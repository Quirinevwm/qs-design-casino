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

The permanent production rollout defaults are **gpt-5-mini** via Microsoft Foundry, **full evidence** (not compact), a strict lens- and craft-mode-specific Responses schema (`text.format` with `json_schema` and `strict: true`), trusted developer scoring policy, and `max_output_tokens=8192`, including reasoning tokens. Each completed evaluation records its scoring model; existing reports, human ratings, and historical attribution remain unchanged.

New reports display all four captured screenshots inline with captions. Page text and HTML remain linked source files. This changes only the report presentation: the model already receives the screenshots, so embedding them does not require another evaluation or add image tokens.

Production input validation, diagnostics, and scoring exclusively select `FOUNDRY_SWEDEN_RESPONSES_ENDPOINT` and `FOUNDRY_SWEDEN_API_KEY`. Configure these secret names privately, without publishing service URLs, resource/project identifiers, or secret values. Legacy `FOUNDRY_RESPONSES_ENDPOINT` and `FOUNDRY_SCORING_API_KEY` are no longer used in production; do not delete those secrets. These documented code defaults do not confirm live operational changes. Verify private configuration, GitHub workflow enablement, and recovery eligibility separately before live rollout.

Production scoring reuses the bounded request helper: each request plus response-body read has a 180-second limit. Up to two transient retries wait at least 30 and 60 seconds and honor `retry-after`, `retry-after-ms`, and `x-ms-retry-after-ms`. A requested retry wait above 120 seconds fails instead of retrying early or holding the scoring queue indefinitely. No raw requests or response bodies are output. Selected sanitized service details appear in the Actions run summary and runner-local `eval-scoring` metadata, with credentials and endpoint identifiers redacted.

| Period | Model | Notes |
|------|-------|-------|
| W33 | openai/gpt-4o | Via GitHub Models (now retired) |
| W34 onward, before the model switch | gpt-5.6-sol | Via Azure AI Foundry |
| Interim deployment attempt | gpt-5.6-sol-q | Returned service errors; no evaluation published |
| Interim deployment attempt | gpt-6-astra-q | Returned capacity errors; no evaluation published |
| Prior configuration | gpt-6.1-sol | Historical attribution preserved |
| Current configuration | gpt-5-mini | Full evidence, strict schema, 8192-token output budget |

The Mon-Thu 04:15 `America/Los_Angeles` schedule, serialized concurrency, and Friday human review remain unchanged. Every mode checks that the selected issue is open with `status:ready` before diagnostics or scoring. Publication requires a validated evaluation committed and pushed successfully; issue comments and labels change only after confirmed push. See the [recovery boundary](../design-process/weekly-eval-bet-process.md#recovery-boundary) before retrying a failed evaluation.

### Manual model dry runs

For a selected open `status:ready` issue, use the registered `weekly-eval-bet.yml` workflow with a feature-branch ref, that issue's `issue_number`, `dry_run=true`, an optional `test_model`, and optionally `diagnostics_first=true`. `test_model` is the privately configured Azure deployment name and is rejected unless this is a manual dry run. An empty override tests the production model, **gpt-5-mini**.

To test a separate connection, add `test_connection=true`. This selector defaults to false and requires a manual dry run. Input validation, minimal diagnostics, and full scoring select the secret names `FOUNDRY_TEST_RESPONSES_ENDPOINT` and `FOUNDRY_TEST_API_KEY` before dereferencing them. Missing selected test secrets fail before any Foundry call, with no fallback to production. Configure them privately. Model selection remains independent through `test_model`; default and scheduled runs retain the production connection.

Dry runs make real, billable calls. They recapture the target page using the full evidence and scoring pipeline, not byte-identical evidence from a failed historical run. Minimal diagnostics and full scoring use the selected deployment. No report or sidecar is written to production paths, nothing is committed, and no issue comments or labels change.

To test a bounded output allowance without trimming any input evidence, add `test_max_output_tokens=8192`. This includes reasoning tokens, not just the final report. The manual dry-run-only input accepts integers from 512 to 32768; its default of `0` omits the API parameter as a deployment-default control. It does not remove production's fixed 8192-token budget. An incomplete response, including one that exhausts this allowance, fails without publishing partial scores. A smaller allowance may help admission estimates, but does not guarantee backend capacity.

Production always uses the strict schema and developer scoring policy, even when `test_structured_output=false`. In manual dry runs, `test_structured_output=true` tests that contract; the default `false` retains the older nonstrict dry-run control. The policy treats issue and page content as untrusted evidence, keeps primary and craft scores separate, and requires empty `primary.items` for craft-only evaluations. Full evidence remains unchanged unless compact is selected separately. Report validation still rejects invalid scores, duplicate dimensions, and unsupported narrative content; refusals and incomplete responses fail. Strict dry runs record `json_schema` in request diagnostics and candidate metadata.

If the service explicitly rejects the request size during peak load, `test_compact_evidence=true` opts a dry run into a smaller evidence profile. All screenshots, rubric, and original scoring instructions remain. Raw HTML is replaced with an omission marker, and rendered page text is limited to 12000 characters per current or baseline capture. The full capture remains stored and fingerprinted on the runner. The model is instructed not to infer omitted content and to disclose evidence limits. Candidate reports and metadata identify compact evidence; these are not full-evidence baselines. This input defaults to false and is rejected outside dry runs.

The run summary and 14-day `eval-dry-run` artifact retain sanitized per-attempt HTTP status, timing, retry/rate-limit headers, request ID, payload size, output allowance, and completion/token usage when available. Failed responses retain selected service error codes and messages, with credentials and endpoint identifiers redacted, rather than raw response bodies. Incomplete responses retain their reason. A validated response adds `candidate.md` and `candidate.json` in runner storage. These are review candidates, not published baselines; their evidence links refer to repository capture paths, and screenshots/raw requests are not uploaded. Failed attempts still upload diagnostics. Capacity errors, incomplete responses, refusals, and invalid scores fail the run. Full dry-run and production requests share the 180-second request/body bound, minimum retry waits, and 120-second retry-wait ceiling: a longer requested wait fails rather than sending an early retry.

**Bets create lenses. Lenses build stacks. Stacks raise the craft bar.**
