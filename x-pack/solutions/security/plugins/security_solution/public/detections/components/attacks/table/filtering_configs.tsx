/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { Filter } from '@kbn/es-query';
import {
  ALERT_ATTACK_DISCOVERY_USER_ID,
  ATTACK_DISCOVERY_ALERTS_COMMON_INDEX_PREFIX,
  ATTACK_DISCOVERY_ADHOC_ALERTS_COMMON_INDEX_PREFIX,
} from '@kbn/elastic-assistant-common';
import { ALERT_ATTACK_IDS } from '../../../../../common/field_maps/field_names';
import type { AssigneesIdsSelection } from '../../../../common/components/assignees/types';

const indexPattern = `${ATTACK_DISCOVERY_ALERTS_COMMON_INDEX_PREFIX},${ATTACK_DISCOVERY_ADHOC_ALERTS_COMMON_INDEX_PREFIX}`;

export const buildAttackAuthorFilter = (authorsIds: AssigneesIdsSelection[]): Filter[] => {
  if (!authorsIds.length) {
    return [];
  }
  const combinedQuery = {
    bool: {
      should: authorsIds.map((id) =>
        id
          ? {
              term: {
                [ALERT_ATTACK_DISCOVERY_USER_ID]: id,
              },
            }
          : { bool: { must_not: { exists: { field: ALERT_ATTACK_DISCOVERY_USER_ID } } } }
      ),
    },
  };

  return [
    {
      meta: {
        alias: null,
        negate: false,
        disabled: false,
        index: indexPattern,
      },
      query: combinedQuery,
    },
  ];
};

export const buildConnectorIdFilter = (connectorNames: string[]): Filter[] => {
  if (!connectorNames.length) return [];

  return [
    {
      meta: {
        key: 'kibana.alert.attack_discovery.api_config.name',
        type: 'term',
        index: indexPattern,
        disabled: false,
      },
      query: {
        terms: {
          'kibana.alert.attack_discovery.api_config.name': connectorNames,
        },
      },
    },
  ];
};

export const buildAttacksOnlyFilter = (): Filter[] => {
  return [
    {
      query: {
        exists: {
          field: ALERT_ATTACK_IDS,
        },
      },
      meta: {
        alias: null,
        negate: false,
        disabled: false,
        key: ALERT_ATTACK_IDS,
        type: 'exists',
        value: 'exists',
      },
    },
  ];
};
