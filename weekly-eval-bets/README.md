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

New auto-scored evaluations use **gpt-6.1-sol** via Microsoft Foundry. Diagnostics and scoring share the private endpoint and credential configured through GitHub Actions secrets. The model may change as newer options become available or as evaluation needs evolve. Each completed evaluation file notes which model scored it; historical scores and attribution are preserved.

| Period | Model | Notes |
|------|-------|-------|
| W33 | openai/gpt-4o | Via GitHub Models (now retired) |
| W34 onward, before the model switch | gpt-5.6-sol | Via Azure AI Foundry |
| Interim deployment attempt | gpt-5.6-sol-q | Returned service errors; no evaluation published |
| Interim deployment attempt | gpt-6-astra-q | Returned capacity errors; no evaluation published |
| Current configuration | gpt-6.1-sol | Endpoint and credentials configured privately |

### Manual model dry runs

Use the registered `weekly-eval-bet.yml` workflow with a feature-branch ref and inputs `issue_number=54`, `dry_run=true`, `test_model=gpt-5-mini`, and optionally `diagnostics_first=true`. `test_model` is the actual Azure deployment name and is rejected unless `dry_run=true`. An empty override tests the production model. Scheduled scoring stays on **gpt-6.1-sol**.

For the regional/subscription experiment, use `issue_number=54`, `dry_run=true`, `test_connection=true`, `test_model=gpt-5.6-sol`, and optionally `diagnostics_first=true`. The connection selector defaults to false and requires a manual dry run. Both minimal diagnostics and full scoring then use the separate `FOUNDRY_TEST_RESPONSES_ENDPOINT` and `FOUNDRY_TEST_API_KEY` secrets. Missing selected test secrets fail before any Foundry call, never falling back to production. Model selection remains independent through `test_model`; the scoring schema, prompt, image evidence pipeline, and output budget stay unchanged. Default and scheduled runs retain the production connection.

Dry runs make real, billable calls. They recapture the target page using the full evidence and scoring pipeline, not byte-identical evidence from a failed historical run. Minimal diagnostics and full scoring use the selected deployment. No report or sidecar is written to production paths, nothing is committed, and no issue comments or labels change.

To test a bounded output allowance without trimming any input evidence, add `test_max_output_tokens=8192`. This includes reasoning tokens, not just the final report. The dry-run-only input accepts integers from 512 to 32768; its default of `0` omits the API parameter and preserves the deployment default. An incomplete response, including one that exhausts this allowance, fails without publishing partial scores. A smaller allowance may help admission estimates, but does not guarantee backend capacity.

If the service explicitly rejects the request size during peak load, `test_compact_evidence=true` opts a dry run into a smaller evidence profile. All screenshots, rubric, and original scoring instructions remain. Raw HTML is replaced with an omission marker, and rendered page text is limited to 12000 characters per current or baseline capture. The full capture remains stored and fingerprinted on the runner. The model is instructed not to infer omitted content and to disclose evidence limits. Candidate reports and metadata identify compact evidence; these are not full-evidence baselines. This input defaults to false and is rejected outside dry runs.

The run summary and 14-day `eval-dry-run` artifact retain sanitized per-attempt HTTP status, timing, retry/rate-limit headers, request ID, payload size, output allowance, and completion/token usage when available. Failed responses retain selected service error codes and messages, with credentials and endpoint identifiers redacted, rather than raw response bodies. Incomplete responses retain their reason. A validated response adds `candidate.md` and `candidate.json` in runner storage. These are review candidates, not published baselines; their evidence links refer to repository capture paths, and screenshots/raw requests are not uploaded. Failed attempts still upload diagnostics. Capacity errors, incomplete responses, refusals, and invalid scores fail the run. Full dry-run requests and body reads time out after 180 seconds per attempt; retries keep the 30/60-second minimum waits and respect `retry-after`, `retry-after-ms`, and `x-ms-retry-after-ms`, failing instead of retrying early when the requested wait exceeds 120 seconds.

**Bets create lenses. Lenses build stacks. Stacks raise the craft bar.**
