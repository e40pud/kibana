/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { cloneDeep } from 'lodash/fp';
import type { ColumnHeaderOptions } from '../../../common/types/timeline';
import { TimelineTabs } from '../../../common/types/timeline';
import {
  DataProviderTypeEnum,
  TimelineStatusEnum,
  TimelineTypeEnum,
} from '../../../common/api/timeline';
import type {
  DataProvider,
  DataProvidersAnd,
} from '../components/timeline/data_providers/data_provider';
import { IS_OPERATOR } from '../components/timeline/data_providers/data_provider';
import {
  defaultColumnHeaderType,
  defaultUdtHeaders,
} from '../components/timeline/body/column_headers/default_headers';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../components/timeline/body/constants';
import { defaultHeaders } from '../../common/mock';
import {
  addNewTimeline,
  addTimelineProviders,
  addTimelineToStore,
  removeTimelineColumn,
  removeTimelineProvider,
  updateTimelineColumns,
  updateTimelineColumnWidth,
  updateTimelineItemsPerPage,
  updateTimelinePerPageOptions,
  updateTimelineProviderEnabled,
  updateTimelineProviderExcluded,
  updateTimelineProviders,
  updateTimelineProviderType,
  updateTimelineRange,
  updateTimelineShowTimeline,
  updateTimelineSort,
  updateTimelineTitleAndDescription,
  upsertTimelineColumn,
} from './helpers';
import type { TimelineModel } from './model';
import { timelineDefaults } from './defaults';
import type { TimelineById } from './types';
import { Direction } from '../../../common/search_strategy';
import {
  type LocalStorageColumnSettings,
  setStoredTimelineColumnsConfig,
} from './middlewares/timeline_localstorage';

jest.mock('../../common/utils/normalize_time_range');
jest.mock('../../common/utils/default_date_settings', () => {
  const actual = jest.requireActual('../../common/utils/default_date_settings');
  return {
    ...actual,
    DEFAULT_FROM_MOMENT: new Date('2020-10-27T11:37:31.655Z'),
    DEFAULT_TO_MOMENT: new Date('2020-10-28T11:37:31.655Z'),
  };
});

const basicDataProvider: DataProvider = {
  and: [],
  id: '123',
  name: 'data provider 1',
  enabled: true,
  queryMatch: {
    field: '',
    value: '',
    operator: IS_OPERATOR,
  },
  excluded: false,
  kqlQuery: '',
};
const basicTimeline: TimelineModel = {
  activeTab: TimelineTabs.query,
  prevActiveTab: TimelineTabs.eql,
  columns: [],
  defaultColumns: [],
  dataProviders: [{ ...basicDataProvider }],
  dataViewId: null,
  dateRange: {
    start: '2020-07-07T08:20:18.966Z',
    end: '2020-07-08T08:20:18.966Z',
  },
  deletedEventIds: [],
  description: '',
  documentType: '',
  eqlOptions: {
    eventCategoryField: 'event.category',
    tiebreakerField: '',
    timestampField: '@timestamp',
  },
  eventIdToNoteIds: {},
  excludedRowRendererIds: [],
  highlightedDropAndProviderId: '',
  historyIds: [],
  id: 'foo',
  indexNames: [],
  isFavorite: false,
  isLive: false,
  isSaving: false,
  isSelectAllChecked: false,
  itemsPerPage: 25,
  itemsPerPageOptions: [10, 25, 50],
  kqlMode: 'filter',
  kqlQuery: { filterQuery: null },
  loadingEventIds: [],
  noteIds: [],
  pinnedEventIds: {},
  pinnedEventsSaveObject: {},
  queryFields: [],
  savedObjectId: null,
  selectAll: false,
  selectedEventIds: {},
  show: true,
  sort: [
    {
      columnId: '@timestamp',
      columnType: 'date',
      esTypes: ['date'],
      sortDirection: Direction.desc,
    },
  ],
  status: TimelineStatusEnum.active,
  templateTimelineId: null,
  templateTimelineVersion: null,
  timelineType: TimelineTypeEnum.default,
  title: '',
  version: null,
  savedSearchId: null,
  savedSearch: null,
  isDataProviderVisible: true,
  sampleSize: 500,
};
const timelineByIdMock: TimelineById = {
  foo: { ...basicTimeline },
};

const timelineByIdTemplateMock: TimelineById = {
  foo: {
    ...basicTimeline,
    timelineType: TimelineTypeEnum.template,
  },
};

const columnsMock: ColumnHeaderOptions[] = [
  defaultHeaders[0],
  defaultHeaders[1],
  defaultHeaders[2],
];

describe('Timeline', () => {
  beforeEach(() => {
    setStoredTimelineColumnsConfig(undefined);
  });

  describe('#add saved object Timeline to store ', () => {
    test('should return a timelineModel with default value and not just a timelineResult ', () => {
      const update = addTimelineToStore({
        id: 'foo',
        timeline: {
          ...basicTimeline,
        },
        timelineById: timelineByIdMock,
      });

      expect(update).toEqual({
        foo: {
          ...basicTimeline,
          show: true,
        },
      });
    });

    test('should apply the locally stored column config', () => {
      const initialWidth = 123456789;
      const storedConfig: LocalStorageColumnSettings = {
        '@timestamp': {
          id: '@timestamp',
          initialWidth,
        },
      };
      setStoredTimelineColumnsConfig(storedConfig);
      const update = addTimelineToStore({
        id: 'foo',
        timeline: {
          ...basicTimeline,
          columns: [{ id: '@timestamp', columnHeaderType: 'not-filtered' }],
        },
        timelineById: timelineByIdMock,
      });

      expect(update.foo.columns.find((col) => col.id === '@timestamp')).toEqual(
        expect.objectContaining({
          initialWidth,
        })
      );
    });

    test('should not apply changes to the columns when no previous config is stored in localStorage', () => {
      const update = addTimelineToStore({
        id: 'foo',
        timeline: {
          ...basicTimeline,
          columns: [{ id: '@timestamp', columnHeaderType: 'not-filtered' }],
        },
        timelineById: timelineByIdMock,
      });

      expect(update.foo.columns.find((col) => col.id === '@timestamp')).toEqual({
        id: '@timestamp',
        columnHeaderType: 'not-filtered',
      });
    });

    test('should override timerange if adding an immutable template', () => {
      const update = addTimelineToStore({
        id: 'foo',
        timeline: {
          ...basicTimeline,
          status: TimelineStatusEnum.immutable,
          timelineType: TimelineTypeEnum.template,
        },
        timelineById: timelineByIdMock,
      });

      expect(update).toEqual({
        foo: {
          ...basicTimeline,
          status: TimelineStatusEnum.immutable,
          timelineType: TimelineTypeEnum.template,
          dateRange: {
            start: '2020-10-27T11:37:31.655Z',
            end: '2020-10-28T11:37:31.655Z',
          },
          show: true,
        },
      });
    });
  });

  describe('#addNewTimeline', () => {
    test('should return a new reference and not the same reference', () => {
      const update = addNewTimeline({
        id: 'bar',
        columns: defaultHeaders,
        dataViewId: null,
        indexNames: [],
        timelineById: timelineByIdMock,
        timelineType: TimelineTypeEnum.default,
        savedSearchId: null,
      });
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should add a new timeline', () => {
      const update = addNewTimeline({
        id: 'bar',
        columns: timelineDefaults.columns,
        dataViewId: null,
        indexNames: [],
        timelineById: timelineByIdMock,
        timelineType: TimelineTypeEnum.default,
        savedSearchId: null,
      });
      expect(update).toEqual({
        foo: basicTimeline,
        bar: { ...timelineDefaults, id: 'bar' },
      });
    });

    test('should add the specified columns to the timeline', () => {
      const barWithEmptyColumns = { ...timelineDefaults, id: 'bar' };
      const barWithPopulatedColumns = { ...barWithEmptyColumns, columns: defaultHeaders };

      const update = addNewTimeline({
        id: 'bar',
        columns: defaultHeaders,
        dataViewId: null,
        indexNames: [],
        timelineById: timelineByIdMock,
        timelineType: TimelineTypeEnum.default,
        savedSearchId: null,
      });
      expect(update).toEqual({
        foo: basicTimeline,
        bar: barWithPopulatedColumns,
      });
    });
  });

  describe('#updateTimelineShowTimeline', () => {
    test('should return a new reference and not the same reference', () => {
      const update = updateTimelineShowTimeline({
        id: 'foo',
        show: false,
        timelineById: timelineByIdMock,
      });
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should change show from true to false', () => {
      const update = updateTimelineShowTimeline({
        id: 'foo',
        show: false, // value we are changing from true to false
        timelineById: timelineByIdMock,
      });

      expect(update).toEqual({
        ...timelineByIdMock,
        foo: {
          ...timelineByIdMock.foo,
          show: false,
        },
      });
    });
  });

  describe('#upsertTimelineColumn', () => {
    let timelineById: TimelineById = {};
    let columns: ColumnHeaderOptions[] = [];
    let columnToAdd: ColumnHeaderOptions;
    let mockWithExistingColumns: TimelineById;

    beforeEach(() => {
      timelineById = cloneDeep(timelineByIdMock);
      columns = cloneDeep(columnsMock);
      columnToAdd = {
        category: 'event',
        columnHeaderType: defaultColumnHeaderType,
        description:
          'The action captured by the event.\nThis describes the information in the event. It is more specific than `event.category`. Examples are `group-add`, `process-started`, `file-created`. The value is normally defined by the implementer.',
        example: 'user-password-change',
        id: 'event.action',
        type: 'keyword',
        aggregatable: true,
        initialWidth: DEFAULT_COLUMN_MIN_WIDTH,
      };
      mockWithExistingColumns = {
        ...timelineById,
        foo: {
          ...timelineById.foo,
          columns,
        },
      };
    });

    test('should return a new reference and not the same reference', () => {
      const update = upsertTimelineColumn({
        column: columnToAdd,
        id: 'foo',
        index: 0,
        timelineById,
      });

      expect(update).not.toBe(timelineById);
    });

    test('should add a new column to an empty collection of columns', () => {
      const expectedColumns = [columnToAdd];
      const update = upsertTimelineColumn({
        column: columnToAdd,
        id: 'foo',
        index: 0,
        timelineById,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should add a new column to an existing collection of columns at the beginning of the collection', () => {
      const expectedColumns = [columnToAdd, ...columns];

      const update = upsertTimelineColumn({
        column: columnToAdd,
        id: 'foo',
        index: 0,
        timelineById: mockWithExistingColumns,
      });
      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should add a new column to an existing collection of columns in the middle of the collection', () => {
      const expectedColumns = [columns[0], columnToAdd, columns[1], columns[2]];

      const update = upsertTimelineColumn({
        column: columnToAdd,
        id: 'foo',
        index: 1,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should add a new column to an existing collection of columns at the end of the collection', () => {
      const expectedColumns = [...columns, columnToAdd];

      const update = upsertTimelineColumn({
        column: columnToAdd,
        id: 'foo',
        index: expectedColumns.length - 1,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    columns.forEach((column, i) => {
      test(`should upsert (NOT add a new column) a column when already exists at the same index (${i})`, () => {
        const update = upsertTimelineColumn({
          column,
          id: 'foo',
          index: i,
          timelineById: mockWithExistingColumns,
        });

        expect(update.foo.columns).toEqual(columns);
      });
    });

    test('should allow the 1st column to be moved to the 2nd column', () => {
      const expectedColumns = [columns[1], columns[0], columns[2]];

      const update = upsertTimelineColumn({
        column: columns[0],
        id: 'foo',
        index: 1,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should allow the 1st column to be moved to the 3rd column', () => {
      const expectedColumns = [columns[1], columns[2], columns[0]];

      const update = upsertTimelineColumn({
        column: columns[0],
        id: 'foo',
        index: 2,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should allow the 2nd column to be moved to the 1st column', () => {
      const expectedColumns = [columns[1], columns[0], columns[2]];

      const update = upsertTimelineColumn({
        column: columns[1],
        id: 'foo',
        index: 0,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should allow the 2nd column to be moved to the 3rd column', () => {
      const expectedColumns = [columns[0], columns[2], columns[1]];

      const update = upsertTimelineColumn({
        column: columns[1],
        id: 'foo',
        index: 2,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should allow the 3rd column to be moved to the 1st column', () => {
      const expectedColumns = [columns[2], columns[0], columns[1]];

      const update = upsertTimelineColumn({
        column: columns[2],
        id: 'foo',
        index: 0,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should allow the 3rd column to be moved to the 2nd column', () => {
      const expectedColumns = [columns[0], columns[2], columns[1]];

      const update = upsertTimelineColumn({
        column: columns[2],
        id: 'foo',
        index: 1,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should apply the locally stored column config to new columns', () => {
      const initialWidth = 123456789;
      const storedConfig: LocalStorageColumnSettings = {
        'event.action': {
          id: 'event.action',
          initialWidth,
        },
      };
      setStoredTimelineColumnsConfig(storedConfig);
      const expectedColumns = [{ ...columnToAdd, initialWidth }];
      const update = upsertTimelineColumn({
        column: columnToAdd,
        id: 'foo',
        index: 0,
        timelineById,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should apply the locally stored column config to existing columns', () => {
      const initialWidth = 123456789;
      const storedConfig: LocalStorageColumnSettings = {
        '@timestamp': {
          id: '@timestamp',
          initialWidth,
        },
      };
      setStoredTimelineColumnsConfig(storedConfig);
      const update = upsertTimelineColumn({
        column: columns[0],
        id: 'foo',
        index: 0,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns.find((col) => col.id === '@timestamp')).toEqual(
        expect.objectContaining({
          initialWidth,
        })
      );
    });
  });

  describe('#addTimelineProvider', () => {
    const providerToAdd: DataProvider[] = [
      {
        ...basicDataProvider,
        id: '567',
        name: 'data provider 2',
      },
    ];
    test('should return a new reference and not the same reference', () => {
      const update = addTimelineProviders({
        id: 'foo',
        providers: providerToAdd,
        timelineById: timelineByIdMock,
      });
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should add a new timeline provider', () => {
      const update = addTimelineProviders({
        id: 'foo',
        providers: providerToAdd,
        timelineById: timelineByIdMock,
      });
      const addedDataProvider = [...basicTimeline.dataProviders].concat(providerToAdd);
      expect(update.foo.dataProviders).toEqual(addedDataProvider);
    });

    test('should NOT add a new timeline provider if it already exists and the attributes "and" is empty', () => {
      const update = addTimelineProviders({
        id: 'foo',
        providers: [basicDataProvider],
        timelineById: timelineByIdMock,
      });
      expect(update).toEqual(timelineByIdMock);
    });

    test('should add a new timeline provider if it already exists and the attributes "and" is NOT empty', () => {
      const myMockTimelineByIdMock = cloneDeep(timelineByIdMock);
      myMockTimelineByIdMock.foo.dataProviders[0].and = [
        {
          ...basicDataProvider,
          id: '456',
          name: 'and data provider 1',
        },
      ];
      const providers = [{ ...basicDataProvider }];
      const update = addTimelineProviders({
        id: 'foo',
        providers,
        timelineById: myMockTimelineByIdMock,
      });
      expect(update.foo.dataProviders[1]).toEqual(providers[0]);
    });

    test('should UPSERT an existing timeline provider if it already exists', () => {
      const update = addTimelineProviders({
        id: 'foo',
        providers: [
          {
            ...basicDataProvider,
            name: 'my name changed',
          },
        ],
        timelineById: timelineByIdMock,
      });
      expect(update.foo.dataProviders[0].name).toEqual('my name changed');
    });
  });

  describe('#removeTimelineColumn', () => {
    let mockWithExistingColumns: TimelineById;
    beforeEach(() => {
      mockWithExistingColumns = {
        ...timelineByIdMock,
        foo: {
          ...timelineByIdMock.foo,
          columns: columnsMock,
        },
      };
    });
    test('should return a new reference and not the same reference', () => {
      const update = removeTimelineColumn({
        id: 'foo',
        columnId: columnsMock[0].id,
        timelineById: mockWithExistingColumns,
      });

      expect(update).not.toBe(timelineByIdMock);
    });

    test('should remove just the first column when the id matches', () => {
      const expectedColumns = [columnsMock[1], columnsMock[2]];

      const update = removeTimelineColumn({
        id: 'foo',
        columnId: columnsMock[0].id,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should remove just the last column when the id matches', () => {
      const expectedColumns = [columnsMock[0], columnsMock[1]];

      const update = removeTimelineColumn({
        id: 'foo',
        columnId: columnsMock[2].id,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should remove just the middle column when the id matches', () => {
      const expectedColumns = [columnsMock[0], columnsMock[2]];

      const update = removeTimelineColumn({
        id: 'foo',
        columnId: columnsMock[1].id,
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });

    test('should not modify the columns if the id to remove was not found', () => {
      const expectedColumns = cloneDeep(columnsMock);

      const update = removeTimelineColumn({
        id: 'foo',
        columnId: 'does.not.exist',
        timelineById: mockWithExistingColumns,
      });

      expect(update.foo.columns).toEqual(expectedColumns);
    });
  });

  describe('#addAndProviderToTimelineProvider', () => {
    test('should add a new and provider to an existing timeline provider', () => {
      const providerToAdd: DataProvider[] = [
        {
          ...basicDataProvider,
          id: '567',
          name: 'data provider 2',
          queryMatch: {
            field: 'handsome',
            value: 'xavier',
            operator: IS_OPERATOR,
          },
        },
      ];

      const newTimeline = addTimelineProviders({
        id: 'foo',
        providers: providerToAdd,
        timelineById: timelineByIdMock,
      });

      newTimeline.foo.highlightedDropAndProviderId = '567';

      const andProviderToAdd: DataProvider[] = [
        {
          ...basicDataProvider,
          id: '568',
          name: 'And Data Provider',
          queryMatch: {
            field: 'smart',
            value: 'steph',
            operator: IS_OPERATOR,
          },
        },
      ];

      const update = addTimelineProviders({
        id: 'foo',
        providers: andProviderToAdd,
        timelineById: newTimeline,
      });
      const indexProvider = update.foo.dataProviders.findIndex((i) => i.id === '567');
      const addedAndDataProvider = update.foo.dataProviders[indexProvider].and[0];
      const { and, ...expectedResult } = andProviderToAdd[0];
      expect(addedAndDataProvider).toEqual(expectedResult);
      newTimeline.foo.highlightedDropAndProviderId = '';
    });

    test('should add another and provider because it is not a duplicate', () => {
      const providerToAdd: DataProvider[] = [
        {
          ...basicDataProvider,
          and: [
            {
              ...basicDataProvider,
              id: '568',
              name: 'And Data Provider',
              queryMatch: {
                field: 'smart',
                value: 'xavier',
                operator: IS_OPERATOR,
              },
            },
          ],
          id: '567',
          queryMatch: {
            field: 'handsome',
            value: 'steph',
            operator: IS_OPERATOR,
          },
        },
      ];

      const newTimeline = addTimelineProviders({
        id: 'foo',
        providers: providerToAdd,
        timelineById: timelineByIdMock,
      });

      newTimeline.foo.highlightedDropAndProviderId = '567';

      const andProviderToAdd: DataProvider[] = [
        {
          ...basicDataProvider,
          id: '569',
          name: 'And Data Provider',
          queryMatch: {
            field: 'happy',
            value: 'andrewG',
            operator: IS_OPERATOR,
          },
        },
      ];
      // temporary, we will have to decouple DataProvider & DataProvidersAnd
      // that's bigger a refactor than just fixing a bug
      // @ts-expect-error
      delete andProviderToAdd[0].and;
      const update = addTimelineProviders({
        id: 'foo',
        providers: andProviderToAdd,
        timelineById: newTimeline,
      });

      expect(update.foo.dataProviders[1].and[1]).toEqual(andProviderToAdd[0]);
      newTimeline.foo.highlightedDropAndProviderId = '';
    });

    test('should NOT add another and provider because it is a duplicate', () => {
      const providerToAdd: DataProvider[] = [
        {
          ...basicDataProvider,
          and: [
            {
              ...basicDataProvider,
              id: '568',
              name: 'And Data Provider',
              queryMatch: {
                field: 'smart',
                value: 'xavier',
                operator: IS_OPERATOR,
              },
            },
          ],
          id: '567',
          queryMatch: {
            field: 'handsome',
            value: 'steph',
            operator: IS_OPERATOR,
          },
        },
      ];

      const newTimeline = addTimelineProviders({
        id: 'foo',
        providers: providerToAdd,
        timelineById: timelineByIdMock,
      });

      newTimeline.foo.highlightedDropAndProviderId = '567';

      const andProviderToAdd: DataProvider[] = [
        {
          ...basicDataProvider,
          id: '569',
          name: 'And Data Provider',
          queryMatch: {
            field: 'smart',
            value: 'xavier',
            operator: IS_OPERATOR,
          },
        },
      ];
      const update = addTimelineProviders({
        id: 'foo',
        providers: andProviderToAdd,
        timelineById: newTimeline,
      });

      expect(update).toEqual(newTimeline);
      newTimeline.foo.highlightedDropAndProviderId = '';
    });
  });

  describe('#updateTimelineColumns', () => {
    test('should return a new reference and not the same reference', () => {
      const update = updateTimelineColumns({
        id: 'foo',
        columns: columnsMock,
        timelineById: timelineByIdMock,
      });
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should update a timeline with new columns', () => {
      const update = updateTimelineColumns({
        id: 'foo',
        columns: columnsMock,
        timelineById: timelineByIdMock,
      });
      expect(update.foo.columns).toEqual([...columnsMock]);
    });

    test('should apply the locally stored column config', () => {
      const initialWidth = 123456789;
      const storedConfig: LocalStorageColumnSettings = {
        '@timestamp': {
          id: '@timestamp',
          initialWidth,
        },
      };
      setStoredTimelineColumnsConfig(storedConfig);
      const update = updateTimelineColumns({
        id: 'foo',
        columns: columnsMock,
        timelineById: timelineByIdMock,
      });

      expect(update.foo.columns.find((col) => col.id === '@timestamp')).toEqual(
        expect.objectContaining({
          initialWidth,
        })
      );
    });
  });

  describe('#updateTimelineTitleAndDescription', () => {
    const newTitle = 'a new title';
    const newDescription = 'breathing room';

    test('should return a new reference and not the same reference', () => {
      const update = updateTimelineTitleAndDescription({
        id: 'foo',
        description: '',
        title: newTitle,
        timelineById: timelineByIdMock,
      });
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should update the timeline title and description', () => {
      const update = updateTimelineTitleAndDescription({
        id: 'foo',
        description: newDescription,
        title: newTitle,
        timelineById: timelineByIdMock,
      });
      expect(update.foo.title).toEqual(newTitle);
      expect(update.foo.description).toEqual(newDescription);
    });

    test('should always trim all leading whitespace', () => {
      const update = updateTimelineTitleAndDescription({
        id: 'foo',
        description: '      breathing room      ',
        title: '      room at the back      ',
        timelineById: timelineByIdMock,
      });
      expect(update.foo.title).toEqual('room at the back');
      expect(update.foo.description).toEqual('breathing room');
    });
  });

  describe('#updateTimelineProviders', () => {
    test('should return a new reference and not the same reference', () => {
      const update = updateTimelineProviders({
        id: 'foo',
        providers: [
          {
            ...basicDataProvider,
            id: '567',
            name: 'data provider 2',
          },
        ],
        timelineById: timelineByIdMock,
      });
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should add update a timeline with new providers BBB', () => {
      const providerToAdd: DataProvider = {
        ...basicDataProvider,
        id: '567',
        name: 'data provider 2',
      };
      const update = updateTimelineProviders({
        id: 'foo',
        providers: [providerToAdd],
        timelineById: timelineByIdMock,
      });
      expect(update.foo.dataProviders).toEqual([providerToAdd]);
    });
  });

  describe('#updateTimelineRange', () => {
    let update: TimelineById;
    beforeAll(() => {
      update = updateTimelineRange({
        id: 'foo',
        start: '2020-07-07T08:20:18.966Z',
        end: '2020-07-08T08:20:18.966Z',
        timelineById: timelineByIdMock,
      });
    });
    test('should return a new reference and not the same reference', () => {
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should update the timeline range', () => {
      expect(update.foo.dateRange).toEqual({
        start: '2020-07-07T08:20:18.966Z',
        end: '2020-07-08T08:20:18.966Z',
      });
    });
  });

  describe('#updateTimelineSort', () => {
    let update: TimelineById;
    beforeAll(() => {
      update = updateTimelineSort({
        id: 'foo',
        sort: [
          {
            columnId: 'some column',
            columnType: 'text',
            esTypes: ['keyword'],
            sortDirection: Direction.desc,
          },
        ],
        timelineById: timelineByIdMock,
      });
    });
    test('should return a new reference and not the same reference', () => {
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should update the sort attribute', () => {
      expect(update.foo.sort).toEqual([
        {
          columnId: 'some column',
          columnType: 'text',
          esTypes: ['keyword'],
          sortDirection: Direction.desc,
        },
      ]);
    });
  });

  describe('#updateTimelineProviderEnabled', () => {
    test('should return a new reference and not the same reference', () => {
      const update: TimelineById = updateTimelineProviderEnabled({
        id: 'foo',
        providerId: '123',
        enabled: false, // value we are updating from true to false
        timelineById: timelineByIdMock,
      });
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should return a new reference for data provider and not the same reference of data provider', () => {
      const update: TimelineById = updateTimelineProviderEnabled({
        id: 'foo',
        providerId: '123',
        enabled: false, // value we are updating from true to false
        timelineById: timelineByIdMock,
      });
      expect(update.foo.dataProviders).not.toBe(basicTimeline.dataProviders);
    });

    test('should update the timeline provider enabled from true to false', () => {
      const update: TimelineById = updateTimelineProviderEnabled({
        id: 'foo',
        providerId: '123',
        enabled: false, // value we are updating from true to false
        timelineById: timelineByIdMock,
      });
      const expected: TimelineById = {
        foo: {
          ...basicTimeline,
          dataProviders: [
            {
              ...basicDataProvider,
              enabled: false,
            },
          ],
        },
      };
      expect(update).toEqual(expected);
    });

    test('should update only one data provider and not two data providers', () => {
      const multiDataProvider = [...basicTimeline.dataProviders].concat({
        ...basicDataProvider,
        id: '456',
      });
      const multiDataProviderMock = {
        foo: {
          ...timelineByIdMock.foo,
          dataProviders: multiDataProvider,
        },
      };
      const update = updateTimelineProviderEnabled({
        id: 'foo',
        providerId: '123',
        enabled: false, // value we are updating from true to false
        timelineById: multiDataProviderMock,
      });
      const expected: TimelineById = {
        foo: {
          ...basicTimeline,
          dataProviders: [
            {
              ...basicDataProvider,
              enabled: false,
            },
            {
              ...basicDataProvider,
              id: '456',
            },
          ],
        },
      };
      expect(update).toEqual(expected);
    });
  });

  describe('#updateTimelineAndProviderEnabled', () => {
    let timelineByIdwithAndMock: TimelineById = timelineByIdMock;
    let update: TimelineById;
    beforeEach(() => {
      const providerToAdd: DataProvider[] = [
        {
          ...basicDataProvider,
          and: [
            {
              ...basicDataProvider,
              id: '568',
              name: 'And Data Provider',
            },
          ],
          id: '567',
        },
      ];

      timelineByIdwithAndMock = addTimelineProviders({
        id: 'foo',
        providers: providerToAdd,
        timelineById: timelineByIdMock,
      });

      update = updateTimelineProviderEnabled({
        id: 'foo',
        providerId: '567',
        enabled: false, // value we are updating from true to false
        timelineById: timelineByIdwithAndMock,
        andProviderId: '568',
      });
    });

    test('should return a new reference and not the same reference', () => {
      expect(update).not.toBe(timelineByIdwithAndMock);
    });

    test('should return a new reference for and data provider and not the same reference of data and provider', () => {
      expect(update.foo.dataProviders).not.toBe(basicTimeline.dataProviders);
    });

    test('should update the timeline and provider enabled from true to false', () => {
      const indexProvider = update.foo.dataProviders.findIndex((i) => i.id === '567');
      expect(update.foo.dataProviders[indexProvider].and[0].enabled).toEqual(false);
    });

    test('should update only one and data provider and not two and data providers ahhhh', () => {
      const indexProvider = timelineByIdwithAndMock.foo.dataProviders.findIndex(
        (i) => i.id === '567'
      );
      const multiAndDataProvider = timelineByIdwithAndMock.foo.dataProviders[
        indexProvider
      ].and.concat({
        id: '456',
        name: 'new and data provider',
        enabled: true,
        queryMatch: {
          field: '',
          value: '',
          operator: IS_OPERATOR,
        },

        excluded: false,
        kqlQuery: '',
      });
      const multiAndDataProviderMock = timelineByIdwithAndMock;
      multiAndDataProviderMock.foo.dataProviders[indexProvider].and = multiAndDataProvider;
      update = updateTimelineProviderEnabled({
        id: 'foo',
        providerId: '567',
        enabled: false, // value we are updating from true to false
        timelineById: multiAndDataProviderMock,
        andProviderId: '568',
      });
      const oldAndProvider = update.foo.dataProviders[indexProvider].and.find(
        (i) => i.id === '568'
      );
      const newAndProvider = update.foo.dataProviders[indexProvider].and.find(
        (i) => i.id === '456'
      );
      expect(oldAndProvider?.enabled).toEqual(false);
      expect(newAndProvider?.enabled).toEqual(true);
    });
  });

  describe('#updateTimelineProviderExcluded', () => {
    let update: TimelineById;
    beforeAll(() => {
      update = updateTimelineProviderExcluded({
        id: 'foo',
        providerId: '123',
        excluded: true, // value we are updating from false to true
        timelineById: timelineByIdMock,
      });
    });
    test('should return a new reference and not the same reference', () => {
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should return a new reference for data provider and not the same reference of data provider', () => {
      expect(update.foo.dataProviders).not.toBe(basicTimeline.dataProviders);
    });

    test('should update the timeline provider excluded from true to false', () => {
      const expected: TimelineById = {
        foo: {
          ...basicTimeline,
          dataProviders: [
            {
              ...basicDataProvider,
              excluded: true,
            },
          ],
        },
      };
      expect(update).toEqual(expected);
    });

    test('should update only one data provider and not two data providers', () => {
      const multiDataProvider = basicTimeline.dataProviders.concat({
        ...basicDataProvider,
        id: '456',
      });
      const multiDataProviderMock = {
        ...timelineByIdMock,
        foo: {
          ...timelineByIdMock.foo,
          dataProviders: multiDataProvider,
        },
      };
      update = updateTimelineProviderExcluded({
        id: 'foo',
        providerId: '123',
        excluded: true, // value we are updating from false to true
        timelineById: multiDataProviderMock,
      });
      const expected: TimelineById = {
        foo: {
          ...basicTimeline,
          dataProviders: [
            {
              ...basicDataProvider,
              excluded: true, // value we are updating from false to true
            },
            {
              ...basicDataProvider,
              id: '456',
            },
          ],
        },
      };
      expect(update).toEqual(expected);
    });
  });

  describe('#updateTimelineProviderType', () => {
    test('should return the same reference if run on timelineType default', () => {
      const update = updateTimelineProviderType({
        id: 'foo',
        providerId: '123',
        type: DataProviderTypeEnum.template, // value we are updating from default to template
        timelineById: timelineByIdMock,
      });
      expect(update).toBe(timelineByIdMock);
    });

    test('should return a new reference and not the same reference', () => {
      const update = updateTimelineProviderType({
        id: 'foo',
        providerId: '123',
        type: DataProviderTypeEnum.template, // value we are updating from default to template
        timelineById: timelineByIdTemplateMock,
      });
      expect(update).not.toBe(timelineByIdTemplateMock);
    });

    test('should return a new reference for data provider and not the same reference of data provider', () => {
      const update = updateTimelineProviderType({
        id: 'foo',
        providerId: '123',
        type: DataProviderTypeEnum.template, // value we are updating from default to template
        timelineById: timelineByIdTemplateMock,
      });
      expect(update.foo.dataProviders).not.toBe(timelineByIdTemplateMock.foo.dataProviders);
    });

    test('should update the timeline provider type from default to template', () => {
      const update = updateTimelineProviderType({
        id: 'foo',
        providerId: '123',
        type: DataProviderTypeEnum.template,
        timelineById: timelineByIdTemplateMock,
      });
      const expected: TimelineById = {
        foo: {
          ...basicTimeline,
          dataProviders: [
            {
              ...basicDataProvider,
              name: '',
              queryMatch: {
                field: '',
                value: '{}',
                operator: IS_OPERATOR,
              },
              type: DataProviderTypeEnum.template,
            },
          ],
          timelineType: TimelineTypeEnum.template,
        },
      };

      expect(update).toEqual(expected);
    });
    test('should update only one data provider and not two data providers AHH', () => {
      const multiDataProvider = [
        ...timelineByIdTemplateMock.foo.dataProviders,
        {
          ...basicDataProvider,
          id: '456',
          type: DataProviderTypeEnum.template,
        },
      ];

      const multiDataProviderMock = {
        ...timelineByIdTemplateMock,
        foo: {
          ...timelineByIdTemplateMock.foo,
          dataProviders: multiDataProvider,
        },
      };
      const update = updateTimelineProviderType({
        id: 'foo',
        providerId: '123',
        type: DataProviderTypeEnum.template, // value we are updating from default to template
        timelineById: multiDataProviderMock,
      });
      const expected = [
        {
          ...basicDataProvider,
          name: '',
          type: DataProviderTypeEnum.template,
          queryMatch: {
            field: '',
            value: '{}',
            operator: IS_OPERATOR,
          },
        },
        {
          ...basicDataProvider,
          id: '456',
          type: DataProviderTypeEnum.template,
        },
      ];
      expect(update.foo.dataProviders).toEqual(expected);
    });
  });

  describe('#updateTimelineAndProviderExcluded', () => {
    let timelineByIdwithAndMock: TimelineById = timelineByIdMock;
    beforeEach(() => {
      const providerToAdd: DataProvider[] = [
        {
          ...basicDataProvider,
          and: [
            {
              ...basicDataProvider,
              id: '568',
              name: 'And Data Provider',
            },
          ],
          id: '567',
        },
      ];

      timelineByIdwithAndMock = addTimelineProviders({
        id: 'foo',
        providers: providerToAdd,
        timelineById: timelineByIdMock,
      });
    });

    test('should return a new reference and not the same reference', () => {
      const update = updateTimelineProviderExcluded({
        id: 'foo',
        providerId: '567',
        excluded: true, // value we are updating from true to false
        timelineById: timelineByIdwithAndMock,
        andProviderId: '568',
      });
      expect(update).not.toBe(timelineByIdwithAndMock);
    });

    test('should return a new reference for and data provider and not the same reference of data and provider', () => {
      const update = updateTimelineProviderExcluded({
        id: 'foo',
        providerId: '567',
        excluded: true, // value we are updating from false to true
        timelineById: timelineByIdwithAndMock,
        andProviderId: '568',
      });
      expect(update.foo.dataProviders).not.toBe(basicTimeline.dataProviders);
    });

    test('should update the timeline and provider excluded from true to false', () => {
      const update = updateTimelineProviderExcluded({
        id: 'foo',
        providerId: '567',
        excluded: true, // value we are updating from true to false
        timelineById: timelineByIdwithAndMock,
        andProviderId: '568',
      });
      const indexProvider = update.foo.dataProviders.findIndex((i) => i.id === '567');
      expect(update.foo.dataProviders[indexProvider].and[0].enabled).toEqual(true);
    });

    test('should update only one and data provider and not two and data providers', () => {
      const indexProvider = timelineByIdwithAndMock.foo.dataProviders.findIndex(
        (i) => i.id === '567'
      );
      const multiAndDataProvider = timelineByIdwithAndMock.foo.dataProviders[
        indexProvider
      ].and.concat({
        ...basicDataProvider,
        id: '456',
        name: 'new and data provider',
      });
      const multiAndDataProviderMock = timelineByIdwithAndMock;
      multiAndDataProviderMock.foo.dataProviders[indexProvider].and = multiAndDataProvider;
      const update = updateTimelineProviderExcluded({
        id: 'foo',
        providerId: '567',
        excluded: true, // value we are updating from true to false
        timelineById: multiAndDataProviderMock,
        andProviderId: '568',
      });
      const oldAndProvider = update.foo.dataProviders[indexProvider].and.find(
        (i) => i.id === '568'
      );
      const newAndProvider = update.foo.dataProviders[indexProvider].and.find(
        (i) => i.id === '456'
      );
      expect(oldAndProvider?.excluded).toEqual(true);
      expect(newAndProvider?.excluded).toEqual(false);
    });
  });

  describe('#updateTimelineItemsPerPage', () => {
    test('should return a new reference and not the same reference', () => {
      const update = updateTimelineItemsPerPage({
        id: 'foo',
        itemsPerPage: 10, // value we are updating from 5 to 10
        timelineById: timelineByIdMock,
      });
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should update the items per page from 25 to 50', () => {
      const update = updateTimelineItemsPerPage({
        id: 'foo',
        itemsPerPage: 50, // value we are updating from 25 to 50
        timelineById: timelineByIdMock,
      });
      const expected: TimelineById = {
        foo: {
          ...basicTimeline,
          itemsPerPage: 50,
        },
      };
      expect(update).toEqual(expected);
    });
  });

  describe('#updateTimelinePerPageOptions', () => {
    test('should return a new reference and not the same reference', () => {
      const update = updateTimelinePerPageOptions({
        id: 'foo',
        itemsPerPageOptions: [100, 200, 300], // value we are updating from [5, 10, 20]
        timelineById: timelineByIdMock,
      });
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should update the items per page options from [10, 25, 50] to [100, 200, 300]', () => {
      const update = updateTimelinePerPageOptions({
        id: 'foo',
        itemsPerPageOptions: [100, 200, 300], // value we are updating from [10, 25, 50]
        timelineById: timelineByIdMock,
      });
      const expected: TimelineById = {
        foo: {
          ...basicTimeline,
          itemsPerPageOptions: [100, 200, 300], // updated
        },
      };
      expect(update).toEqual(expected);
    });
  });

  describe('#removeTimelineProvider', () => {
    test('should return a new reference and not the same reference', () => {
      const update = removeTimelineProvider({
        id: 'foo',
        providerId: '123',
        timelineById: timelineByIdMock,
      });
      expect(update).not.toBe(timelineByIdMock);
    });

    test('should remove a timeline provider', () => {
      const update = removeTimelineProvider({
        id: 'foo',
        providerId: '123',
        timelineById: timelineByIdMock,
      });
      expect(update.foo.dataProviders).toEqual([]);
    });

    test('should remove only one data provider and not two data providers', () => {
      const multiDataProvider = basicTimeline.dataProviders.concat({
        ...basicDataProvider,
        id: '456',
        name: 'data provider 2',
      });
      const multiDataProviderMock = {
        ...timelineByIdMock,
        foo: {
          ...timelineByIdMock.foo,
          dataProviders: multiDataProvider,
        },
      };
      const update = removeTimelineProvider({
        id: 'foo',
        providerId: '123',
        timelineById: multiDataProviderMock,
      });
      const expected: TimelineById = {
        foo: {
          ...basicTimeline,
          dataProviders: [
            {
              ...basicDataProvider,
              id: '456',
              name: 'data provider 2',
            },
          ],
        },
      };
      expect(update).toEqual(expected);
    });

    test('should remove only first provider and not nested andProvider', () => {
      const dataProviders: DataProvider[] = [
        {
          ...basicDataProvider,
          id: '111',
        },
        {
          ...basicDataProvider,
          id: '222',
          name: 'data provider 2',
        },
        {
          ...basicDataProvider,
          id: '333',
          name: 'data provider 3',
        },
      ];

      const multiDataProviderMock = {
        ...timelineByIdMock,
        foo: {
          ...timelineByIdMock.foo,
          dataProviders,
        },
      };
      const andDataProvider: DataProvidersAnd = {
        ...basicDataProvider,
        id: '211',
        name: 'And Data Provider',
      };

      const nestedMultiAndDataProviderMock = multiDataProviderMock;
      multiDataProviderMock.foo.dataProviders[1].and = [andDataProvider];

      const update = removeTimelineProvider({
        id: 'foo',
        providerId: '222',
        timelineById: nestedMultiAndDataProviderMock,
      });
      expect(update.foo.dataProviders).toEqual([
        nestedMultiAndDataProviderMock.foo.dataProviders[0],
        { ...andDataProvider, and: [] },
        nestedMultiAndDataProviderMock.foo.dataProviders[2],
      ]);
    });

    test('should remove only the first provider and keep multiple nested andProviders', () => {
      const multiDataProvider: DataProvider[] = [
        {
          ...basicDataProvider,
          and: [
            {
              ...basicDataProvider,
              id: 'socket_closed-MSoH7GoB9v5HJNSHRYj1-user_name-root',
              name: 'root',
              queryMatch: {
                field: 'user.name',
                value: 'root',
                operator: ':',
              },
            },
            {
              ...basicDataProvider,
              id: 'executed-yioH7GoB9v5HJNSHKnp5-auditd_result-success',
              name: 'success',
              queryMatch: {
                field: 'auditd.result',
                value: 'success',
                operator: ':',
              },
            },
          ],
          id: 'hosts-table-hostName-suricata-iowa',
          name: 'suricata-iowa',
          queryMatch: {
            field: 'host.name',
            value: 'suricata-iowa',
            operator: ':',
          },
        },
      ];

      const multiDataProviderMock = {
        ...timelineByIdMock,
        foo: {
          ...timelineByIdMock.foo,
          dataProviders: multiDataProvider,
        },
      };

      const update = removeTimelineProvider({
        id: 'foo',
        providerId: 'hosts-table-hostName-suricata-iowa',
        timelineById: multiDataProviderMock,
      });

      expect(update.foo.dataProviders).toEqual([
        {
          ...basicDataProvider,
          id: 'socket_closed-MSoH7GoB9v5HJNSHRYj1-user_name-root',
          name: 'root',
          queryMatch: {
            field: 'user.name',
            value: 'root',
            operator: ':',
          },
          and: [
            {
              ...basicDataProvider,
              id: 'executed-yioH7GoB9v5HJNSHKnp5-auditd_result-success',
              name: 'success',
              queryMatch: {
                field: 'auditd.result',
                value: 'success',
                operator: ':',
              },
            },
          ],
        },
      ]);
    });
    test('should remove only the first AND provider when the first AND is deleted, and there are multiple andProviders', () => {
      const multiDataProvider: DataProvider[] = [
        {
          ...basicDataProvider,
          and: [
            {
              ...basicDataProvider,
              id: 'socket_closed-MSoH7GoB9v5HJNSHRYj1-user_name-root',
              name: 'root',
              queryMatch: {
                field: 'user.name',
                value: 'root',
                operator: ':',
              },
            },
            {
              ...basicDataProvider,
              id: 'executed-yioH7GoB9v5HJNSHKnp5-auditd_result-success',
              name: 'success',
              queryMatch: {
                field: 'auditd.result',
                value: 'success',
                operator: ':',
              },
            },
          ],
          id: 'hosts-table-hostName-suricata-iowa',
          name: 'suricata-iowa',
          queryMatch: {
            field: 'host.name',
            value: 'suricata-iowa',
            operator: ':',
          },
        },
      ];

      const multiDataProviderMock = {
        ...timelineByIdMock,
        foo: {
          ...timelineByIdMock.foo,
          dataProviders: multiDataProvider,
        },
      };

      const update = removeTimelineProvider({
        andProviderId: 'socket_closed-MSoH7GoB9v5HJNSHRYj1-user_name-root',
        id: 'foo',
        providerId: 'hosts-table-hostName-suricata-iowa',
        timelineById: multiDataProviderMock,
      });

      expect(update.foo.dataProviders).toEqual([
        {
          ...basicDataProvider,
          and: [
            {
              ...basicDataProvider,
              id: 'executed-yioH7GoB9v5HJNSHKnp5-auditd_result-success',
              name: 'success',
              queryMatch: {
                field: 'auditd.result',
                value: 'success',
                operator: ':',
              },
            },
          ],
          id: 'hosts-table-hostName-suricata-iowa',
          name: 'suricata-iowa',
          queryMatch: {
            field: 'host.name',
            value: 'suricata-iowa',
            operator: ':',
          },
        },
      ]);
    });

    test('should remove only the second AND provider when the second AND is deleted, and there are multiple andProviders', () => {
      const multiDataProvider: DataProvider[] = [
        {
          ...basicDataProvider,
          and: [
            {
              ...basicDataProvider,
              id: 'socket_closed-MSoH7GoB9v5HJNSHRYj1-user_name-root',
              name: 'root',
              queryMatch: {
                field: 'user.name',
                value: 'root',
                operator: ':',
              },
            },
            {
              ...basicDataProvider,
              id: 'executed-yioH7GoB9v5HJNSHKnp5-auditd_result-success',
              name: 'success',
              queryMatch: {
                field: 'auditd.result',
                value: 'success',
                operator: ':',
              },
            },
          ],
          id: 'hosts-table-hostName-suricata-iowa',
          name: 'suricata-iowa',
          queryMatch: {
            field: 'host.name',
            value: 'suricata-iowa',
            operator: ':',
          },
        },
      ];

      const multiDataProviderMock = {
        ...timelineByIdMock,
        foo: {
          ...timelineByIdMock.foo,
          dataProviders: multiDataProvider,
        },
      };

      const update = removeTimelineProvider({
        andProviderId: 'executed-yioH7GoB9v5HJNSHKnp5-auditd_result-success',
        id: 'foo',
        providerId: 'hosts-table-hostName-suricata-iowa',
        timelineById: multiDataProviderMock,
      });

      expect(update.foo.dataProviders).toEqual([
        {
          ...basicDataProvider,
          and: [
            {
              ...basicDataProvider,
              id: 'socket_closed-MSoH7GoB9v5HJNSHRYj1-user_name-root',
              name: 'root',
              queryMatch: {
                field: 'user.name',
                value: 'root',
                operator: ':',
              },
            },
          ],
          id: 'hosts-table-hostName-suricata-iowa',
          name: 'suricata-iowa',
          queryMatch: {
            field: 'host.name',
            value: 'suricata-iowa',
            operator: ':',
          },
        },
      ]);
    });
  });

  describe('#updateTimelineColumnWidth', () => {
    let mockTimelineById: TimelineById;
    beforeEach(() => {
      mockTimelineById = structuredClone(timelineByIdMock);
      mockTimelineById.foo.columns = structuredClone(defaultUdtHeaders);
    });

    it('should update column width correctly when correct column is supplied', () => {
      const result = updateTimelineColumnWidth({
        columnId: '@timestamp',
        id: 'foo',
        timelineById: mockTimelineById,
        width: 500,
      });

      expect(result.foo.columns[0]).toHaveProperty('initialWidth', 500);
    });

    it('should be no-op when incorrect column is supplied', () => {
      const result = updateTimelineColumnWidth({
        columnId: 'invalid-column',
        id: 'foo',
        timelineById: mockTimelineById,
        width: 500,
      });

      expect(result.foo.columns).toEqual(defaultUdtHeaders);
    });
  });
});
