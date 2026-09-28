// Creates the DuckDB file used by the dashtro example.
//
// Sources:
// 1. Stack Exchange Developer Survey 2025 (published aggregate results).
//    https://github.com/StackExchange/Survey
// 2. "The Simpsons by the Data" (episode ratings and US viewers).
//    https://www.kaggle.com/datasets/prashant111/the-simpsons-dataset
//
// Run with: pnpm seed
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DuckDBInstance } from '@duckdb/node-api';
import { unzipSync } from 'fflate';

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(here, '../data/analytics.duckdb');
const workDir = join(tmpdir(), 'dashtro-example-seed');

// Pin the survey commit so the example keeps working if the repo moves on.
const SURVEY_COMMIT = '32a114542da67e3759479637343718502742adfd';
const SURVEY_FILES = ['work', 'technology', 'developer-profile', 'community', 'ai'];
const SURVEY_BASE = `https://raw.githubusercontent.com/StackExchange/Survey/${SURVEY_COMMIT}/packages/archive/2025/json`;

const SIMPSONS_URL =
  'https://www.kaggle.com/api/v1/datasets/download/prashant111/the-simpsons-dataset';

await mkdir(dirname(dbPath), { recursive: true });
await mkdir(workDir, { recursive: true });

async function download(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`dashtro: GET ${url} failed with ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function stripHtml(text) {
  return String(text ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Turn one survey JSON file into flat answer rows. */
function flattenSurvey(section, json) {
  const rows = [];

  for (const [question, data] of Object.entries(json)) {
    for (const [dataset, group] of Object.entries(data.datasets ?? {})) {
      // Only the plain distributions. Skip sankey, scatter and dumbbell shapes.
      if (group.plot_type !== 'bar' && group.plot_type !== 'table') {
        continue;
      }

      for (const item of group.data ?? []) {
        if (item.response === undefined) {
          continue;
        }

        rows.push({
          section,
          question,
          question_text: stripHtml(data.question),
          dataset,
          dataset_name: group.name ?? dataset,
          response: String(item.response),
          frequency: numberOrNull(item.frequency),
          percent: numberOrNull(item.percent),
          rank: numberOrNull(item.rank),
          median: numberOrNull(item.median),
          mode: numberOrNull(item.mode),
          total: numberOrNull(item.total),
        });
      }
    }
  }

  return rows;
}

// 1. Survey answers.
const surveyRows = [];
for (const file of SURVEY_FILES) {
  const json = JSON.parse((await download(`${SURVEY_BASE}/${file}.json`)).toString('utf8'));
  const rows = flattenSurvey(file, json);
  surveyRows.push(...rows);
  console.log(`dashtro: survey ${file}.json -> ${rows.length} answers`);
}

const surveyPath = join(workDir, 'survey_answer.ndjson');
await writeFile(surveyPath, `${surveyRows.map((row) => JSON.stringify(row)).join('\n')}\n`);

// 2. Simpsons episodes. The zip also holds a 34 MB script-line file; extract
// only the episode table.
console.log('dashtro: downloading the Simpsons dataset…');
const zip = await download(SIMPSONS_URL);
const extracted = unzipSync(new Uint8Array(zip), {
  filter: (file) => file.name === 'simpsons_episodes.csv',
});
const episodes = extracted['simpsons_episodes.csv'];
if (!episodes) {
  throw new Error('dashtro: simpsons_episodes.csv was not in the dataset zip');
}
const episodesPath = join(workDir, 'simpsons_episodes.csv');
await writeFile(episodesPath, episodes);

// 3. Load both sources into DuckDB.
await rm(dbPath, { force: true });
const instance = await DuckDBInstance.create(dbPath);
const connection = await instance.connect();

const sqlPath = (path) => path.replace(/\\/g, '/');

await connection.run(`
  create table survey_answer as
  select * from read_ndjson('${sqlPath(surveyPath)}', columns = {
    section: 'VARCHAR',
    question: 'VARCHAR',
    question_text: 'VARCHAR',
    dataset: 'VARCHAR',
    dataset_name: 'VARCHAR',
    response: 'VARCHAR',
    frequency: 'DOUBLE',
    percent: 'DOUBLE',
    rank: 'DOUBLE',
    median: 'DOUBLE',
    mode: 'DOUBLE',
    total: 'DOUBLE'
  })
`);

await connection.run(`
  create table simpsons_episodes as
  select
    id,
    title,
    season,
    number_in_season,
    number_in_series,
    cast(original_air_date as date) as air_date,
    original_air_year,
    imdb_rating,
    imdb_votes,
    us_viewers_in_millions,
    views
  from read_csv_auto('${sqlPath(episodesPath)}', header = true)
`);

const reader = await connection.runAndReadAll(`
  select
    (select count(*) from survey_answer) as answers,
    (select count(distinct question) from survey_answer) as questions,
    (select count(*) from simpsons_episodes) as episodes
`);
const [counts] = reader.getRowObjectsJS();

connection.closeSync();
instance.closeSync();

console.log(
  `dashtro: survey_answer has ${counts.answers} rows over ${counts.questions} questions`,
);
console.log(`dashtro: simpsons_episodes has ${counts.episodes} rows`);
console.log(`dashtro: database at ${dbPath}`);
