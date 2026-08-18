# Dify signed-out page: promise-to-product gap

## Evaluation summary

**Promise-to-product verdict:** Inconclusive with the supplied evidence. The signed-out page makes clear, testable commitments, but no fresh-account walkthrough or signed-in screenshots were provided to verify delivery within the first five minutes.

**Craft verdict:** **26/35, solid craft with specific areas to sharpen.** The page presents Dify as a coherent, production-oriented platform, but its breadth creates density and makes several promises more expansive than the first-run experience can reasonably prove.

![Dify signed-out page above the fold](screenshots/dify-signed-out-page-promise-to-product-gap/above-the-fold.png)

## Evaluation scope and method

The primary method is the bet’s judged evaluation:

1. Identify specific promises on the signed-out page.
2. Translate each promise into a five-minute acceptance test.
3. Enter the product with a fresh account.
4. Mark each promise as delivered, partially delivered, or broken.
5. Compare signed-out and signed-in evidence.

The supplied materials include the signed-out page content, HTML structure, and screenshot references. They do not include a signed-in session, timestamps, task results, or product screenshots. For that reason, the report documents the promises and acceptance criteria but does not manufacture delivery judgments.

The first-impression craft rubric is applied as a secondary lens.

## Signed-out promise audit

The page’s central design contract is that Dify consolidates agentic application development into one production-ready platform. Five promises are prominent enough to shape user expectations.

| Promise | Signed-out evidence | Five-minute acceptance test | Current status |
|---|---|---|---|
| Build agentic workflows | The title and metadata position Dify as a platform for “production-ready agentic workflows.” | Create a workflow from scratch or a template, connect at least two functional steps, and complete one successful run. | **Not verified** |
| Build a RAG or knowledge pipeline | The description promises agents and knowledge pipelines on one canvas. | Upload a small document, complete indexing, connect it to an application, and receive a grounded response. | **Not verified** |
| Start without infrastructure setup | The bet identifies a managed cloud workspace and zero infrastructure setup as explicit commitments. | Create an account and reach a usable workspace without configuring hosting, databases, containers, or networking. | **Not verified** |
| Publish as a web app or API | The page promises deployable applications and the bet specifically identifies web app and API publishing. | Run an application, publish it, and locate either a working web URL or callable API endpoint. | **Not verified** |
| Move from prototype to production without rebuilding | The positioning emphasizes production readiness and deployment across Cloud, VPC, or self-hosted environments. | Confirm that the same application exposes deployment, access, environment, or observability controls without requiring recreation in another tool. | **Not verified** |

### Judged evaluation result

No promise can responsibly be labeled delivered, partially delivered, or broken from the signed-out evidence alone. Absence of signed-in evidence is not evidence of product failure.

The test also exposes an issue in the promise set itself. “Create a workflow,” “start without infrastructure,” and “publish an app” are observable within five minutes. “Production-ready” and “without rebuilding the stack” are longitudinal claims that require stronger proxies or a longer evaluation window.

## Where the trust gap is most likely

### The opening claim is broader than the first-run proof

“Production-ready” implies reliability, deployment control, security, monitoring, versioning, and operational resilience. A successful first workflow run can demonstrate product immediacy, but it cannot substantiate the full claim.

The first-run experience should therefore surface concrete proof objects early, such as:

- A working run log
- Version or environment controls
- A publish action with a live endpoint
- API credentials and example requests
- Usage limits and execution history
- A visible path from sandbox to a managed deployment option

### The platform breadth increases onboarding risk

The signed-out positioning combines agents, workflows, models, tools, knowledge pipelines, and multiple deployment modes. This communicates capability, but it also raises the chance that a new workspace begins with too many equivalent choices.

The strongest continuation across authentication would preserve the visitor’s intent. A visitor who enters through a RAG message should land on a RAG starter path, while a visitor responding to the workflow promise should land in a runnable workflow template.

### Publishing is the clearest trust checkpoint

Publishing as a web app or API is concrete, valuable, and easy to verify. It should be treated as the primary proof of continuity between the landing page and the product.

A strong five-minute experience would produce:

1. A runnable starter application
2. A visible publish control
3. A generated web URL or API endpoint
4. A successful invocation
5. A clear explanation of sandbox limitations

If any of these steps are hidden behind model configuration, billing decisions, or unexplained credentials, the promise would be only partially delivered.

## First-impression craft score

| Dimension | Weight | Score | Weighted score | Rationale |
|---|---:|---:|---:|---|
| Visual hierarchy | 1x | 4/5 | 4 | The production-ready agentic workflow proposition is prominent and supported by a clear route into the cloud product, though the number of adjacent capabilities slightly diffuses the primary message. |
| Information density | 1x | 3/5 | 3 | The long page gives substantial space to product breadth and deployment options, but repeated capability framing risks competing with the core workflow promise. |
| Readability | 1x | 4/5 | 4 | Strong display typography, restrained copy blocks, and a consistent visual cadence support scanning, although specialized terms such as agentic workflows and RAG assume category familiarity. |
| Coherence | 2x | 4/5 | 8 | The typography, blue-led visual identity, product diagrams, and card system make the page feel like one designed system rather than an assembly of unrelated sections. |
| Durability | 1x | 3/5 | 3 | The modular section and card structure should tolerate moderate content changes, but tightly composed marketing statements and product graphics may become brittle with longer localization or qualification text. |
| Intentionality | 1x | 4/5 | 4 | The major visual and structural choices reinforce technical capability and production credibility, though the breadth of claims sometimes appears driven by coverage rather than prioritization. |
| **Total** |  |  | **26/35** | **Solid craft with specific areas to sharpen.** |

![Dify signed-out page full view](screenshots/dify-signed-out-page-promise-to-product-gap/full-page.png)

## Craft interpretation

### What the page does well

The page has a credible platform posture. Its custom typography, controlled color system, deployment framing, and product-oriented imagery support the idea of an integrated technical product rather than a lightweight AI wrapper.

The design also gives deployment meaningful prominence. That is important because deployment is the bridge between “build” and “production-ready,” and it provides a more concrete point of differentiation than a generic promise to create AI applications.

### What costs the page

The page asks one headline proposition to carry several concepts at once: agents, workflows, RAG, models, tools, cloud deployment, VPC deployment, and self-hosting. Each concept is relevant, but together they weaken immediate prioritization.

The visual system is coherent, yet the product contract remains broad. The page would earn greater trust by pairing its largest claim with one equally prominent, inspectable proof. A live endpoint, execution trace, deployment checklist, or first-run time estimate would do more than another capability card.

## Recommended before-and-after evaluation

A human reviewer should complete the following test with a new sandbox account and record the session continuously.

### Test conditions

- Use a fresh browser profile.
- Start at the homepage.
- Begin timing when the primary cloud CTA is selected.
- Do not use documentation unless the product directs the user there.
- Stop each task at five minutes.
- Capture the signed-out promise, corresponding signed-in screen, task outcome, and any blocker.

### Measures

| Measure | Target |
|---|---:|
| Time to usable workspace | Under 60 seconds after authentication |
| Time to first successful workflow run | Under 3 minutes |
| Time to first grounded knowledge response | Under 5 minutes |
| Time to locate publishing | Under 30 seconds after a successful run |
| Time to obtain a web URL or API endpoint | Under 5 minutes total |
| Mandatory external setup steps | Zero for the default starter path |
| Dead ends or unexplained errors | Zero |

### Decision rules

- **Delivered:** The task is completed within five minutes without documentation or infrastructure setup.
- **Partially delivered:** The path is visible and substantially usable, but requires external credentials, unclear configuration, documentation, or more than five minutes.
- **Broken:** The promised capability is unavailable, blocked on the free tier without prior disclosure, or cannot be located after a reasonable attempt.

For “production-ready” and “without rebuilding,” use a separate 30-minute review. The reviewer should inspect versioning, environment management, logs, access control, deployment portability, and whether the prototype artifact remains the deployable artifact.

## Priority recommendations

1. **Preserve intent across authentication.** Route visitors into a starter experience aligned with the promise or CTA they selected.
2. **Make publishing the first-run finish line.** Treat a working web URL or API response as the onboarding success state.
3. **Qualify the production claim.** Show the specific operational capabilities that make the product production-ready.
4. **Reduce initial choice load.** Lead with three task-based starts, such as workflow, knowledge app, and agent, instead of exposing the full platform taxonomy immediately.
5. **Instrument promise completion.** Measure time to first run, time to publish, completion rate, documentation exits, and abandonment by marketing entry point.

## Patterns worth borrowing

- A concise platform position centered on a meaningful technical outcome
- A coherent visual system across typography, color, cards, and product imagery
- Deployment presented as part of the core product story
- Multiple hosting models introduced without displacing the main cloud entry point
- Modular page sections that can support deeper capability explanations
- Explicit acceptance tests that connect marketing language to observable product behavior

## Anti-patterns to avoid

- Using “production-ready” as a substitute for visible operational proof
- Combining too many product nouns in the primary value proposition
- Treating a successful prototype run as proof of production readiness
- Sending every visitor into the same generic workspace regardless of stated intent
- Hiding publishing behind model setup, billing, or undocumented credentials
- Assigning delivered or broken judgments without signed-in evidence

_Status: auto-scored_
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
