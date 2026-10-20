#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PROFILE_ID = 'QyBSTzEAAAAJ';
const PROFILE_NAME = 'Pengxiang Ding';
const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();

function validateProfileUrl(value) {
  const url = new URL(value);
  if (url.origin !== 'https://scholar.google.com' ||
      url.pathname !== '/citations' ||
      url.searchParams.get('user') !== PROFILE_ID) {
    throw new Error('The response is not the expected public Google Scholar profile.');
  }
  return url;
}

function totalCitations(profile) {
  validateProfileUrl(profile.url);
  if (normalize(profile.name) !== PROFILE_NAME) {
    throw new Error('Scholar profile identity could not be verified.');
  }
  const rows = profile.rows.map(row => row.map(normalize));
  const allColumn = rows[0]?.indexOf('All') ?? -1;
  const citationRows = rows.filter(row => row[0] === 'Citations');
  if (allColumn < 1 || citationRows.length !== 1) {
    throw new Error('The Citations / All cell is missing; retaining the previous snapshot.');
  }
  const value = citationRows[0][allColumn] ?? '';
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value)) {
    throw new Error('Scholar did not return a complete numeric citation count.');
  }
  const count = Number(value.replaceAll(',', ''));
  if (!Number.isSafeInteger(count)) throw new Error('Invalid citation count.');
  return count;
}

function shanghaiDate(now) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function readPublicProfile(profileUrl) {
  const { chromium } = require('playwright');
  const url = validateProfileUrl(profileUrl);
  url.searchParams.set('hl', 'en');
  const options = { headless: true };
  // Optional local environment settings; CI needs neither credentials nor a proxy.
  if (process.env.SCHOLAR_BROWSER_CHANNEL) options.channel = process.env.SCHOLAR_BROWSER_CHANNEL;
  if (process.env.SCHOLAR_PROXY) options.proxy = { server: process.env.SCHOLAR_PROXY };
  const browser = await chromium.launch(options);
  try {
    const page = await browser.newPage();
    const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!response || response.status() !== 200) {
      throw new Error(`Scholar returned HTTP ${response?.status() ?? 'unknown'}; no data was changed.`);
    }
    validateProfileUrl(page.url());
    await page.locator('#gsc_rsb_st').waitFor({ timeout: 10000 });
    return await page.evaluate(() => ({
      url: location.href,
      name: document.querySelector('#gsc_prf_in')?.textContent ?? '',
      rows: Array.from(document.querySelectorAll('#gsc_rsb_st tr'), row =>
        Array.from(row.querySelectorAll('th, td'), cell => cell.textContent))
    }));
  } finally {
    await browser.close();
  }
}

async function updateSnapshot({
  dataFile = path.resolve(__dirname, '../_data/home_metrics.json'),
  readProfile = readPublicProfile,
  now = () => new Date()
} = {}) {
  const original = fs.readFileSync(dataFile, 'utf8');
  const metrics = JSON.parse(original);
  const matches = metrics.filter(item => item.id === 'scholar-citations');
  if (matches.length !== 1) throw new Error('Expected exactly one Scholar metric.');
  const metric = matches[0];
  const count = totalCitations(await readProfile(metric.url));
  if (count === 0 && Number(String(metric.value).replaceAll(',', '')) > 0) {
    throw new Error('Unexpected zero count; retaining the previous snapshot for review.');
  }
  metric.value = count.toLocaleString('en-US');
  metric.verified_on = shanghaiDate(now());
  metric.verification_note = 'Automatically read the official Google Scholar profile for ' +
    `${PROFILE_NAME} (${PROFILE_ID}); Citations / All column.`;
  const updated = JSON.stringify(metrics, null, 2) + '\n';
  if (updated !== original) {
    const temporary = `${dataFile}.tmp`;
    fs.writeFileSync(temporary, updated);
    fs.renameSync(temporary, dataFile);
  }
  return { count, verified_on: metric.verified_on, changed: updated !== original };
}

module.exports = { totalCitations, shanghaiDate, updateSnapshot };

if (require.main === module) {
  updateSnapshot().then(result => {
    console.log(JSON.stringify(result));
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        `Google Scholar: **${result.count.toLocaleString('en-US')} total citations**, ` +
        `verified **${result.verified_on}** (Asia/Shanghai).\n`);
    }
  }).catch(error => {
    console.error(`Citation refresh failed: ${error.message}`);
    console.error('The previous citation count and verification date have been preserved.');
    process.exitCode = 1;
  });
}
