---
name: human-ai-interaction-review
description: Evaluate AI-powered interfaces using Microsoft's HAX guidelines and newer Microsoft Research frameworks for generative AI reliance and human-agent collaboration. Use this skill to review capabilities, limitations, verification, correction, transparency, oversight, and user control.
---

# Human-AI interaction review

Review AI-powered interfaces using Microsoft's 18 Guidelines for Human-AI Interaction as the foundation, then apply newer Microsoft Research guidance for generative AI and agentic systems.

**Source**: Amershi, S. et al. "Guidelines for Human-AI Interaction." ACM CHI 2019.
**Toolkit**: [aka.ms/haxtoolkit](https://aka.ms/haxtoolkit)

The original guidelines remain Microsoft's canonical human-AI UX framework. They have not been replaced. The newer frameworks in this skill extend HAX for risks and interaction models that became more important with generative AI and autonomous agents.

---

## The 18 guidelines

### Initially

How AI should behave upon first interaction.

**G1. Make clear what the system can do**
Help the user understand what the AI system is capable of doing. Surface capabilities upfront so users form accurate mental models before they start.

**G2. Make clear how well the system can do what it can do**
Help the user understand how often the AI system may make mistakes. Set honest expectations about confidence and limitations.

### During interaction

How AI should behave during regular, ongoing use.

**G3. Time services based on context**
Time when to act or interrupt based on the user's current task and environment. Don't surface AI suggestions at the wrong moment.

**G4. Show contextually relevant information**
Display information relevant to the user's current task and environment. AI outputs should feel situated, not generic.

**G5. Match relevant social norms**
Ensure the experience is delivered in a way that users would expect, given their social and cultural context.

**G6. Mitigate social biases**
Ensure the AI system's language and behaviors do not reinforce undesirable and unfair stereotypes and biases.

### When wrong

How AI should behave when errors, failures, or unwanted actions occur.

**G7. Support efficient invocation**
Make it easy to invoke or request the AI system's services when needed.

**G8. Support efficient dismissal**
Make it easy to dismiss or ignore undesired AI system services.

**G9. Support efficient correction**
Make it easy to edit, refine, or recover when the AI system is wrong.

**G10. Scope services when in doubt**
Engage in disambiguation or gracefully degrade the AI system's services when uncertain about a user's goals.

**G11. Make clear why the system did what it did**
Enable the user to access an explanation of why the AI system behaved as it did.

### Over time

How AI should behave as the relationship between user and system evolves.

**G12. Remember recent interactions**
Maintain short-term memory and allow the user to make efficient references to that memory.

**G13. Learn from user behavior**
Personalize the user's experience by learning from their actions over time.

**G14. Update and adapt cautiously**
Limit disruptive changes when updating and adapting the AI system's behaviors.

**G15. Encourage granular feedback**
Enable the user to provide feedback indicating their preferences during regular interaction with the AI system.

**G16. Convey the consequences of user actions**
Immediately update or convey how user actions will impact future behaviors of the AI system.

**G17. Provide global controls**
Allow the user to globally customize what the AI system monitors and how it behaves.

**G18. Notify users about changes**
Inform the user when the AI system adds or updates its capabilities.

---

## Core guidelines to prioritize

When time is limited, start with these five guidelines:

1. **G1: Make clear what the system can do**
2. **G2: Make clear how well the system can do it**
3. **G9: Support efficient correction**
4. **G10: Scope services when in doubt**
5. **G11: Make clear why the system did what it did**

These establish realistic expectations, calibrated trust, recovery, uncertainty handling, and explainability. Apply other HAX guidelines when the product context makes them relevant.

---

## Newer Microsoft Research extensions

### Appropriate reliance on generative AI

Use the **Overreliance Risk Identification and Mitigation Framework** for products where users may accept generated answers, recommendations, summaries, or code without sufficient verification.

Review against three UX goals:

1. **Create realistic mental models**: Help users understand what the system can do, how it produces results, and where it is likely to fail.
2. **Signal when to verify**: Make risk, uncertainty, missing evidence, and high-impact situations visible at the moment they matter.
3. **Facilitate verification**: Give users practical ways to inspect sources, compare evidence, test outputs, or obtain a second perspective.

Do not assume that warnings or disclaimers reduce overreliance. Mitigations can backfire, so evaluate them with user research.

**Use for**: copilots, chat experiences, generated content, recommendations, summarization, code generation, and decision support.

### Human-agent communication

Use the **Challenges in Human-Agent Communication** framework when an agent plans work, uses tools, changes an environment, or completes multi-step tasks.

#### Across the interaction

- **X1. Verification**: How does the agent help the user verify its behavior?
- **X2. Consistency**: How does the agent convey whether its behavior will be consistent?
- **X3. Level of detail**: How does the agent choose an appropriate amount of information?
- **X4. Interaction history**: Which past interactions does the agent consider and communicate?

#### From the user to the agent

- **U1. Goal**: What should the agent achieve?
- **U2. Preferences**: Which user preferences should the agent respect?
- **U3. Adaptation**: What should the agent do differently next time?

#### From the agent to the user

- **A1. Capabilities**: What can the agent do?
- **A2. Intent**: What is the agent about to do?
- **A3. Progress**: What is the agent currently doing?
- **A4. Side effects**: Were there changes to the environment or unintended consequences?
- **A5. Outcome**: Was the user's goal achieved?

**Use for**: autonomous agents, tool-using assistants, long-running tasks, background work, multi-agent systems, and workflows with real-world side effects.

### Magentic-UI interaction mechanisms

Use the **Magentic-UI** research as an implementation reference for keeping people meaningfully involved in agentic work.

Evaluate whether the experience needs:

1. **Co-planning**: Let users review or shape the plan before execution.
2. **Co-tasking**: Let users contribute directly while the agent works.
3. **Action approval**: Pause before irreversible, sensitive, or consequential actions.
4. **Answer verification**: Help users inspect whether the result is supported and complete.
5. **Memory controls**: Make remembered information visible, editable, and removable.
6. **Multi-tasking**: Support safe monitoring and control across concurrent agent tasks.

These are interaction mechanisms, not a replacement checklist for HAX. Select them according to autonomy, reversibility, risk, and task duration.

---

## Credibility and provenance

These frameworks come from official Microsoft and Microsoft Research publications:

| Framework | Publication | Credibility |
|---|---|---|
| HAX guidelines | Amershi et al., ACM CHI 2019 | Synthesized from more than 150 recommendations and evaluated with 49 design practitioners across 20 AI products |
| Appropriate reliance | Vorvoreanu, Passi, Dhanorkar, Heger, and Walker, Microsoft Technical Report MSR-TR-2025-4 | Built from multiple Microsoft Research studies on overreliance and explicitly extends HAX G1, G2, and G11 |
| Human-agent communication | Bansal, Vaughan, Amershi, Horvitz, Fourney, Mozannar, Dibia, and Weld, MSR-TR-2024-53 | Microsoft-led research identifying 12 communication challenges introduced by autonomous agents |
| Magentic-UI | Mozannar, Bansal, Tan, Fourney, Dibia et al., Microsoft Technical Report MSR-TR-2025-40 | Open-source Microsoft research prototype evaluated through benchmarks, simulated testing, user studies, and safety assessments |

Official sources:

- [HAX Toolkit](https://aka.ms/haxtoolkit)
- [Appropriate reliance framework](https://aka.ms/overreliance-framework)
- [Human-agent communication research](https://www.microsoft.com/en-us/research/publication/human-agent-interaction-challenges/)
- [Magentic-UI research](https://www.microsoft.com/en-us/research/publication/magentic-ui-report/)

---

## Using this skill

### When to use

Use this skill when reviewing any interface where AI generates, recommends, decides, or acts on behalf of the user.

### How to review

1. **Identify the AI surface**: What is the AI doing in this interface?
2. **Apply core HAX**: Start with G1, G2, G9, G10, and G11, then select other relevant guidelines.
3. **Select the extension**: Add appropriate reliance for generated outputs and agent communication plus Magentic-UI for autonomous actions.
4. **Test failure and recovery**: Examine what happens when the AI is uncertain, incorrect, interrupted, or produces side effects.
5. **Prioritize by risk**: Give the most weight to user harm, irreversible actions, misplaced trust, and loss of control.

### Review output format

```
## Human-AI interaction review: [Feature/Surface Name]

### AI surface
[What the AI does in this interface]

### Phase assessment

| Phase | Guidelines checked | Status | Notes |
|-------|-------------------|--------|-------|
| Initially | G1, G2 | 🟢/🟠/⚫ | |
| During | G3, G4, G5, G6 | 🟢/🟠/⚫ | |
| When wrong | G7, G8, G9, G10, G11 | 🟢/🟠/⚫ | |
| Over time | G12-G18 | 🟢/🟠/⚫ | |
| Appropriate reliance | Mental model, verification signals, verification support | 🟢/🟠/⚫ | |
| Agent communication | X1-X4, U1-U3, A1-A5 | 🟢/🟠/⚫/N/A | |
| Human oversight | Co-planning, co-tasking, approvals, verification, memory, multi-tasking | 🟢/🟠/⚫/N/A | |

**Legend:** 🟢 Met | 🟠 Partially met | ⚫ Not met or missing | N/A Not applicable

### Key findings

**Critical gaps:**
1. [Guideline #] Issue and recommendation

**Improvements:**
1. [Guideline #] What to improve and how

### Verdict
[Pass / Needs work / Needs design support]
```

### Selecting relevant guidelines

Not every guideline or framework applies to every surface. A one-shot generation tool may not need the over-time guidelines. A low-autonomy suggestion feature may not need co-planning or action approvals. Document what was scoped out and why.

---

## Acknowledgments

The 18 Guidelines for Human-AI Interaction were created by Saleema Amershi, Dan Weld, Mihaela Vorvoreanu, Adam Fourney, Besmira Nushi, Penny Collisson, Jina Suh, Shamsi Iqbal, Paul Bennett, Kori Inkpen, Jaime Teevan, Ruth Kikin-Gil, and Eric Horvitz. Published at ACM CHI 2019, Glasgow, Scotland.

The newer guidance in this skill is based on Microsoft Research's Appropriate Reliance initiative, Challenges in Human-Agent Communication, and Magentic-UI research. These works extend the original guidelines for generative and agentic AI without replacing them.
