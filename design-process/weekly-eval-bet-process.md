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

1. **Find the bet** -- Picks the oldest `status:ready` issue (or a specific one if triggered manually). Extracts the title, body, and generates a week-stamped filename.

2. **Fetch the target page** -- Pulls the first URL from the issue body. Grabs both raw HTML (first 50KB) and a text-only version (first 10KB) for the model to analyze.

3. **Capture screenshots with Playwright** -- Installs a headless Chromium browser and takes four shots:
   - Above the fold (1440x900, 2x retina)
   - Full page scroll
   - Mid-page
   - Mobile (390x844)

   These get committed alongside the evaluation so Friday review has visual evidence.

4. **Auto-score with gpt-5.6-sol through Azure AI Foundry** -- Sends the model a prompt containing:
   - The craft rubric (`skills/first-impression-craft-rubric.md`)
   - The bet's specific evaluation approach (from the issue body)
   - The extracted page text and HTML structure
   - Instructions to score, format markdown, and reference screenshots

   The model returns a publication-ready evaluation report.

5. **Append human review table** -- Adds an auto-score vs human-score table at the bottom for Friday review, with space to explain each confirmed or overridden dimension score.

6. **Commit and push** -- Writes the evaluation markdown and screenshots to `weekly-eval-bets/` on main.

7. **Comment on the issue** -- Posts a link to the committed file and flips the label from `status:ready` to `status:reviewed`.

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

Screenshots live in `weekly-eval-bets/screenshots/{slug}/` and are referenced in the evaluation markdown.

## Friday human review

On Friday morning, a workflow creates a review issue assigned to you. Your job:

1. Open each evaluation file from the week
2. Compare each auto-score with your human score
3. Add a note explaining confirmations or differences
4. Mark the verdict as "Confirmed" or "Needs revision"
5. Commit your edits directly on GitHub

The review section at the bottom of each file looks like:

```markdown
## Human review

Reviewed:

| Dimension | Auto-score | Human score | Note |
|-----------|-----------|-------------|------|
| Visual hierarchy | /5 | | |
| Information density | /5 | | |
| Readability | /5 | | |
| Coherence (2x) | /5 | | |
| Durability | /5 | | |
| Intentionality | /5 | | |
| **Total** | **/35** | | |

### Verdict

[ ] Confirmed / [ ] Needs revision
```

## Notification

Friday review issues are assigned to `@Quirinevwm`. Check your GitHub notifications:
https://github.com/notifications?query=repo%3AQuirinevwm%2Fqs-design-casino+reason%3Aassign

## Rubric reference

All evaluations use the first-impression craft rubric: [`skills/first-impression-craft-rubric.md`](../skills/first-impression-craft-rubric.md)

Coherence is weighted 2x. Max score: 35.

## Adding new bets

Open an issue using the "Weekly eval bet" template. It auto-labels `weekly-eval-bet` + `status:ready` and enters the queue. The auto-scorer picks bets in order of creation date (oldest first).

Automated public-repository discovery only replenishes the queue after no open `status:ready` bets remain. While any issue has both `weekly-eval-bet` and `status:ready`, discovery exits without searching for or creating new candidates.

---

*This process evolves. Update this doc when the cadence, rubric, or review method changes.*
