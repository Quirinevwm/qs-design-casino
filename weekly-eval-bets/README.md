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

## Automated discovery

A GitHub Actions workflow runs every Monday and searches active public repositories across design systems, accessibility, user experience, human-computer interaction, and AI design.

The workflow turns recent public signals into attributed backlog issues labeled `weekly-eval-bet` and `status:ready`. Each candidate includes a proposed lens, design question, evaluator class, evidence type, and link to the original source.

The backlog is also the memory:

- Existing weekly eval bet issues prevent the same source or theme from being proposed again.
- Completed folders in `weekly-eval-bets/` preserve reviewed themes and source links.
- Every generated candidate keeps its attribution, even after it is selected or completed.
- The workflow synthesizes an original experiment rather than copying the source material.

The workflow can also be started manually from the Actions tab through **Discover weekly eval bets**.

**Bets create lenses. Lenses build stacks. Stacks raise the craft bar.**
