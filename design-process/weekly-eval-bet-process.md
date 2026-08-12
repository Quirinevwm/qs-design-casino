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

## How auto-scoring works

Each weekday (Mon-Thu) at 09:00 UTC, the workflow:

1. Picks the oldest issue labeled `weekly-eval-bet` + `status:ready`
2. Fetches the target page (HTML and text content)
3. Captures screenshots with Playwright (full page, above the fold, mid-page, mobile)
4. Sends the page content, screenshots context, rubric, and bet details to the GitHub Models API
5. Receives a scored evaluation report
6. Appends a human review checklist to the report
7. Commits the evaluation and screenshots to `weekly-eval-bets/`
8. Labels the issue `status:reviewed`

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
2. Check the boxes for dimensions you agree with
3. Add a note next to any dimension you'd score differently
4. Write override scores if needed
5. Mark "Verdict confirmed" or "Needs revision"
6. Commit your edits directly on GitHub

The review section at the bottom of each file looks like:

```markdown
## Human review (Friday)

- [ ] Visual hierarchy — 
- [ ] Information density — 
- [ ] Readability — 
- [ ] Coherence (2x) — 
- [ ] Durability — 
- [ ] Intentionality — 

**Overrides:** (adjust scores here)

**Verdict confirmed?** [ ] Yes / [ ] Needs revision
```

## Notification

Friday review issues are assigned to `@Quirinevwm`. Check your GitHub notifications:
https://github.com/notifications?query=repo%3AQuirinevwm%2Fqs-design-casino+reason%3Aassign

## Rubric reference

All evaluations use the first-impression craft rubric: [`skills/first-impression-craft-rubric.md`](../skills/first-impression-craft-rubric.md)

Coherence is weighted 2x. Max score: 35.

## Adding new bets

Open an issue using the "Weekly eval bet" template. It auto-labels `weekly-eval-bet` + `status:ready` and enters the queue. The auto-scorer picks bets in order of creation date (oldest first).

## Manual trigger

You can run the auto-scorer on any specific issue from the Actions tab:
**Actions > Daily eval bet auto-score > Run workflow > enter issue number**

---

*This process evolves. Update this doc when the cadence, rubric, or review method changes.*
