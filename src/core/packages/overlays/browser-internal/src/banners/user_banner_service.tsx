/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { filter } from 'rxjs';
import { Subscription } from 'rxjs';

import { FormattedMessage } from '@kbn/i18n-react';
import { EuiCallOut, EuiButton, EuiLoadingSpinner } from '@elastic/eui';

import type { AnalyticsServiceStart } from '@kbn/core-analytics-browser';
import type { ThemeServiceStart } from '@kbn/core-theme-browser';
import type { UserProfileService } from '@kbn/core-user-profile-browser';
import type { I18nStart } from '@kbn/core-i18n-browser';
import type { IUiSettingsClient } from '@kbn/core-ui-settings-browser';
import type { OverlayBannersStart } from '@kbn/core-overlays-browser';
import { KibanaRenderContextProvider } from '@kbn/react-kibana-context-render';

interface StartServices {
  analytics: AnalyticsServiceStart;
  i18n: I18nStart;
  theme: ThemeServiceStart;
  userProfile: UserProfileService;
}

interface StartDeps extends StartServices {
  banners: OverlayBannersStart;
  uiSettings: IUiSettingsClient;
}

const ReactMarkdownLazy = React.lazy(() => import('react-markdown'));

/**
 * Sets up the custom banner that can be specified in advanced settings.
 * @internal
 */
export class UserBannerService {
  private settingsSubscription?: Subscription;

  public start({ banners, uiSettings, ...startServices }: StartDeps) {
    let id: string | undefined;
    let timeout: any;

    const dismiss = () => {
      banners.remove(id!);
      clearTimeout(timeout);
    };

    const updateBanner = () => {
      const content = uiSettings.get('notifications:banner');
      const lifetime = uiSettings.get('notifications:lifetime:banner');

      if (typeof content !== 'string' || content.length === 0 || typeof lifetime !== 'number') {
        dismiss();
        return;
      }

      id = banners.replace(
        id,
        (el) => {
          ReactDOM.render(
            <KibanaRenderContextProvider {...startServices}>
              <EuiCallOut
                title={
                  <FormattedMessage
                    id="core.ui.overlays.banner.attentionTitle"
                    defaultMessage="Attention"
                  />
                }
                iconType="question"
              >
                <React.Suspense
                  fallback={
                    <div>
                      <EuiLoadingSpinner />
                    </div>
                  }
                >
                  <ReactMarkdownLazy>{content.trim()}</ReactMarkdownLazy>
                </React.Suspense>

                <EuiButton color="primary" size="s" onClick={() => banners.remove(id!)}>
                  <FormattedMessage
                    id="core.ui.overlays.banner.closeButtonLabel"
                    defaultMessage="Close"
                  />
                </EuiButton>
              </EuiCallOut>
            </KibanaRenderContextProvider>,
            el
          );

          timeout = setTimeout(dismiss, lifetime);

          return () => ReactDOM.unmountComponentAtNode(el);
        },
        100
      );
    };

    updateBanner();
    this.settingsSubscription = uiSettings
      .getUpdate$()
      .pipe(
        filter(
          ({ key }) => key === 'notifications:banner' || key === 'notifications:lifetime:banner'
        )
      )
      .subscribe(() => updateBanner());
  }

  public stop() {
    if (this.settingsSubscription) {
      this.settingsSubscription.unsubscribe();
      this.settingsSubscription = undefined;
    }
  }
}
