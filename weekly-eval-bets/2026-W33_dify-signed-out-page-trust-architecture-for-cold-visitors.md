# Dify signed-out page: trust architecture for cold visitors

## Evaluation summary

Dify presents credible, concrete proof through its GitHub traction, security certifications, and deployment flexibility. The main weakness is sequencing: prominent trust signals appear before the page has fully established what Dify is, who it serves, and what a visitor can make with it. The result is a page that looks credible quickly but asks cold visitors to interpret the significance of that credibility.

**Trust architecture score:** 18/25  
**First-impression craft score:** 28/35  
**Overall assessment:** Solid craft and strong proof assets, with a trust sequence that should move from comprehension to evidence to action more deliberately.

![Dify above the fold](screenshots/dify-signed-out-page-trust-architecture-for-cold-visitors/above-the-fold.png)

## Primary evaluation: trust architecture

Each dimension is scored from 1 to 5, where 5 indicates that the page strongly earns trust for a visitor with no prior knowledge of Dify.

| Dimension | Score | Evaluation |
|---|---:|---|
| Sequence | 2/5 | Trust badges and the “Trusted by Builders & Enterprises Worldwide” message arrive before the product is sufficiently explained, so credibility precedes comprehension rather than reinforcing it. |
| Specificity | 5/5 | The 152K+ GitHub stars, SOC 2 Type II certification, ISO 27001 certification, and named deployment options are concrete signals rather than generic claims. |
| Social proof quality | 3/5 | GitHub traction is externally verifiable and certifications are meaningful, but the broad “trusted worldwide” framing is weaker without prominent attributed customers, outcomes, or testimonials. |
| Friction to first action | 4/5 | A visible “Get Started” path provides a direct route into Dify Cloud, although cold visitors still need clearer expectations about signup requirements and what they can try before committing. |
| Risk reduction | 4/5 | Cloud, VPC, and self-hosted deployment options address control and lock-in concerns, while certifications address security, but pricing, data ownership, and operational tradeoffs are not resolved near the first decision point. |
| **Total** | **18/25** | **Dify has strong trust material, but its placement and explanatory context limit how effectively that material works for a cold visitor.** |

## Trust sequence analysis

### 1. The page establishes scale before meaning

The GitHub star count and enterprise trust framing signal that Dify is established. That is valuable for a developer audience, particularly when the metric links to a public repository and can be independently checked.

However, a cold visitor first needs a simple mental model:

1. What is Dify?
2. What can I build with it?
3. Why is it credible?
4. What is the safest way to try it?

Dify compresses the first two questions into category language such as “production-ready agentic workflows.” That language may be legible to experienced AI platform buyers, but it does not fully explain the product to someone encountering the category for the first time. The early trust strip therefore risks functioning as decoration rather than evidence.

A stronger sequence would show a concise product explanation or concrete workflow example first, then use GitHub adoption and enterprise credentials to validate the explanation.

### 2. The proof is specific but unevenly interpretable

The strongest signals are measurable and verifiable:

- **152K+ GitHub stars** indicates substantial open-source awareness and community interest.
- **SOC 2 Type II** indicates that relevant controls have been assessed over time.
- **ISO 27001** signals a formal information security management system.
- **Cloud, VPC, and self-hosted deployment** provides evidence of operational flexibility.

These signals serve different audiences. GitHub stars speak primarily to developers and open-source adopters. SOC 2 and ISO 27001 speak to security, procurement, and enterprise buyers. Deployment flexibility addresses architects concerned with control and lock-in.

The page would benefit from labeling these proof types by the objection they resolve. Without that framing, visitors must infer why each signal matters.

### 3. Social proof emphasizes popularity over outcomes

The GitHub metric is compelling, but popularity is not the same as production success. A stronger proof system would pair adoption with attributed outcomes, such as:

- A named company and deployed use case
- Time saved in building or maintaining an agentic workflow
- Scale handled in production
- A security or deployment constraint Dify helped satisfy
- A link to a customer story, repository, or certification record

Recognizable logos can improve rapid credibility, but logos alone remain weak evidence. Dify should prioritize attributed customer stories with a specific result over a larger decorative logo wall.

### 4. The first action is visible but not fully de-risked

“Get Started” provides a clear entry point, and the available cloud path appears to minimize navigation overhead. This is a strong baseline.

For a cold visitor, the CTA would be more trustworthy if the page stated the immediate consequence of clicking it. Useful supporting language could include:

- Free sandbox available
- No credit card required
- Start in Dify Cloud
- Self-host with Docker
- View the live product before signup

The existing architecture makes the action easy to find, but it does not fully explain the commitment involved.

### 5. Deployment flexibility is the strongest risk-reduction argument

Dify’s support for Cloud, VPC, and self-hosted deployment is a meaningful answer to enterprise concerns about data location, infrastructure control, and platform dependency. This is more persuasive than a generic claim of being “enterprise-ready.”

That argument should be surfaced as a trust proposition rather than only a feature proposition. For example: “Start in Cloud, deploy in your VPC, or self-host when your requirements change.” This connects flexibility directly to reduced adoption risk.

![Dify full page](screenshots/dify-signed-out-page-trust-architecture-for-cold-visitors/full-page.png)

## Recommended trust architecture

A more effective cold-visitor sequence would be:

1. **Define the product:** Explain Dify in plain language and name the primary user.
2. **Show the product:** Present one representative workflow, canvas, or production use case.
3. **Prove adoption:** Introduce GitHub traction, named customers, and attributed outcomes.
4. **Reduce technical risk:** Explain Cloud, VPC, and self-hosted options.
5. **Reduce organizational risk:** Present SOC 2 Type II, ISO 27001, data handling, and support information.
6. **Clarify the first action:** State whether the sandbox is free, whether a credit card is required, and what happens after clicking.
7. **Repeat the CTA:** Offer distinct paths for trying Dify, viewing the repository, and discussing enterprise deployment.

## Secondary evaluation: first-impression craft

### Weighted score

| Dimension | Weight | Score | Weighted score | Rationale |
|---|---:|---:|---:|---|
| Visual hierarchy | 1x | 4/5 | 4 | The hero, primary product category, and start action are easy to locate, although the adjacent trust layer competes with the product explanation for early attention. |
| Information density | 1x | 4/5 | 4 | The page organizes substantial product and credibility content into distinct sections, but some broad claims add less value than the concrete proof around them. |
| Readability | 1x | 4/5 | 4 | Typography and section separation support scanning, while specialized phrases such as “production-ready agentic workflows” increase the comprehension burden for uninitiated visitors. |
| Coherence | 2x | 4/5 | 8 | The page uses a consistent visual system across product, deployment, and trust sections, though the narrative order is less unified than the visual treatment. |
| Durability | 1x | 4/5 | 4 | The modular section and card structure should tolerate moderate changes in copy or proof points, although metric-led trust elements require regular maintenance. |
| Intentionality | 1x | 4/5 | 4 | Most choices support a developer-to-enterprise positioning, but the decision to place generalized trust language before sufficient product explanation weakens the rationale of the opening sequence. |
| **Total** |  |  | **28/35** | **Solid craft with specific areas to sharpen.** |

## Craft verdict

At **28/35**, Dify sits at the top of the rubric’s “solid craft” range. The page feels designed rather than assembled, and its proof assets are stronger than those of many AI platform landing pages. It falls short of exceptional craft because the narrative hierarchy does not match the visual polish. The visitor sees that Dify is credible before fully understanding why Dify is relevant.

## Priority improvements

### 1. Put comprehension before validation

Move the first major trust cluster until after a concise product explanation and a concrete product view. Keep one compact proof signal near the hero if needed, such as “Open source, 152K+ GitHub stars,” but defer the broader trust section.

### 2. Replace broad trust language with attributed evidence

Change “Trusted by Builders & Enterprises Worldwide” from a standalone assertion into a heading supported by named companies, roles, use cases, and measurable results.

### 3. Explain what each credential resolves

Group security certifications under a clear enterprise-risk heading and connect deployment options to data control, infrastructure choice, and migration flexibility.

### 4. Add commitment language beside the CTA

State whether the first experience is free, requires an account, requires a credit card, or opens a sandbox. This is a small copy change with a significant trust benefit.

### 5. Separate developer and enterprise proof

Give developers a path through GitHub, documentation, templates, and self-hosting. Give enterprise buyers a path through certifications, VPC deployment, data controls, support, and customer evidence.

## Patterns worth borrowing

- Use externally verifiable adoption metrics rather than unsupported superlatives.
- Pair open-source credibility with enterprise security credentials.
- Offer Cloud, VPC, and self-hosted deployment as concrete evidence of platform flexibility.
- Keep the primary action visible and direct.
- Use a consistent visual system across product explanation, proof, and deployment content.
- Provide multiple trust signals that address distinct technical and organizational audiences.

## Anti-patterns to avoid

- Presenting trust badges before visitors understand the product being validated.
- Using a broad “trusted worldwide” claim without attributed customers or outcomes.
- Treating GitHub popularity as sufficient evidence of production reliability.
- Displaying certifications without explaining their relevance to buyer concerns.
- Asking visitors to start without clarifying signup, payment, or sandbox requirements.
- Mixing developer proof and enterprise proof without identifying which objection each signal resolves.

*Status: auto-scored*
---

## Human review (Friday)

Check each dimension you agree with. Add a note if you'd adjust the score.

- [ ] Visual hierarchy — 
- [ ] Information density — 
- [ ] Readability — 
- [ ] Coherence (2x) — 
- [ ] Durability — 
- [ ] Intentionality — 

**Overrides:** (adjust scores here if any dimension is off)


**Verdict confirmed?** [ ] Yes / [ ] Needs revision

---

*Status: auto-scored, pending human review*
*Scoring model: gpt-5.6-sol*
*Human-reviewed: 2026-08-14. Original trust total: 18/25, revised: 17/25. Original craft total: 28/35, revised: 26/35.*
*Specificity: 5/5 → 4/5 (older data). Visual hierarchy: 4/5 → 3/5 (too much to process).*
