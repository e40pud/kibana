/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { METRIC_TYPE } from '.';

export interface UserAgentMetric {
  type: METRIC_TYPE.USER_AGENT;
  appName: string;
  userAgent: string;
}

export function trackUsageAgent(appName: string): UserAgentMetric {
  const userAgent = (window && window.navigator && window.navigator.userAgent) || '';

  return {
    type: METRIC_TYPE.USER_AGENT,
    appName,
    userAgent,
  };
}
