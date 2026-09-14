# Replicate signed-out page: promise clarity audit

**Page:** [replicate.com](https://replicate.com/)  
**Evaluator class:** Design quality, message hierarchy and clarity  
**Primary method:** Checked review  
**Secondary method:** First-impression craft rubric  
**Evidence:** Signed-out desktop page, extracted page content, and supplied HTML structure

## Executive verdict

Replicate communicates its core proposition with exceptional economy above the fold: “Run AI with an API” is immediate, distinctive, and reinforced by a working code example. The page is clearly aimed at developers, and the product demonstration makes the promise tangible without requiring explanation.

Clarity declines as the page continues. Repeated model cards, capability categories, community promotion, fine-tuning, and deployment content expand the story from a focused API product into a broad marketplace narrative. These sections are relevant, but their repetition and similar visual weight dilute the singular promise rather than progressively proving it.

**Primary evaluation score: 20/25**  
**Craft score: 28/35, solid craft with specific areas to sharpen**

![Replicate signed-out page above the fold](screenshots/replicate-signed-out-page-promise-clarity-audit/above-the-fold.png)

## Primary evaluation: promise clarity

| Criterion | Score | Evaluation |
|---|---:|---|
| Singular message | 5/5 | “Run AI with an API” states one clear product promise, while the supporting line keeps running, fine-tuning, and deployment subordinate to that API proposition. |
| Audience alignment | 4/5 | Code tabs, API terminology, model identifiers, and production claims speak directly to developers, although the later shift toward model contributors introduces a second audience. |
| CTA focus | 4/5 | “Get started for free” is the clear hero action, but “Try for free,” “Explore models,” “Push a model,” and the Playground link create several competing entry points across the page. |
| Claim specificity | 4/5 | “One line of code,” named models, run counts, example prompts, and production-ready APIs provide concrete proof, but broad claims such as “all the latest models” are less disciplined. |
| Redundancy | 3/5 | Repeated model collections, duplicated cards, and multiple statements about thousands of production-ready models add volume without adding proportional understanding. |

**Total: 20/25**

## Promise clarity findings

### The hero establishes the promise immediately

The title, “Run AI with an API,” is concise enough to understand in a single glance. It describes both the object and the mechanism, avoiding abstract language about AI platforms, transformation, or infrastructure.

The supporting sentence extends the proposition without replacing it:

> Run and fine-tune models. Deploy custom models. All with one line of code.

This is strong message architecture. The headline supplies the category-level promise, while the subhead introduces progressively more advanced use cases.

### The product demonstration is the strongest proof

The code and generated-image module directly connects API input to model output. Language tabs for Node, Python, and HTTP reinforce developer relevance, while named models and prompts make the example credible.

This proof is more effective than a generic product illustration because it demonstrates the actual interaction model. It shows that Replicate is both a catalog of models and a consistent way to run them.

### Promotional content adds early competition

The promotional banner for “Wan 3.0” introduces a temporary commercial message before the durable product promise. It is relevant to active users, but for a cold visitor it creates an additional hierarchy level and asks for attention before the product has been explained.

The Playground link above the headline has a similar effect. It is useful, but it competes with the primary “Get started for free” path during the most important first-impression window.

### The middle of the page over-proves model breadth

Capability links such as image generation, speech, music, restoration, video, captioning, and LLMs efficiently communicate range. The following model cards then provide recognizable proof through provider names, descriptions, official labels, and run counts.

The issue is accumulation. Multiple horizontal model collections repeat the same card grammar and several of the same models. Once breadth and marketplace activity have been established, additional rows produce density rather than confidence.

![Replicate signed-out page full view](screenshots/replicate-signed-out-page-promise-clarity-audit/full-page.png)

### Community content introduces a second narrative

“Thousands of models contributed by our community” explains where the catalog comes from and distinguishes Replicate from a closed API provider. However, “Push a model” changes the audience from developers consuming models to creators publishing them.

That secondary proposition is strategically valid, but it should remain visibly subordinate. Giving “Explore models” and “Push a model” parallel treatment makes the page briefly feel like it has two primary jobs.

### The “How it works” section restores structure

The later sequence of running models, fine-tuning models, and deploying custom code returns to the progression introduced in the hero. This section is useful because it translates the broad product promise into increasingly advanced workflows.

Its clarity would improve if earlier marketplace content were condensed. The page could then move more directly from promise, to model proof, to workflow depth.

## Secondary evaluation: first-impression craft rubric

| Dimension | Weight | Score | Weighted score | Rationale |
|---|---:|---:|---:|---|
| Visual hierarchy | 1x | 5 | 5 | The oversized headline, concise support copy, primary CTA, and code demonstration make the message and action identifiable within three seconds. |
| Information density | 1x | 3 | 3 | The hero is disciplined, but repeated model cards, marquees, provider names, run counts, and capability links cause the full page to overstate the same evidence. |
| Readability | 1x | 4 | 4 | Short headings, plain language, code formatting, and modular sections support scanning, although dense card descriptions and long model identifiers slow mid-page reading. |
| Coherence | 2x | 4 | 8 | A consistent developer-oriented visual language unifies code, model cards, and generated outputs, but marketplace, community, and workflow sections sometimes feel stacked rather than sequenced. |
| Durability | 1x | 4 | 4 | Reusable cards and modular content blocks can accommodate changing models and examples, though long model names and descriptions place pressure on compact repeated layouts. |
| Intentionality | 1x | 4 | 4 | Most choices reinforce technical credibility and product immediacy, but duplicated collections and the prominent temporary promotion feel driven by inventory rather than hierarchy. |

**Weighted total: 28/35**

**Rubric verdict:** Solid craft with specific areas to sharpen.

## What earned the score

- The core promise is unusually concise and visible.
- The hero demonstrates the product instead of merely describing it.
- Developer cues appear immediately through language tabs, code, model identifiers, and API terminology.
- Generated outputs add visual interest while remaining connected to the product mechanism.
- Concrete model names and run counts provide credible marketplace proof.
- The page supports both light and dark system preferences, indicating attention to presentation context.
- The “How it works” progression gives advanced capabilities a comprehensible order.

## What cost the score

- The promotional banner competes with the durable product message.
- “Compare models in the Playground” adds another early action before the primary CTA has fully established priority.
- “Get started for free” and “Try for free” describe nearly the same action with different labels.
- Repeated model collections make the marketplace feel larger but not easier to understand.
- Consumer and contributor journeys receive similar emphasis in the community section.
- The page repeats claims about model quantity and production readiness after those points are already established.
- Broad inventory sections delay the clearer run, fine-tune, and deploy workflow narrative.

## Recommended refinements

1. **Preserve the hero almost as-is.** Keep the headline, supporting sentence, primary CTA, and executable product demonstration as the central composition.
2. **Use one label for the primary conversion action.** Standardize “Get started for free” and “Try for free” unless they lead to meaningfully different flows.
3. **Reduce the marketplace proof to one curated collection.** A single representative row with model diversity, official status, and run counts would establish breadth.
4. **Move the workflow sequence earlier.** Place “Run models,” “Fine-tune models,” and “Deploy custom code” directly after the first marketplace proof.
5. **Separate consumer and contributor paths.** Treat “Push a model” as a secondary route with lower visual emphasis than “Explore models.”
6. **Consolidate repeated claims.** State “thousands of production-ready models” once, then use subsequent sections to prove quality, speed, pricing, or deployment flexibility.
7. **Lower the prominence of temporary promotions for cold visitors.** The discount banner should not outrank the enduring product proposition.

## Patterns worth borrowing

- A category-defining headline expressed in five words.
- A support line that expands the promise through a clear capability sequence.
- A product demonstration placed directly beside or below the promise.
- Language-specific code tabs that identify the intended audience without extra explanation.
- Real model names, prompts, outputs, and usage counts as concrete proof.
- Progressive disclosure from running a model to fine-tuning and custom deployment.
- Reusable visual components that connect marketplace discovery with API execution.

## Anti-patterns to avoid

- Placing a temporary promotion ahead of the foundational product message.
- Using multiple labels for effectively the same primary conversion action.
- Repeating card collections after breadth has already been established.
- Giving consumer and contributor journeys equal prominence without clarifying priority.
- Treating inventory volume as a substitute for structured explanation.
- Repeating marketplace claims instead of advancing to new proof.
- Allowing supporting content to become longer and louder than the core promise.

_Status: auto-scored_
---

## Human review

Reviewed:

| Dimension | Auto-score | Human score | Note |
|-----------|-----------|-------------|------|
| Visual hierarchy | ?/5 | | |
| Information density | ?/5 | | |
| Readability | ?/5 | | |
| Coherence (2x) | ?/5 | | |
| Durability | ?/5 | | |
| Intentionality | ?/5 | | |
| **Total** | **/35** | | |

### Verdict

[ ] Confirmed / [ ] Needs revision

---

*Scoring model: gpt-5.6-sol*
*Status: auto-scored, pending human review*