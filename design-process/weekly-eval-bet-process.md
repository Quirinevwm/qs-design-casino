# Weekly eval bet process

How the Design Casino runs its automated evaluation cadence.

## Weekly rhythm

| Day | What happens |
|-----|-------------|
| Mon | Auto-score bet 1 |
| Tue | Auto-score bet 2 |
| Wed | Auto-score bet 3 |
| Thu | Auto-score bet 4 |
| Fri | Human review: check all 4, confirm or override scores |

## How the auto-scorer works

The daily workflow (`weekly-eval-bet.yml`) is scheduled for **04:15 Pacific, Monday through Thursday**, and processes one bet per day. It uses `America/Los_Angeles`, so the local time stays the same across daylight saving changes (11:15 UTC during daylight time, 12:15 UTC during standard time). Friday remains reserved for human review.

The early-morning slot aims to reduce exposure to peak model demand, not guarantee capacity. Starting at 15 minutes past the hour also avoids GitHub Actions' busiest scheduling boundary. GitHub may delay scheduled runs, so the trigger time is not a guaranteed start time. Manual runs remain available and do not change the regular cadence.

### Step by step

1. **Find and guard the bet** -- Picks the oldest `status:ready` issue (or a specific one if triggered manually). Every mode verifies that the selected issue is open with `status:ready` before diagnostics or scoring; otherwise it skips the evaluation. Extracts the title and body, then generates a filename containing the week, slug, workflow run ID, and attempt. Eligible retries do not overwrite earlier evidence or reports.

2. **Resolve the target page** -- Uses the issue's Target page field, falling back to the first HTTPS link for older issues. The URL must identify the page being evaluated, not merely a source issue or reference article.

3. **Capture screenshots with Playwright** -- Installs a headless Chromium browser and takes four shots:
   - Above the fold (1440x900, 2x retina)
   - Full page scroll
   - Mid-page
   - Mobile (390x844)

   Rendered text, HTML, and capture settings are stored with the screenshots in an immutable run-specific folder. Failed page responses stop the run rather than becoming valid evaluation evidence.

4. **Choose the craft scope** -- Match the target URL, rendering settings, rubric version, and captured evidence against prior machine-readable evaluation records. Choose a new baseline, an existing baseline reference, or a changed-evidence comparison as described below.

5. **Auto-score with gpt-5-mini through Microsoft Foundry** -- Production input validation, diagnostics, and scoring exclusively use `FOUNDRY_SWEDEN_RESPONSES_ENDPOINT` and `FOUNDRY_SWEDEN_API_KEY`, configured privately. Legacy `FOUNDRY_RESPONSES_ENDPOINT` and `FOUNDRY_SCORING_API_KEY` are not used in production; do not delete them. Never publish service URLs, resource/project identifiers, or secret values. There is no fallback connection. Send full evidence: the named lens, bet details, rubric, captured text/HTML, screenshots, and baseline evidence for changes. Production always uses the strict lens/mode Responses schema and trusted developer scoring policy, with `max_output_tokens=8192` including reasoning. Validate dimensions and score ranges, calculate totals, and render the report in code. Invalid or incomplete output fails without partial scores. Preserve existing reports, human ratings, and historical model attribution.

6. **Build a scoped human review** -- Include the named lens dimensions. Include all six craft dimensions only when establishing a baseline; show only reassessed dimensions for a change review; otherwise link the baseline without requesting another craft score. Keep role-specific audience validation separate from design-lead review.

7. **Commit and push the validated evaluation** -- Save the markdown report, a same-name JSON sidecar with AI scores and evidence provenance, and the immutable capture folder to `weekly-eval-bets/` on main. Publication requires successful validation, commit, and confirmed push. Scoring runs remain serialized so later runs can see earlier baselines.

8. **Comment on the issue only after confirmed push** -- Post the report location and flip the label from `status:ready` to `status:reviewed` only after publication succeeds. A failed commit or push leaves the issue unchanged. This means AI-scored, not human-approved.

These are the production rollout's code defaults, not confirmation of live operational changes. Verify private configuration, GitHub workflow enablement, and recovery eligibility separately before live rollout. Production scoring reuses the bounded request helper: each request plus body read has a 180-second limit, with up to two transient retries waiting at least 30 and 60 seconds and honoring `retry-after`, `retry-after-ms`, and `x-ms-retry-after-ms`. Retry hints above 120 seconds fail rather than retry early or hold the queue indefinitely. Only selected sanitized service details appear in the run summary and runner-local `eval-scoring` metadata, never raw requests or response bodies.

### Craft once per comparable page version

Craft is a shared baseline, not a compulsory secondary score for every lens.

| Evidence state | AI scoring | Human review |
|---|---|---|
| No comparable baseline | Establish six craft dimensions once, alongside the named lens if needed | Review the baseline once |
| Same URL, capture context, rubric, and exact evidence | Reuse the existing baseline without new craft scores | Follow its link; no repeated craft table |
| Changed evidence with comparable URL, context, and rubric | Compare old and new evidence; reassess only affected dimensions with explicit change reasons | Review only the reassessed dimensions |
| Evidence changed but no material craft impact | Explain why no craft dimensions changed and retain the baseline reference | No repeated craft scoring |
| Different page, rendering context, or rubric | Establish a separate baseline | Review the new baseline |

The evidence fingerprint covers rendered text/HTML and all four screenshot files. Exact matches provide deterministic reuse. Differences are a reason to compare, not proof that all craft dimensions changed: dynamic counts or minor copy changes may have no material craft impact.

Baseline links retain provenance. Unaffected AI scores may be used to calculate a revised baseline total, but they are not presented as newly scored dimensions. Human overrides remain in the linked human review and are never imported as AI scores or silently applied to later reports.

Legacy reports have no comparable machine-readable capture record. They remain readable historical evidence but are not automatically adopted as baselines. The first future comparable run establishes an explicit baseline. Existing W36/W37 reports and scores are not rewritten by this change.

### Named lens and reviewer scope

- **Craft:** Establish or reference the shared craft baseline.
- **Promise clarity:** Score singular message, audience alignment, CTA focus, claim specificity, and redundancy.
- **Trust architecture:** Score sequence, specificity, social proof quality, friction to first action, and risk reduction.
- **Audience fit:** Label role-specific scores as AI hypotheses requiring representative reviewers, not as validated design-lead judgments.
- **Other:** Follow the bet's own evaluation method. If the supplied evidence cannot demonstrate the claim, report it as inconclusive rather than replacing it with a craft pass.

New issues select a Primary lens explicitly. Older issue titles are used to recognize existing craft, promise, trust, and audience bets. Audience-fit evaluations are skipped by default in the design-lead review: record the skip and reason in the report, leave the AI scores unvalidated, and complete the checklist item within that scope. Representative reviewers can validate them separately.

### Friday review

A separate workflow (`friday-eval-review.yml`) runs every Friday. It gathers everything scored that week and creates a review issue with checkboxes, assigned to the reviewer.

### Manual trigger

The workflow can be triggered manually from the Actions tab with an optional `issue_number` input to evaluate a selected open `status:ready` bet out of order. The readiness guard applies before diagnostics and scoring in every mode.

For a hosted diagnostic run, enable `diagnostics_first`. The workflow sends one minimal text request, then one existing screenshot under 1 MB. Only completed, usable responses from both controls allow the normal evaluation to proceed. Failures appear in the Actions run summary and stop before any scoring or queue updates.

The optional `not_before` field delays a single manual run until an explicit UTC timestamp such as `2026-10-16T05:00:00Z` (October 15 at 10 p.m. Pacific). It accepts at most four hours of waiting and rejects stale timestamps. The wait happens on a GitHub-hosted runner, not your laptop, and does not add a recurring schedule. The run uses hosted runner time during the wait, and GitHub may delay its initial start. Manual diagnostics use the tools from the dispatched workflow revision, including when testing an unmerged PR branch. Model and endpoint settings are shared with the full scorer.

Model, connection, output-budget, compact-evidence, and nonstrict-output test controls remain manual dry-run-only. Test secret names are selected before dereferencing, with no fallback if missing. Production remains full-evidence and strict even with `test_structured_output=false`; `test_max_output_tokens=0` omits the parameter only in dry runs. See [manual model dry runs](../weekly-eval-bets/README.md#manual-model-dry-runs) for controls and artifact isolation.

### Recovery boundary

Recovery is limited to verified failed evaluations still pending human review whose source issue remains open with `status:ready`. Never rescore successful or reviewed reports, requeue issues, or edit existing reports, human ratings, or historical attribution for recovery. Independently audit failure history and human-review status before selecting eligible issues for manual dispatch. This document establishes no specific case as eligible.

## Screenshots captured per evaluation

| File | What it shows |
|------|--------------|
| `above-the-fold.png` | First viewport at 1440x900 (2x retina) |
| `full-page.png` | Entire scrollable page |
| `mid-page.png` | Middle section of the page |
| `mobile.png` | 390x844 viewport (iPhone-sized) |

New captures live in `weekly-eval-bets/screenshots/{week}_{slug}_{run-id}_{attempt}/`. They also contain `page-text.txt`, `page-content.html`, and `capture-context.json`. Reports link to their own evidence; earlier screenshots are not overwritten. Historical captures retain their existing `{slug}` paths.

## Friday human review

On Friday morning, a workflow creates a review issue assigned to you. Your job:

1. Open each evaluation file from the week
2. Review the named lens and any newly requested baseline or changed craft dimensions, not every linked baseline again
3. Add a note for each confirmation or difference, preserving notes even when scores match
4. Mark the verdict as "Confirmed" or "Needs revision"; Quirine's submitted ratings count as confirmation unless she requests revision
5. Record explicit skips and reviewer scope rather than inventing scores for unreviewed dimensions
6. Commit the review or merge its PR, check off the evaluation, and archive its source issue when complete

For example, a trust evaluation that references an existing craft baseline requests trust scores, not six more craft scores:

```markdown
## Human review

Reviewed:

| Dimension | Auto-score | Human score | Note |
|-----------|-----------|-------------|------|
| Sequence | 4/5 | | |
| Specificity | 4/5 | | |
| Social proof quality | 3/5 | | |
| Friction to first action | 4/5 | | |
| Risk reduction | 4/5 | | |
| **Trust total** | **19/25** | | |

Craft: refer to the linked baseline. No new craft scoring requested.

### Verdict

[ ] Confirmed / [ ] Needs revision
```

## Notification

Friday review issues are assigned to `@Quirinevwm`. Check your GitHub notifications:
https://github.com/notifications?query=repo%3AQuirinevwm%2Fqs-design-casino+reason%3Aassign

## Rubric reference

Craft baselines and changed-dimension reviews use the first-impression craft rubric: [`skills/first-impression-craft-rubric.md`](../skills/first-impression-craft-rubric.md). Other lenses do not repeat it.

Coherence is weighted 2x. Max score: 35.

## Scoring validation

Run `node --test .github/scripts/eval-*.test.cjs` from the repository root. These dependency-free tests cover baseline selection, structured output validation, score arithmetic, provenance, scoped human review generation, and workflow capture integration. The same command runs in the Eval scoring tests workflow without Foundry credentials or live page requests.

## Adding new bets

Only publish a bet after explicit approval of its target, evaluation scope, and public visibility. The "Weekly eval bet" template automatically adds `weekly-eval-bet` + `status:ready`, so creating that issue also puts it into the scoring queue. The auto-scorer picks ready bets in order of creation date (oldest first); it does not independently verify that approval.

Automated public-repository discovery is paused in GitHub Actions. An empty queue is not permission to publish or score new external candidates.

## Archived lesson: discovery is not approval

**Archived:** 2026-09-28  
**Experiment:** Automatic external discovery, public backlog creation, and downstream scoring  
**Decision:** Archive this automatic handoff. Keep outside-in learning, but separate research from publication and evaluation.

The intent was useful: find real design problems outside our own work and turn them into reusable evaluation questions. The implementation selected issue titles using keywords and activity signals, wrapped them in a generic template, and immediately marked the resulting public issues as ready for scoring. It treated an interesting signal as an approved experiment without establishing relevance, consent to publication, or usable evidence.

Two consequences made the boundary clear. Public source-linked issues generated upstream backlinks exposing this repository, even though the workflow did not post comments there. The scorer also evaluated a repository page instead of the component the original signal described. Neither public visibility nor a numerical score was justified by discovery alone.

The lesson is to keep these decisions separate:

- Gather external insights read-only and keep research notes private by default.
- Ask for explicit approval before creating a public issue, publishing source references, or queuing an evaluation.
- Define the actual target and evidence before scoring; popularity and title relevance are not proof of evaluability.
- Preserve useful learning without making a public backlog the default research memory.

Discovery remains disabled. Its code is retained as historical reference, not as an approved workflow to restart. This archive does not disable scoring for deliberately selected bets or change existing human reviews. No external project names or source links are needed to preserve the lesson.

---

*This process evolves. Update this doc when the cadence, rubric, or review method changes.*
