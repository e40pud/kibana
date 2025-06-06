/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC } from 'react';
import React from 'react';

import { Axis, BarSeries, Chart, Position, ScaleType, Settings } from '@elastic/charts';
import type { EuiDataGridColumn } from '@elastic/eui';
import { useElasticChartsTheme } from '@kbn/charts-theme';
import { isUnsupportedChartData, type ChartData } from '@kbn/ml-data-grid';

import { i18n } from '@kbn/i18n';
import { useColumnChart } from './use_column_chart';
import { useColumnChartStyles } from './column_chart_styles';

interface Props {
  chartData: ChartData;
  columnType: EuiDataGridColumn;
  dataTestSubj: string;
  hideLabel?: boolean;
  maxChartColumns: number;
  isNumeric?: boolean;
}

const zeroSize = { bottom: 0, left: 0, right: 0, top: 0 };
const size = { width: 100, height: 10 };

export const ColumnChart: FC<Props> = ({
  chartData,
  columnType,
  dataTestSubj,
  hideLabel,
  maxChartColumns,
  isNumeric,
}) => {
  const { data, legendText } = useColumnChart(chartData, columnType, maxChartColumns, isNumeric);
  const styles = useColumnChartStyles();
  const chartBaseTheme = useElasticChartsTheme();
  return (
    <div data-test-subj={dataTestSubj} style={{ width: '100%' }}>
      {!isUnsupportedChartData(chartData) && data.length > 0 && (
        <Chart size={size}>
          <Settings
            baseTheme={chartBaseTheme}
            xDomain={Array.from({ length: maxChartColumns }, (_, i) => i)}
            theme={{
              chartMargins: zeroSize,
              chartPaddings: zeroSize,
              crosshair: { band: { visible: false } },
              axes: { gridLine: { horizontal: { visible: false }, vertical: { visible: false } } },
            }}
            locale={i18n.getLocale()}
          />
          <Axis
            id="bottom"
            position={Position.Bottom}
            tickFormat={(idx) => {
              return `${data[idx]?.key_as_string ?? ''}`;
            }}
            hide
          />
          <BarSeries
            id={'count'}
            xScaleType={ScaleType.Ordinal}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['doc_count']}
            data={data}
            styleAccessor={(d) => d.datum.color}
          />
        </Chart>
      )}
      <div css={styles.legend} data-test-subj={`${dataTestSubj}-legend`}>
        {legendText}
      </div>
      {!hideLabel && <div data-test-subj={`${dataTestSubj}-id`}>{columnType.id}</div>}
    </div>
  );
};
