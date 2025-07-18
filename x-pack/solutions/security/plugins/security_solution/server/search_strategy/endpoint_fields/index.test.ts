/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  SearchStrategyDependencies,
  DataViewsServerPluginStart,
} from '@kbn/data-plugin/server';
import { fieldsBeat as beatFields } from '@kbn/timelines-plugin/server/utils/beat_schema/fields.json';
import { IndexPatternsFetcher } from '@kbn/data-plugin/server';
import { requestEndpointFieldsSearch } from '.';
import { createMockEndpointAppContextService } from '../../endpoint/mocks';
import { getEndpointAuthzInitialStateMock } from '../../../common/endpoint/service/authz/mocks';
import { eventsIndexPattern, METADATA_UNITED_INDEX } from '../../../common/endpoint/constants';
import { EndpointAuthorizationError } from '../../endpoint/errors';
import type { IndexFieldsStrategyRequestByIndices } from '@kbn/timelines-plugin/common/search_strategy';
import { buildIndexNameWithNamespace } from '../../../common/endpoint/utils/index_name_utilities';

jest.mock('../../../common/endpoint/utils/index_name_utilities', () => ({
  buildIndexNameWithNamespace: jest.fn(),
}));

const buildIndexNameWithNamespaceMock = buildIndexNameWithNamespace as jest.Mock;

describe('Endpoint fields', () => {
  const getFieldsForWildcardMock = jest.fn();
  const esClientSearchMock = jest.fn();
  const esClientFieldCapsMock = jest.fn();
  const endpointAppContextService = createMockEndpointAppContextService();
  let IndexPatterns: DataViewsServerPluginStart;

  const deps = {
    esClient: {
      asInternalUser: { search: esClientSearchMock, fieldCaps: esClientFieldCapsMock },
    },
  } as unknown as SearchStrategyDependencies;

  const mockPattern = {
    title: 'test',
    fields: {
      toSpec: () => ({
        coolio: {
          name: 'name_test',
          type: 'type_test',
          searchable: true,
          aggregatable: true,
        },
      }),
    },
    toSpec: () => ({
      runtimeFieldMap: { runtimeField: { type: 'keyword' } },
    }),
  };
  const getStartServices = jest.fn().mockReturnValue([
    null,
    {
      data: {
        indexPatterns: {
          dataViewsServiceFactory: () => ({
            get: jest.fn().mockReturnValue(mockPattern),
          }),
        },
      },
    },
  ]);

  beforeAll(() => {
    getFieldsForWildcardMock.mockResolvedValue([]);
    esClientSearchMock.mockResolvedValue({ hits: { total: { value: 123 } } });
    esClientFieldCapsMock.mockResolvedValue({ indices: ['value'] });
    IndexPatternsFetcher.prototype.getFieldsForWildcard = getFieldsForWildcardMock;
  });

  beforeEach(async () => {
    const [
      ,
      {
        data: { indexPatterns },
      },
    ] = await getStartServices();
    IndexPatterns = indexPatterns;
    getFieldsForWildcardMock.mockClear();
    esClientSearchMock.mockClear();
    esClientFieldCapsMock.mockClear();
    buildIndexNameWithNamespaceMock.mockClear();

    // Reset all mocks on endpointAppContextService
    (endpointAppContextService.getActiveSpace as jest.Mock).mockClear();
    (endpointAppContextService.getInternalFleetServices as jest.Mock).mockClear();
    (endpointAppContextService.getEndpointAuthz as jest.Mock).mockResolvedValue(
      getEndpointAuthzInitialStateMock()
    );

    // @ts-expect-error write to readonly property
    endpointAppContextService.experimentalFeatures.endpointManagementSpaceAwarenessEnabled = false;
  });

  afterAll(() => {
    getFieldsForWildcardMock.mockRestore();
  });

  describe('with right privileges', () => {
    describe('when space awareness feature is disabled', () => {
      it('should check index exists for event filters', async () => {
        const indices = [eventsIndexPattern];
        const request = {
          indices,
          onlyCheckIfIndicesExist: true,
        };

        const response = await requestEndpointFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        );
        expect(response.indexFields).toHaveLength(0);
        expect(response.indicesExist).toEqual(indices);
        expect(buildIndexNameWithNamespaceMock).not.toHaveBeenCalled();
      });

      it('should check index exists for endpoints list', async () => {
        const indices = [METADATA_UNITED_INDEX];
        const request = {
          indices,
          onlyCheckIfIndicesExist: true,
        };

        const response = await requestEndpointFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        );
        expect(response.indexFields).toHaveLength(0);
        expect(response.indicesExist).toEqual(indices);
        expect(buildIndexNameWithNamespaceMock).not.toHaveBeenCalled();
      });
    });

    describe('when space awareness feature is enabled', () => {
      beforeEach(() => {
        // @ts-expect-error write to readonly property
        endpointAppContextService.experimentalFeatures = {
          ...endpointAppContextService.experimentalFeatures,
          endpointManagementSpaceAwarenessEnabled: true,
        };
      });

      it('should use space-aware index pattern when feature flag is enabled', async () => {
        const spaceId = 'custom-space';
        const mockIntegrationNamespaces = { endpoint: ['custom-namespace'] };
        const mockIndexPattern = 'logs-endpoint.events.*-custom-namespace';
        const indices = [eventsIndexPattern];
        const request = {
          indices,
          onlyCheckIfIndicesExist: true,
        };

        // Mock getActiveSpace
        (endpointAppContextService.getActiveSpace as jest.Mock).mockResolvedValue({ id: spaceId });

        // Mock getInternalFleetServices
        const mockFleetServices = {
          getIntegrationNamespaces: jest.fn().mockResolvedValue(mockIntegrationNamespaces),
        };
        (endpointAppContextService.getInternalFleetServices as jest.Mock).mockReturnValue(
          mockFleetServices
        );

        // Mock buildIndexNameWithNamespace
        buildIndexNameWithNamespaceMock.mockReturnValue(mockIndexPattern);

        const response = await requestEndpointFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        );

        expect(response.indexFields).toHaveLength(0);
        expect(response.indicesExist).toEqual([mockIndexPattern]);
        expect(endpointAppContextService.getActiveSpace).toHaveBeenCalledWith(deps.request);
        expect(endpointAppContextService.getInternalFleetServices).toHaveBeenCalledWith(spaceId);
        expect(mockFleetServices.getIntegrationNamespaces).toHaveBeenCalledWith(['endpoint']);
        expect(buildIndexNameWithNamespaceMock).toHaveBeenCalledWith(
          eventsIndexPattern,
          'custom-namespace',
          { preserveWildcard: true }
        );
      });

      it('should handle when space-aware index pattern retrieval returns null', async () => {
        const spaceId = 'custom-space';
        const mockIntegrationNamespaces = { endpoint: [] };
        const indices = [eventsIndexPattern];
        const request = {
          indices,
          onlyCheckIfIndicesExist: true,
        };

        // Mock getActiveSpace
        (endpointAppContextService.getActiveSpace as jest.Mock).mockResolvedValue({ id: spaceId });

        // Mock getInternalFleetServices
        const mockFleetServices = {
          getIntegrationNamespaces: jest.fn().mockResolvedValue(mockIntegrationNamespaces),
        };
        (endpointAppContextService.getInternalFleetServices as jest.Mock).mockReturnValue(
          mockFleetServices
        );

        // Mock buildIndexNameWithNamespace to return null (indicating failure)
        buildIndexNameWithNamespaceMock.mockReturnValue(null);

        // When namespaces array is empty, it should fall back to original index pattern
        const response = await requestEndpointFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        );

        expect(response.indexFields).toHaveLength(0);
        expect(response.indicesExist).toEqual(indices); // Should use original indices
        expect(endpointAppContextService.getActiveSpace).toHaveBeenCalledWith(deps.request);
        expect(endpointAppContextService.getInternalFleetServices).toHaveBeenCalledWith(spaceId);
        // buildIndexNameWithNamespace should not be called when namespaces array is empty
        expect(buildIndexNameWithNamespaceMock).not.toHaveBeenCalled();
      });

      it('should handle non-events index pattern without space-aware processing', async () => {
        const indices = [METADATA_UNITED_INDEX];
        const request = {
          indices,
          onlyCheckIfIndicesExist: true,
        };

        const response = await requestEndpointFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        );

        expect(response.indexFields).toHaveLength(0);
        expect(response.indicesExist).toEqual(indices);
        expect(endpointAppContextService.getActiveSpace).not.toHaveBeenCalled();
        expect(buildIndexNameWithNamespaceMock).not.toHaveBeenCalled();
      });
    });

    // Legacy tests (moved to maintain compatibility)
    it('should check index exists for event filters', async () => {
      const indices = [eventsIndexPattern];
      const request = {
        indices,
        onlyCheckIfIndicesExist: true,
      };

      const response = await requestEndpointFieldsSearch(
        endpointAppContextService,
        request,
        deps,
        beatFields,
        IndexPatterns
      );
      expect(response.indexFields).toHaveLength(0);
      expect(response.indicesExist).toEqual(indices);
    });

    it('should check index exists for endpoints list', async () => {
      const indices = [METADATA_UNITED_INDEX];
      const request = {
        indices,
        onlyCheckIfIndicesExist: true,
      };

      const response = await requestEndpointFieldsSearch(
        endpointAppContextService,
        request,
        deps,
        beatFields,
        IndexPatterns
      );
      expect(response.indexFields).toHaveLength(0);
      expect(response.indicesExist).toEqual(indices);
    });

    it('should search index fields for event filters', async () => {
      const indices = [eventsIndexPattern];
      const request = {
        indices,
        onlyCheckIfIndicesExist: false,
      };

      const response = await requestEndpointFieldsSearch(
        endpointAppContextService,
        request,
        deps,
        beatFields,
        IndexPatterns
      );

      expect(getFieldsForWildcardMock).toHaveBeenCalledWith({
        pattern: indices[0],
        fieldCapsOptions: undefined,
      });

      expect(response.indexFields).not.toHaveLength(0);
      expect(response.indicesExist).toEqual(indices);
    });

    it('should search index fields for endpoints list', async () => {
      const indices = [METADATA_UNITED_INDEX];
      const request = {
        indices,
        onlyCheckIfIndicesExist: false,
      };

      const response = await requestEndpointFieldsSearch(
        endpointAppContextService,
        request,
        deps,
        beatFields,
        IndexPatterns
      );

      expect(getFieldsForWildcardMock).toHaveBeenCalledWith({ pattern: indices[0] });

      expect(response.indexFields).not.toHaveLength(0);
      expect(response.indicesExist).toEqual(indices);
    });

    it('should throw when request body is invalid', async () => {
      const request = {};

      await expect(async () => {
        await requestEndpointFieldsSearch(
          endpointAppContextService,
          request as unknown as IndexFieldsStrategyRequestByIndices,
          deps,
          beatFields,
          IndexPatterns
        );
      }).rejects.toThrowError(/invalid_type/);
    });

    it('should throw when invalid index', async () => {
      const indices = ['invalid'];
      const request = {
        indices,
        onlyCheckIfIndicesExist: false,
      };

      await expect(async () => {
        await requestEndpointFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        );
      }).rejects.toThrowError('Invalid indices request invalid');
    });

    it('should throw when more than one index', async () => {
      const indices = ['invalid', 'invalid2'];
      const request = {
        indices,
        onlyCheckIfIndicesExist: false,
      };

      await expect(async () => {
        await requestEndpointFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        );
      }).rejects.toThrowError('Invalid indices request invalid, invalid2');
    });
  });

  describe('without right privileges', () => {
    it('should throw because not enough privileges for event filters', async () => {
      (endpointAppContextService.getEndpointAuthz as jest.Mock).mockResolvedValue(
        getEndpointAuthzInitialStateMock({ canReadEventFilters: true, canWriteEventFilters: false })
      );
      const indices = [eventsIndexPattern];
      const request = {
        indices,
        onlyCheckIfIndicesExist: false,
      };

      await expect(
        requestEndpointFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        )
      ).rejects.toThrow(EndpointAuthorizationError);
    });

    it('should throw because not enough privileges for endpoints list', async () => {
      (endpointAppContextService.getEndpointAuthz as jest.Mock).mockResolvedValue(
        getEndpointAuthzInitialStateMock({ canReadEndpointList: false })
      );
      const indices = [METADATA_UNITED_INDEX];
      const request = {
        indices,
        onlyCheckIfIndicesExist: false,
      };

      await expect(
        requestEndpointFieldsSearch(
          endpointAppContextService,
          request,
          deps,
          beatFields,
          IndexPatterns
        )
      ).rejects.toThrow(EndpointAuthorizationError);
    });
  });
});
