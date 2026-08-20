# OpenAI signed-out page: promise-to-product gap

## Evaluation summary

**Primary method:** Judged promise-to-product evaluation  
**Secondary method:** First-impression craft rubric  
**Observed artifact:** Cloudflare challenge page served at `https://openai.com`  
**Craft score:** **19/35**  
**Craft verdict:** **Functional but lacking intentionality**  
**Promise delivery:** **0 of 4 promises reached within the observed journey**

The supplied capture does not contain OpenAI’s intended signed-out homepage. It contains a security challenge with the OpenAI logo and the fallback instruction, “Enable JavaScript and cookies to continue.” As a result, the most important finding is not a conventional marketing-to-product mismatch. It is an access failure before the visitor can see a promise, choose a product, sign up, or begin using it.

This evaluation scores the experience that was actually delivered in the supplied evidence. It does not treat the challenge page as representative of OpenAI’s intended homepage for every visitor.

![Above-the-fold capture of the signed-out experience](screenshots/openai-signed-out-page-promise-to-product-gap/above-the-fold.png)

## Primary evaluation: promise-to-product delivery

### Method and limitation

The suggested approach calls for documenting three to five promises from the signed-out page, signing in as a fresh visitor, and attempting each promise within five minutes.

That procedure could not be completed end to end because the captured signed-out state never exposed the homepage or a product entry point. The promises below therefore come from the supplied bet brief, which identifies OpenAI’s broad commitments around ChatGPT, research and deployment, API access, and Playground. They were tested against the first barrier in the observed journey.

A **broken** result here means broken in the supplied run, not proven broken for all users or environments.

### Promise test results

| Promise | Expected first-five-minute outcome | Observed outcome | Status |
|---|---|---|---|
| Use ChatGPT | Reach ChatGPT, authenticate if required, and submit a first prompt. | The challenge page exposed no ChatGPT link, sign-in control, or prompt interface. | Broken in observed run |
| Access the API platform | Reach the developer platform, authenticate, and locate the first API setup step. | The challenge page exposed no developer navigation, documentation, account path, or API setup control. | Broken in observed run |
| Experiment in Playground | Reach Playground and run or prepare a first model interaction. | The challenge page exposed no Playground route or product selection mechanism. | Broken in observed run |
| Research and deploy AI | Understand the available product paths and enter an appropriate building or deployment workflow. | The visitor could not reach the homepage message, compare products, or begin a deployment workflow. | Broken in observed run |

### Promise-to-product verdict

**Result: 0 delivered, 0 partially delivered, 4 broken in the observed run.**

The promise-to-product gap is absolute at the access layer. The visitor receives neither the promise nor the product. OpenAI’s multi-product onboarding challenge is therefore replaced by a more basic question: can a legitimate first-time visitor reliably clear the security boundary and recover if they cannot?

The challenge page includes an OpenAI mark, a centered layout, light and dark color handling, and an automatic refresh after 360 seconds. It does not include visible progress, troubleshooting guidance, an alternate route, support access, or a clear statement that verification is underway. If JavaScript is enabled but verification stalls, the supplied markup may leave the visitor with little or no explanatory text.

![Full-page capture of the signed-out experience](screenshots/openai-signed-out-page-promise-to-product-gap/full-page.png)

## User impact assessment

### Primary user impact

The observed state prevents completion of every high-value first-session task:

- A consumer cannot start a ChatGPT conversation.
- A developer cannot find API documentation or credentials.
- An evaluator cannot reach Playground.
- A prospective customer cannot understand the product portfolio.
- An existing user cannot find a visible sign-in route.

At OpenAI’s scale, even a low incidence rate could affect a meaningful number of sessions. The supplied evidence does not include traffic, completion rates, or challenge failure rates, so the magnitude cannot be quantified from this run alone.

### Process improvement opportunity

Because the bet requests before-and-after evidence, the strongest follow-up would measure the complete path from challenge presentation to first product success.

Recommended measures:

1. **Challenge completion rate:** Percentage of challenged visitors who reach the intended homepage.
2. **Challenge duration:** Median and 95th-percentile time from challenge display to page access.
3. **Silent-stall rate:** Percentage of challenge sessions with no visible message and no successful redirect.
4. **Recovery rate:** Percentage of stalled users who succeed through retry, alternate verification, or support.
5. **Time to first value:** Time from initial visit to first ChatGPT prompt, Playground run, or successful API request.
6. **Product-path completion:** Conversion from homepage product choice to the corresponding signed-in destination.

A valid before-and-after study should segment results by browser, device, geography, privacy settings, assistive technology, and network reputation. This would distinguish necessary abuse prevention from avoidable user lockout.

## Secondary evaluation: first-impression craft

### Weighted score

| Dimension | Weight | Score | Weighted score | Rationale |
|---|---:|---:|---:|---|
| Visual hierarchy | 1x | 2 | 2 | The centered logo is immediately visible, but there is no primary message, progress state, or actionable next step to identify within three seconds. |
| Information density | 1x | 4 | The surface is visually quiet and contains little competing noise, although its sparseness comes from missing guidance rather than disciplined prioritization. |
| Readability | 1x | 3 | The fallback instruction is short and centered, but muted gray styling and conditional `noscript` rendering make the explanation weak or potentially absent. |
| Coherence | 2x | 3 | The logo, restrained palette, animation, and centered composition form a consistent challenge shell, but the generic Arial treatment and security markup feel detached from a complete OpenAI experience. |
| Durability | 1x | 2 | The layout can accommodate a short status line, but it lacks structures for longer errors, troubleshooting steps, alternate actions, localization, or support content. |
| Intentionality | 1x | 2 | The branded loading animation and theme support appear deliberate, while the absence of status, recovery, and accessibility affordances makes the overall experience feel under-resolved. |
| **Total** | **7x** |  | **19** | **The delivered state is visually controlled but fails to orient the visitor or provide a resilient path forward.** |

### Score interpretation

A score of **19/35** falls within **“Functional but lacking intentionality.”** Even that framing is generous from a user-task perspective. The page may be functioning as a security mechanism, but it is not functioning as a signed-out product landing experience.

The minimal composition avoids clutter, yet minimalism is not the same as clarity. A successful interstitial should answer four questions immediately:

1. What is happening?
2. Why is it happening?
3. How long should it take?
4. What can the visitor do if it fails?

The observed page answers, at most, part of the first question.

## Detailed craft findings

### Visual hierarchy

The composition directs attention to the OpenAI logo rather than to a meaningful state or action. Branding is clear, but task hierarchy is not. A verification message, progress indicator, and recovery action should carry more visual weight than the brand mark.

### Information density

There is no visible clutter, duplicated navigation, or competing promotion. However, the page removes essential information along with unnecessary information. The appropriate improvement is not greater density in general, but a compact block containing status, expected wait time, privacy context, and recovery options.

### Readability

The short fallback sentence is easy to parse when it appears. Its muted gray presentation may reduce contrast, and users with JavaScript enabled may not receive that text because it is inside `noscript`. Status information should remain visible independently of script execution and should use semantic live-region behavior when the state changes.

### Coherence

The shell is internally consistent, with a centered flex layout, a single muted palette, and a restrained logo animation. It does not appear integrated with a broader product-entry system. There is no navigation, account context, product context, or support language connecting the security state to the destination.

### Durability

The design is highly dependent on having almost no content. A 30 percent increase in copy would probably fit, but realistic error handling would require substantially more structure. Longer localized strings, multiple recovery actions, incident notices, or accessibility guidance are not clearly accommodated.

### Intentionality

The logo animation, responsive sizing, dark-mode handling, and periodic refresh show implementation intent. The user-facing decisions are less complete. A six-minute refresh interval without visible timing or manual retry can feel arbitrary, particularly when the page provides no assurance that progress is occurring.

## Highest-priority improvements

1. **Make verification status explicit.** Replace the logo-only state with a clear heading such as “Verifying your browser,” followed by concise supporting text.
2. **Show progress and expected duration.** Tell visitors that verification normally takes a few seconds and disclose when an automatic retry will occur.
3. **Provide recovery controls.** Include “Try again,” troubleshooting guidance, status information, and a support route.
4. **Preserve product intent.** Carry the selected destination through verification so a visitor seeking ChatGPT, API Platform, or Playground lands in the correct product afterward.
5. **Render guidance without relying on `noscript`.** Essential instructions should be present for stalled scripts, blocked cookies, failed challenges, and assistive technologies.
6. **Measure first-value completion.** Evaluate whether users who encounter the challenge subsequently complete a first prompt, Playground run, or API setup step.
7. **Test legitimate edge cases.** Include privacy browsers, VPNs, managed networks, strict cookie settings, screen readers, and slower connections.

## Patterns worth borrowing

- Use a restrained interstitial rather than adding promotional content during a security check.
- Preserve clear OpenAI branding so visitors can identify the domain and destination.
- Support light and dark system preferences.
- Keep status language concise and scannable.
- Use subtle motion to indicate activity, provided reduced-motion preferences are respected.

## Anti-patterns to avoid

- Showing a branded logo without explaining the current state.
- Hiding the only useful instruction inside a `noscript` fallback.
- Blocking every product route without offering retry, support, or troubleshooting.
- Using an automatic refresh interval without communicating timing or progress.
- Treating visual emptiness as sufficient clarity.
- Allowing a security boundary to erase the visitor’s original product intent.
- Claiming promise delivery before verifying that challenged users can reach the product.

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