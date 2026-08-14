# 2026-W33 Dify signed-out page: first-impression craft

> Evaluating the design craft of dify.ai's homepage as a signed-out visitor arriving cold.

## Context

- **Issue:** #6
- **Evaluator class:** Design quality (craft, coherence, accessibility)
- **Evidence type:** Rubric-scored (criteria checklist)
- **Evaluation approach:** Checked review
- **Page evaluated:** https://dify.ai (fetched 2026-08-12)
- **Tech stack observed:** Astro v7.1.6, Soehne typeface (Klim Type Foundry), custom design tokens, scroll-driven animations

---

## Rubric scores

### 1. Visual hierarchy (3/5)

**What works:**
- Clear CTA layering in the nav: "Contact Sales" (text) < "Log in" (text) < "Get Started" (filled blue button). Three levels of visual weight, immediately parseable.
- Brand color (#0033ff) used sparingly and only for primary actions. Everything else recedes into ink/fog/dust token layers.
- The deploy section uses card-based layout with tab-like selectors (Managed / Self-hosted / Open-Source), giving three audiences distinct containers without stacking them vertically.

**What costs it a point:**
- The hero copy is dense and multi-clause: "Build Agentic workflows, RAG pipelines, with rich AI model and tool support on one collaborative workspace." That is not a 3-second read. It tries to name every capability rather than lead with one sharp promise.
- Two competing section headers ("Trusted by Builders & Enterprises Worldwide" and "Deploy Dify Your Way") appear in quick succession, splitting attention before the visitor has anchored on the core message.

**Score: 3** - Strong structural hierarchy in navigation and CTAs. Hero text undermines it by front-loading too many concepts.

---

### 2. Information density (3/5)

**What works:**
- The deploy cards are well-structured: each lists exactly four bullet points. Parallel structure across the three options reduces cognitive load.
- Semantic token naming (ink, fog, dust, brand) implies a deliberate system behind the density choices.

**What costs it points:**
- The page stacks: hero statement, trust badge section, deploy cards (with 12+ bullet points across three options), then another value prop section ("Convert Your AI Vision into Immediate Business Value"). For a signed-out visitor, that is a lot of information before any single concept has landed.
- Trust signals ("Trusted by Builders & Enterprises Worldwide") appear before the product is explained. The visitor hasn't decided to care yet.
- Compliance details (SOC 2 Type II, ISO 27001, Helm charts) in the deploy cards are enterprise-buyer language that adds noise for the majority of first-time visitors (developers exploring open-source).

**Score: 3** - Individual sections are well-portioned, but the page-level stack asks the visitor to absorb too many registers (developer, enterprise buyer, open-source contributor) in one scroll.

---

### 3. Readability (4/5)

**What works:**
- Soehne is an excellent typeface choice: high x-height, clear letter differentiation, modern without being trendy. It performs well at both display and body sizes.
- Two weights preloaded (Buch for body, Kraftig for headings) keeps the typographic palette tight.
- White background with ink text. No dark-mode complexity on the marketing surface. Clean contrast.
- Minimum viewport width of 320px with a dedicated mobile layout shows responsive care.

**What costs it a point:**
- The hero subline is a compound sentence that runs long. "Deploy on cloud, VPC, or self-hosted, so teams move from prototype to production without rebuilding the stack" would benefit from being broken into two statements or tightened.
- Multiple font-size tiers visible in the source (section-heading, card-heading, inner-heading, small-text) suggest the type scale may have more steps than the content hierarchy needs.

**Score: 4** - Typography is a strong craft decision. Sentence-level readability in the hero could be tighter.

---

### 4. Coherence (3/5)

**What works:**
- Consistent design language: the token system (dust, fog, ink, brand) creates a unified material metaphor. Every interactive state (hover, active) uses the same transition timing and color shifts.
- Scroll-driven animations with `prefers-reduced-motion` respect show a team that cares about the details.
- One accent color. One typeface family. One CTA shape (rounded-lg, blue fill). The system holds.
- Navigation pattern (Products, Solutions, Docs, Pricing, Company) is conventional and expected for this product category.

**What costs it a point:**
- The page mixes two tonal registers: developer-practical ("Single-command Docker deploy," "Full agent runtime + workflow editor") and enterprise-sales ("Convert Your AI Vision into Immediate Business Value," "Eliminate the overhead between idea and execution"). These feel like they were written by different teams. The design holds them together visually, but the voice fractures.

**Score: 3** - The visual system is coherent. The content voice is split between developer and enterprise registers, creating a subtle "assembled" feeling.

---

### 5. Durability (3/5)

**What works:**
- The deploy-card pattern (three tabbed options with parallel bullet structures) would survive content changes well. Swap the options, rename them, add a fourth: the container holds.
- Token-based styling means the visual system can evolve without refactoring individual components.
- Astro's static-first architecture means this page loads fast and stays stable.

**What costs it points:**
- The hero copy is tightly coupled to current product features ("Agentic workflows, RAG pipelines"). When Dify adds new capabilities or the industry moves past "agentic" as a buzzword, this line dates immediately.
- "152K+ stars on GitHub" is a vanity metric that needs manual updating and will look stale if growth plateaus.
- "Convert Your AI Vision into Immediate Business Value" is era-specific enterprise AI language. It reads as 2024-2025 positioning that will feel generic within a year.

**Score: 3** - The structural design is durable. The content strategy ties itself to current terminology and metrics that will age.

---

### 6. Intentionality (3/5)

**What works:**
- The Soehne typeface is a premium, deliberate choice (Klim Type Foundry). This isn't a default; someone chose it for its clarity and modernity.
- Token naming (ink, fog, dust, brand) reflects a considered material metaphor. Each name carries meaning beyond generic "gray-100" scales.
- Scroll-driven animations with `prefers-reduced-motion` support signal a team that thought about the experience layer, not just the content layer.
- The three-card deploy pattern is architecturally intentional: it gives each audience a home without forcing a choose-your-adventure fork.

**What costs it points:**
- The hero copy reads like a feature list was compressed into a sentence. The intent behind what to say first is unclear.
- Trust signals placed above the product explanation feels like a pattern borrowed from a template rather than a conscious sequencing decision.
- "Convert Your AI Vision into Immediate Business Value" reads as stakeholder-driven copy, not a designer's intentional choice about what the visitor needs to hear next.

**Score: 3** - The visual and system-level decisions show clear intent. The content-level decisions feel defaulted or inherited rather than authored.

---

## Summary

| Dimension | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Visual hierarchy | 1x | 3/5 | 3 |
| Information density | 1x | 3/5 | 3 |
| Readability | 1x | 4/5 | 4 |
| Coherence | 2x | 3/5 | 6 |
| Durability | 1x | 3/5 | 3 |
| Intentionality | 1x | 3/5 | 3 |
| **Total** | | | **22/35** |

**Band: Solid craft with specific areas to sharpen (22-28).**

---

## Verdict

**Adapt selectively.** The visual system and component architecture are strong craft. Worth borrowing:

- The CTA hierarchy pattern (text < text < filled button) in the nav
- Token-based color semantics (ink/fog/dust/brand) as a naming convention
- Parallel-structure cards for audience segmentation
- Scroll-driven animations with motion preference respect
- Soehne as a reference for typeface intentionality on platform pages

Avoid reproducing:

- Multi-concept hero statements that try to name every capability
- Trust signals placed before the product concept has landed
- Mixing developer-practical and enterprise-sales copy on the same surface
- Hardcoded metrics (star counts) that require manual maintenance
- Content decisions that feel inherited from templates rather than authored for the visitor

---

## Rubric reference

Scored using the first-impression craft rubric: [`skills/first-impression-craft-rubric.md`](../skills/first-impression-craft-rubric.md)

---

*Reviewed: 2026-08-12 (rescored with v2 rubric: coherence 2x, intentionality added)*
*Human-reviewed: 2026-08-14. Visual hierarchy adjusted 4→3 (too much to process). Coherence adjusted 4→3 (API docs missing, mixed target audience).*
