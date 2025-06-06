/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Find Rules API endpoint
 *   version: 2023-10-31
 */

import { z } from '@kbn/zod';
import { ArrayFromString } from '@kbn/zod-helpers';

import { SortOrder } from '../../model/sorting.gen';
import { RuleResponse } from '../../model/rule_schema/rule_schemas.gen';

export type FindRulesSortField = z.infer<typeof FindRulesSortField>;
export const FindRulesSortField = z.enum([
  'created_at',
  'createdAt',
  'enabled',
  'execution_summary.last_execution.date',
  'execution_summary.last_execution.metrics.execution_gap_duration_s',
  'execution_summary.last_execution.metrics.total_indexing_duration_ms',
  'execution_summary.last_execution.metrics.total_search_duration_ms',
  'execution_summary.last_execution.status',
  'name',
  'risk_score',
  'riskScore',
  'severity',
  'updated_at',
  'updatedAt',
]);
export type FindRulesSortFieldEnum = typeof FindRulesSortField.enum;
export const FindRulesSortFieldEnum = FindRulesSortField.enum;

export type FindRulesRequestQuery = z.infer<typeof FindRulesRequestQuery>;
export const FindRulesRequestQuery = z.object({
  fields: ArrayFromString(z.string()).optional(),
  /** 
      * Search query

Filters the returned results according to the value of the specified field, using the alert.attributes.<field name>:<field value> syntax, where <field name> can be:
- name
- enabled
- tags
- createdBy
- interval
- updatedBy
> info
> Even though the JSON rule object uses created_by and updated_by fields, you must use createdBy and updatedBy fields in the filter.
 
      */
  filter: z.string().optional(),
  /**
   * Field to sort by
   */
  sort_field: FindRulesSortField.optional(),
  /**
   * Sort order
   */
  sort_order: SortOrder.optional(),
  /**
   * Page number
   */
  page: z.coerce.number().int().min(1).optional().default(1),
  /**
   * Rules per page
   */
  per_page: z.coerce.number().int().min(0).optional().default(20),
  /**
   * Gaps range start
   */
  gaps_range_start: z.string().optional(),
  /**
   * Gaps range end
   */
  gaps_range_end: z.string().optional(),
});
export type FindRulesRequestQueryInput = z.input<typeof FindRulesRequestQuery>;

export type FindRulesResponse = z.infer<typeof FindRulesResponse>;
export const FindRulesResponse = z.object({
  page: z.number().int(),
  perPage: z.number().int(),
  total: z.number().int(),
  data: z.array(RuleResponse),
});
