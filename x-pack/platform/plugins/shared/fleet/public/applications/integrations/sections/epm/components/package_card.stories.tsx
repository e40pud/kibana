/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import type { PackageCardProps } from './package_card';
import { PackageCard } from './package_card';

export default {
  title: 'Sections/EPM/Package Card',
  description: 'A card representing a package available in Fleet',
};

type Args = PackageCardProps & { width: number };

const args: Args = {
  width: 280,
  title: 'Title',
  description: 'Description',
  name: 'beats',
  release: 'ga',
  id: 'id',
  version: '1.0.0',
  url: '/',
  icons: [],
  integration: '',
  categories: ['foobar'],
  isUnverified: false,
  isUpdateAvailable: false,
  isQuickstart: false,
  isCollectionCard: false,
};

const argTypes = {
  release: {
    control: {
      type: 'radio',
      options: ['ga', 'beta', 'preview', 'rc'],
    },
  },
  isUnverified: {
    control: 'boolean',
  },
  isUpdateAvailable: {
    control: 'boolean',
  },
  isQuickstart: {
    control: 'boolean',
  },
  isCollectionCard: {
    control: 'boolean',
  },
};

export const AvailablePackage = {
  render: ({ width, ...props }: Args) => (
    <div style={{ width }}>
      <PackageCard {...props} showLabels={false} />
    </div>
  ),

  args,
  argTypes,
};

export const InstalledPackage = {
  render: ({ width, ...props }: Args) => (
    <div style={{ width }}>
      <PackageCard {...props} showLabels={true} />
    </div>
  ),

  args,
  argTypes,
};
