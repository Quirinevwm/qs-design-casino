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

The daily workflow (`weekly-eval-bet.yml`) runs Monday through Thursday and processes one bet per day.

### Step by step

1. **Find the bet** -- Picks the oldest `status:ready` issue (or a specific one if triggered manually). Extracts the title and body, then generates a filename containing the week, slug, workflow run ID, and attempt. Reruns do not overwrite earlier evidence or reports.

2. **Resolve the target page** -- Uses the issue's Target page field, falling back to the first HTTPS link for older issues. The URL must identify the page being evaluated, not merely a source issue or reference article.

3. **Capture screenshots with Playwright** -- Installs a headless Chromium browser and takes four shots:
   - Above the fold (1440x900, 2x retina)
   - Full page scroll
   - Mid-page
   - Mobile (390x844)

   Rendered text, HTML, and capture settings are stored with the screenshots in an immutable run-specific folder. Failed page responses stop the run rather than becoming valid evaluation evidence.

4. **Choose the craft scope** -- Match the target URL, rendering settings, rubric version, and captured evidence against prior machine-readable evaluation records. Choose a new baseline, an existing baseline reference, or a changed-evidence comparison as described below.

5. **Auto-score with gpt-5.6-sol through Azure AI Foundry** -- Send the named lens, bet details, rubric, captured text/HTML, and screenshots. For changed evidence, also send the baseline evidence. The model returns structured scores and a narrative. Validate dimensions and score ranges, calculate totals, and render the report in code. Invalid output fails the run; it does not publish missing scores as `?`.

6. **Build a scoped human review** -- Include the named lens dimensions. Include all six craft dimensions only when establishing a baseline; show only reassessed dimensions for a change review; otherwise link the baseline without requesting another craft score. Keep role-specific audience validation separate from design-lead review.

7. **Commit and push** -- Save the markdown report, a same-name JSON sidecar with AI scores and evidence provenance, and the immutable capture folder to `weekly-eval-bets/` on main. Scoring runs are serialized so later runs can see earlier baselines.

8. **Comment on the issue** -- Post the report location and flip the label from `status:ready` to `status:reviewed`. This means AI-scored, not human-approved.

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

New issues select a Primary lens explicitly. Older issue titles are used to recognize existing craft, promise, trust, and audience bets. An explicit skip with its rationale can complete the agreed design-lead scope without validating role-specific audience scores.

### Friday review

A separate workflow (`friday-eval-review.yml`) runs every Friday. It gathers everything scored that week and creates a review issue with checkboxes, assigned to the reviewer.

### Manual trigger

The workflow can be triggered manually from the Actions tab with an optional `issue_number` input to evaluate a specific bet out of order.

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

Open an issue using the "Weekly eval bet" template. It auto-labels `weekly-eval-bet` + `status:ready` and enters the queue. The auto-scorer picks bets in order of creation date (oldest first).

Automated public-repository discovery only replenishes the queue after no open `status:ready` bets remain. While any issue has both `weekly-eval-bet` and `status:ready`, discovery exits without searching for or creating new candidates.

---

*This process evolves. Update this doc when the cadence, rubric, or review method changes.*
