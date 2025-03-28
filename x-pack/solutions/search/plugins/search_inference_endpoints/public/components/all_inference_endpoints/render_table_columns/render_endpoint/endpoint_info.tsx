/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiBetaBadge, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import React from 'react';
import { InferenceInferenceEndpointInfo } from '@elastic/elasticsearch/lib/api/types';
import { isEndpointPreconfigured } from '../../../../utils/preconfigured_endpoint_helper';
import * as i18n from './translations';
import { isProviderTechPreview } from '../../../../utils/reranker_helper';

export interface EndpointInfoProps {
  inferenceId: string;
  endpointInfo: InferenceInferenceEndpointInfo;
}

export const EndpointInfo: React.FC<EndpointInfoProps> = ({ inferenceId, endpointInfo }) => (
  <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
    <EuiFlexItem grow={false}>
      <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
        <EuiFlexItem grow={false}>
          <span>
            <strong>{inferenceId}</strong>
          </span>
        </EuiFlexItem>
        {isProviderTechPreview(endpointInfo) ? (
          <EuiFlexItem grow={false}>
            <span>
              <EuiBetaBadge
                label={i18n.TECH_PREVIEW_LABEL}
                size="s"
                color="subdued"
                alignment="middle"
              />
            </span>
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    </EuiFlexItem>
    {isEndpointPreconfigured(inferenceId) ? (
      <EuiFlexItem grow={false}>
        <span>
          <EuiBetaBadge
            label={i18n.PRECONFIGURED_LABEL}
            size="s"
            color="hollow"
            alignment="middle"
          />
        </span>
      </EuiFlexItem>
    ) : null}
  </EuiFlexGroup>
);
