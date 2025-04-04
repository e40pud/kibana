/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObject } from '@kbn/core/server';
import { getRuleExecutionStatusPendingAttributes } from '../lib/rule_execution_status';
import type { RawRule } from '../types';

export function transformRulesForExport(rules: SavedObject[]): Array<SavedObject<RawRule>> {
  const exportDate = new Date().toISOString();
  return rules.map((rule) => transformRuleForExport(rule as SavedObject<RawRule>, exportDate));
}

function transformRuleForExport(
  rule: SavedObject<RawRule>,
  exportDate: string
): SavedObject<RawRule> {
  return {
    ...rule,
    attributes: {
      ...rule.attributes,
      legacyId: null,
      enabled: false,
      apiKey: null,
      apiKeyOwner: null,
      apiKeyCreatedByUser: null,
      scheduledTaskId: null,
      executionStatus: getRuleExecutionStatusPendingAttributes(exportDate),
    },
  };
}
