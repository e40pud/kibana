/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import _ from 'lodash';
import { euiPaletteColorBlind } from '@elastic/eui';

const thresholdLineDefaults = {
  show: false,
  value: 10,
  width: 1,
  style: 'full',
  color: euiPaletteColorBlind()[9],
};

export class PointSeries {
  constructor(handler, seriesEl, seriesData, seriesConfig) {
    this.handler = handler;
    this.baseChart = handler.pointSeries;
    this.chartEl = seriesEl;
    this.chartData = seriesData;
    this.seriesConfig = seriesConfig;
    this.thresholdLineOptions = _.defaults(
      handler.visConfig.get('thresholdLine', {}),
      thresholdLineDefaults
    );
  }

  getGroupedCount() {
    const stacks = [];
    return this.baseChart.chartConfig.series.reduce((sum, series) => {
      const valueAxis = series.valueAxis || this.baseChart.handler.valueAxes[0].id;
      const isStacked = series.mode === 'stacked';
      const isHistogram = series.type === 'histogram';
      if (!isHistogram) return sum;
      if (isStacked && stacks.includes(valueAxis)) return sum;
      if (isStacked) stacks.push(valueAxis);
      return sum + 1;
    }, 0);
  }

  getGroupedNum(seriesId) {
    let i = 0;
    const stacks = [];
    for (const seri of this.baseChart.chartConfig.series) {
      const valueAxis = seri.valueAxis || this.baseChart.handler.valueAxes[0].id;
      const isStacked = seri.mode === 'stacked';
      if (!isStacked) {
        if (seri.data.rawId === seriesId) return i;
        i++;
      } else {
        if (!(valueAxis in stacks)) stacks[valueAxis] = i++;
        if (seri.data.rawId === seriesId) return stacks[valueAxis];
      }
    }
    return 0;
  }

  getValueAxis() {
    return (
      _.find(this.handler.valueAxes, (axis) => {
        return axis.axisConfig.get('id') === this.seriesConfig.valueAxis;
      }) || this.handler.valueAxes[0]
    );
  }

  getCategoryAxis() {
    return (
      _.find(this.handler.categoryAxes, (axis) => {
        return axis.axisConfig.get('id') === this.seriesConfig.categoryAxis;
      }) || this.handler.categoryAxes[0]
    );
  }

  addCircleEvents(element) {
    const events = this.events;
    if (this.handler.visConfig.get('enableHover')) {
      const hover = events.addHoverEvent();
      const mouseout = events.addMouseoutEvent();
      element.call(hover).call(mouseout);
    }
    const click = events.addClickEvent();
    return element.call(click);
  }

  addThresholdLine(svgElem) {
    const chartData = this.chartData;
    const isHorizontal = this.getCategoryAxis().axisConfig.isHorizontal();
    const valueAxisDomain = this.getValueAxis().axisScale.getDomain(chartData.values.length);
    const yScale = this.getValueAxis().getScale();
    const svgParentWidth = svgElem[0][0].attributes.width.value;
    const svgParentHeight = svgElem[0][0].attributes.height.value;

    const thresholdLineWidth = this.thresholdLineOptions.width;
    let thresholdLineStyle = '0';
    if (this.thresholdLineOptions.style === 'dashed') {
      thresholdLineStyle = '10,5';
    } else if (this.thresholdLineOptions.style === 'dot-dashed') {
      thresholdLineStyle = '20,5,5,5';
    }
    const thresholdValue = this.thresholdLineOptions.value;

    const lineColor = this.thresholdLineOptions.color;

    function y(y) {
      return yScale(y);
    }

    if (
      valueAxisDomain &&
      valueAxisDomain[0] <= thresholdValue &&
      valueAxisDomain[1] >= thresholdValue
    ) {
      svgElem
        .append('line')
        .attr('x1', isHorizontal ? 0 : y(thresholdValue))
        .attr('y1', isHorizontal ? y(thresholdValue) : 0)
        .attr('x2', isHorizontal ? svgParentWidth : y(thresholdValue))
        .attr('y2', isHorizontal ? y(thresholdValue) : svgParentHeight)
        .attr('stroke-width', thresholdLineWidth)
        .attr('stroke-dasharray', thresholdLineStyle)
        .attr('stroke', lineColor);
    }
  }
}
