/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { resolve, relative } from 'path';
import { createReadStream } from 'fs';
import { Readable, Writable } from 'stream';
import type { Client } from '@elastic/elasticsearch';
import { ToolingLog } from '@kbn/tooling-log';
import type { KbnClient } from '@kbn/test';
import { createPromiseFromStreams } from '@kbn/utils';
import { REPO_ROOT } from '@kbn/repo-info';

import {
  isGzip,
  createStats,
  prioritizeMappings,
  readDirectory,
  createParseArchiveStreams,
  createFilterRecordsStream,
  createDeleteIndexStream,
} from '../lib';

export async function unloadAction({
  inputDir,
  client,
  log,
  kbnClient,
}: {
  inputDir: string;
  client: Client;
  log: ToolingLog;
  kbnClient: KbnClient;
}) {
  const name = relative(REPO_ROOT, inputDir);
  const stats = createStats(name, log);

  const files = prioritizeMappings(await readDirectory(inputDir));
  for (const filename of files) {
    log.info('[%s] Unloading indices from %j', name, filename);

    await createPromiseFromStreams([
      createReadStream(resolve(inputDir, filename)) as Readable,
      ...createParseArchiveStreams({ gzip: isGzip(filename) }),
      createFilterRecordsStream((record) => ['index', 'data_stream', 'doc'].includes(record.type)),
      createDeleteIndexStream(client, stats, log),
    ] as [Readable, ...Writable[]]);
  }

  return stats.toJSON();
}
