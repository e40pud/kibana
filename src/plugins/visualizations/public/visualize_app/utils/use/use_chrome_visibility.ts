/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useState, useEffect } from 'react';
import { ChromeStart } from '@kbn/core/public';

export const useChromeVisibility = (chrome: ChromeStart) => {
  const [isVisible, setIsVisible] = useState<boolean>();

  useEffect(() => {
    const subscription = chrome.getIsVisible$().subscribe((value: boolean) => {
      setIsVisible(value);
    });

    return () => subscription.unsubscribe();
  }, [chrome]);

  return isVisible;
};
