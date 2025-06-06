/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ChartType, YUnit } from '../../../typings/timeseries';

export interface ChartBase {
  title: string;
  key: string;
  type: ChartType;
  yUnit: YUnit;
  series: {
    [key: string]: {
      title: string;
      color?: string;
    };
  };
  description?: string;
}
