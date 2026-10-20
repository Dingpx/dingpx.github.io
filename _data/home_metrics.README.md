# Homepage metrics

`home_metrics.json` supplies the compact statistics below the introduction.
Each item appears only when `value`, `url`, and `verified_on` are populated.
If every item is incomplete, the entire strip is omitted without taking space.

These are dated snapshots, not live counters. Google Scholar is refreshed daily.
No network request or credential
is sent from visitors' browsers. An unavailable count stays `null`; it must not
be replaced with zero or an estimate.

To update a metric:

1. Confirm the account and count on its official profile, or obtain the account
   owner's confirmation. Google Scholar uses **total citations**, and both
   social accounts use **followers**, not following, likes, or post views.
2. Set `value` to the displayed count as a string. Preserve platform rounding
   rather than inventing precision, for example keeping a rounded `K` suffix.
3. Set `verified_on` to the date the count was observed, in `YYYY-MM-DD` format.
   Record the evidence in `verification_note`; this note is not rendered.
4. For the company X item, first fill in the confirmed company profile URL.
   The existing homepage contact link is a personal account and is separate.

If a later refresh fails, keep the last verified value **and its original
date**. Do not advance the date unless the value has been checked again.

## Automatic Google Scholar refresh

`.github/workflows/update-scholar.yml` checks the official public Scholar profile
daily at approximately **08:23 Asia/Shanghai**, and can also be started from the
Actions tab using **Run workflow**. GitHub may delay scheduled runs. No local
computer needs to stay on, and no Scholar login or paid API is required.

`scripts/update-scholar.cjs` verifies the profile ID and name, then reads the
**Citations / All** cell. Only a successful, numeric result updates the value
and Shanghai verification date. Login pages, rate limits, changed markup, and
network errors fail the workflow without changing either saved field. A
successful check advances the date even when the count stays the same.

The workflow commits only `_data/home_metrics.json`, then explicitly requests
a Pages build. This is necessary because a push using `GITHUB_TOKEN` does not
by itself trigger the legacy Pages deployment. A failed run is visible in the
repository's Actions tab; the next scheduled run tries again.

Validate parsing and preservation of existing data:

```sh
node --test scripts/update-scholar.test.cjs
```

The fetcher requires Playwright 1.62.1 and Chromium. For local runs with Chrome,
set `SCHOLAR_BROWSER_CHANNEL=chrome`; an existing local proxy can optionally be
specified in `SCHOLAR_PROXY`. No proxy is configured in the GitHub workflow.

## Social accounts

The social metrics still require verified manual snapshots. X's official User Lookup API exposes
`public_metrics.followers_count` with developer authentication:
https://docs.x.com/x-api/users/lookup/introduction
Any future integration must run outside the public page and keep API tokens
out of this public repository.
