/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { metrics } from './metrics';
import {
  aws as awsRequiredMetrics,
  nginx as nginxRequireMetrics,
} from '../shared/metrics/required_metrics';
import { createInventoryModel } from '../shared/create_inventory_model';

export const host = createInventoryModel('host', {
  displayName: i18n.translate('xpack.metricsData.inventoryModel.host.displayName', {
    defaultMessage: 'Hosts',
  }),
  singularDisplayName: i18n.translate(
    'xpack.metricsData.inventoryModels.host.singularDisplayName',
    {
      defaultMessage: 'Host',
    }
  ),
  requiredModule: 'system',
  crosslinkSupport: {
    details: true,
    logs: true,
    apm: true,
    uptime: true,
  },
  fields: {
    id: 'host.name',
    name: 'host.name',
    os: 'host.os.name',
    ip: 'host.ip',
    cloudProvider: 'cloud.provider',
  },
  metrics,
  requiredMetrics: [
    'hostSystemOverview',
    'hostCpuUsageTotal',
    'hostCpuUsage',
    'hostLoad',
    'hostMemoryUsage',
    'hostNetworkTraffic',
    'hostK8sOverview',
    'hostK8sCpuCap',
    'hostK8sMemoryCap',
    'hostK8sDiskCap',
    'hostK8sPodCap',
    ...awsRequiredMetrics,
    ...nginxRequireMetrics,
  ],
  tooltipMetrics: ['cpuV2', 'memory', 'txV2', 'rxV2', 'cpu', 'tx', 'rx'],
  legacyMetrics: ['cpu', 'tx', 'rx'],
});
