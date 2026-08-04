---
name: hax-guidelines
description: Evaluate AI-powered interfaces against Microsoft's 18 Human-AI Interaction (HAX) guidelines. Use this skill to review whether AI features communicate capabilities clearly, support user control, handle errors gracefully, and evolve responsibly over time.
---

# HAX guidelines

Review AI-powered interfaces using Microsoft's 18 Guidelines for Human-AI Interaction. These guidelines are specific, observable behaviors (not abstract principles) validated with 49 design practitioners across 20 AI products. They tell you what to look for at the UI level.

**Source**: Amershi, S. et al. "Guidelines for Human-AI Interaction." ACM CHI 2019.
**Toolkit**: [aka.ms/haxtoolkit](https://aka.ms/haxtoolkit)

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

## Using this skill

### When to use

Use HAX guidelines when reviewing any interface where AI generates, recommends, or automates something on behalf of the user. This includes: chat interfaces, code suggestions, content generation, smart defaults, predictive features, and agent-driven workflows.

### How to review

1. **Identify the AI surface**: What is the AI doing in this interface?
2. **Walk through the phases**: Initially, During, When Wrong, Over Time
3. **Flag gaps**: Which guidelines are violated or missing entirely?
4. **Prioritize**: Focus on guidelines that directly impact the user's ability to trust, control, and correct the AI

### Review output format

```
## HAX Review: [Feature/Surface Name]

### AI surface
[What the AI does in this interface]

### Phase assessment

| Phase | Guidelines checked | Status | Notes |
|-------|-------------------|--------|-------|
| Initially | G1, G2 | 🟢/🟠/⚫ | |
| During | G3, G4, G5, G6 | 🟢/🟠/⚫ | |
| When wrong | G7, G8, G9, G10, G11 | 🟢/🟠/⚫ | |
| Over time | G12-G18 | 🟢/🟠/⚫ | |

**Legend:** 🟢 Met | 🟠 Partially met | ⚫ Not met or missing

### Key findings

**Critical gaps:**
1. [Guideline #] Issue and recommendation

**Improvements:**
1. [Guideline #] What to improve and how

### Verdict
[Pass / Needs work / Needs design support]
```

### Selecting relevant guidelines

Not every guideline applies to every surface. A one-shot generation tool may not need G12-G18 (over time). A background AI service may not need G1-G2 if the user never directly invokes it. Use judgment, but document which guidelines you scoped out and why.

---

## Acknowledgments

The 18 Guidelines for Human-AI Interaction were created by Saleema Amershi, Dan Weld, Mihaela Vorvoreanu, Adam Fourney, Besmira Nushi, Penny Collisson, Jina Suh, Shamsi Iqbal, Paul Bennett, Kori Inkpen, Jaime Teevan, Ruth Kikin-Gil, and Eric Horvitz. Published at ACM CHI 2019, Glasgow, Scotland. The HAX Toolkit is maintained by Microsoft Research at [aka.ms/haxtoolkit](https://aka.ms/haxtoolkit).
