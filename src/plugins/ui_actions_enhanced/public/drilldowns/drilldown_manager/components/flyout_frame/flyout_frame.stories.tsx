/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/* eslint-disable no-console */

import * as React from 'react';
import { EuiFlyout, EuiButton } from '@elastic/eui';
import { storiesOf } from '@storybook/react';
import { FlyoutFrame } from '.';

storiesOf('components/FlyoutFrame', module)
  .add('default', () => {
    return <FlyoutFrame>test</FlyoutFrame>;
  })
  .add('with title', () => {
    return <FlyoutFrame title="Hello world">test</FlyoutFrame>;
  })
  .add('with onClose', () => {
    return <FlyoutFrame onClose={() => console.log('onClose')}>test</FlyoutFrame>;
  })
  .add('with onBack', () => {
    return (
      <FlyoutFrame onBack={() => console.log('onClose')} title={'Title'}>
        test
      </FlyoutFrame>
    );
  })
  .add('custom footer', () => {
    return <FlyoutFrame footer={<button>click me!</button>}>test</FlyoutFrame>;
  })
  .add('open in flyout', () => {
    return (
      <EuiFlyout onClose={() => {}}>
        <FlyoutFrame
          title="Create drilldown"
          footer={<EuiButton>Save</EuiButton>}
          onClose={() => console.log('onClose')}
        >
          test
        </FlyoutFrame>
      </EuiFlyout>
    );
  });
