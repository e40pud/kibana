/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ loadTestFile }: FtrProviderContext) {
  describe('security (trial license)', function () {
    // Updates here should be mirrored in `../../../api_integration_basic/apis/security/index.ts` if tests
    // should also run under a basic license.

    loadTestFile(require.resolve('./api_keys'));
    loadTestFile(require.resolve('./basic_login'));
    loadTestFile(require.resolve('./builtin_es_privileges'));
    loadTestFile(require.resolve('./change_password'));
    loadTestFile(require.resolve('./index_fields'));
    loadTestFile(require.resolve('./query_api_keys'));
    loadTestFile(require.resolve('./roles'));
    loadTestFile(require.resolve('./users'));
    loadTestFile(require.resolve('./privileges'));
    loadTestFile(require.resolve('./roles_bulk'));

    // THIS TEST NEEDS TO BE LAST. IT IS DESTRUCTIVE! IT REMOVES TRIAL LICENSE!!!
    loadTestFile(require.resolve('./license_downgrade'));
  });
}
