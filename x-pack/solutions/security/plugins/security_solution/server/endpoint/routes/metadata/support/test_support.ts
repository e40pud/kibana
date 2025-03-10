/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { estypes } from '@elastic/elasticsearch';
import type { Agent } from '@kbn/fleet-plugin/common';
import { METADATA_UNITED_INDEX } from '../../../../../common/endpoint/constants';
import type {
  HostMetadata,
  UnitedAgentMetadataPersistedData,
} from '../../../../../common/endpoint/types';

export function legacyMetadataSearchResponseMock(
  hostMetadata?: HostMetadata
): estypes.SearchResponse<HostMetadata> {
  return {
    took: 15,
    timed_out: false,
    _shards: {
      total: 1,
      successful: 1,
      skipped: 0,
      failed: 0,
    },
    hits: {
      total: {
        value: 1,
        relation: 'eq',
      },
      max_score: null,
      hits: hostMetadata
        ? [
            {
              _index: 'metrics-endpoint.metadata-default',
              _id: '8FhM0HEBYyRTvb6lOQnw',
              _score: null,
              _source: {
                ...hostMetadata,
              },
              sort: [1588337587997],
            },
          ]
        : [],
    },
  } as unknown as estypes.SearchResponse<HostMetadata>;
}

export function unitedMetadataSearchResponseMock(
  hostMetadata: HostMetadata = {} as HostMetadata,
  agent: Agent = {} as Agent,
  agentStatus: Agent['status'] = 'online'
): estypes.SearchResponse<UnitedAgentMetadataPersistedData> {
  return {
    took: 15,
    timed_out: false,
    _shards: {
      total: 1,
      successful: 1,
      skipped: 0,
      failed: 0,
    },
    hits: {
      total: {
        value: 1,
        relation: 'eq',
      },
      max_score: null,
      hits: hostMetadata
        ? [
            {
              _index: METADATA_UNITED_INDEX,
              _id: '8FhM0HEBYyRTvb6lOQnw',
              _score: null,
              _source: {
                agent: {
                  id: 'test-agent-id',
                },
                united: {
                  agent: {
                    ...agent,
                  },
                  endpoint: {
                    ...hostMetadata,
                  },
                },
              },
              fields: {
                status: [agentStatus],
              },
              sort: [1588337587997],
            },
          ]
        : [],
    },
  } as unknown as estypes.SearchResponse<UnitedAgentMetadataPersistedData>;
}
