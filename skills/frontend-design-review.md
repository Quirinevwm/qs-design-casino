---
name: frontend-design-review
description: Review and create distinctive, production-grade frontend interfaces with high design quality and design system compliance. Evaluates using three pillars - frictionless insight-to-action, quality craft, and trustworthy building. Use for PR reviews, design reviews, accessibility checks, design system compliance, and creating memorable UI that avoids generic aesthetics.
acknowledgments: |
  This skill blends design review practices with creative frontend guidance inspired by Anthropic's frontend-design skill (https://github.com/anthropics/skills/tree/main/skills/frontend-design).
  Licensed under respective terms.
---

# Frontend Design Review Skill

Review UI implementations against design quality standards and your design system **OR** create distinctive, production-grade frontend interfaces from scratch. This skill covers both evaluating existing work and generating creative new interfaces.

## Two Modes of Operation

### Mode 1: Design Review
Evaluate existing UI implementations for:
- Design system compliance
- Three quality pillars (Frictionless, Quality Craft, Trustworthy)
- Accessibility and responsive design
- Code quality and token usage

### Mode 2: Creative Frontend Design
Create distinctive interfaces that:
- Avoid generic "AI slop" aesthetics
- Have clear conceptual direction
- Execute with precision and intention
- Match the context and purpose

---

## Part 1: Creative Frontend Design

When creating new interfaces, understand the context before coding.

### Design Thinking

Before coding, understand the context and commit to an aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Choose a direction: minimal, maximalist, retro-futuristic, organic/natural, luxury/refined, playful, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this distinctive and context-appropriate?

Choose a clear conceptual direction and execute it with precision. The key is intentionality, not intensity.

### Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate aesthetics. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

**AVOID generic AI aesthetics:**
- Overused font families (Inter, Roboto, Arial, Space Grotesk, system fonts)
- Cliched color schemes
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details.

---

## Part 2: Design Review (Existing Implementations)

When reviewing existing UI work, evaluate against design system standards and quality pillars.

### Design System Reference

**Figma Design System**: `[Link to your Figma design system]`

**Component Library / Storybook**: `[Link to your component library documentation]`

All UI implementations must align with components and patterns defined in your design system. When reviewing:
- Verify components match Figma specs (spacing, colors, typography)
- Check that variants and states are implemented as designed
- Ensure design tokens are used (not hardcoded values)
- Flag deviations from the design system without documented exceptions

### Design System Workflow

**Before implementing:**
1. Check if component exists in your design system Figma
2. Review component in your component library for API and usage examples
3. Review component variants and states in Figma
4. Use Figma Dev Mode to get exact specs (spacing, tokens, properties)
5. Implement using design system components + design tokens

**During review:**
1. Compare implementation to Figma design
2. Verify design tokens are used (check imports and usage)
3. Check all variants/states are implemented correctly
4. Flag any deviations (needs design approval)

**If component doesn't exist in design system:**
1. Check if existing component can be adapted
2. Reach out to design for new component creation
3. Document exception and rationale in code
4. Plan to migrate when design system is updated

### Review Process

1. **Identify user task**: What is the user trying to accomplish?
2. **Check design system**: Does this match a pattern in your design system?
3. **Evaluate aesthetic direction**: Is there clear conceptual intent?
4. **Identify scope**: Component, feature, or complete flow
5. **Gather context**: Screenshots, code, design files, or live implementation
6. **Evaluate each pillar** using criteria below
7. **Score and prioritize** issues by severity (blocking/major/minor)
8. **Provide recommendations** with design system component examples

### Core Principles

**Task completion:**
- Users must complete their core task with minimum clicks/interactions
- Every screen should answer: "What can I do here?" and "What happens next?"
- Common tasks should be optimized for efficiency

**Action hierarchy:**
- Limit primary actions to 1-2 per view
- Use your design system's primary/secondary/tertiary button hierarchy
- Progressive disclosure for additional options
- Pattern: Primary action in prominent position, contextual actions in overflow

**Onboarding:**
- Explain what the feature does when introducing it
- First-time experience should guide without blocking
- Smart defaults over configuration
- Examples: Recommendations, pre-configured templates, helpful examples

**Navigation:**
- Clear entry and exit points for every experience
- Back/cancel always available and obvious
- Breadcrumbs or context indicators for deep flows
- Clear navigation structure with preserved context

---

## Quality Pillars

### 1. Frictionless Insight to Action

**Evaluate:**
- **Task completion**: Can users complete their core task efficiently?
- **Action clarity**: Primary action is obvious and singular

**Red flags:** 
- Excessive clicks (>3 steps for primary workflows)
- Multiple competing primary buttons or buried primary actions

### 2. Quality is Craft

**Evaluate:**
- **Design system compliance**: Uses components from your design system, matches Figma specs, uses design tokens (not hardcoded values)
- **Aesthetic direction**: Clear conceptual intent with distinctive typography, cohesive colors, intentional motion (not generic AI patterns)

**Accessibility minimum**: Grade C (WCAG 2.1 A), Grade B ideal (WCAG 2.1 AA)

**Red flags:** 
- Generic AI aesthetics (overused fonts, cliched color schemes, predictable layouts)
- Hardcoded values instead of design tokens
- Implementation doesn't match Figma specs

### 3. Trustworthy Building

**Evaluate:**
- **AI transparency**: AI-generated content includes required disclaimer: "AI-generated content may be incorrect"
- **Error transparency**: Clear error messages with actionable next steps

**Red flags:** 
- Missing disclaimers on generated/AI content
- Opaque errors without guidance

---

## Pattern Examples

### Creative Frontend (New Interfaces)

**Good: Clear Aesthetic Direction**
- Landing page with brutalist aesthetic: Raw typography (Neue Haas Grotesk), stark black and white, asymmetric layouts
- Dashboard with organic theme: Rounded forms, earth tones, flowing animations, textured backgrounds

**Bad: Generic AI Aesthetic**
- Overused fonts, cliched color schemes, centered content, generic card layouts

### Design System Review (Existing Work)

**Good: Frictionless**
- Single primary button, clear task completion path

**Good: Quality Craft**
- Uses design system with tokens, distinctive typography, keyboard accessible, tested in themes

**Bad: Quality Craft**
- Hardcoded values, generic overused fonts, poor contrast in dark mode

---

## Review Output Format

```
## Frontend Design Review: [Component/Feature Name]

### Context
- **Purpose**: What problem does this solve? Who uses it?
- **Aesthetic Direction**: [If new design: describe the bold conceptual direction]
- **User Task**: What is the user trying to accomplish?

### Summary
[Pass/Needs Work/Blocked] - [One-line assessment]

### Design System Compliance (if applicable)
- [ ] Component exists in [Your Figma Design System]
- [ ] Component usage verified in [Your Component Library]
- [ ] Implementation matches Figma specs (spacing, colors, typography)
- [ ] Uses design tokens (not hardcoded values) - verified in code
- [ ] All variants match design system options
- [ ] Spacing verified against Figma Dev Mode
- [ ] Documented exception if deviating from design system

### Aesthetic Quality (especially for new designs)
- [ ] Clear conceptual direction (not generic AI aesthetic)
- [ ] Distinctive typography choices
- [ ] Cohesive color palette with CSS variables
- [ ] Intentional motion and micro-interactions
- [ ] Spatial composition creates visual interest
- [ ] Backgrounds and visual details add atmosphere

### Pillar Assessment

| Pillar | Status | Notes |
|--------|--------|-------|
| Frictionless | 🟢/🟠/⚫ | Task completion efficient, primary action clear |
| Quality Craft | 🟢/🟠/⚫ | Design system compliant, aesthetic distinctive, accessible |
| Trustworthy | 🟢/🟠/⚫ | AI disclaimers present, errors actionable |

**Legend:** 🟢 Pass | 🟠 Needs attention | ⚫ Blocking issue

### Design Critique
**Verdict:** [Pass / Needs work / Reach out to design for more support]

**Rationale:** [Brief explanation based on pillar assessment, design system compliance, and aesthetic direction]

**Criteria:**
- **Pass**: All pillars 🟢 or minor 🟠 that don't block user tasks, design system compliant, clear aesthetic direction
- **Needs work**: Multiple 🟠 or any critical workflow issues, design system deviations, or generic aesthetic choices
- **Reach out to design for more support**: Any ⚫ blocking issues, fundamental pattern problems, major design system violations, or need for aesthetic direction

### Issues

**Blocking (must fix before merge):**
1. [Pillar/Design System/Aesthetic] Issue description + recommendation with link

**Major (should fix):**
1. [Pillar/Design System/Aesthetic] Issue description + pattern suggestion with reference

**Minor (consider for refinement):**
1. [Pillar/Design System/Aesthetic] Issue description + optional improvement

### Recommendations
- [Design system component to use with link]
- [Specific code change with design token reference]
- [Typography recommendation for better aesthetic direction]
- [Motion/animation suggestion]
- [Link to design system in Figma]
```

---

## Review Type Modifiers

Adjust focus based on review context:

**PR Review**: 
- Focus: Code implementation, design system component usage, design token usage, accessibility in code
- Check: Proper imports, design tokens used (not hardcoded), ARIA attributes present
- Verify: Component matches Figma specs using Dev Mode

**Creative Frontend Review**: 
- Focus: Aesthetic direction, typography choices, visual distinctiveness, motion design
- Check: Clear conceptual intent, avoiding generic AI patterns, cohesive execution
- Verify: Implementation complexity matches vision (maximalist needs elaborate code, minimalist needs precision)

**Design Review**: 
- Focus: User flows, interaction patterns, visual hierarchy, navigation, design system alignment
- Check: Task completion path, action hierarchy, progressive disclosure
- Verify: All components exist in design system or have documented exceptions

**Accessibility Audit**: 
- Focus: Deep dive Quality Craft pillar
- Check: Keyboard testing, screen reader testing, contrast ratios, ARIA patterns
- Test with: Screen readers (NVDA, JAWS, Narrator), keyboard only, 200% zoom
- Verify: Design system accessibility features are properly implemented

**Security Review**: 
- Focus: Deep dive Trustworthy pillar
- Check: Default permissions, data handling, disclaimers, error information disclosure
- Verify: Using design system secure components (message bar for warnings, etc.)

**Design System Compliance Audit**:
- Focus: Deep dive design system usage
- Check: All components match Figma specs, design tokens used throughout, no hardcoded values
- Test: Compare implementation side-by-side with Figma using Dev Mode
- Verify: Component variants, spacing, colors, typography all match design system
- Document: Any deviations with rationale and plan to align

---

## Quick Checklist

Before approving any UI work:

**Design System Compliance:**
- [ ] Component verified in [Your Figma Design System]
- [ ] Component implementation checked in [Your Component Library]
- [ ] Figma Dev Mode specs followed (spacing, tokens, typography)
- [ ] Design tokens used (no hardcoded hex colors or pixel values)
- [ ] Token imports verified in code
- [ ] All variants/states implemented as designed in Figma
- [ ] Spacing measurements match Figma Dev Mode exactly
- [ ] Deviations documented with design approval

**Aesthetic Quality (especially for new designs):**
- [ ] Clear conceptual direction (not generic overused fonts and cliched schemes)
- [ ] Distinctive typography (avoid overused fonts)
- [ ] Cohesive color palette with CSS variables
- [ ] Intentional motion (staggered reveals, hover states)
- [ ] Visual interest through composition (asymmetry, overlap, grid-breaking)
- [ ] Atmosphere through backgrounds (gradients, textures, patterns)
- [ ] Implementation complexity matches vision

**Frictionless:**
- [ ] Core task completable efficiently (≤3 interactions)
- [ ] Single clear primary action per view

**Quality Craft:**
- [ ] Uses design system components (verified in Figma)
- [ ] Design tokens used (no hardcoded values)
- [ ] Distinctive aesthetic (not generic overused fonts/cliched schemes)
- [ ] Accessible (Grade C minimum, Grade B ideal)
- [ ] Keyboard navigation complete
- [ ] Tested in light/dark/high contrast modes

**Trustworthy:**
- [ ] AI-generated content has disclaimer
- [ ] Error messages are actionable

---

## Acknowledgments

This skill blends structured design review practices with creative frontend guidance. Creative frontend principles inspired by [Anthropic's frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design), which emphasizes bold aesthetic choices and avoiding generic AI patterns. Design system compliance and quality pillar framework developed for systematic UI evaluation.
