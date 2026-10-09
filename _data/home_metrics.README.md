# Homepage metrics

`home_metrics.json` supplies the compact statistics below the introduction.
Each item appears only when `value`, `url`, and `verified_on` are populated.
If every item is incomplete, the entire strip is omitted without taking space.

These are dated snapshots, not live counters. No network request or credential
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

No automatic refresh is configured. X's official User Lookup API exposes
`public_metrics.followers_count` with developer authentication:
https://docs.x.com/x-api/users/lookup/introduction
Any future integration must run outside the public page and keep API tokens
out of this public repository.
