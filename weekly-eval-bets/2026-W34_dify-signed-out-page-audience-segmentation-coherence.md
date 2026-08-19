# Dify signed-out page: audience segmentation coherence

## Executive summary

Dify presents Cloud, Enterprise, and Community Edition as deployment choices within one platform narrative. This creates strong visual and conceptual unity, but it does not give all three audiences equal prominence. Cloud builders receive the clearest path from the hero and primary CTA, while enterprise buyers and self-hosters must progress further down the page before finding language and actions specific to them.

The segmentation works best once the deployment card or tab pattern appears. Distinct vocabulary such as “Zero infrastructure setup,” “SSO/SAML, RBAC, audit logs,” and “Single-command Docker deploy” helps each audience recognize its option without fragmenting the page into three separate marketing experiences. The main weakness is discovery timing, not the quality of the segmentation component itself.

**Weighted craft score: 26/35**

**Verdict: Solid craft with specific areas to sharpen.** The page is coherent and polished, but the above-the-fold hierarchy privileges the cloud path enough that Enterprise and Community Edition can initially feel secondary.

## Evidence reviewed

The above-the-fold experience establishes a single product category and a dominant getting-started path before presenting the audience-specific deployment choices.

![Dify signed-out page above the fold](screenshots/dify-signed-out-page-audience-segmentation-coherence/above-the-fold.png)

The full-page composition contains the three options within a shared visual system, preserving continuity as the message moves from platform capabilities to deployment models.

![Dify signed-out page full page](screenshots/dify-signed-out-page-audience-segmentation-coherence/full-page.png)

This is a heuristic review based on the supplied screenshots, extracted page content, and HTML structure. Interaction behavior, keyboard operation, focus states, and responsive variants require separate validation.

## Audience segmentation review

| Audience | Find themselves within 5 seconds? | Vocabulary fit | CTA fit | Distraction from other audiences | Designed for them? |
|---|---|---|---|---|---|
| Cloud builders | Yes, the dominant getting-started path and speed-oriented framing align immediately with this audience. | Strong, especially through “Zero infrastructure setup” and the broader emphasis on building quickly. | Strong, a direct trial or start action matches a low-friction evaluation stage. | Low, the other deployment models read as evidence of platform maturity rather than competing paths. | Yes, this is the audience most clearly prioritized by the initial hierarchy. |
| Enterprise buyers | Partially, the production positioning is relevant, but explicit enterprise recognition arrives later than the main cloud path. | Strong once surfaced, with SSO/SAML, RBAC, and audit logs matching buyer and security-review vocabulary. | Appropriate if the enterprise card leads to a sales or consultation path, but that route is less visually dominant than the cloud CTA. | Moderate, developer-oriented workflow and deployment content can delay access to governance and compliance signals. | Partially, the page accommodates enterprise needs without making enterprise buyers feel like the primary visitor. |
| Open-source self-hosters | Partially, self-hosting is part of the platform promise but becomes concrete only at the Community Edition option. | Strong, especially through “Single-command Docker deploy” and explicit control over hosting. | Appropriate when it leads directly to deployment instructions, documentation, or the repository rather than a generic signup flow. | Moderate, cloud-first actions can initially suggest that hosted usage is the default or preferred product. | Partially, the page respects this audience’s priorities but does not foreground community identity or ownership early enough. |

### Cloud builder verdict

Cloud builders receive the strongest end-to-end journey. The hero, primary action, and “Zero infrastructure setup” language form a consistent promise of speed. Other deployment options do not materially disrupt this path.

### Enterprise buyer verdict

Enterprise buyers receive credible, specific vocabulary rather than generic claims about security. However, the page asks them to accept a broad developer-platform story before exposing the governance controls that establish enterprise relevance. Their route is coherent but delayed.

### Open-source self-hoster verdict

Self-hosters receive a concrete deployment promise and an option that fits their preference for control. The Community Edition framing is legible once encountered, but the cloud-led initial hierarchy makes self-hosting feel like an alternative distribution model rather than an equally central product identity.

## Overall segmentation coherence

The three-audience model is coherent because Dify segments by deployment and operating model rather than attempting to maintain three unrelated narratives. All audiences are choosing how to run the same underlying platform, which allows the page to reuse product imagery, capability descriptions, and visual language without appearing assembled from separate campaigns.

The card or tab pattern is the key structural success. It contains changes in vocabulary, proof, and CTA behavior while preserving a stable comparison frame. Visitors can distinguish speed, compliance, and control without needing to decode an undifferentiated feature list.

The primary coherence cost is asymmetrical discovery. Cloud is both an audience option and the page’s default action, while Enterprise and Community Edition function more like alternatives revealed later. This is commercially understandable, but it weakens the claim that the signed-out page serves all three audiences equally.

A stronger version would preserve one universal hero while introducing a compact early routing cue, such as “Start in Cloud,” “Explore Enterprise,” and “Self-host Dify.” That would improve recognition without splitting the page into three competing hero messages.

## Craft rubric score

| Dimension | Weight | Score | Weighted score | Rationale |
|---|---:|---:|---:|---|
| Visual hierarchy | 1x | 4 | 4 | The platform message and primary cloud action are easy to identify, but Enterprise and Community Edition are not equally discoverable in the initial view. |
| Information density | 1x | 4 | The deployment choices are contained in a structured card or tab pattern, though the long page delays some audience-specific signals. |
| Readability | 1x | 4 | Short deployment promises and audience-specific terminology support scanning, but specialized platform language assumes a technically informed reader. |
| Coherence | 2x | 3 | The shared visual system and deployment framework unify the three audiences, but cloud-first emphasis creates a noticeable imbalance in perceived priority. |
| Durability | 1x | 4 | The modular deployment pattern should tolerate moderate changes in descriptions, proof points, and actions without requiring a structural redesign. |
| Intentionality | 1x | 4 | Audience vocabulary, deployment framing, and differentiated actions appear purposeful, although the reason for delaying explicit segmentation is less convincing. |
| **Total** | **7x** | **N/A** | **26** | **The result falls within the 22-28 range for solid craft with specific areas to sharpen.** |

## Accessibility considerations

The segmentation does not rely on generic audience labels alone. Concrete phrases such as “SSO/SAML,” “audit logs,” and “Docker deploy” improve cognitive accessibility by helping visitors match an option to a recognizable need.

The tab or card implementation should still be validated for:

- Keyboard access to every audience option.
- Visible focus treatment on tabs, cards, and CTAs.
- Correct tab, tablist, and tabpanel semantics if content changes in place.
- Screen reader announcement of the selected option.
- Sufficient contrast for secondary text and inactive states.
- Access to all three options when JavaScript is unavailable.
- Reduced-motion behavior for scroll-triggered card animations.

These implementation details cannot be confirmed from static screenshots and extracted HTML alone.

## Recommended refinements

1. **Expose all three paths earlier.** Add a lightweight audience or deployment router near the hero so Enterprise and Community visitors can self-identify before scrolling.
2. **Keep one dominant product message.** Do not replace the universal hero with three simultaneous value propositions, since that would reduce clarity and increase competition.
3. **Differentiate CTA language by intent.** Use trial language for Cloud, consultation or evaluation language for Enterprise, and deploy or repository language for Community Edition.
4. **Give each option one decisive proof point.** Pair speed with setup time, enterprise controls with compliance evidence, and self-hosting with deployment clarity.
5. **Make equal availability explicit.** State that Cloud, VPC, and self-hosted deployment are first-class ways to use the same platform, not a primary product with two secondary variants.
6. **Preserve comparison context.** Keep the three options adjacent or easily switchable so visitors can understand tradeoffs without navigating away.

## Patterns worth borrowing

- Segment audiences around a shared decision dimension, in this case deployment and operating model.
- Use audience-specific vocabulary instead of broad claims that attempt to satisfy everyone.
- Contain divergent messages and actions inside one stable card or tab framework.
- Match CTA intent to the audience’s evaluation stage.
- Preserve a single product identity across hosted, enterprise, and open-source offerings.
- Use concrete operational details to make each audience option recognizable.

## Anti-patterns to avoid

- Allowing the primary CTA to make one audience appear synonymous with the entire product.
- Deferring enterprise and self-hosted recognition until late in a long page.
- Giving all audiences the same generic “Get started” action despite different buying stages.
- Mixing compliance, developer tooling, and community deployment details in one undifferentiated feature list.
- Creating three independent visual languages that make one platform feel like separate products.
- Treating self-hosting as a footnote when control and ownership are central audience motivations.

*Status: auto-scored*
---

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

---

*Scoring model: gpt-5.6-sol*
*Status: auto-scored, pending human review*