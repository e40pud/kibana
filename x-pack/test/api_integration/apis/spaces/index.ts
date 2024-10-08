/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ loadTestFile }: FtrProviderContext) {
  describe('spaces', function () {
    loadTestFile(require.resolve('./get_active_space'));
    loadTestFile(require.resolve('./saved_objects'));
    loadTestFile(require.resolve('./space_attributes'));
    loadTestFile(require.resolve('./get_content_summary'));
    loadTestFile(require.resolve('./set_solution_space'));
  });
}
