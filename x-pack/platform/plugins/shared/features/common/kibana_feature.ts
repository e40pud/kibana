/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { RecursiveReadonly } from '@kbn/utility-types';
import { AppCategory } from '@kbn/core/types';
import { LicenseType } from '@kbn/licensing-plugin/common/types';
import { FeatureKibanaPrivileges } from './feature_kibana_privileges';
import { SubFeatureConfig, SubFeature as KibanaSubFeature } from './sub_feature';
import { ReservedKibanaPrivilege } from './reserved_kibana_privilege';
import { AlertingKibanaPrivilege } from './alerting_kibana_privilege';

/**
 * Enum for allowed feature scope values.
 * security - The feature is available in Security Feature Privileges.
 * spaces - The feature is available in the Spaces Visibility Toggles.
 */
export enum KibanaFeatureScope {
  Security = 'security',
  Spaces = 'spaces',
}

/**
 * Interface for registering a feature.
 * Feature registration allows plugins to hide their applications with spaces,
 * and secure access when configured for security.
 */
export interface KibanaFeatureConfig {
  /**
   * Unique identifier for this feature.
   * This identifier is also used when generating UI Capabilities.
   *
   * @see UICapabilities
   */
  id: string;

  /**
   * Display name for this feature.
   * This will be displayed to end-users, so a translatable string is advised for i18n.
   */
  name: string;

  /**
   * An optional description that will appear as subtext underneath the feature name
   */
  description?: string | null;

  /**
   * The category for this feature.
   * This will be used to organize the list of features for display within the
   * Spaces and Roles management screens.
   */
  category: AppCategory;

  /**
   * An ordinal used to sort features relative to one another for display.
   */
  order?: number;

  /**
   * Whether or not this feature should be excluded from the base privileges.
   * This is primarily helpful when migrating applications with a "legacy" privileges model
   * to use Kibana privileges. We don't want these features to be considered part of the `all`
   * or `read` base privileges in a minor release if the user was previously granted access
   * using an additional reserved role.
   */
  excludeFromBasePrivileges?: boolean;

  /**
   * Optional minimum supported license.
   * If omitted, all licenses are allowed.
   * This does not restrict access to your feature based on license.
   * Its only purpose is to inform the space and roles UIs on which features to display.
   */
  minimumLicense?: LicenseType;

  /**
   * An array of app ids that are enabled when this feature is enabled.
   * Apps specified here will automatically cascade to the privileges defined below, unless specified differently there.
   */
  app: readonly string[];

  /**
   * If this feature includes management sections, you can specify them here to control visibility of those
   * pages based on the current space.
   *
   * Items specified here will automatically cascade to the privileges defined below, unless specified differently there.
   *
   * @example
   * ```ts
   *  // Enables access to the "Advanced Settings" management page within the Kibana section
   *  management: {
   *    kibana: ['settings']
   *  }
   * ```
   */
  management?: {
    [sectionId: string]: readonly string[];
  };
  /**
   * If this feature includes a catalogue entry, you can specify them here to control visibility based on the current space.
   *
   * Items specified here will automatically cascade to the privileges defined below, unless specified differently there.
   */
  catalogue?: readonly string[];

  /**
   * If your feature grants access to specific rule types, you can specify them here to control visibility based on the current space.
   * Include both rule types registered by the feature and external rule types such as built-in
   * rule types and rule types provided by other features to which you wish to grant access. For each rule type
   * you can specify the consumers the feature has access to.
   */
  alerting?: AlertingKibanaPrivilege;

  /**
   * If your feature grants access to specific case types, you can specify them here to control visibility based on the current space.
   */
  cases?: readonly string[];

  /**
   * Feature privilege definition.
   *
   * @example
   * ```ts
   *  {
   *    all: {...},
   *    read: {...}
   *  }
   * ```
   * @see FeatureKibanaPrivileges
   */
  privileges: {
    all: FeatureKibanaPrivileges;
    read: FeatureKibanaPrivileges;
  } | null;

  /**
   * Optional sub-feature privilege definitions. This can only be specified if `privileges` are are also defined.
   */
  subFeatures?: readonly SubFeatureConfig[];

  /**
   * Optional message to display on the Role Management screen when configuring permissions for this feature.
   */
  privilegesTooltip?: string;

  /**
   * @internal
   */
  reserved?: {
    description: string;
    privileges: readonly ReservedKibanaPrivilege[];
  };

  /**
   * Indicates whether the feature is available as a standalone feature. The feature can still be
   * referenced by other features, but it will not be displayed in any feature management UIs. By default, all features
   * are visible.
   */
  hidden?: boolean;

  /**
   * Indicates whether the feature is available in Security Feature Privileges and the Spaces Visibility Toggles.
   */
  scope?: readonly KibanaFeatureScope[];

  /**
   * If defined, the feature is considered deprecated and won't be available to users when configuring roles or Spaces.
   */
  readonly deprecated?: Readonly<{
    /**
     * The mandatory, localizable, user-facing notice that will be displayed to users whenever we need to explain why a
     * feature is deprecated and what they should rely on instead. The notice can also include links to more detailed
     * documentation.
     */
    notice: string;
    /**
     * An optional list of feature IDs representing the features that should _conceptually_ replace this deprecated
     * feature. This is used, for example, in the Spaces feature visibility toggles UI to display the replacement
     * feature(s) instead of the deprecated one. By default, the list of replacement features is derived from the
     * `replacedBy` fields of the feature privileges. However, if the feature privileges are replaced by the privileges
     * of multiple features, this behavior is not always desired and can be overridden here.
     */
    replacedBy?: readonly string[];
  }>;
}

export class KibanaFeature {
  public readonly subFeatures: KibanaSubFeature[];

  constructor(protected readonly config: RecursiveReadonly<KibanaFeatureConfig>) {
    this.subFeatures = (config.subFeatures ?? []).map(
      (subFeatureConfig) => new KibanaSubFeature(subFeatureConfig)
    );
  }

  public get id() {
    return this.config.id;
  }

  public get deprecated() {
    return this.config.deprecated;
  }

  public get hidden() {
    return this.config.hidden;
  }

  public get name() {
    return this.config.name;
  }

  public get description() {
    return this.config.description;
  }

  public get order() {
    return this.config.order;
  }

  public get category() {
    return this.config.category;
  }

  public get app() {
    return this.config.app;
  }

  public get catalogue() {
    return this.config.catalogue;
  }

  public get management() {
    return this.config.management;
  }

  public get minimumLicense() {
    return this.config.minimumLicense;
  }

  public get privileges() {
    return this.config.privileges;
  }

  public get alerting() {
    return this.config.alerting;
  }

  public get cases() {
    return this.config.cases;
  }

  public get excludeFromBasePrivileges() {
    return this.config.excludeFromBasePrivileges ?? false;
  }

  public get reserved() {
    return this.config.reserved;
  }

  public get scope() {
    return this.config.scope;
  }

  public toRaw() {
    return { ...this.config } as KibanaFeatureConfig;
  }
}
