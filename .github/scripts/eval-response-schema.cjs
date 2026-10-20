'use strict';

// Keep these names aligned with eval-scoring.cjs validators. That file is not
// available beside this helper in the diagnostics tools sparse checkout.
const DIMENSIONS = {
  craft: [
    'Visual hierarchy',
    'Information density',
    'Readability',
    'Coherence',
    'Durability',
    'Intentionality',
  ],
  promise: [
    'Singular message',
    'Audience alignment',
    'CTA focus',
    'Claim specificity',
    'Redundancy',
  ],
  trust: [
    'Sequence',
    'Specificity',
    'Social proof quality',
    'Friction to first action',
    'Risk reduction',
  ],
  audience: [
    'Recognition',
    'Vocabulary fit',
    'CTA fit',
    'Cross-audience distraction',
    'Intentionality',
  ],
};

function buildResponseFormat(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    throw new TypeError('context must be an object');
  }
  if (!['craft', 'promise', 'trust', 'audience', 'other'].includes(context.lens)) {
    throw new Error(`Unsupported primary lens: ${context.lens}`);
  }
  if (!['baseline', 'reuse', 'delta'].includes(context.mode)) {
    throw new Error(`Unsupported craft mode: ${context.mode}`);
  }

  return {
    type: 'json_schema',
    name: 'evaluation_response',
    strict: true,
    schema: objectSchema({
      summaryMarkdown: text(
        'Non-empty evaluation summary, including patterns to borrow and anti-patterns to avoid. '
        + 'No score tables or human review sections.'
      ),
      primary: primarySchema(context.lens),
      craft: craftSchema(context.mode),
    }),
  };
}

function primarySchema(lens) {
  let items;
  if (lens === 'craft') {
    items = {
      type: 'array',
      minItems: 0,
      maxItems: 0,
      items: scoredItem(DIMENSIONS.craft),
      description: 'Must be empty. Craft scores belong only under craft, never under primary.',
    };
  } else if (lens === 'audience') {
    items = {
      type: 'array',
      minItems: 1,
      items: objectSchema({
        role: text('Non-empty, distinct representative role.'),
        hypothesis: text('Non-empty AI role hypothesis, not a human-validated finding.'),
        rationale: text('Non-empty rationale grounded in the captured evidence.'),
        dimensions: scoredArray(DIMENSIONS.audience),
      }),
    };
  } else if (lens === 'other') {
    const item = scoredItem();
    item.properties.score = {
      type: ['integer', 'null'],
      minimum: 1,
      maximum: 5,
      description: 'Use null only for an inconclusive result. Otherwise supply a justified score.',
    };
    items = { type: 'array', minItems: 1, items: item };
  } else {
    items = scoredArray(DIMENSIONS[lens]);
  }

  return objectSchema({
    noteMarkdown: text(
      lens === 'other'
        ? 'Evidence-limit explanation required when inconclusive is true; otherwise may be empty. '
          + 'No score tables or human review sections.'
        : 'May be empty. No score tables or human review sections.'
    ),
    inconclusive: lens === 'other'
      ? { type: 'boolean' }
      : { type: 'boolean', enum: [false] },
    items,
  });
}

function craftSchema(mode) {
  const properties = {
    mode: { type: 'string', enum: [mode] },
    summaryMarkdown: text('Non-empty craft summary. No score tables or human review sections.'),
  };

  if (mode === 'baseline') {
    properties.dimensions = scoredArray(DIMENSIONS.craft);
    properties.dimensions.description = 'Score each of the six craft dimensions exactly once.';
  } else if (mode === 'delta') {
    properties.changedDimensions = {
      type: 'array',
      minItems: 0,
      maxItems: DIMENSIONS.craft.length,
      items: objectSchema({
        ...scoredItem(DIMENSIONS.craft).properties,
        changeEvidence: text('Non-empty, specific evidence of material change from the baseline.'),
      }),
      description: 'Only materially changed dimensions, each at most once. Do not return a full table.',
    };
    properties.noMaterialChangeExplanation = text(
      'Must be non-empty when changedDimensions is empty. May be empty when changes are provided. '
      + 'No score tables or human review sections.'
    );
  }

  return objectSchema(properties);
}

function scoredArray(names) {
  return {
    type: 'array',
    minItems: names.length,
    maxItems: names.length,
    items: scoredItem(names),
    description: 'Include each named dimension exactly once.',
  };
}

function scoredItem(names) {
  return objectSchema({
    name: names
      ? { type: 'string', enum: [...names] }
      : text('Non-empty, distinct custom criterion name.'),
    score: { type: 'integer', minimum: 1, maximum: 5 },
    rationale: text('Non-empty rationale grounded in the captured evidence.'),
  });
}

function objectSchema(properties) {
  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

function text(description) {
  // String content and conditional requirements remain authoritative in buildEvaluation.
  return { type: 'string', description };
}

module.exports = { buildResponseFormat };
