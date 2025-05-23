/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { composeStories } from '@storybook/react';
import React from 'react';
import { mount } from 'enzyme';
import { EuiThemeProvider } from '@elastic/eui';
import * as stories from './exception_stacktrace.stories';
import type { ExceptionStackTraceTitleProps } from './exception_stacktrace_title';

const { JavaWithLongLines } = composeStories(stories);

describe('ExceptionStacktrace', () => {
  describe('render', () => {
    describe('with stacktraces', () => {
      it('renders the stacktraces', () => {
        expect(
          mount(<JavaWithLongLines />, {
            wrappingComponent: EuiThemeProvider,
          }).find('Stacktrace')
        ).toHaveLength(3);
      });
      it('should have the title in a specific format', function () {
        const wrapper = mount(<JavaWithLongLines />, {
          wrappingComponent: EuiThemeProvider,
        }).find('ExceptionStacktraceTitle');
        expect(wrapper).toHaveLength(1);
        const { type, message } = wrapper.props() as ExceptionStackTraceTitleProps;
        expect(wrapper.text()).toContain(`${type}: ${message}`);
      });
    });

    describe('with more than one stack trace', () => {
      it('renders cause stacktraces', () => {
        expect(
          mount(<JavaWithLongLines />, {
            wrappingComponent: EuiThemeProvider,
          }).find('CauseStacktrace')
        ).toHaveLength(2);
      });
    });
  });
});
