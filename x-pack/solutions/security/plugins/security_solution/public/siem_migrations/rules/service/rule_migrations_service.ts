/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { BehaviorSubject, type Observable } from 'rxjs';
import type { CoreStart } from '@kbn/core/public';
import type { TraceOptions } from '@kbn/elastic-assistant/impl/assistant/types';
import {
  DEFAULT_ASSISTANT_NAMESPACE,
  TRACE_OPTIONS_SESSION_STORAGE_KEY,
} from '@kbn/elastic-assistant/impl/assistant_context/constants';
import type { TelemetryServiceStart } from '../../../common/lib/telemetry';
import type { RuleMigrationTaskStats } from '../../../../common/siem_migrations/model/rule_migration.gen';
import type {
  CreateRuleMigrationRulesRequestBody,
  StartRuleMigrationResponse,
  UpsertRuleMigrationResourcesRequestBody,
} from '../../../../common/siem_migrations/model/api/rules/rule_migration.gen';
import type { SiemMigrationRetryFilter } from '../../../../common/siem_migrations/constants';
import { SiemMigrationTaskStatus } from '../../../../common/siem_migrations/constants';
import type { StartPluginsDependencies } from '../../../types';
import { ExperimentalFeaturesService } from '../../../common/experimental_features_service';
import { licenseService } from '../../../common/hooks/use_license';
import * as api from '../api';
import {
  getMissingCapabilities,
  type MissingCapability,
  type CapabilitiesLevel,
} from './capabilities';
import type { RuleMigrationSettings, RuleMigrationStats } from '../types';
import { getSuccessToast } from './notifications/success_notification';
import { RuleMigrationsStorage } from './storage';
import * as i18n from './translations';
import { SiemRulesMigrationsTelemetry } from './telemetry';
import { getNoConnectorToast } from './notifications/no_connector_notification';
import { getMissingCapabilitiesToast } from './notifications/missing_capabilities_notification';

// use the default assistant namespace since it's the only one we use
const NAMESPACE_TRACE_OPTIONS_SESSION_STORAGE_KEY =
  `${DEFAULT_ASSISTANT_NAMESPACE}.${TRACE_OPTIONS_SESSION_STORAGE_KEY}` as const;

export const REQUEST_POLLING_INTERVAL_SECONDS = 10 as const;
const CREATE_MIGRATION_BODY_BATCH_SIZE = 50 as const;

export class SiemRulesMigrationsService {
  private readonly latestStats$: BehaviorSubject<RuleMigrationStats[] | null>;
  private isPolling = false;
  public connectorIdStorage = new RuleMigrationsStorage<string>('connectorId');
  public traceOptionsStorage = new RuleMigrationsStorage<TraceOptions>('traceOptions', {
    customKey: NAMESPACE_TRACE_OPTIONS_SESSION_STORAGE_KEY,
    storageType: 'session',
  });
  public telemetry: SiemRulesMigrationsTelemetry;

  constructor(
    private readonly core: CoreStart,
    private readonly plugins: StartPluginsDependencies,
    telemetryService: TelemetryServiceStart
  ) {
    this.telemetry = new SiemRulesMigrationsTelemetry(telemetryService);
    this.latestStats$ = new BehaviorSubject<RuleMigrationStats[] | null>(null);

    this.plugins.spaces.getActiveSpace().then((space) => {
      this.connectorIdStorage.setSpaceId(space.id);
      this.startPolling();
    });
  }

  public get api() {
    return api;
  }

  public getLatestStats$(): Observable<RuleMigrationStats[] | null> {
    return this.latestStats$.asObservable();
  }

  public getMissingCapabilities(level?: CapabilitiesLevel): MissingCapability[] {
    return getMissingCapabilities(this.core.application.capabilities, level);
  }

  public hasMissingCapabilities(level?: CapabilitiesLevel): boolean {
    return this.getMissingCapabilities(level).length > 0;
  }

  /** Checks if the service is available based on the `license`, `capabilities` and `experimentalFeatures` */
  public isAvailable() {
    return (
      !ExperimentalFeaturesService.get().siemMigrationsDisabled &&
      licenseService.isEnterprise() &&
      !this.hasMissingCapabilities('minimum')
    );
  }

  public startPolling() {
    if (this.isPolling || !this.isAvailable()) {
      return;
    }
    this.isPolling = true;
    this.startTaskStatsPolling()
      .catch((e) => {
        this.core.notifications.toasts.addError(e, { title: i18n.POLLING_ERROR });
      })
      .finally(() => {
        this.isPolling = false;
      });
  }

  public async addRulesToMigration(
    migrationId: string,
    rules: CreateRuleMigrationRulesRequestBody
  ) {
    const rulesCount = rules.length;
    if (rulesCount === 0) {
      throw new Error(i18n.EMPTY_RULES_ERROR);
    }

    // Batching creation to avoid hitting the max payload size limit of the API
    for (let i = 0; i < rulesCount; i += CREATE_MIGRATION_BODY_BATCH_SIZE) {
      const rulesBatch = rules.slice(i, i + CREATE_MIGRATION_BODY_BATCH_SIZE);
      await api.addRulesToMigration({ migrationId, body: rulesBatch });
    }
  }

  public async createRuleMigration(data: CreateRuleMigrationRulesRequestBody): Promise<string> {
    const rulesCount = data.length;
    if (rulesCount === 0) {
      throw new Error(i18n.EMPTY_RULES_ERROR);
    }

    try {
      // create the migration
      const { migration_id: migrationId } = await api.createRuleMigration({});

      await this.addRulesToMigration(migrationId, data);

      this.telemetry.reportSetupMigrationCreated({ migrationId, rulesCount });
      return migrationId;
    } catch (error) {
      this.telemetry.reportSetupMigrationCreated({ rulesCount, error });
      throw error;
    }
  }

  public async upsertMigrationResources(
    migrationId: string,
    body: UpsertRuleMigrationResourcesRequestBody
  ): Promise<void> {
    const count = body.length;
    if (count === 0) {
      throw new Error(i18n.EMPTY_RULES_ERROR);
    }
    // We assume all resources are of the same type. There is no use case for mixing types in a single upload
    const type = body[0].type;
    try {
      // Batching creation to avoid hitting the max payload size limit of the API
      for (let i = 0; i < count; i += CREATE_MIGRATION_BODY_BATCH_SIZE) {
        const bodyBatch = body.slice(i, i + CREATE_MIGRATION_BODY_BATCH_SIZE);
        await api.upsertMigrationResources({ migrationId, body: bodyBatch });
      }
      this.telemetry.reportSetupResourceUploaded({ migrationId, type, count });
    } catch (error) {
      this.telemetry.reportSetupResourceUploaded({ migrationId, type, count, error });
      throw error;
    }
  }

  public async startRuleMigration(
    migrationId: string,
    retry?: SiemMigrationRetryFilter,
    settings?: RuleMigrationSettings
  ): Promise<StartRuleMigrationResponse> {
    const missingCapabilities = this.getMissingCapabilities('all');
    if (missingCapabilities.length > 0) {
      this.core.notifications.toasts.add(
        getMissingCapabilitiesToast(missingCapabilities, this.core)
      );
      return { started: false };
    }
    const connectorId = settings?.connectorId ?? this.connectorIdStorage.get();
    const skipPrebuiltRulesMatching = settings?.skipPrebuiltRulesMatching;
    if (!connectorId) {
      this.core.notifications.toasts.add(getNoConnectorToast(this.core));
      return { started: false };
    }
    const params: api.StartRuleMigrationParams = {
      migrationId,
      settings: {
        connectorId,
        skipPrebuiltRulesMatching,
      },
      retry,
    };

    const traceOptions = this.traceOptionsStorage.get();
    if (traceOptions) {
      params.langSmithOptions = {
        project_name: traceOptions.langSmithProject,
        api_key: traceOptions.langSmithApiKey,
      };
    }

    try {
      const result = await api.startRuleMigration(params);
      this.startPolling();

      this.telemetry.reportStartTranslation(params);
      return result;
    } catch (error) {
      this.telemetry.reportStartTranslation({
        ...params,
        error,
      });
      throw error;
    }
  }

  public async getRuleMigrationsStats(
    params: api.GetRuleMigrationsStatsAllParams = {}
  ): Promise<RuleMigrationStats[]> {
    const allStats = await this.getRuleMigrationsStatsWithRetry(params);
    const results = allStats.map(
      // the array order (by creation) is guaranteed by the API
      (stats, index) => ({ ...stats, number: index + 1 } as RuleMigrationStats) // needs cast because of the `status` enum override
    );
    this.latestStats$.next(results); // Always update the latest stats
    return results;
  }

  private async getRuleMigrationsStatsWithRetry(
    params: api.GetRuleMigrationsStatsAllParams = {},
    sleepSecs?: number
  ): Promise<RuleMigrationTaskStats[]> {
    if (sleepSecs) {
      await new Promise((resolve) => setTimeout(resolve, sleepSecs * 1000));
    }

    return api.getRuleMigrationsStatsAll(params).catch((e) => {
      // Retry only on network errors (no status) and 503 (Service Unavailable), otherwise throw
      const status = e.response?.status || e.status;
      if (status && status !== 503) {
        throw e;
      }
      const nextSleepSecs = sleepSecs ? sleepSecs * 2 : 1; // Exponential backoff
      if (nextSleepSecs > 60) {
        // Wait for a minutes max (two minutes total) for the API to be available again
        throw e;
      }
      return this.getRuleMigrationsStatsWithRetry(params, nextSleepSecs);
    });
  }

  private async startTaskStatsPolling(): Promise<void> {
    let pendingMigrationIds: string[] = [];
    do {
      const results = await this.getRuleMigrationsStats();

      if (pendingMigrationIds.length > 0) {
        // send notifications for finished migrations
        pendingMigrationIds.forEach((pendingMigrationId) => {
          const migration = results.find((item) => item.id === pendingMigrationId);
          if (migration?.status === SiemMigrationTaskStatus.FINISHED) {
            this.core.notifications.toasts.addSuccess(getSuccessToast(migration, this.core));
          }
        });
      }

      // reprocess pending migrations
      pendingMigrationIds = [];
      for (const result of results) {
        if (result.status === SiemMigrationTaskStatus.RUNNING) {
          pendingMigrationIds.push(result.id);
        }

        // automatically resume stopped migrations when all conditions are met
        if (result.status === SiemMigrationTaskStatus.STOPPED && !result.last_execution?.error) {
          const connectorId = result.last_execution?.connector_id ?? this.connectorIdStorage.get();
          const skipPrebuiltRulesMatching = result.last_execution?.skip_prebuilt_rules_matching;
          if (connectorId && !this.hasMissingCapabilities('all')) {
            await api.startRuleMigration({
              migrationId: result.id,
              settings: {
                connectorId,
                skipPrebuiltRulesMatching,
              },
            });
            pendingMigrationIds.push(result.id);
          }
        }
      }

      // Do not wait if there are no more pending migrations
      if (pendingMigrationIds.length > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, REQUEST_POLLING_INTERVAL_SECONDS * 1000)
        );
      }
    } while (pendingMigrationIds.length > 0);
  }
}
