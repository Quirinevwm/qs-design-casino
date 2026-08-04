---
title: Communicating intent is design?
author: Quirine van Walt Meijer
published: 2026-02-24
source: https://medium.com/@quirinevanwaltmeijer/communicating-intent-is-design-6f78a7a5e39e
---

# Communicating intent is design?

## Where human judgment shapes quality

Over the past months I have been observing a shift in how design teams work as they move closer to code. Designers in my teams are spending more time closer to real product surfaces, lightweight repositories, and runnable prototypes, and less time producing static artifacts with redlines. This change did not start with a mandate or a new tool. It emerged from practice, as AI shortened cycles and made it possible to explore, test, and refine ideas directly in the environments where products live.

In this context, **communicating intent has become a core design task**. Not just expressing what something should look like, but making clear what it is trying to do, why it exists, and how it should behave. As loops speed up and multiply, alignment depends less on static outputs and more on shared understanding across design, product, and engineering.

## Double Diamond x AI

The Double Diamond continues to be relevant in this shift. It gives teams a shared language for when to open up and when to decide. In AI-accelerated cycles, it helps us stay oriented. It reminds us where we are in the flow, what we owe next, and what "done" should feel like. What has changed is not the process itself, but how many times we can run it, how quickly we can converge, and how closely those loops now sit to code.

![Design process Double Diamond. Two diamonds labeled Discover, Define, Validate, and Deliver, with a human evaluation callout at the first convergence.](https://cdn-images-1.medium.com/max/1024/1*cgNWSzrVcnciwhaxOmrEoA.png)

*[The Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/) is a visual representation of the design and innovation process, with human design evaluation callouts. Visual styling inspired by TheyDo's [Double Diamond feedback-loop diagrams](https://www.theydo.com/blog/articles/the-double-diamond-lacks-a-feedback-loop-so-we-built-it).*

The Double Diamond process was created at the British Design Council in the early 2000s and published in 2005 ([Design Council](https://www.designcouncil.org.uk/our-resources/the-double-diamond/history-of-the-double-diamond/)), led by Richard Eisermann and a multidisciplinary team seeking a clearer way to describe the rhythm of design work. Drawing on earlier divergence and convergence models, including work by Bela Banathy, the goal was to make the invisible structure of design visible. That clarity is why the model still holds today, especially as teams navigate fast-moving environments.

With AI accelerating parts of the process, we are judging our actual output: *Did we define the problem clearly? Is the intent coherent? Can we converge with confidence?* What is changing right now is not just our tools, but our rhythm. We are in a transition, actively figuring out what a designer's day and week look like when AI is part of the loop. As we experiment, reviews happen more often, and collaboration with AI becomes continuous rather than episodic. Even as each discipline brings its own process, a shared mental model helps keep **human judgment, taste, and clarity at the center**.

## Faster convergence and multiple diamonds with AI

AI shows up differently across the stages of the Double Diamond. In Discover, it is a powerful perspective expander. It pulls in competitor signals, fresh patterns, and references we might not find inside our usual circles. This is where many teams lean more heavily on AI today, using it to generate multiple options at scale.

> As Sander Bogers, Design Director Data & AI at Philips Experience Design, shared in a recent conversation: "AI opens the diverging stage. It lets designers explore far more possibilities."

It is a helpful reminder that our ability to open up has never been greater. What I am observing is that the real power appears when human judgment and AI work together to accelerate convergence. In Define and Deliver, designers take that wide spread of possibilities and turn it into clarity. This is where the compounding value becomes visible. We can spin up multiple doable Double Diamonds in parallel, form hypotheses quickly, and test them at a scale we never had access to before. AI gives us rapid exploration, and humans bring the decisive convergence that makes the work coherent, grounded, and shippable.

![Zoomed-in Double Diamond design process with human design evaluation callouts.](https://cdn-images-1.medium.com/max/1024/1*QiFVUtMtrjADIdMhqYWwWA.png)

- **From many options to refining the user JTBDs.** AI can sweep through broad spaces at speed, pulling in adjacent patterns, competitor moves, weak signals, and references that would take days to gather manually. It widens the inspiration funnel and gives us a high-resolution audit of what surrounds the problem. Convergence begins when humans decide which user jobs truly matter and which opportunities deserve deeper attention.
- **Synthesis with judgment.** Once the possibilities and inputs are on the table, AI can cluster themes and reveal relationships that help illuminate patterns, not just volume. This is still raw material. Designers bring judgment by interpreting what those patterns mean for users, the business, accessibility, and the brand. This is where we shape context, form the narrative, and decide which signals carry real weight.
- **Exit criteria that tighten the loops.** Acceleration shows up when shaped context becomes crisp: a clear problem statement, explicit quality principles, decision boundaries, and testable hypotheses. Leaving Define with this level of clarity speeds up the second diamond and removes churn. After Validate, we confirm hypotheses through user conversations, structured tests, and A/B experiments to understand what truly delivers value. In Deliver, we assess whether the output meets the quality bar as we build with engineering. This is where loops tighten, alignment strengthens, and solutions prove themselves in real contexts.

To make this practical, our team is experimenting with a working model that reflects this shift. Short output-focused standups, explicit quality principles, and diff-based testing create frequent moments to pause, learn, and realign. This structure makes space for collaboration with AI without losing human judgment. We are creating agent skills for front-end behavior analysis, creation, and quality reviews on design patterns. This gives designers and others fast, contextual feedback inside the real surface where decisions happen. By moving more of our work into a collective team GitHub repo, we can share skills, guidelines, styles, and small reusable patterns in a way that stays alive and easy to build on together. These rituals help us converge with clarity instead of drifting with volume. They make us work sharper.

## Converge to build to learn

To support this way of working, our team is moving more directly in the Terminal with GitHub Copilot CLI in VS Code. **A lightweight simplified mini-product, or baby-product, setup using the product's tech stack**, with Fluent components in our case, keeps designers close to the code surface, where intent and constraints carry through cleanly. Our mini-product setup is optimized for rapid prototyping and authenticated sharing of ideas. It is based on the production codebase's technology without testing, internationalization, telemetry, and server dependencies, creating more realistic and practical designs while facilitating handoff. GitHub Copilot helps us clone repos, generate variants, leverage our Storybook MCP, push prototypes into branches, and spin up Azure Static Web Apps for secure sharing with colleagues.

![Screen capture of Visual Studio Code showcasing components in a mini-product repository.](https://cdn-images-1.medium.com/max/1024/1*Czzg_8hhOQ1surHYIz1_qQ.png)

*Screen capture of a mini-product with components created by UX Engineers James Bradford and Stephanie Keske in VS Code, leveraging GitHub Copilot in the Terminal.*

As design teams start moving closer to code, traditional static UI starts to strain as well. When intent is small, contextual, and dynamic, interfaces need to adapt without adding cognitive or operational overhead. The same goes for our end users. This is where generative UI patterns begin to matter, not as futuristic abstractions, but as practical responses to real conditions. When interfaces can be generated, adjusted, or composed at runtime, and when interaction moves fluidly between text, structure, and behavior, teams can support many small surfaces without overwhelming users or themselves. Terminal UI and CLI design are not a new destination, but one newly discovered by more designers as our work shifts closer to code and runtime behavior.

What enables that:

- **Close to the code surface.** We are using a lightweight mini-product setup with our product-specific Fluent components, which keeps intent and constraints intact and lets designers share realistic variants confidently with engineering. In that sense, it changes how we think about handing off designs.
- **Safe speed.** Local mocks and fewer production dependencies allow us to explore behavior without risk while keeping accessibility and reflow top of mind.
- **Taste early.** Cross-functional reviews guided by shared principles and diffs keep convergence fast, principled, and grounded in how the product behaves.

Together, these practices are helping us navigate a transition. As we test ideas in context and refine decisions with more confidence, we are learning what to automate, what to review more often, and where human judgment needs protected space.

In the end, all of this is about sharpening intent. When we are clear about what we are trying to make and why, **the tools amplify the craft instead of competing with it.** What continues to matter most is a designer's sensitivity to quality: noticing where intent drifts, where symmetry or coherence slips, and where the work still needs human judgment to feel right.

*Q, with support from Copilot CLI (Claude Sonnet 4.6)*

> *Special note: Thank you, Jay Tan. You interviewed me for the Microsoft Design blog and made me feel comfortable sharing thoughts with the community. Your curiosity, kindness, and belief in designers meant a lot. You are very much missed, and I will remember you dearly.*

Related: [Vibe coding makes prototyping close to code, closer to users](https://medium.com/microsoft-design/vibe-coding-makes-prototyping-close-to-code-closer-to-users-1129c0bf556c)

Originally published on [Medium](https://medium.com/@quirinevanwaltmeijer/communicating-intent-is-design-6f78a7a5e39e).
