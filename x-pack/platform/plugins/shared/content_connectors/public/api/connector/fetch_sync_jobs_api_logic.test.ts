/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { httpServiceMock } from '@kbn/core/public/mocks';

import { nextTick } from '@kbn/test-jest-helpers';

import { fetchSyncJobs } from './fetch_sync_jobs_api_logic';

describe('FetchSyncJobs', () => {
  const http = httpServiceMock.createSetupContract();
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('fetchSyncJobs', () => {
    it('calls correct api', async () => {
      const promise = Promise.resolve('result');
      http.get.mockReturnValue(promise);
      const result = fetchSyncJobs({ http, connectorId: 'connectorId1' });
      await nextTick();
      expect(http.get).toHaveBeenCalledWith(
        '/internal/content_connectors/connectors/connectorId1/sync_jobs',
        { query: { from: 0, size: 10 } }
      );
      await expect(result).resolves.toEqual('result');
    });
    it('appends query if specified', async () => {
      const promise = Promise.resolve('result');
      http.get.mockReturnValue(promise);
      const result = fetchSyncJobs({ http, connectorId: 'connectorId1', from: 10, size: 20 });
      await nextTick();
      expect(http.get).toHaveBeenCalledWith(
        '/internal/content_connectors/connectors/connectorId1/sync_jobs',
        { query: { from: 10, size: 20 } }
      );
      await expect(result).resolves.toEqual('result');
    });
  });
});
