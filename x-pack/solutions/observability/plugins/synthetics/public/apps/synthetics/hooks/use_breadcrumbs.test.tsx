/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { coreMock } from '@kbn/core/public/mocks';
import { ChromeBreadcrumb } from '@kbn/core/public';
import { render } from '../utils/testing';
import React from 'react';
import { i18n } from '@kbn/i18n';
import { Route } from '@kbn/shared-ux-router';
import { OVERVIEW_ROUTE } from '../../../../common/constants';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import {
  SyntheticsUrlParams,
  getSupportedUrlParams,
} from '../utils/url_params/get_supported_url_params';
import { makeBaseBreadcrumb, useBreadcrumbs } from './use_breadcrumbs';
import { SyntheticsSettingsContext } from '../contexts';
import { BehaviorSubject } from 'rxjs';
import { ChromeStyle } from '@kbn/core-chrome-browser';

describe('useBreadcrumbs', () => {
  it('sets the given breadcrumbs', () => {
    const [getBreadcrumbs, core] = mockCore();

    const expectedCrumbs: ChromeBreadcrumb[] = [
      {
        text: 'Crumb: ',
        'data-test-subj': 'http://href.example.net',
        href: 'http://href.example.net',
      },
      {
        text: 'Crumb II: Son of Crumb',
        'data-test-subj': 'http://href2.example.net',
        href: 'http://href2.example.net',
      },
    ];

    const Component = () => {
      useBreadcrumbs(expectedCrumbs);
      return (
        <>
          {i18n.translate('app_not_found_in_i18nrc.component.helloLabel', {
            defaultMessage: 'Hello',
          })}
        </>
      );
    };

    render(
      <KibanaContextProvider services={{ ...core }}>
        <Route path={OVERVIEW_ROUTE}>
          <SyntheticsSettingsContext.Provider
            value={{
              darkMode: false,
              basePath: '/app/synthetics',
              canSave: true,
              dateRangeStart: '',
              dateRangeEnd: '',
              isApmAvailable: true,
              setBreadcrumbs: core.chrome.setBreadcrumbs,
              isInfraAvailable: false,
              isLogsAvailable: false,
              canManagePrivateLocations: false,
            }}
          >
            <Component />
          </SyntheticsSettingsContext.Provider>
        </Route>
      </KibanaContextProvider>
    );

    const urlParams: SyntheticsUrlParams = getSupportedUrlParams({});
    expect(JSON.stringify(getBreadcrumbs())).toEqual(
      JSON.stringify(
        [
          { text: 'Observability', href: '/app/observability/overview' },
          ...makeBaseBreadcrumb('/app/synthetics', urlParams),
        ].concat(expectedCrumbs)
      )
    );
  });
});

const mockCore: () => [() => ChromeBreadcrumb[], any] = () => {
  let breadcrumbObj: ChromeBreadcrumb[] = [];
  const get = () => {
    return breadcrumbObj;
  };
  const defaultCoreMock = coreMock.createStart();

  const core = {
    application: {
      getUrlForApp: (app: string) =>
        app === 'synthetics' ? '/app/synthetics' : '/app/observability',
      navigateToUrl: jest.fn(),
    },
    chrome: {
      ...defaultCoreMock.chrome,
      getChromeStyle$: () => new BehaviorSubject<ChromeStyle>('classic').asObservable(),
      setBreadcrumbs: (newBreadcrumbs: ChromeBreadcrumb[]) => {
        breadcrumbObj = newBreadcrumbs;
      },
    },
  };

  return [get, core];
};
