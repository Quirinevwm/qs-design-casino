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

### 1. Visual hierarchy (4/5)

**What works:**
- Clear CTA layering in the nav: "Contact Sales" (text) < "Log in" (text) < "Get Started" (filled blue button). Three levels of visual weight, immediately parseable.
- Brand color (#0033ff) used sparingly and only for primary actions. Everything else recedes into ink/fog/dust token layers.
- The deploy section uses card-based layout with tab-like selectors (Managed / Self-hosted / Open-Source), giving three audiences distinct containers without stacking them vertically.

**What costs it a point:**
- The hero copy is dense and multi-clause: "Build Agentic workflows, RAG pipelines, with rich AI model and tool support on one collaborative workspace." That is not a 3-second read. It tries to name every capability rather than lead with one sharp promise.
- Two competing section headers ("Trusted by Builders & Enterprises Worldwide" and "Deploy Dify Your Way") appear in quick succession, splitting attention before the visitor has anchored on the core message.

**Score: 4** - Strong structural hierarchy in navigation and CTAs. Hero text undermines it by front-loading too many concepts.

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

### 4. Coherence (4/5)

**What works:**
- Consistent design language: the token system (dust, fog, ink, brand) creates a unified material metaphor. Every interactive state (hover, active) uses the same transition timing and color shifts.
- Scroll-driven animations with `prefers-reduced-motion` respect show a team that cares about the details.
- One accent color. One typeface family. One CTA shape (rounded-lg, blue fill). The system holds.
- Navigation pattern (Products, Solutions, Docs, Pricing, Company) is conventional and expected for this product category.

**What costs it a point:**
- The page mixes two tonal registers: developer-practical ("Single-command Docker deploy," "Full agent runtime + workflow editor") and enterprise-sales ("Convert Your AI Vision into Immediate Business Value," "Eliminate the overhead between idea and execution"). These feel like they were written by different teams. The design holds them together visually, but the voice fractures.

**Score: 4** - The visual system is coherent. The content voice is split between developer and enterprise registers, creating a subtle "assembled" feeling.

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

## Summary

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual hierarchy | 4/5 | Strong CTA layering, hero text too dense |
| Information density | 3/5 | Well-portioned sections, but too many registers stacked |
| Readability | 4/5 | Excellent type choice, hero sentences run long |
| Coherence | 4/5 | Visual system holds, content voice is split |
| Durability | 3/5 | Structural design endures, copy ties to current trends |
| **Total** | **18/25** | |

---

## Verdict

**Adapt selectively.** The visual system and component architecture are strong craft. Worth borrowing:

- The CTA hierarchy pattern (text < text < filled button) in the nav
- Token-based color semantics (ink/fog/dust/brand) as a naming convention
- Parallel-structure cards for audience segmentation
- Scroll-driven animations with motion preference respect

Avoid reproducing:

- Multi-concept hero statements that try to name every capability
- Trust signals placed before the product concept has landed
- Mixing developer-practical and enterprise-sales copy on the same surface
- Hardcoded metrics (star counts) that require manual maintenance

---

## Reusable artifacts

### First-impression craft rubric (5-point, generalized)

This rubric applies to any product landing page or signed-out state:

| # | Dimension | Question | Scoring |
|---|-----------|----------|---------|
| 1 | Visual hierarchy | Can you identify the primary message and action within 3 seconds? | 5 = instant, 1 = buried |
| 2 | Information density | Is every element earning its space? | 5 = nothing to remove, 1 = noise competes with signal |
| 3 | Readability | Do typography, contrast, and sentence length support scanning? | 5 = effortless, 1 = labored |
| 4 | Coherence | Does the page feel like one designed thing? | 5 = unified, 1 = assembled from parts |
| 5 | Durability | Would this design hold if content changed by 30%? | 5 = resilient, 1 = brittle |

**Scoring guide:**
- 21-25: Exceptional craft. Study and reference.
- 16-20: Solid craft with specific areas to sharpen.
- 11-15: Functional but lacking intentionality.
- 5-10: Needs structural rethinking.

---

*Reviewed: 2026-08-12*
