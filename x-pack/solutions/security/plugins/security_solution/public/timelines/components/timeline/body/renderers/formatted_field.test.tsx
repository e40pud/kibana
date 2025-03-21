/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { shallow } from 'enzyme';
import { get } from 'lodash/fp';
import React from 'react';

import { mockTimelineData, TestProviders } from '../../../../../common/mock';
import { getEmptyValue } from '../../../../../common/components/empty_value';
import { useMountAppended } from '../../../../../common/utils/use_mount_appended';

import { FormattedFieldValue } from './formatted_field';
import { HOST_NAME_FIELD_NAME } from './constants';

jest.mock('@elastic/eui', () => {
  const original = jest.requireActual('@elastic/eui');
  return {
    ...original,
    EuiScreenReaderOnly: () => <></>,
  };
});

jest.mock('../../../../../common/lib/kibana');
jest.mock('../../../../../common/components/link_to');

describe('Events', () => {
  const mount = useMountAppended();

  test('renders correctly against snapshot', () => {
    const wrapper = shallow(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName="timestamp"
          fieldType="date"
          value={get('timestamp', mockTimelineData[0].ecs)}
        />
      </TestProviders>
    );
    expect(wrapper.find('FormattedFieldValue')).toMatchSnapshot();
  });

  test('it renders a localized date tooltip for a field type of date that has a valid timestamp', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName="timestamp"
          fieldType="date"
          value={get('timestamp', mockTimelineData[0].ecs)}
        />
      </TestProviders>
    );

    expect(wrapper.find('[data-test-subj="localized-date-tool-tip"]').exists()).toEqual(true);
  });

  test('it does NOT render a localized date tooltip when field type is NOT date, even if it contains valid timestamp', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName="timestamp"
          fieldType="text"
          value={get('timestamp', mockTimelineData[0].ecs)}
        />
      </TestProviders>
    );

    expect(wrapper.find('[data-test-subj="localized-date-tool-tip"]').exists()).toEqual(false);
  });

  test('it does NOT render a localized date tooltip when field type is date, but it does NOT contains a valid timestamp', () => {
    const hasBadDate = {
      ...mockTimelineData[0].ecs,
      timestamp: 'not a good first date',
    };

    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName="timestamp"
          fieldType="date"
          value={get('timestamp', hasBadDate)}
        />
      </TestProviders>
    );

    expect(wrapper.find('[data-test-subj="localized-date-tool-tip"]').exists()).toEqual(false);
  });

  test('it renders the value for a non-date field when the field is populated', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName="event.module"
          fieldType="text"
          value={get('event.module[0]', mockTimelineData[0].ecs)}
        />
      </TestProviders>
    );

    expect(wrapper.text()).toEqual('nginx');
  });

  test('it renders placeholder text for a non-date field when the field is NOT populated', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName="fake.field"
          fieldType="text"
          value={get('fake.field', mockTimelineData[0].ecs)}
        />
      </TestProviders>
    );

    expect(wrapper.text()).toEqual(getEmptyValue());
  });

  test('it renders tooltip for truncatable message when it exists', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          contextId="test"
          eventId={mockTimelineData[0].ecs._id}
          fieldName="message"
          fieldType="text"
          truncate
          value={'some message'}
        />
      </TestProviders>
    );

    expect(wrapper.find('[data-test-subj="message-tool-tip"]').exists()).toEqual(true);
  });

  test('it does NOT render a tooltip for truncatable message when it is null', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          contextId="test"
          eventId={mockTimelineData[0].ecs._id}
          fieldName="message"
          fieldType="text"
          truncate
          value={null}
        />
      </TestProviders>
    );
    expect(wrapper.find('[data-test-subj="message-tool-tip"]').exists()).toEqual(false);
  });

  test('it does NOT render a tooltip for truncatable message when it is undefined', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          contextId="test"
          eventId={mockTimelineData[0].ecs._id}
          fieldName="message"
          fieldType="text"
          truncate
          value={undefined}
        />
      </TestProviders>
    );
    expect(wrapper.find('[data-test-subj="message-tool-tip"]').exists()).toEqual(false);
  });

  test('it does NOT render a tooltip for truncatable message when it is an empty string', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          contextId="test"
          eventId={mockTimelineData[0].ecs._id}
          fieldName="message"
          fieldType="text"
          truncate
          value={''}
        />
      </TestProviders>
    );
    expect(wrapper.find('[data-test-subj="message-tool-tip"]').exists()).toEqual(false);
  });

  test('it renders a message text string', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName="message"
          fieldType="text"
          value={'some message'}
        />
      </TestProviders>
    );
    expect(wrapper.text()).toEqual('some message');
  });

  test('it renders truncatable message text when fieldName is message with truncate prop', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          contextId="test"
          eventId={mockTimelineData[0].ecs._id}
          fieldName="message"
          fieldType="text"
          truncate
          value={'some message'}
        />
      </TestProviders>
    );
    expect(wrapper.find('[data-test-subj="truncatable-message"]').exists()).toEqual(true);
  });

  test('it does NOT render the truncatable message style when truncate is false', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName="NOT-message"
          fieldType="text"
          truncate={false}
          value={'a NON-message value'}
        />
      </TestProviders>
    );
    expect(wrapper.find('[data-test-subj="truncatable-message"]').exists()).toEqual(false);
  });

  test('it renders a button to open the hosts details panel when fieldName is host.name, and a hostname is provided', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName={HOST_NAME_FIELD_NAME}
          fieldType="text"
          value={'some-hostname'}
        />
      </TestProviders>
    );
    expect(wrapper.find('[data-test-subj="host-details-button"]').exists()).toEqual(true);
  });

  test('it does NOT render a button to open the hosts details panel when fieldName is host.name, but a hostname is NOT provided', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName={HOST_NAME_FIELD_NAME}
          fieldType="text"
          value={undefined}
        />
      </TestProviders>
    );
    expect(wrapper.find('[data-test-subj="host-details-button"]').exists()).toEqual(false);
  });

  test('it renders placeholder text when fieldName is host.name, but a hostname is NOT provided', () => {
    const wrapper = mount(
      <TestProviders>
        <FormattedFieldValue
          eventId={mockTimelineData[0].ecs._id}
          contextId="test"
          fieldName={HOST_NAME_FIELD_NAME}
          fieldType="text"
          value={undefined}
        />
      </TestProviders>
    );
    expect(wrapper.text()).toEqual(getEmptyValue());
  });
});
