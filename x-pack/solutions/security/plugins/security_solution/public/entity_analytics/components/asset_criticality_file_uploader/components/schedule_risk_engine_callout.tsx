/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import {
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiHorizontalRule,
  EuiText,
  EuiFlexItem,
} from '@elastic/eui';
import React, { useCallback } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';

import { i18n } from '@kbn/i18n';
import { RiskEngineStatusEnum } from '../../../../../common/api/entity_analytics';
import { useAppToasts } from '../../../../common/hooks/use_app_toasts';
import { useScheduleNowRiskEngineMutation } from '../../../api/hooks/use_schedule_now_risk_engine_mutation';
import {
  useRiskEngineStatus,
  useRiskEngineCountdownTime,
} from '../../../api/hooks/use_risk_engine_status';

const TEN_SECONDS = 10000;

export const ScheduleRiskEngineCallout: React.FC = () => {
  const { data: riskEngineStatus, isLoading: isRiskEngineStatusLoading } = useRiskEngineStatus({
    refetchInterval: TEN_SECONDS,
    structuralSharing: false, // Force the component to rerender after every Risk Engine Status API call
  });
  const isRunning = riskEngineStatus?.risk_engine_task_status?.status === 'running';
  const { addSuccess, addError } = useAppToasts();
  const { isLoading: isLoadingRiskEngineSchedule, mutate: scheduleRiskEngineMutation } =
    useScheduleNowRiskEngineMutation({
      onSuccess: () =>
        addSuccess(
          i18n.translate(
            'xpack.securitySolution.entityAnalytics.assetCriticalityResultStep.riskEngine.successMessage',
            {
              defaultMessage: 'Risk engine run scheduled',
            }
          )
        ),
      onError: (error) =>
        addError(error, {
          title: i18n.translate(
            'xpack.securitySolution.entityAnalytics.assetCriticalityResultStep.riskEngine.errorMessage',
            {
              defaultMessage: 'Risk engine schedule failed',
            }
          ),
        }),
    });

  const countDownText = useRiskEngineCountdownTime(riskEngineStatus);

  const scheduleRiskEngine = useCallback(() => {
    scheduleRiskEngineMutation();
  }, [scheduleRiskEngineMutation]);

  if (riskEngineStatus?.risk_engine_status !== RiskEngineStatusEnum.ENABLED) {
    return null;
  }

  return (
    <EuiCallOut
      data-test-subj="risk-engine-callout"
      title={
        <FormattedMessage
          defaultMessage="Entity risk score"
          id="xpack.securitySolution.entityAnalytics.assetCriticalityResultStep.riskEngine.calloutTitle"
        />
      }
      color="primary"
      iconType="info"
    >
      <FormattedMessage
        defaultMessage="The assigned criticality levels will impact entity risk scores on the next engine run."
        id="xpack.securitySolution.entityAnalytics.assetCriticalityResultStep.riskEngine.calloutText"
      />
      <EuiHorizontalRule />
      <EuiFlexGroup direction="row">
        <EuiFlexItem>
          <EuiText size="xs">
            <FormattedMessage
              defaultMessage="The next scheduled engine run is in:"
              id="xpack.securitySolution.entityAnalytics.assetCriticalityResultStep.riskEngine.scheduleText"
            />
            <b>{` ${countDownText}`}</b>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            iconType="play"
            size="xs"
            onClick={scheduleRiskEngine}
            isLoading={isLoadingRiskEngineSchedule || isRiskEngineStatusLoading || isRunning}
          >
            <FormattedMessage
              defaultMessage="Recalculate entity risk scores now"
              id="xpack.securitySolution.entityAnalytics.assetCriticalityResultStep.riskEngine.runNowButton"
            />
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCallOut>
  );
};
