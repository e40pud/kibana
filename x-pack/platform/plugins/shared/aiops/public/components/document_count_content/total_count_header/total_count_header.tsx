/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// TODO Consolidate with duplicate component `TotalCountHeader` in
// `x-pack/plugins/private/data_visualizer/public/application/common/components/document_count_content/total_count_header.tsx`

import { EuiFlexItem, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import React from 'react';

export const TotalCountHeader = ({
  sampleProbability,
  totalCount,
}: {
  sampleProbability?: number;
  totalCount: number;
}) => (
  <EuiFlexItem>
    <EuiText size="s" data-test-subj="aiopsTotalDocCountHeader">
      <FormattedMessage
        id="xpack.aiops.searchPanel.totalDocCountLabel"
        defaultMessage="Total documents: {strongTotalCount}"
        values={{
          strongTotalCount: (
            <strong data-test-subj="aiopsTotalDocCount">
              <FormattedMessage
                id="xpack.aiops.searchPanel.totalDocCountNumber"
                defaultMessage="{totalCount, plural, one {#} other {#}}"
                values={{ totalCount }}
              />
            </strong>
          ),
        }}
      />
      {sampleProbability !== undefined && sampleProbability < 1 && (
        <>
          {' '}
          <FormattedMessage
            id="xpack.aiops.searchPanel.sampleProbabilityLabel"
            defaultMessage="Sampling probability: {strongSamplingProbability}"
            values={{
              strongSamplingProbability: (
                <strong data-test-subj="aiopsSamplingProbability">
                  <FormattedMessage
                    id="xpack.aiops.searchPanel.sampleProbabilityNumber"
                    defaultMessage="{sampleProbability, plural, one {#} other {#}}"
                    values={{ sampleProbability }}
                  />
                </strong>
              ),
            }}
          />
        </>
      )}
    </EuiText>
  </EuiFlexItem>
);
