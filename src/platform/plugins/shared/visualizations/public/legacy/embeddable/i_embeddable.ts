/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Observable } from 'rxjs';
import { ErrorLike } from '@kbn/expressions-plugin/common';
import type { KibanaExecutionContext } from '@kbn/core/public';
import { Adapters } from '@kbn/inspector-plugin/public';
import type { SerializableRecord } from '@kbn/utility-types';
import { ViewMode } from '@kbn/presentation-publishing';

export type EmbeddableError = ErrorLike;

export interface EmbeddableInput {
  version?: string;
  viewMode?: ViewMode;
  title?: string;
  description?: string;
  /**
   * Note this is not a saved object id. It is used to uniquely identify this
   * Embeddable instance from others (e.g. inside a container).  It's possible to
   * have two Embeddables where everything else is the same but the id.
   */
  id: string;
  lastReloadRequestTime?: number;
  hidePanelTitles?: boolean;

  /**
   * Reserved key for enhancements added by other plugins.
   */
  enhancements?: SerializableRecord;

  /**
   * List of action IDs that this embeddable should not render.
   */
  disabledActions?: string[];

  /**
   * Whether this embeddable should not execute triggers.
   */
  disableTriggers?: boolean;

  /**
   * Search session id to group searches
   */
  searchSessionId?: string;

  /**
   * Flag whether colors should be synced with other panels
   */
  syncColors?: boolean;

  /**
   * Flag whether cursor should be synced with other panels on hover
   */
  syncCursor?: boolean;

  /**
   * Flag whether tooltips should be synced with other panels on hover
   */
  syncTooltips?: boolean;

  executionContext?: KibanaExecutionContext;
}

export interface EmbeddableOutput {
  // Whether the embeddable is actively loading.
  loading?: boolean;
  // Whether the embeddable is rendered.
  rendered?: boolean;
  // Whether the embeddable finished loading with an error.
  error?: EmbeddableError;
  editUrl?: string;
  editApp?: string;
  editPath?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  title?: string;
  description?: string;
  editable?: boolean;
  // set this to true if the embeddable allows inline editing
  inlineEditable?: boolean;
  // Whether the embeddable can be edited inline by re-requesting the explicit input from the user
  editableWithExplicitInput?: boolean;
  savedObjectId?: string;
}

export interface IEmbeddable<
  I extends EmbeddableInput = EmbeddableInput,
  O extends EmbeddableOutput = EmbeddableOutput,
  N = any
> {
  /**
   * The type of embeddable, this is what will be used to take a serialized
   * embeddable and find the correct factory for which to create an instance of it.
   **/
  readonly type: string;

  /**
   * A unique identifier for this embeddable. Mainly only used by containers to map their
   * Panel States to a child embeddable instance.
   **/
  readonly id: string;

  /**
   * If set to true, defer embeddable load tells the container that this embeddable
   * type isn't completely loaded when the constructor returns. This embeddable
   * will have to manually call setChildLoaded on its parent when all of its initial
   * output is finalized. For instance, after loading a saved object.
   */
  readonly deferEmbeddableLoad: boolean;

  /**
   * Unique ID an embeddable is assigned each time it is initialized. This ID
   * is different for different instances of the same embeddable. For example,
   * if the same dashboard is rendered twice on the screen, all embeddable
   * instances will have a unique `runtimeId`.
   */
  readonly runtimeId?: number;

  /**
   * Extra abilities added to Embeddable by `*_enhanced` plugins.
   */
  enhancements?: object;

  /**
   * If this embeddable has encountered a fatal error, that error will be stored here
   **/
  fatalError?: Error;

  /**
   * This method returns false by default.
   * It should be set to true for any embeddable type that utilizes the `loading` and `rendered`
   * output variables to notify a container of their loading progress. If set to false, a container should assume
   * the embeddable is loaded immediately.
   */
  reportsEmbeddableLoad(): boolean;

  /**
   * Get the input used to instantiate this embeddable. The input is a serialized representation of
   * this embeddable instance and can be used to clone or re-instantiate it. Input state:
   *
   * - Can be updated externally
   * - Can change multiple times for a single embeddable instance.
   *
   * Examples: title, pie slice colors, custom search columns and sort order.
   **/
  getInput(): Readonly<I>;

  /**
   * Because embeddables can inherit input from their parents, they also need a way to separate their own
   * input from input which is inherited. If the embeddable does not have a parent, getExplicitInput
   * and getInput should return the same.
   **/
  getExplicitInput(): Readonly<Partial<I>>;

  /**
   * Some embeddables contain input that should not be persisted anywhere beyond their own state. This method
   * is a way for containers to separate input to store from input which can be ephemeral. In most cases, this
   * will be the same as getExplicitInput
   **/
  getPersistableInput(): Readonly<Partial<I>>;

  /**
   * Output state is:
   *
   * - State that should not change once the embeddable is instantiated, or
   * - State that is derived from the input state, or
   * - State that only the embeddable instance itself knows about, or the factory.
   *
   * Examples: editUrl, title taken from a saved object, if your input state was first name and
   *   last name, your output state could be greeting.
   **/
  getOutput(): Readonly<O>;

  /**
   * Updates input state with the given changes.
   * @param changes
   */
  updateInput(changes: Partial<I>): void;

  /**
   * Updates output state with the given changes.
   * @param changes
   */
  updateOutput(changes: Partial<O>): void;

  /**
   * Returns an observable which will be notified when input state changes.
   */
  getInput$(): Readonly<Observable<I>>;

  /**
   * Returns an observable which will be notified when output state changes.
   */
  getOutput$(): Readonly<Observable<O>>;

  /**
   * Returns the title of this embeddable.
   */
  getTitle(): string | undefined;

  /**
   * Returns the description of this embeddable.
   */
  getDescription(): string | undefined;

  /**
   * Renders the embeddable at the given node.
   * @param domNode
   * @returns A React node to mount or void in the case when rendering is done without React.
   */
  render(domNode: HTMLElement | Element): N | void;

  /**
   * Renders a custom embeddable error at the given node.
   * @param error
   * @param domNode
   * @returns A React node or callback that will be called on error destroy.
   */
  catchError?(error: EmbeddableError, domNode: HTMLElement | Element): N | (() => void);

  /**
   * Reload the embeddable so output and rendering is up to date. Especially relevant
   * if the embeddable takes relative time as input (e.g. now to now-15)
   */
  reload(): void;

  /**
   * An embeddable can return inspector adapters if it wants the inspector to be
   * available via the context menu of that panel.
   * @return Inspector adapters that will be used to open an inspector for.
   */
  getInspectorAdapters(): Adapters | undefined;

  /**
   * Cleans up subscriptions, destroy nodes mounted from calls to render.
   */
  destroy(): void;

  /**
   * List of triggers that this embeddable will execute.
   */
  supportedTriggers(): string[];

  /**
   * Used to diff explicit embeddable input
   */
  getExplicitInputIsEqual(lastInput: Partial<I>): Promise<boolean>;

  untilInitializationFinished(): Promise<void>;
}
