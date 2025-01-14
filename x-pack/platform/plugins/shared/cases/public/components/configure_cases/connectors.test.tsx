/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { ComponentType, ReactWrapper } from 'enzyme';
import { mount } from 'enzyme';
import { render, screen } from '@testing-library/react';

import type { Props } from './connectors';
import { Connectors } from './connectors';
import {
  type AppMockRenderer,
  noConnectorsCasePermission,
  createAppMockRenderer,
  TestProviders,
} from '../../common/mock';
import { ConnectorsDropdown } from './connectors_dropdown';
import { connectors, actionTypes } from './__mock__';
import { ConnectorTypes } from '../../../common/types/domain';
import userEvent from '@testing-library/user-event';
import { useApplicationCapabilities } from '../../common/lib/kibana';

const useApplicationCapabilitiesMock = useApplicationCapabilities as jest.Mocked<
  typeof useApplicationCapabilities
>;
jest.mock('../../common/lib/kibana');

describe('Connectors', () => {
  let wrapper: ReactWrapper;
  let appMockRender: AppMockRenderer;
  const onChangeConnector = jest.fn();
  const handleShowEditFlyout = jest.fn();
  const onAddNewConnector = jest.fn();

  const props: Props = {
    actionTypes,
    connectors,
    disabled: false,
    handleShowEditFlyout,
    isLoading: false,
    mappings: [],
    onChangeConnector,
    selectedConnector: { id: 'none', type: ConnectorTypes.none },
    updateConnectorDisabled: false,
    onAddNewConnector,
  };

  beforeAll(() => {
    wrapper = mount(<Connectors {...props} />, {
      wrappingComponent: TestProviders as ComponentType<React.PropsWithChildren<{}>>,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    appMockRender = createAppMockRenderer();
  });

  it('shows the connectors from group', () => {
    expect(wrapper.find('[data-test-subj="case-connectors-form-group"]').first().exists()).toBe(
      true
    );
  });

  it('shows the connectors form row', () => {
    expect(wrapper.find('[data-test-subj="case-connectors-form-row"]').first().exists()).toBe(true);
  });

  it('shows the connectors dropdown', () => {
    expect(wrapper.find('[data-test-subj="case-connectors-dropdown"]').first().exists()).toBe(true);
  });

  it('pass the correct props to child', () => {
    const connectorsDropdownProps = wrapper.find(ConnectorsDropdown).props();
    expect(connectorsDropdownProps).toMatchObject({
      disabled: false,
      isLoading: false,
      connectors,
      selectedConnector: 'none',
      onChange: props.onChangeConnector,
    });
  });

  it('the connector is changed successfully', () => {
    wrapper.find('button[data-test-subj="dropdown-connectors"]').simulate('click');
    wrapper.find('button[data-test-subj="dropdown-connector-resilient-2"]').simulate('click');

    expect(onChangeConnector).toHaveBeenCalled();
    expect(onChangeConnector).toHaveBeenCalledWith('resilient-2');
  });

  it('the connector is changed successfully to none', () => {
    onChangeConnector.mockClear();
    const newWrapper = mount(
      <Connectors
        {...props}
        selectedConnector={{ id: 'servicenow-1', type: ConnectorTypes.serviceNowITSM }}
      />,
      {
        wrappingComponent: TestProviders as ComponentType<React.PropsWithChildren<{}>>,
      }
    );

    newWrapper.find('button[data-test-subj="dropdown-connectors"]').simulate('click');
    newWrapper.find('button[data-test-subj="dropdown-connector-no-connector"]').simulate('click');

    expect(onChangeConnector).toHaveBeenCalled();
    expect(onChangeConnector).toHaveBeenCalledWith('none');
  });

  it('shows the add connector button', () => {
    appMockRender.render(<Connectors {...props} />);

    expect(screen.getByTestId('add-new-connector')).toBeInTheDocument();
  });

  it('shows the add connector flyout when the button is clicked', async () => {
    appMockRender.render(<Connectors {...props} />);

    await userEvent.click(await screen.findByTestId('add-new-connector'));
    expect(onAddNewConnector).toHaveBeenCalled();
  });

  it('the text of the update button is shown correctly', () => {
    const newWrapper = mount(
      <Connectors
        {...props}
        selectedConnector={{ id: 'servicenow-1', type: ConnectorTypes.serviceNowITSM }}
      />,
      {
        wrappingComponent: TestProviders as ComponentType<React.PropsWithChildren<{}>>,
      }
    );

    expect(
      newWrapper
        .find('button[data-test-subj="case-configure-update-selected-connector-button"]')
        .text()
    ).toBe('Update My SN connector');
  });

  it('shows the deprecated callout when the connector is deprecated', async () => {
    render(
      <Connectors
        {...props}
        selectedConnector={{ id: 'servicenow-uses-table-api', type: ConnectorTypes.serviceNowITSM }}
      />,
      {
        // wrapper: TestProviders produces a TS error
        wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
      }
    );

    expect(screen.getByText('This connector type is deprecated')).toBeInTheDocument();
    expect(screen.getByText('Update this connector, or create a new one.')).toBeInTheDocument();
  });

  it('does not shows the deprecated callout when the connector is none', async () => {
    render(<Connectors {...props} />, {
      // wrapper: TestProviders produces a TS error
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    });

    expect(screen.queryByText('Deprecated connector type')).not.toBeInTheDocument();
  });

  it('shows the actions permission message if the user does not have read access to actions', async () => {
    useApplicationCapabilitiesMock().actions = { crud: false, read: false };

    appMockRender.render(<Connectors {...props} />);

    expect(
      await screen.findByTestId('configure-case-connector-permissions-error-msg')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('case-connectors-dropdown')).not.toBeInTheDocument();
  });

  it('shows the actions permission message if the user does not have access to case connector', async () => {
    appMockRender = createAppMockRenderer({ permissions: noConnectorsCasePermission() });

    const result = appMockRender.render(<Connectors {...props} />);
    expect(
      result.getByTestId('configure-case-connector-permissions-error-msg')
    ).toBeInTheDocument();
    expect(result.queryByTestId('case-connectors-dropdown')).toBe(null);
  });

  it('it should hide the "Add Connector" button when the user lacks the capability to add a new connector', () => {
    useApplicationCapabilitiesMock().actions = { crud: false, read: true };

    appMockRender.render(<Connectors {...props} />);

    expect(screen.queryByTestId('add-new-connector')).not.toBeInTheDocument();
  });
});
