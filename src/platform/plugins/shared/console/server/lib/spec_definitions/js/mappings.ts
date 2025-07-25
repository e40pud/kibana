/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { SpecDefinitionsService } from '../../../services';

import { BOOLEAN } from './shared';

export const mappings = (specService: SpecDefinitionsService) => {
  specService.addEndpointDescription('put_mapping', {
    priority: 10, // collides with put doc by id
    data_autocomplete_rules: {
      __template: {
        properties: {
          FIELD: {},
        },
      },
      _source: {
        enabled: BOOLEAN,
      },
      _all: {
        enabled: BOOLEAN,
      },
      _field_names: {
        index: BOOLEAN,
      },
      _routing: {
        required: BOOLEAN,
      },
      _index: {
        enabled: BOOLEAN,
      },
      _timestamp: {
        enabled: BOOLEAN,
        format: 'YYYY-MM-dd',
        default: '',
      },
      dynamic_date_formats: ['yyyy-MM-dd'],
      date_detection: BOOLEAN,
      numeric_detection: BOOLEAN,
      properties: {
        '*': {
          type: {
            __one_of: [
              'alias',
              'binary',
              'boolean',
              'completion',
              'constant_keyword',
              'date',
              'date_nanos',
              'dense_vector',
              'flattened',
              'geo_point',
              'geo_shape',
              'histogram',
              'ip',
              'join',
              'keyword',
              'match_only_text',
              'nested',
              'numeric',
              'object',
              'passthrough',
              'percolator',
              'point',
              'range',
              'rank_feature',
              'rank_features',
              'search_as_you_type',
              'semantic_text',
              'shape',
              'sparse_vector',
              'text',
              'token_count',
              'version',
              'wildcard',
            ],
          },

          // strings
          store: BOOLEAN,
          index: BOOLEAN,
          term_vector: {
            __one_of: ['no', 'yes', 'with_offsets', 'with_positions', 'with_positions_offsets'],
          },
          boost: 1.0,
          null_value: '',
          doc_values: BOOLEAN,
          eager_global_ordinals: BOOLEAN,
          norms: BOOLEAN,
          coerce: BOOLEAN,

          // Not actually available in V6 of ES. Add when updating the autocompletion system.
          // index_phrases: BOOLEAN,
          // index_prefixes: { min_chars, max_chars },

          index_options: {
            // leave the first item blank because the default depends on type
            __one_of: [
              '',
              // text-based types
              'docs',
              'freqs',
              'positions',
              'offsets',
              // semantic_text type
              {
                dense_vector: DenseVectorIndexOptions,
              },
              // dense_vector type
              DenseVectorIndexOptions,
            ],
          },
          chunking_settings: {
            strategy: {
              __one_of: ['sentence', 'word', 'none'],
            },
            max_chunk_size: 250,
            sentence_overlap: 1,
            overlap: 1,
          },
          analyzer: 'standard',
          search_analyzer: 'standard',
          include_in_all: {
            __one_of: [false, true],
          },
          ignore_above: 10,
          normalizer: '',
          position_increment_gap: 0,

          // numeric
          precision_step: 4,
          ignore_malformed: BOOLEAN,
          scaling_factor: 100,

          // geo_point
          lat_lon: {
            __one_of: [true, false],
          },
          geohash: {
            __one_of: [true, false],
          },
          geohash_precision: '1m',
          geohash_prefix: {
            __one_of: [true, false],
          },
          validate: {
            __one_of: [true, false],
          },
          validate_lat: {
            __one_of: [true, false],
          },
          validate_lon: {
            __one_of: [true, false],
          },
          normalize: {
            __one_of: [true, false],
          },
          normalize_lat: {
            __one_of: [true, false],
          },
          normalize_lon: {
            __one_of: [true, false],
          },

          // geo_shape
          tree: {
            __one_of: ['geohash', 'quadtree'],
          },
          precision: '5km',
          tree_levels: 12,
          distance_error_pct: 0.025,
          orientation: 'ccw',

          // dates
          format: {
            // outer array required to for an array of string values
            __one_of: [
              [
                ...[
                  'date',
                  'date_time',
                  'date_time_no_millis',
                  'ordinal_date',
                  'ordinal_date_time',
                  'ordinal_date_time_no_millis',
                  'time',
                  'time_no_millis',
                  't_time',
                  't_time_no_millis',
                  'week_date',
                  'week_date_time',
                  'week_date_time_no_millis',
                ].flatMap(function (s) {
                  return ['basic_' + s, 'strict_' + s];
                }),
                ...[
                  'date',
                  'date_hour',
                  'date_hour_minute',
                  'date_hour_minute_second',
                  'date_hour_minute_second_fraction',
                  'date_hour_minute_second_millis',
                  'date_optional_time',
                  'date_time',
                  'date_time_no_millis',
                  'hour',
                  'hour_minute',
                  'hour_minute_second',
                  'hour_minute_second_fraction',
                  'hour_minute_second_millis',
                  'ordinal_date',
                  'ordinal_date_time',
                  'ordinal_date_time_no_millis',
                  'time',
                  'time_no_millis',
                  't_time',
                  't_time_no_millis',
                  'week_date',
                  'week_date_time',
                  'weekDateTimeNoMillis',
                  'weekyear',
                  'strict_weekyear',
                  'weekyear_week',
                  'strict_weekyear_week',
                  'strict_date_optional_time_nanos',
                  'weekyear_week_day',
                  'strict_weekyear_week_day',
                  'year',
                  'year_month',
                  'year_month_day',
                  'epoch_millis',
                  'epoch_second',
                ],
              ].sort(),
            ],
          },

          fielddata: {
            filter: {
              regex: '',
              frequency: {
                min: 0.001,
                max: 0.1,
                min_segment_size: 500,
              },
            },
          },
          similarity: {
            // leave the first item blank because the default depends on type
            __one_of: [
              '',
              // text-based types
              'BM25',
              'boolean',
              // dense_vector type
              'l2_norm',
              'dot_product',
              'cosine',
              'max_inner_product',
            ],
          },

          // objects
          properties: {
            __scope_link: 'put_mapping.type.properties',
          },

          // multi_field
          fields: {
            '*': {
              __scope_link: 'put_mapping.type.properties.field',
            },
          },
          copy_to: { __one_of: ['{field}', ['{field}']] },

          // nested
          include_in_parent: BOOLEAN,
          include_in_root: BOOLEAN,

          // dense_vector
          element_type: {
            __one_of: ['float', 'byte', 'bit'],
          },
          dims: 3,
        },
      },
    },
  });
};

const DenseVectorIndexOptions = {
  type: {
    __one_of: [
      'bbq_hnsw',
      'bbq_flat',
      'int8_hnsw',
      'hnsw',
      'int4_hnsw',
      'flat',
      'int8_flat',
      'int4_flat',
    ],
  },
  m: 16,
  ef_construction: 100,
  confidence_interval: 0,
};
