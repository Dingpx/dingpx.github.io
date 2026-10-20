'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { totalCitations, shanghaiDate, updateSnapshot } = require('./update-scholar.cjs');

const profile = {
  url: 'https://scholar.google.com/citations?user=QyBSTzEAAAAJ&hl=en',
  name: 'Pengxiang Ding',
  rows: [
    ['', 'All', 'Since 2021'],
    ['Citations', '2,417', '2,416'],
    ['h-index', '28', '28'],
    ['i10-index', '39', '39']
  ]
};

test('reads total citations rather than the recent count or h-index', () => {
  assert.equal(totalCitations(profile), 2417);
  assert.equal(totalCitations({ ...profile, rows: [
    ['', 'Since 2021', 'All'], ['Citations', '2416', '2417']
  ] }), 2417);
});

test('rejects another profile, login responses, missing cells and abbreviated counts', () => {
  for (const invalid of [
    { ...profile, name: 'Another Researcher' },
    { ...profile, url: profile.url.replace('QyBSTzEAAAAJ', 'other') },
    { ...profile, url: 'https://accounts.google.com/signin' },
    { ...profile, rows: [] },
    { ...profile, rows: [['', 'Since 2021'], ['Citations', '2416']] },
    { ...profile, rows: [['', 'All'], ['Citations', '2.4K']] },
    { ...profile, rows: [['', 'All'], ['Citations', '']] }
  ]) assert.throws(() => totalCitations(invalid));
});

test('uses the Shanghai calendar date at a UTC day boundary', () => {
  assert.equal(shanghaiDate(new Date('2026-10-19T16:30:00Z')), '2026-10-20');
});

test('only verified results update the file; all failure paths preserve value and date', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scholar-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const dataFile = path.join(directory, 'metrics.json');
  const originalMetrics = [
    { id: 'scholar-citations', url: profile.url, value: '2,312', verified_on: '2026-10-09' },
    { id: 'redbook-followers', value: null, verified_on: '' }
  ];
  const original = JSON.stringify(originalMetrics, null, 2) + '\n';
  fs.writeFileSync(dataFile, original);
  for (const readProfile of [
    async () => { throw new Error('HTTP 429'); },
    async () => ({ ...profile, rows: [] }),
    async () => ({ ...profile, rows: [['', 'All'], ['Citations', '0']] })
  ]) {
    await assert.rejects(updateSnapshot({ dataFile, readProfile }));
    assert.equal(fs.readFileSync(dataFile, 'utf8'), original);
  }
  const readProfile = async () => profile;
  const now = () => new Date('2026-10-20T01:00:00Z');
  const result = await updateSnapshot({ dataFile, readProfile, now });
  assert.deepEqual(result, { count: 2417, verified_on: '2026-10-20', changed: true });
  const updated = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  assert.equal(updated[0].value, '2,417');
  assert.equal(updated[0].verified_on, '2026-10-20');
  assert.deepEqual(updated[1], originalMetrics[1]);
  assert.equal((await updateSnapshot({ dataFile, readProfile, now })).changed, false);
  await updateSnapshot({ dataFile, readProfile, now: () => new Date('2026-10-21T01:00:00Z') });
  assert.equal(JSON.parse(fs.readFileSync(dataFile, 'utf8'))[0].verified_on, '2026-10-21');
});
