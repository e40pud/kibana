/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Suggestion } from '@kbn/lens-plugin/public';
import { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { v4 } from 'uuid';
import { SuggestVisualizationList as Component } from '.';
import '../../../.storybook/mock_kibana_services';
import { KibanaReactStorybookDecorator } from '../../../.storybook/storybook_decorator';
import { metricSuggestion, tableSuggestion, treemapSuggestion } from './suggestions.mock';

const meta: Meta<typeof Component> = {
  component: Component,
  title: 'app/Molecules/SuggestVisualizationList',
  decorators: [KibanaReactStorybookDecorator],
};

export default meta;

function mapWithIds(suggestions: Suggestion[]) {
  return suggestions.map((suggestion) => ({ id: v4(), ...suggestion }));
}

const defaultProps: StoryObj<typeof Component> = {
  render: (props) => {
    return <Component {...props} />;
  },
};

export const WithSuggestions: StoryObj<typeof Component> = {
  ...defaultProps,
  args: {
    loading: false,
    suggestions: mapWithIds([tableSuggestion, treemapSuggestion]),
  },
  name: 'With suggestions',
};

export const WithoutSuggestions: StoryObj<typeof Component> = {
  ...defaultProps,
  args: {
    loading: false,
    suggestions: [],
  },
  name: 'Without suggestions',
};

export const LoadingStory: StoryObj<typeof Component> = {
  ...defaultProps,
  args: {
    loading: true,
    suggestions: [],
  },
  name: 'Loading without suggestions',
};

export const LoadingWithSuggestionsStory: StoryObj<typeof Component> = {
  ...defaultProps,
  args: {
    loading: true,
    suggestions: mapWithIds([metricSuggestion, treemapSuggestion]),
  },
  name: 'Loading with suggestions',
};

export const ErrorStory: StoryObj<typeof Component> = {
  ...defaultProps,
  args: {
    error: new Error('Network error'),
    suggestions: [],
  },
  name: 'Error',
};
