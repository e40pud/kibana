/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import {
  AppMountParameters,
  AppStatus,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  Plugin,
  PluginInitializerContext,
} from '@kbn/core/public';
import { INVESTIGATE_APP_ID } from '@kbn/deeplinks-observability/constants';
import { i18n } from '@kbn/i18n';
import type { Logger } from '@kbn/logging';
import { once } from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import type { InvestigateAppServices } from './services/types';
import type {
  ConfigSchema,
  InvestigateAppPublicSetup,
  InvestigateAppPublicStart,
  InvestigateAppSetupDependencies,
  InvestigateAppStartDependencies,
} from './types';
import { createInvestigateAppRepositoryClient, InvestigateAppRepositoryClient } from './api';

const getCreateEsqlService = once(() => import('./services/esql').then((m) => m.createEsqlService));

export class InvestigateAppPlugin
  implements
    Plugin<
      InvestigateAppPublicSetup,
      InvestigateAppPublicStart,
      InvestigateAppSetupDependencies,
      InvestigateAppStartDependencies
    >
{
  logger: Logger;
  config: ConfigSchema;
  repositoryClient!: InvestigateAppRepositoryClient;

  constructor(context: PluginInitializerContext<ConfigSchema>) {
    this.logger = context.logger.get();
    this.config = context.config.get();
  }

  setup(
    coreSetup: CoreSetup<InvestigateAppStartDependencies, InvestigateAppPublicStart>,
    pluginsSetup: InvestigateAppSetupDependencies
  ): InvestigateAppPublicSetup {
    this.repositoryClient = createInvestigateAppRepositoryClient(coreSetup);

    coreSetup.application.register({
      id: INVESTIGATE_APP_ID,
      title: i18n.translate('xpack.investigateApp.appTitle', {
        defaultMessage: 'Investigations',
      }),
      euiIconType: 'logoObservability',
      appRoute: '/app/investigations',
      category: DEFAULT_APP_CATEGORIES.observability,
      status: this.config.enabled ? AppStatus.accessible : AppStatus.inaccessible,
      visibleIn: [],
      deepLinks: [
        {
          id: 'investigations',
          title: i18n.translate('xpack.investigateApp.investigationsDeepLinkTitle', {
            defaultMessage: 'All investigations',
          }),
          path: '/',
        },
        {
          id: 'investigationDetails',
          title: i18n.translate('xpack.investigateApp.newInvestigateDeepLinkTitle', {
            defaultMessage: 'New investigation',
          }),
          path: '/new',
        },
      ],
      mount: async (appMountParameters: AppMountParameters<unknown>) => {
        // Load application bundle and Get start services
        const [{ Application }, [coreStart, pluginsStart], createEsqlService] = await Promise.all([
          import('./application'),
          coreSetup.getStartServices(),
          getCreateEsqlService(),
        ]);

        const services: InvestigateAppServices = {
          ...coreStart,
          esql: createEsqlService({
            data: pluginsStart.data,
            dataViews: pluginsStart.dataViews,
            lens: pluginsStart.lens,
          }),
          charts: pluginsStart.charts,
          investigateAppRepositoryClient: this.repositoryClient,
        };

        ReactDOM.render(
          <Application
            coreStart={coreStart}
            history={appMountParameters.history}
            pluginsStart={pluginsStart}
            theme$={appMountParameters.theme$}
            services={services}
          />,
          appMountParameters.element
        );

        return () => {
          ReactDOM.unmountComponentAtNode(appMountParameters.element);
        };
      },
    });

    const pluginsStartPromise = coreSetup
      .getStartServices()
      .then(([, pluginsStart]) => pluginsStart);

    Promise.all([
      pluginsStartPromise,
      import('./items/register_items').then((m) => m.registerItems),
      getCreateEsqlService(),
    ]).then(([pluginsStart, registerItems, createEsqlService]) => {
      registerItems({
        dependencies: {
          setup: pluginsSetup,
          start: pluginsStart,
        },
        services: {
          investigateAppRepositoryClient: this.repositoryClient,
          esql: createEsqlService({
            data: pluginsStart.data,
            dataViews: pluginsStart.dataViews,
            lens: pluginsStart.lens,
          }),
          charts: pluginsStart.charts,
        },
      });
    });

    return {};
  }

  start(
    coreStart: CoreStart,
    pluginsStart: InvestigateAppStartDependencies
  ): InvestigateAppPublicStart {
    return {};
  }
}
