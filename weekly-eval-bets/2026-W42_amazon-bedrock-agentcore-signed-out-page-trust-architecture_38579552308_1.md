# Amazon Bedrock AgentCore signed-out page: trust architecture

## Evaluation summary

**AI trust score:** 20/25

**Human trust score:** 16/25

**Human verdict:** Confirmed.

**Human craft scope:** Not rescored in this trust-only review.

The original AI assessment is preserved below. Human scores and notes are recorded in the [human review](#human-review) section.

The page builds trust through a strong progression from a concise production promise to concrete platform capabilities, security details, quantified outcomes, named customer stories, and documentation-oriented next steps. It demonstrates credible specificity through framework names, authentication and access-control scenarios, automated reasoning references, benchmark figures, and customer outcomes. These statements are presented by the page and are not independently verified by the capture.

**Patterns worth borrowing**
- Lead with a concise promise and pair it with both a direct technical action and a product demonstration.
- Translate platform capabilities into recognizable production problems such as permissions, debugging, and scaling.
- Combine quantified evidence with a visible source label and named customer outcomes.
- Place security explanations near operational capabilities rather than isolating them in generic trust language.

**Anti-patterns to avoid**
- Persistent sales and generative AI assistant prompts obscure content, especially on mobile.
- Repeated media controls and download actions add friction to an otherwise clear narrative.
- Broad phrases such as “numerous AWS compliance programs” reduce the specificity of risk-reduction claims.
- Large empty intervals weaken continuity between trust evidence and the next action.

## Evidence

- Target URL: https://aws.amazon.com/bedrock/agentcore/
- Canonical URL: https://aws.amazon.com/bedrock/agentcore/
- [Page text](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-trust-architecture_38579552308_1/page-text.txt)
- [HTML snapshot](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-trust-architecture_38579552308_1/page-content.html)
- [Above the fold screenshot](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-trust-architecture_38579552308_1/above-the-fold.png)
- [Full page screenshot](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-trust-architecture_38579552308_1/full-page.png)
- [Mid page screenshot](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-trust-architecture_38579552308_1/mid-page.png)
- [Mobile screenshot](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-trust-architecture_38579552308_1/mobile.png)

## Primary lens review

This assessment describes the trust architecture demonstrated by the captured page. Security, performance, compliance, benchmark, and customer outcome claims are treated as page assertions rather than independently verified facts.

| Dimension | Score | Rationale |
|---|---:|---|
| Sequence | 4/5 | The page moves logically from promise and first actions through production problems, operational capabilities, security, quantified results, customer stories, and next steps. Trust evidence arrives progressively, although large spacing gaps and floating utilities interrupt the flow. |
| Specificity | 4/5 | The content names LangChain, OpenAI Agents SDK, Claude Agent SDK, Strands SDK, MCP servers, Lambda, IAM, S3, automated reasoning, multiple regions, and concrete performance figures. Some claims remain broad, particularly the references to compliance programs and infrastructure trusted by millions. |
| Social proof quality | 4/5 | The page presents named organizations and quantified outcomes, including 17 production agents, 68 percent support resolution, and 70 percent automation, plus a Signal65 comparison source. The capture does not establish study methodology, customer quotation context, or independent verification. |
| Friction to first action | 4/5 | A prominent AgentCore CLI action and a secondary demonstration action are immediately available without a visible form. Documentation also offers a lower-risk path, but it appears later, while assistant overlays obstruct reading and interaction on mobile. |
| Risk reduction | 4/5 | The page addresses production risk with platform-layer controls, authentication, access policies, automated reasoning, compliance alignment, regional deployment, observability, and customer evidence. It does not show detailed compliance certifications, contractual assurances, pricing risk, or implementation prerequisites in the captured content. |
| **Total** | **20/25** | **AI subtotal.** |

### Human review

| Dimension | AI score | Human score | Notes |
|---|---:|---:|---|
| Sequence | 4/5 | 3/5 | The "why" at the bottom would make more sense earlier on the page. |
| Specificity | 4/5 | 3/5 | It's quite generic. |
| Social proof quality | 4/5 | 2/5 | Just three customer cases. |
| Friction to first action | 4/5 | 4/5 | Agree. It seems simple enough with a click. |
| Risk reduction | 4/5 | 4/5 | Score explicitly confirmed; no additional note provided. |
| **Total** | **20/25** | **16/25** | Sequence -1, specificity -1, social proof quality -2. Friction to first action and risk reduction retained. |

## Craft review

No craft dimension changed materially from the prior comparable evidence. The current and prior captures show the same hierarchy, spacing, repeated media modules, assistant overlays, responsive behavior, and page content. The rendered benchmark values are also unchanged in the screenshots, so incidental extracted counter states do not justify rescoring.

Evidence changed, but no materially relevant craft dimensions changed. The originating baseline remains [weekly-eval-bets/2026-W42_amazon-bedrock-agentcore-signed-out-page-first-impression-craft_38300906347_1.md](2026-W42_amazon-bedrock-agentcore-signed-out-page-first-impression-craft_38300906347_1.md).

The current evidence is visually and structurally equivalent to the prior evidence across all six craft dimensions. No affected craft dimension requires reassessment.

## Human verdict

Reviewed: 2026-10-27

[x] Confirmed / [ ] Needs revision

Confirmed on submission of the human trust rating. Risk reduction was explicitly retained at 4/5 without an additional observation. Confirmation applies to trust architecture only. Craft was not rescored, and no human craft scores are copied from another report.

### Review synthesis (AI-assisted)

**Easy to start, limited proof.** The first action seems simple, but the explanation of why the platform matters arrives too late. The human review finds the claims generic and gives the three customer cases less credit than the AI assessment. The opportunity is to bring the "why" forward and strengthen the specificity and breadth of customer evidence while preserving the easy first step.

*Scoring model: gpt-5.6-sol*
*Status: human trust review confirmed; craft not rescored in this review*
