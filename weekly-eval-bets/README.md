# Q's weekly eval bets

One focused design experiment each week. Every bet connects a reusable skill, an evaluation lens, and a practical framework so the learning can be reviewed, tested, and reused.

> **Check the observable. Judge the felt.**

## Evaluation classes

Each evaluation lens belongs to one of two classes.

### Checked

Deterministic checks measure observable qualities such as design tokens, accessibility, terminology, schemas, or responsive behavior.

- **Source-provable:** The evidence lives in code and can be checked at commit time.
- **Runtime-only:** The evidence appears only when the experience is rendered or used.

### Judged

Experience-based evaluation uses labeled exemplars to assess qualities such as clarity, trust, craft, journey success, or overall UX.

- **Holistic:** Evaluates the complete page, flow, or experience.
- **Path-aware:** Evaluates each step from a persona's perspective and identifies where the journey breaks.

## Anatomy of a bet

Every weekly eval bet is a self-describing package:

```text
weekly-eval-bets/
└── YYYY-MM-bet-name/
    ├── bet.yaml
    ├── README.md
    ├── skill/
    ├── eval/
    │   ├── rubric.md
    │   ├── exemplars/
    │   └── sample-report.json
    └── framework/
```

The manifest defines the question, evaluator class, evidence type, artifact, success threshold, and craft flags. The package then contains either deterministic checks or judged exemplars, plus a sample report that makes the result tangible.

## From bets to stacks

Successful evaluation lenses stay reusable. Multiple lenses can later be composed into a review stack with shared thresholds, weights, and gate policies.

A stack coordinates existing lenses rather than duplicating their scoring rules:

```text
Stack package -> Specialized runners -> Actionable stack report
```

The report should show whether the work is ready for review, needs craft attention, or is blocked, with links to the evidence and remediation for every lens.

## Archived discovery experiment

Automatic external discovery into a public, ready-to-score backlog is archived. The **Discover weekly eval bets** workflow is disabled in GitHub Actions.

The useful principle remains outside-in learning. External research should be read-only, with private notes by default. Publishing a source-linked issue or putting a candidate into the scoring queue requires explicit approval and a defined evaluation target.

The lesson: **discovery is not approval**. Public references can generate upstream backlinks, and an interesting issue is not necessarily a usable evaluation surface.

See the [archived lesson and operating boundary](../design-process/weekly-eval-bet-process.md#archived-lesson-discovery-is-not-approval). Scoring and human review for deliberately selected bets continue unchanged.

## Scoring model

Each evaluation scores its named lens. Craft is a shared baseline for comparable page evidence, not a mandatory secondary review: later lenses reference the baseline, and material changes trigger only affected-dimension reassessment. AI scores, human overrides, and role-specific audience validation remain distinct. See the [scoring process](../design-process/weekly-eval-bet-process.md#craft-once-per-comparable-page-version).

Auto-scored evaluations currently use **gpt-5.6-sol** via Microsoft Foundry. The model may change as newer options become available or as evaluation needs evolve. Each completed evaluation file notes which model scored it.

| Week | Model | Notes |
|------|-------|-------|
| W33 | openai/gpt-4o | Via GitHub Models (now retired) |
| W34+ | gpt-5.6-sol | Via Azure AI Foundry |

**Bets create lenses. Lenses build stacks. Stacks raise the craft bar.**
