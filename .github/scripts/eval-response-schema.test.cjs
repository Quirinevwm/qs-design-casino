'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const { buildResponseFormat } = require('./eval-response-schema.cjs');
const { buildEvaluation } = require('./eval-scoring.cjs');

const DIMENSIONS = {
  craft: [
    'Visual hierarchy', 'Information density', 'Readability',
    'Coherence', 'Durability', 'Intentionality',
  ],
  promise: [
    'Singular message', 'Audience alignment', 'CTA focus', 'Claim specificity', 'Redundancy',
  ],
  trust: [
    'Sequence', 'Specificity', 'Social proof quality', 'Friction to first action', 'Risk reduction',
  ],
  audience: [
    'Recognition', 'Vocabulary fit', 'CTA fit', 'Cross-audience distraction', 'Intentionality',
  ],
};
const LENSES = ['craft', 'promise', 'trust', 'audience', 'other'];
const MODES = ['baseline', 'reuse', 'delta'];

test('format uses the Responses API envelope and only the existing response fields', () => {
  const format = buildResponseFormat({ lens: 'craft', mode: 'baseline' });
  assert.deepEqual(Object.keys(format), ['type', 'name', 'strict', 'schema']);
  assert.equal(format.type, 'json_schema');
  assert.equal(format.name, 'evaluation_response');
  assert.equal(format.strict, true);
  assert.equal(format.schema.type, 'object');
  assert.deepEqual(format.schema.required, ['summaryMarkdown', 'primary', 'craft']);
  assert.deepEqual(format.schema.properties.summaryMarkdown.type, 'string');
  assert.match(format.schema.properties.summaryMarkdown.description, /Non-empty/);
  assert.deepEqual(
    format.schema.properties.primary.required,
    ['noteMarkdown', 'inconclusive', 'items']
  );
  assert.equal(format.schema.properties.primary.properties.noteMarkdown.type, 'string');
  assert.match(format.schema.properties.primary.properties.noteMarkdown.description, /May be empty/);
});

for (const lens of LENSES) {
  for (const mode of MODES) {
    test(`${lens}/${mode} is closed, fully required and compatible with buildEvaluation`, () => {
      const context = contextFixture(lens, mode);
      const format = buildResponseFormat(context);
      assertStrictSchema(format.schema);
      assert.deepEqual(format.schema.properties.craft.properties.mode.enum, [mode]);
      if (lens !== 'other') {
        assert.deepEqual(format.schema.properties.primary.properties.inconclusive.enum, [false]);
      }

      const built = buildEvaluation({
        context,
        responseText: JSON.stringify(responseFixture(lens, mode)),
        model: 'gpt-5-mini',
      });
      assert.equal(built.record.primaryLens, lens);
      assert.equal(built.record.model, 'gpt-5-mini');
      assert.equal(built.record.ai.craft.evaluationMode, mode);
      assert.equal(built.record.ai.craft.totalScore, { baseline: 28, reuse: 21, delta: 23 }[mode]);
      assert.deepEqual(
        built.record.ai.craft.scores.map((item) => item.name),
        DIMENSIONS.craft
      );
      if (lens === 'craft') {
        assert.deepEqual(built.record.ai.primary.items, []);
        assert.doesNotMatch(built.markdown, /## Primary lens review/);
      }
    });
  }
}

test('craft lens cannot emit primary scores in any craft mode', () => {
  for (const mode of MODES) {
    const primary = buildResponseFormat({ lens: 'craft', mode }).schema.properties.primary;
    assert.equal(primary.properties.items.type, 'array');
    assert.equal(primary.properties.items.minItems, 0);
    assert.equal(primary.properties.items.maxItems, 0);
    assert.equal(primary.properties.items.items.type, 'object');
    assert.match(primary.properties.items.description, /only under craft/);
    assert.deepEqual(primary.properties.inconclusive, { type: 'boolean', enum: [false] });
  }
});

test('baseline requires exactly six named craft dimensions with integer scores from 1 to 5', () => {
  const craft = buildResponseFormat({ lens: 'craft', mode: 'baseline' }).schema.properties.craft;
  assert.deepEqual(craft.required, ['mode', 'summaryMarkdown', 'dimensions']);
  assertScoredArray(craft.properties.dimensions, DIMENSIONS.craft);
});

test('reuse has no score fields or dimension arrays', () => {
  const craft = buildResponseFormat({ lens: 'promise', mode: 'reuse' }).schema.properties.craft;
  assert.deepEqual(craft.required, ['mode', 'summaryMarkdown']);
  assert.deepEqual(Object.keys(craft.properties), ['mode', 'summaryMarkdown']);
  assert.equal(craft.additionalProperties, false);
});

test('delta only permits changed dimensions and requires the explanation string', () => {
  const craft = buildResponseFormat({ lens: 'trust', mode: 'delta' }).schema.properties.craft;
  assert.deepEqual(craft.required, [
    'mode', 'summaryMarkdown', 'changedDimensions', 'noMaterialChangeExplanation',
  ]);
  assert.equal(craft.additionalProperties, false);
  assert.equal(craft.properties.changedDimensions.minItems, 0);
  assert.equal(craft.properties.changedDimensions.maxItems, 6);
  const item = craft.properties.changedDimensions.items;
  assert.deepEqual(item.required, ['name', 'score', 'rationale', 'changeEvidence']);
  assert.deepEqual(item.properties.name.enum, DIMENSIONS.craft);
  assert.deepEqual(item.properties.score, { type: 'integer', minimum: 1, maximum: 5 });
  assert.equal(item.properties.changeEvidence.type, 'string');
  assert.match(item.properties.changeEvidence.description, /Non-empty/);
  assert.equal(craft.properties.noMaterialChangeExplanation.type, 'string');
  assert.match(craft.properties.noMaterialChangeExplanation.description, /May be empty when changes/);
});

test('promise and trust use their exact named dimensions, not craft dimensions', () => {
  for (const lens of ['promise', 'trust']) {
    const primary = buildResponseFormat({ lens, mode: 'baseline' }).schema.properties.primary;
    assertScoredArray(primary.properties.items, DIMENSIONS[lens]);
  }
});

test('audience items are role hypotheses with five nested dimensions', () => {
  const primary = buildResponseFormat({ lens: 'audience', mode: 'baseline' }).schema.properties.primary;
  assert.equal(primary.properties.items.minItems, 1);
  const role = primary.properties.items.items;
  assert.deepEqual(role.required, ['role', 'hypothesis', 'rationale', 'dimensions']);
  assert.equal(role.properties.role.type, 'string');
  assert.equal(role.properties.hypothesis.type, 'string');
  assert.equal(role.properties.rationale.type, 'string');
  assertScoredArray(role.properties.dimensions, DIMENSIONS.audience);
});

test('other permits custom names and nullable scores without fixing inconclusive', () => {
  const primary = buildResponseFormat({ lens: 'other', mode: 'baseline' }).schema.properties.primary;
  assert.deepEqual(primary.properties.inconclusive, { type: 'boolean' });
  assert.equal(primary.properties.items.minItems, 1);
  const item = primary.properties.items.items;
  assert.deepEqual(item.required, ['name', 'score', 'rationale']);
  assert.equal(item.properties.name.type, 'string');
  assert.equal(Object.hasOwn(item.properties.name, 'enum'), false);
  assert.deepEqual(item.properties.score.type, ['integer', 'null']);
  assert.equal(item.properties.score.minimum, 1);
  assert.equal(item.properties.score.maximum, 5);

  const response = responseFixture('other', 'baseline');
  response.primary.inconclusive = false;
  response.primary.noteMarkdown = '';
  response.primary.items[0].score = 5;
  const built = buildEvaluation({
    context: contextFixture('other', 'baseline'),
    responseText: JSON.stringify(response),
    model: 'gpt-5-mini',
  });
  assert.equal(built.record.ai.primary.items[0].score, 5);
  assert.equal(built.record.ai.primary.inconclusive, false);
});

test('empty delta requires a meaningful explanation through the authoritative validator', () => {
  const context = contextFixture('craft', 'delta');
  const response = responseFixture('craft', 'delta');
  response.craft.changedDimensions = [];
  response.craft.noMaterialChangeExplanation = 'Only an incidental counter changed; craft is unchanged.';
  const built = buildEvaluation({ context, responseText: JSON.stringify(response), model: 'gpt-5-mini' });
  assert.equal(built.record.ai.craft.evaluationMode, 'no-material-change');
  assert.equal(built.record.ai.craft.totalScore, 21);

  response.craft.noMaterialChangeExplanation = '';
  assert.throws(
    () => buildEvaluation({ context, responseText: JSON.stringify(response), model: 'gpt-5-mini' }),
    /noMaterialChangeExplanation must be a non-empty string/
  );
});

test('narrative content remains validated at runtime rather than adding unsupported string keywords', () => {
  const context = contextFixture('craft', 'baseline');
  const response = responseFixture('craft', 'baseline');
  response.summaryMarkdown = '   ';
  assert.throws(
    () => buildEvaluation({ context, responseText: JSON.stringify(response), model: 'gpt-5-mini' }),
    /summaryMarkdown must be a non-empty string/
  );
});

test('unsupported contexts fail explicitly rather than falling back to another lens or mode', () => {
  for (const context of [undefined, null, [], 'craft', 1, true]) {
    assert.throws(() => buildResponseFormat(context), /context must be an object/);
  }
  for (const lens of [undefined, null, '', 'Craft', 'unknown', '__proto__', 'constructor', 'toString']) {
    assert.throws(() => buildResponseFormat({ lens, mode: 'baseline' }), /Unsupported primary lens/);
  }
  for (const mode of [undefined, null, '', 'Baseline', 'unknown', '__proto__', 'constructor']) {
    assert.throws(() => buildResponseFormat({ lens: 'craft', mode }), /Unsupported craft mode/);
  }
});

test('format is model-independent, does not mutate context and returns isolated schemas', () => {
  const context = Object.freeze({ lens: 'craft', mode: 'baseline' });
  const original = buildResponseFormat(context);
  const changed = buildResponseFormat(context);
  changed.schema.properties.craft.properties.dimensions.items.properties.name.enum[0] = 'Wrong';
  changed.schema.properties.craft.properties.dimensions.items.properties.score.minimum = 0;
  assert.deepEqual(buildResponseFormat(context), original);
  assert.deepEqual(buildResponseFormat({
    ...context,
    model: 'another-deployment',
    rubric: { dimensions: ['not canonical validator names'] },
  }), original);
});

test('helper loads without eval-scoring or any adjacent modules in a sparse checkout', () => {
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(fs.readFileSync(require.resolve('./eval-response-schema.cjs'), 'utf8'), sandbox);
  const format = sandbox.module.exports.buildResponseFormat({ lens: 'craft', mode: 'baseline' });
  assert.equal(format.name, 'evaluation_response');
  assert.equal(format.schema.type, 'object');
});

function assertScoredArray(schema, names) {
  assert.equal(schema.type, 'array');
  assert.equal(schema.minItems, names.length);
  assert.equal(schema.maxItems, names.length);
  assert.deepEqual(schema.items.required, ['name', 'score', 'rationale']);
  assert.deepEqual(schema.items.properties.name.enum, names);
  assert.deepEqual(schema.items.properties.score, { type: 'integer', minimum: 1, maximum: 5 });
  assert.equal(schema.items.properties.rationale.type, 'string');
}

function assertStrictSchema(schema) {
  const supportedKeywords = [
    'type', 'properties', 'required', 'additionalProperties',
    'items', 'enum', 'minimum', 'maximum', 'minItems', 'maxItems', 'description',
  ];
  for (const key of Object.keys(schema)) {
    assert.ok(supportedKeywords.includes(key), `Unexpected schema keyword: ${key}`);
  }
  if (schema.type === 'object') {
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(schema.required, Object.keys(schema.properties));
    for (const child of Object.values(schema.properties)) assertStrictSchema(child);
  } else if (schema.type === 'array') {
    assert.ok(schema.items && typeof schema.items === 'object');
    assertStrictSchema(schema.items);
  }
}

function scoredItems(names, score = 4) {
  return names.map((name) => ({
    name,
    score,
    rationale: `${name} is supported by the captured layout and copy.`,
  }));
}

function contextFixture(lens, mode) {
  return {
    schemaVersion: 'eval-scoring/v1',
    lens,
    mode,
    reportPath: `weekly-eval-bets/schema-${lens}-${mode}.md`,
    captureDir: 'weekly-eval-bets/screenshots/schema-current',
    targetUrl: 'https://example.com/product',
    canonicalUrl: 'https://example.com/product',
    issue: { title: 'Captured product page evaluation', body: '' },
    rubric: { id: 'rubric-v1' },
    rubricHash: 'fixture-rubric-hash',
    captureContext: { viewport: 'desktop', locale: 'en-US' },
    captureContextHash: 'fixture-context-hash',
    evidenceHash: 'fixture-current-hash',
    screenshots: {
      current: {
        pageText: 'screenshots/schema-current/page-text.txt',
        pageHtml: 'screenshots/schema-current/page-content.html',
        aboveTheFold: 'screenshots/schema-current/above-the-fold.png',
        fullPage: 'screenshots/schema-current/full-page.png',
        midPage: 'screenshots/schema-current/mid-page.png',
        mobile: 'screenshots/schema-current/mobile.png',
      },
    },
    comparison: mode === 'baseline' ? null : {
      baselineScores: scoredItems(DIMENSIONS.craft, 3),
      baselineReportPath: 'weekly-eval-bets/schema-baseline.md',
      baselineCaptureDir: 'weekly-eval-bets/screenshots/schema-baseline',
      baselineEvidenceHash: 'fixture-baseline-hash',
      sourceReportPath: 'weekly-eval-bets/schema-baseline.md',
      sourceCaptureDir: 'weekly-eval-bets/screenshots/schema-baseline',
      sourceEvidenceHash: 'fixture-baseline-hash',
    },
  };
}

function responseFixture(lens, mode) {
  const primary = { noteMarkdown: '', inconclusive: false, items: [] };
  if (lens === 'promise' || lens === 'trust') {
    primary.items = scoredItems(DIMENSIONS[lens]);
  } else if (lens === 'audience') {
    primary.items = [{
      role: 'Design system lead',
      hypothesis: 'Likely recognizes the standards-oriented operations offer.',
      rationale: 'The copy emphasizes repeatability and coherence.',
      dimensions: scoredItems(DIMENSIONS.audience),
    }];
  } else if (lens === 'other') {
    primary.inconclusive = true;
    primary.noteMarkdown = 'The capture cannot verify operational claims beyond the visible page.';
    primary.items = [{
      name: 'Evidence sufficiency',
      score: null,
      rationale: 'The product state needed to verify the claim is not visible.',
    }];
  }
  const craft = { mode, summaryMarkdown: 'Craft reflects only the comparable captured evidence.' };
  if (mode === 'baseline') {
    craft.dimensions = scoredItems(DIMENSIONS.craft);
  } else if (mode === 'delta') {
    craft.changedDimensions = [{
      name: 'Visual hierarchy',
      score: 5,
      rationale: 'The new proof card creates a stronger focal point.',
      changeEvidence: 'A proof card now precedes the CTA where the baseline had no proof.',
    }];
    craft.noMaterialChangeExplanation = '';
  }
  return {
    summaryMarkdown: 'Borrow the focused entry point; avoid repeating broad claims without proof.',
    primary,
    craft,
  };
}
