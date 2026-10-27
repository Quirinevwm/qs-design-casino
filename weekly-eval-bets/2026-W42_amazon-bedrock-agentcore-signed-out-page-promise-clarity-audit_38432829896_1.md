# Amazon Bedrock AgentCore signed-out page: promise clarity audit

## Evaluation summary

**AI promise clarity score:** 19/25

**Human promise clarity score:** 16/25

**Human verdict:** Confirmed.

**Human craft scope:** Not rescored in this promise-only review.

The original AI assessment is preserved below. Human scores and notes are recorded in the [human review](#human-review) section.

The page communicates a strong, developer-oriented promise: AgentCore is a production platform for building, connecting, securing, debugging, and scaling AI agents across frameworks and models. The hero is concise and the following sections unpack the promise into concrete jobs, but the page gradually broadens from one platform promise into several overlapping speed, flexibility, security, and infrastructure messages. Trust is supported by named frameworks, AWS security mechanisms, sourced performance figures, and customer outcomes, although the captured evidence does not verify those claims. Patterns worth borrowing include a short hero promise, a task-specific primary action, concrete technical vocabulary, and benefit sections that map to recognizable production problems. Anti-patterns to avoid include repeating the same flexibility and security phrases, presenting two competing hero actions without clarifying the intended visitor path, and allowing promotional assistant overlays to obscure the supporting explanation.

## Evidence

- Target URL: https://aws.amazon.com/bedrock/agentcore/
- Canonical URL: https://aws.amazon.com/bedrock/agentcore/
- [Page text](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-promise-clarity-audit_38432829896_1/page-text.txt)
- [HTML snapshot](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-promise-clarity-audit_38432829896_1/page-content.html)
- [Above the fold screenshot](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-promise-clarity-audit_38432829896_1/above-the-fold.png)
- [Full page screenshot](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-promise-clarity-audit_38432829896_1/full-page.png)
- [Mid page screenshot](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-promise-clarity-audit_38432829896_1/mid-page.png)
- [Mobile screenshot](screenshots/2026-W42_amazon-bedrock-agentcore-signed-out-page-promise-clarity-audit_38432829896_1/mobile.png)

## Primary lens review

The current plain-text extraction shows unloaded values such as 0% and 0.0x, while the captured mid-page screenshot displays 75%, 5.2x, and 2.1x. The screenshot is stronger evidence of the rendered state, but neither source verifies the underlying performance claims.

| Dimension | Score | Rationale |
|---|---:|---|
| Singular message | 4/5 | The hero consistently positions AgentCore as the platform for production AI agents, with framework choice, model choice, and security at scale as supporting attributes. Later sections introduce several parallel promises, but they remain reasonably connected to the production-platform theme. |
| Audience alignment | 4/5 | References to frameworks, models, MCP servers, APIs, Lambda, authentication, debugging, evaluations, and deployment clearly address developers and engineering teams taking agents into production. The page is less direct for executive or procurement visitors who need a concise business case before the technical detail. |
| CTA focus | 4/5 | The filled “Get started with the AgentCore CLI” button establishes a clear primary action, while “See it in action” offers a sensible lower-commitment alternative. The broader page adds documentation, learn-more, chat, account creation, and download actions, which dilute focus after the hero. |
| Claim specificity | 4/5 | The page names supported frameworks, production tasks, security mechanisms, deployment characteristics, customer outcomes, and sourced performance figures. The evidence demonstrates that these claims are displayed, but it does not independently verify their accuracy, and phrases such as “secure at scale” and “heavy lifting” remain broad. |
| Redundancy | 3/5 | The page repeatedly returns to any framework, any model, built-in security, faster shipping, and reduced infrastructure work across the hero and supporting sections. Repetition reinforces the core promise, but tighter consolidation would make the value proposition feel more decisive. |
| **Total** | **19/25** | **AI subtotal.** |

### Human review

| Dimension | AI score | Human score | Notes |
|---|---:|---:|---|
| Singular message | 4/5 | 3/5 | "Build, connect, and optimize" is strong, but agents need models, tools, and more. Where are they? |
| Audience alignment | 4/5 | 3/5 | They target enterprise, but don't really elaborate on the value to that audience. |
| CTA focus | 4/5 | 4/5 | Score explicitly confirmed; no additional note provided. |
| Claim specificity | 4/5 | 3/5 | I like their SDK breadth callout. It becomes a little less clear around connections and optimization. |
| Redundancy | 3/5 | 3/5 | Score explicitly confirmed; no additional note provided. |
| **Total** | **19/25** | **16/25** | Singular message -1, audience alignment -1, claim specificity -1. CTA focus and redundancy retained. |

## Craft review

No craft dimension was materially changed relative to the prior baseline. The current and baseline captures show the same hero hierarchy, navigation, alternating media modules, oversized spacing, persistent assistant overlays, mobile obstruction, and overall visual system. Dynamic metric rendering differs between extracted text and screenshots, but that incidental state does not justify rescoring craft.

Evidence changed, but no materially relevant craft dimensions changed. The originating baseline remains [weekly-eval-bets/2026-W42_amazon-bedrock-agentcore-signed-out-page-first-impression-craft_38300906347_1.md](2026-W42_amazon-bedrock-agentcore-signed-out-page-first-impression-craft_38300906347_1.md).

The current page text and baseline page text are effectively the same, and corresponding desktop, mid-page, full-page, and mobile screenshots show no material structural or visual change. All six prior craft scores remain inherited.

## Human verdict

Reviewed: 2026-10-27

[x] Confirmed / [ ] Needs revision

Confirmed on submission of the human promise rating. CTA focus and redundancy were explicitly retained at their AI scores; no additional observations were supplied for those dimensions. Confirmation applies to promise clarity only. Craft was not rescored, and no human craft scores are copied from another report.

### Review synthesis (AI-assisted)

**SDK breadth, a less connected story.** The SDK breadth callout gives the platform a useful concrete anchor. "Build, connect, and optimize" is a strong promise, but the models, tools, and other agent building blocks are harder to locate, and the connections and optimization story becomes less clear. Enterprise targeting is apparent without an equally developed explanation of enterprise value. The next improvement is to show how the building blocks connect and what that enables for the intended audience.

*Scoring model: gpt-5.6-sol*
*Status: human promise review confirmed; craft not rescored in this review*
