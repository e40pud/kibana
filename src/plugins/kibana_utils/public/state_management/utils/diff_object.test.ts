/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { cloneDeep } from 'lodash';
import { applyDiff } from './diff_object';

describe('diff_object', () => {
  test('should list the removed keys', () => {
    const target = { test: 'foo' };
    const source = { foo: 'test' };
    const results = applyDiff(target, source);

    expect(results).toHaveProperty('removed');
    expect(results.removed).toEqual(['test']);
  });

  test('should list the changed keys', () => {
    const target = { foo: 'bar' };
    const source = { foo: 'test' };
    const results = applyDiff(target, source);

    expect(results).toHaveProperty('changed');
    expect(results.changed).toEqual(['foo']);
  });

  test('should list the added keys', () => {
    const target = {};
    const source = { foo: 'test' };
    const results = applyDiff(target, source);

    expect(results).toHaveProperty('added');
    expect(results.added).toEqual(['foo']);
  });

  test('should list all the keys that are change or removed', () => {
    const target = { foo: 'bar', test: 'foo' };
    const source = { foo: 'test' };
    const results = applyDiff(target, source);

    expect(results).toHaveProperty('keys');
    expect(results.keys).toEqual(['foo', 'test']);
  });

  test('should ignore functions', () => {
    const target = { foo: 'bar', test: 'foo' };
    const source = { foo: 'test', fn: () => {} };

    applyDiff(target, source);

    expect(target).not.toHaveProperty('fn');
  });

  test('should ignore underscores', () => {
    const target = { foo: 'bar', test: 'foo' };
    const source = { foo: 'test', _private: 'foo' };

    applyDiff(target, source);

    expect(target).not.toHaveProperty('_private');
  });

  test('should ignore dollar signs', () => {
    const target = { foo: 'bar', test: 'foo' };
    const source = { foo: 'test', $private: 'foo' };

    applyDiff(target, source);

    expect(target).not.toHaveProperty('$private');
  });

  test('should not list any changes for similar objects', () => {
    const target = { foo: 'bar', test: 'foo' };
    const source = { foo: 'bar', test: 'foo', $private: 'foo' };
    const results = applyDiff(target, source);

    expect(results.changed).toEqual([]);
  });

  test('should only change keys that actually changed', () => {
    const obj = { message: 'foo' };
    const target = { obj, message: 'foo' };
    const source = { obj: cloneDeep(obj), message: 'test' };

    applyDiff(target, source);

    expect(target.obj).toBe(obj);
  });
});
