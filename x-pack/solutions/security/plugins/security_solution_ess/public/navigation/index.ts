/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Services } from '../common/services';
import { subscribeBreadcrumbs } from './breadcrumbs';
import { registerSolutionNavigation } from './solution_navigation';

export const startNavigation = (services: Services) => {
  registerSolutionNavigation(services);
  subscribeBreadcrumbs(services);
};
