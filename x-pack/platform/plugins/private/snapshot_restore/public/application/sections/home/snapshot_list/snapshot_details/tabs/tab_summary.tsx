/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiLoadingSpinner,
} from '@elastic/eui';

import { reactRouterNavigate } from '@kbn/kibana-react-plugin/public';
import { SnapshotDetails } from '../../../../../../../common/types';
import { SNAPSHOT_STATE } from '../../../../../constants';
import {
  DataPlaceholder,
  FormattedDateTime,
  CollapsibleIndicesList,
  CollapsibleDataStreamsList,
} from '../../../../../components';
import { linkToPolicy } from '../../../../../services/navigation';
import { SnapshotState } from './snapshot_state';
import { useServices } from '../../../../../app_context';
import { SnapshotFeatureStatesSummary } from '../../../../../components/summaries';

interface Props {
  snapshotDetails: SnapshotDetails;
}

export const TabSummary: React.FC<Props> = ({ snapshotDetails }) => {
  const {
    version,
    // TODO: Add a tooltip explaining that: a false value means that the cluster global state
    // is not stored as part of the snapshot.
    includeGlobalState,
    featureStates,
    dataStreams,
    indices,
    state,
    startTimeInMillis,
    endTimeInMillis,
    durationInMillis,
    uuid,
    policyName,
  } = snapshotDetails;

  const { history } = useServices();

  return (
    <EuiDescriptionList textStyle="reverse">
      <EuiFlexGroup>
        <EuiFlexItem data-test-subj="version">
          <EuiDescriptionListTitle data-test-subj="title">
            <FormattedMessage
              id="xpack.snapshotRestore.snapshotDetails.itemVersionLabel"
              defaultMessage="Version"
            />
          </EuiDescriptionListTitle>

          <EuiDescriptionListDescription className="eui-textBreakWord" data-test-subj="value">
            {version}
          </EuiDescriptionListDescription>
        </EuiFlexItem>

        <EuiFlexItem data-test-subj="uuid">
          <EuiDescriptionListTitle data-test-subj="title">
            <FormattedMessage
              id="xpack.snapshotRestore.snapshotDetails.itemUuidLabel"
              defaultMessage="UUID"
            />
          </EuiDescriptionListTitle>

          <EuiDescriptionListDescription className="eui-textBreakWord" data-test-subj="value">
            {uuid}
          </EuiDescriptionListDescription>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup>
        <EuiFlexItem data-test-subj="state">
          <EuiDescriptionListTitle data-test-subj="title">
            <FormattedMessage
              id="xpack.snapshotRestore.snapshotDetails.itemStateLabel"
              defaultMessage="State"
            />
          </EuiDescriptionListTitle>

          <EuiDescriptionListDescription className="eui-textBreakWord" data-test-subj="value">
            <SnapshotState state={state} displayTooltipIcon={true} />
          </EuiDescriptionListDescription>
        </EuiFlexItem>

        <EuiFlexItem data-test-subj="duration">
          <EuiDescriptionListTitle data-test-subj="title">
            <FormattedMessage
              id="xpack.snapshotRestore.snapshotDetails.itemDurationLabel"
              defaultMessage="Duration"
            />
          </EuiDescriptionListTitle>

          <EuiDescriptionListDescription className="eui-textBreakWord" data-test-subj="value">
            {state === SNAPSHOT_STATE.IN_PROGRESS ? (
              <EuiLoadingSpinner size="m" />
            ) : (
              <DataPlaceholder data={durationInMillis}>
                <FormattedMessage
                  id="xpack.snapshotRestore.snapshotDetails.itemDurationValueLabel"
                  data-test-subj="srSnapshotDetailsDurationValue"
                  defaultMessage="{seconds} {seconds, plural, one {second} other {seconds}}"
                  values={{ seconds: Math.ceil(durationInMillis / 1000) }}
                />
              </DataPlaceholder>
            )}
          </EuiDescriptionListDescription>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup>
        <EuiFlexItem data-test-subj="includeGlobalState">
          <EuiDescriptionListTitle data-test-subj="title">
            <FormattedMessage
              id="xpack.snapshotRestore.snapshotDetails.itemIncludeGlobalStateLabel"
              defaultMessage="Includes global state"
            />
          </EuiDescriptionListTitle>

          <EuiDescriptionListDescription className="eui-textBreakWord" data-test-subj="value">
            {includeGlobalState === false ? (
              <FormattedMessage
                data-test-subj="withoutGlobalState"
                id="xpack.snapshotRestore.snapshotDetails.itemIncludeGlobalStateNoLabel"
                defaultMessage="No"
              />
            ) : (
              <FormattedMessage
                data-test-subj="withGlobalState"
                id="xpack.snapshotRestore.snapshotDetails.itemIncludeGlobalStateYesLabel"
                defaultMessage="Yes"
              />
            )}
          </EuiDescriptionListDescription>
        </EuiFlexItem>

        <SnapshotFeatureStatesSummary featureStates={featureStates} />
      </EuiFlexGroup>

      <EuiFlexGroup>
        <EuiFlexItem data-test-subj="indices">
          <EuiDescriptionListTitle data-test-subj="title">
            <FormattedMessage
              id="xpack.snapshotRestore.snapshotDetails.itemIndicesLabel"
              defaultMessage="Indices ({indicesCount})"
              values={{ indicesCount: indices.length }}
            />
          </EuiDescriptionListTitle>

          <EuiDescriptionListDescription className="eui-textBreakWord" data-test-subj="value">
            <CollapsibleIndicesList indices={indices} />
          </EuiDescriptionListDescription>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup>
        <EuiFlexItem data-test-subj="dataStreams">
          <EuiDescriptionListTitle data-test-subj="title">
            <FormattedMessage
              id="xpack.snapshotRestore.snapshotDetails.itemDataStreamsLabel"
              defaultMessage="Data streams ({dataStreamsCount})"
              values={{ dataStreamsCount: dataStreams.length }}
            />
          </EuiDescriptionListTitle>

          <EuiDescriptionListDescription className="eui-textBreakWord" data-test-subj="value">
            <CollapsibleDataStreamsList dataStreams={dataStreams} />
          </EuiDescriptionListDescription>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup>
        <EuiFlexItem data-test-subj="startTime">
          <EuiDescriptionListTitle data-test-subj="title">
            <FormattedMessage
              id="xpack.snapshotRestore.snapshotDetails.itemStartTimeLabel"
              defaultMessage="Start time"
            />
          </EuiDescriptionListTitle>

          <EuiDescriptionListDescription className="eui-textBreakWord" data-test-subj="value">
            <DataPlaceholder data={startTimeInMillis}>
              <FormattedDateTime epochMs={startTimeInMillis} />
            </DataPlaceholder>
          </EuiDescriptionListDescription>
        </EuiFlexItem>

        <EuiFlexItem data-test-subj="endTime">
          <EuiDescriptionListTitle data-test-subj="title">
            <FormattedMessage
              id="xpack.snapshotRestore.snapshotDetails.itemEndTimeLabel"
              defaultMessage="End time"
            />
          </EuiDescriptionListTitle>

          <EuiDescriptionListDescription className="eui-textBreakWord" data-test-subj="value">
            {state === SNAPSHOT_STATE.IN_PROGRESS ? (
              <EuiLoadingSpinner size="m" />
            ) : (
              <DataPlaceholder data={endTimeInMillis}>
                <FormattedDateTime epochMs={endTimeInMillis} />
              </DataPlaceholder>
            )}
          </EuiDescriptionListDescription>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup>
        {policyName ? (
          <EuiFlexItem data-test-subj="policy">
            <EuiDescriptionListTitle data-test-subj="title">
              <FormattedMessage
                id="xpack.snapshotRestore.snapshotDetails.createdByLabel"
                defaultMessage="Created by"
              />
            </EuiDescriptionListTitle>

            <EuiDescriptionListDescription className="eui-textBreakWord" data-test-subj="value">
              <EuiLink {...reactRouterNavigate(history, linkToPolicy(policyName))}>
                {policyName}
              </EuiLink>
            </EuiDescriptionListDescription>
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    </EuiDescriptionList>
  );
};
