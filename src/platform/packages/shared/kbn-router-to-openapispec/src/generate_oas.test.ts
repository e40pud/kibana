/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

jest.mock('./process_router', () => {
  const module = jest.requireActual('./process_router');
  return {
    ...module,
    processRouter: jest.fn(module.processRouter),
  };
});

jest.mock('./process_versioned_router', () => {
  const module = jest.requireActual('./process_versioned_router');
  return {
    ...module,
    processVersionedRouter: jest.fn(module.processVersionedRouter),
  };
});

import { schema, Type } from '@kbn/config-schema';
import { get } from 'lodash';
import { generateOpenApiDocument } from './generate_oas';
import { processRouter } from './process_router';
import { processVersionedRouter } from './process_versioned_router';
import {
  createTestRouters,
  createRouter,
  createVersionedRouter,
  CreateTestRouterArgs,
} from './generate_oas.test.util';
import {
  sharedOas,
  createSharedZodSchema,
  createSharedConfigSchema,
} from './generate_oas.test.fixture';

interface RecursiveType {
  name: string;
  self: undefined | RecursiveType;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('generateOpenApiDocument', () => {
  describe('@kbn/config-schema', () => {
    it('generates the expected OpenAPI document for the shared schema', async () => {
      const [routers, versionedRouters] = createTestRouters({
        routers: {
          testRouter: {
            routes: [{ method: 'get' }, { method: 'post' }],
          },
        },
        versionedRouters: { testVersionedRouter: { routes: [{}] } },
        bodySchema: createSharedConfigSchema(),
      });
      expect(
        await generateOpenApiDocument(
          {
            routers,
            versionedRouters,
          },
          {
            title: 'test',
            baseUrl: 'https://test.oas',
            version: '99.99.99',
          }
        )
      ).toEqual(sharedOas);
    });

    it('generates the expected OpenAPI document', async () => {
      const [routers, versionedRouters] = createTestRouters({
        routers: {
          testRouter: {
            routes: [
              { method: 'get' },
              { method: 'post' },
              { method: 'post', path: '/no-xsrf/{id}/{path*}', options: { xsrfRequired: false } },
              {
                method: 'delete',
                validationSchemas: {
                  request: {},
                  response: { [200]: { description: 'good response' } },
                },
              },
            ],
          },
        },
        versionedRouters: {
          testVersionedRouter: {
            routes: [
              { method: 'get' },
              {
                method: 'post',
                path: '/no-xsrf/{id}/{path*}',
                options: {
                  access: 'public',
                  options: { xsrfRequired: false },
                  security: {
                    authz: {
                      requiredPrivileges: ['foo'],
                    },
                  },
                },
              },
            ],
          },
        },
      });
      expect(
        await generateOpenApiDocument(
          {
            routers,
            versionedRouters,
          },
          {
            title: 'test',
            baseUrl: 'https://test.oas',
            version: '99.99.99',
          }
        )
      ).toMatchSnapshot();
    });

    it('generates references in the expected format', async () => {
      const sharedIdSchema = schema.string({ minLength: 1, meta: { description: 'test' } });
      const sharedNameSchema = schema.string({ minLength: 1 });
      const otherSchema = schema.object(
        { name: sharedNameSchema, other: schema.string() },
        { meta: { id: 'foo' } }
      );
      expect(
        await generateOpenApiDocument(
          {
            routers: [
              createRouter({
                routes: [
                  {
                    isVersioned: false,
                    path: '/foo/{id}',
                    method: 'get',
                    validationSchemas: {
                      request: {
                        params: schema.object({ id: sharedIdSchema }),
                        body: otherSchema,
                      },
                      response: {
                        [200]: {
                          body: () => schema.string({ maxLength: 10, minLength: 1 }),
                        },
                      },
                    },
                    options: { tags: ['foo'], access: 'public' },
                    handler: jest.fn(),
                  },
                ],
              }),
            ],
            versionedRouters: [],
          },
          {
            title: 'test',
            baseUrl: 'https://test.oas',
            version: '99.99.99',
          }
        )
      ).toMatchSnapshot();
    });

    it('handles recursive schemas', async () => {
      const id = 'recursive';
      const recursiveSchema: Type<RecursiveType> = schema.object(
        {
          name: schema.string(),
          self: schema.lazy<RecursiveType>(id),
        },
        { meta: { id } }
      );
      expect(
        await generateOpenApiDocument(
          {
            routers: [
              createRouter({
                routes: [
                  {
                    isVersioned: false,
                    path: '/recursive',
                    method: 'get',
                    validationSchemas: {
                      request: {
                        body: recursiveSchema,
                      },
                      response: {
                        [200]: {
                          body: () => schema.string({ maxLength: 10, minLength: 1 }),
                        },
                      },
                    },
                    options: { tags: ['foo'], access: 'public' },
                    handler: jest.fn(),
                  },
                ],
              }),
            ],
            versionedRouters: [],
          },
          {
            title: 'test',
            baseUrl: 'https://test.oas',
            version: '99.99.99',
          }
        )
      ).toMatchSnapshot();
    });
  });

  describe('Zod', () => {
    it('generates the expected OpenAPI document for the shared schema', async () => {
      const [routers, versionedRouters] = createTestRouters({
        routers: { testRouter: { routes: [{ method: 'get' }, { method: 'post' }] } },
        versionedRouters: { testVersionedRouter: { routes: [{}] } },
        bodySchema: createSharedZodSchema(),
      });

      expect(
        await generateOpenApiDocument(
          {
            routers,
            versionedRouters,
          },
          {
            title: 'test',
            baseUrl: 'https://test.oas',
            version: '99.99.99',
          }
        )
      ).toMatchObject(sharedOas);
    });
  });

  describe('unknown schema/validation', () => {
    it('produces the expected output', async () => {
      expect(
        await generateOpenApiDocument(
          {
            routers: [
              createRouter({
                routes: [
                  {
                    isVersioned: false,
                    path: '/foo/{id}',
                    method: 'get',
                    validationSchemas: {
                      request: {
                        params: () => ({ value: {} }), // custom validation fn
                        body: () => ({ value: {} }),
                      },
                      response: {
                        [200]: {
                          body: () => undefined as any, // unknown schema
                        },
                      },
                    },
                    options: { tags: ['foo'], access: 'public' },
                    handler: jest.fn(),
                  },
                ],
              }),
            ],
            versionedRouters: [
              createVersionedRouter({
                routes: [
                  {
                    method: 'get',
                    path: '/test',
                    isVersioned: true,
                    options: {
                      access: 'public',
                      security: {
                        authz: {
                          requiredPrivileges: ['foo'],
                        },
                      },
                    },
                    handlers: [
                      {
                        fn: jest.fn(),
                        options: {
                          validate: {
                            request: { body: () => ({ value: {} }) },
                            response: { 200: { body: (() => {}) as any } },
                          },
                          version: '2023-10-31',
                        },
                      },
                    ],
                  },
                ],
              }),
            ],
          },
          {
            title: 'test',
            baseUrl: 'https://test.oas',
            version: '99.99.99',
          }
        )
      ).toMatchSnapshot();
    });
  });

  describe('tags', () => {
    it('handles tags as expected', async () => {
      const [routers, versionedRouters] = createTestRouters({
        routers: {
          testRouter1: {
            routes: [
              {
                path: '/1-1/{id}/{path*}',
                options: { tags: ['oas-tag:1', 'oas-tag:2', 'foo'], access: 'public' },
              },
              {
                path: '/1-2/{id}/{path*}',
                options: { tags: ['oas-tag:1', 'foo'], access: 'public' },
              },
            ],
          },
          testRouter2: {
            routes: [{ path: '/2-1/{id}/{path*}', options: { tags: undefined, access: 'public' } }],
          },
        },
        versionedRouters: {
          testVersionedRouter1: {
            routes: [
              {
                path: '/v1-1',
                options: {
                  access: 'public',
                  options: { tags: ['oas-tag:v1'] },
                  security: {
                    authz: {
                      requiredPrivileges: ['foo'],
                    },
                  },
                },
              },
              {
                path: '/v1-2',
                options: {
                  access: 'public',
                  options: { tags: ['foo', 'bar', 'oas-tag:v2', 'oas-tag:v3'] },
                  security: {
                    authz: {
                      requiredPrivileges: ['foo'],
                    },
                  },
                },
              },
            ],
          },
          testVersionedRouter2: {
            routes: [
              {
                path: '/v2-1',
                options: {
                  access: 'public',
                  options: { tags: undefined },
                  security: {
                    authz: {
                      requiredPrivileges: ['foo'],
                    },
                  },
                },
              },
            ],
          },
        },
      });
      const result = await generateOpenApiDocument(
        {
          routers,
          versionedRouters,
        },
        {
          title: 'test',
          baseUrl: 'https://test.oas',
          version: '99.99.99',
        }
      );
      // router paths
      expect(result.paths['/1-1/{id}/{path}']!.get!.tags).toEqual(['1', '2']);
      expect(result.paths['/1-2/{id}/{path}']!.get!.tags).toEqual(['1']);
      expect(result.paths['/2-1/{id}/{path}']!.get!.tags).toEqual([]);
      // versioned router paths
      expect(result.paths['/v1-1']!.get!.tags).toEqual(['v1']);
      expect(result.paths['/v1-2']!.get!.tags).toEqual(['v2', 'v3']);
      expect(result.paths['/v2-1']!.get!.tags).toEqual([]);
    });
  });

  describe('availability', () => {
    const testCases = [
      {
        name: 'router with experimental stability',
        routerConfig: {
          routers: {
            testRouter: {
              routes: [
                {
                  path: '/test-path/{id}/{path*}',
                  options: { availability: { stability: 'experimental' }, access: 'public' },
                },
              ],
            },
          },
          versionedRouters: {},
        } as CreateTestRouterArgs,
        expectedPath: '/test-path/{id}/{path}',
        expectedState: 'Technical Preview',
      },
      {
        name: 'router with beta stability',
        routerConfig: {
          routers: {
            testRouter: {
              routes: [
                {
                  path: '/test-path/{id}/{path*}',
                  options: { availability: { stability: 'beta' }, access: 'public' },
                },
              ],
            },
          },
          versionedRouters: {},
        } as CreateTestRouterArgs,
        expectedPath: '/test-path/{id}/{path}',
        expectedState: 'Beta',
      },
      {
        name: 'router with stable stability',
        routerConfig: {
          routers: {
            testRouter: {
              routes: [
                {
                  path: '/test-path/{id}/{path*}',
                  options: { availability: { stability: 'stable' }, access: 'public' },
                },
              ],
            },
          },
          versionedRouters: {},
        } as CreateTestRouterArgs,
        expectedPath: '/test-path/{id}/{path}',
        expectedState: 'Generally available',
      },
      {
        name: 'router without availability',
        routerConfig: {
          routers: {
            testRouter: {
              routes: [{ path: '/test-path/{id}/{path*}' }],
            },
          },
          versionedRouters: {},
        } as CreateTestRouterArgs,
        expectedPath: '/test-path/{id}/{path}',
        expectedState: null, // No x-state expected
      },
      {
        name: 'versioned router with experimental stability',
        routerConfig: {
          routers: {},
          versionedRouters: {
            testVersionedRouter: {
              routes: [
                {
                  path: '/test-path',
                  options: {
                    access: 'public',
                    options: { availability: { stability: 'experimental' } },
                    security: {
                      authz: {
                        requiredPrivileges: ['foo'],
                      },
                    },
                  },
                },
              ],
            },
          },
        } as CreateTestRouterArgs,
        expectedPath: '/test-path',
        expectedState: 'Technical Preview',
      },
      {
        name: 'versioned router with beta stability',
        routerConfig: {
          routers: {},
          versionedRouters: {
            testVersionedRouter: {
              routes: [
                {
                  path: '/test-path',
                  options: {
                    access: 'public',
                    options: { availability: { stability: 'beta' } },
                    security: {
                      authz: {
                        requiredPrivileges: ['foo'],
                      },
                    },
                  },
                },
              ],
            },
          },
        } as CreateTestRouterArgs,
        expectedPath: '/test-path',
        expectedState: 'Beta',
      },
      {
        name: 'versioned router with stable stability',
        routerConfig: {
          routers: {},
          versionedRouters: {
            testVersionedRouter: {
              routes: [
                {
                  path: '/test-path',
                  options: {
                    access: 'public',
                    options: { availability: { stability: 'stable' } },
                    security: {
                      authz: {
                        requiredPrivileges: ['foo'],
                      },
                    },
                  },
                },
              ],
            },
          },
        } as CreateTestRouterArgs,
        expectedPath: '/test-path',
        expectedState: 'Generally available',
      },
      {
        name: 'versioned router without availability',
        routerConfig: {
          routers: {},
          versionedRouters: {
            testVersionedRouter: {
              routes: [
                {
                  path: '/test-path',
                  options: {
                    access: 'public',
                    security: {
                      authz: {
                        requiredPrivileges: ['foo'],
                      },
                    },
                  },
                },
              ],
            },
          },
        } as CreateTestRouterArgs,
        expectedPath: '/test-path',
        expectedState: null, // No x-state expected
      },
    ];

    it.each(testCases)(
      '$name: $expectedState',
      async ({ routerConfig, expectedPath, expectedState }) => {
        const [routers, versionedRouters] = createTestRouters(routerConfig);
        const env = { serverless: false, dummy: true };
        const result = await generateOpenApiDocument(
          {
            routers,
            versionedRouters,
          },
          {
            title: 'test',
            baseUrl: 'https://test.oas',
            version: '99.99.99',
            env,
          }
        );

        // Assert that the env has been passed down as expected
        if ((processRouter as jest.Mock).mock.calls.length) {
          (processRouter as jest.Mock).mock.calls.forEach(([{ env: routerEnv }]) =>
            expect(routerEnv).toEqual({ serverless: false, dummy: true })
          );
        }
        if ((processVersionedRouter as jest.Mock).mock.calls.length) {
          (processVersionedRouter as jest.Mock).mock.calls.forEach(
            ([{ env: versionedRouterEnv }]) =>
              expect(versionedRouterEnv).toEqual({ serverless: false, dummy: true })
          );
        }

        if (expectedState) {
          expect(result.paths[expectedPath]!.get).toMatchObject({
            'x-state': expectedState,
          });
        } else {
          expect(result.paths[expectedPath]!.get).not.toMatchObject({
            'x-state': expect.any(String),
          });
        }
      }
    );
  });

  it('merges operation objects', async () => {
    const oasOperationObject = () => ({
      requestBody: {
        content: {
          'application/json': {
            examples: {
              fooExample: {
                value: 999,
              },
            },
          },
        },
      },
    });
    const [routers, versionedRouters] = createTestRouters({
      routers: {
        testRouter: {
          routes: [
            {
              method: 'get',
              options: {
                access: 'public',
                oasOperationObject,
              },
            },
            { method: 'post' },
          ],
        },
      },
      versionedRouters: {
        testVersionedRouter: {
          routes: [
            {
              options: {
                access: 'public',
                security: {
                  authz: {
                    requiredPrivileges: ['foo'],
                  },
                },
              },
            },
          ],
        },
      },
      bodySchema: createSharedConfigSchema(),
    });

    versionedRouters[0].getRoutes()[0].handlers[0].options!.options!.oasOperationObject =
      oasOperationObject;

    const oas = await generateOpenApiDocument(
      { routers, versionedRouters },
      {
        title: 'test',
        baseUrl: 'https://test.oas',
        version: '99.99.99',
      }
    );

    expect(
      get(oas, [
        'paths',
        '/foo/{id}/{path}',
        'get',
        'requestBody',
        'content',
        'application/json',
        'examples',
      ])
    ).toEqual({
      fooExample: {
        value: 999,
      },
    });

    expect(
      get(oas, ['paths', '/bar', 'get', 'requestBody', 'content', 'application/json', 'examples'])
    ).toEqual({
      fooExample: {
        value: 999,
      },
    });
  });
});
