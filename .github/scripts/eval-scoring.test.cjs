'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { prepareEvaluation, buildEvaluation } = require('./eval-scoring.cjs');

const TEST_ROOT_PREFIX = path.join(os.tmpdir(), 'eval-scoring-fixture-');
const testRoots = [];
const DEFAULT_RUBRIC = { id: 'rubric-v1', dimensions: ['craft', 'trust'] };
const DEFAULT_CONTEXT = { viewport: 'desktop', locale: 'en-US' };
const DEFAULT_URL = 'https://example.com/product?view=landing#hero';

test.after(() => {
  for (const rootDir of testRoots) fs.rmSync(rootDir, { recursive: true, force: true });
});

test('baseline create includes exact arithmetic and one-time craft baseline', () => {
  const rootDir = createRepoRoot();
  const reportPath = 'weekly-eval-bets/2026-W40_example-promise.md';
  const captureDir = 'weekly-eval-bets/screenshots/2026-W40_example_RUN1';
  createCapture(rootDir, captureDir, { seed: 'baseline-a' });

  const prepared = prepareEvaluation({
    rootDir,
    reportPath,
    captureDir,
    targetUrl: DEFAULT_URL,
    issue: {
      title: 'Example promise clarity audit',
      body: '### Primary lens\nPromise clarity',
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  assert.equal(prepared.context.mode, 'baseline');
  assert.equal(prepared.context.lens, 'promise');
  assert.equal(countImages(prepared.requestContent), 4);
  assert.match(
    prepared.requestContent[0].text,
    /This run must establish the comparable craft baseline once/
  );

  const response = {
    summaryMarkdown: 'The page is clear enough to evaluate both message and craft.',
    primary: {
      noteMarkdown: 'Promise clarity is scored separately from craft.',
      inconclusive: false,
      items: [
        { name: 'Singular message', score: 4, rationale: 'The headline stays focused.' },
        { name: 'Audience alignment', score: 3, rationale: 'The value proposition fits likely buyers.' },
        { name: 'CTA focus', score: 4, rationale: 'A single action leads the fold.' },
        { name: 'Claim specificity', score: 2, rationale: 'Claims stay broad and under-evidenced.' },
        { name: 'Redundancy', score: 3, rationale: 'Some repeated phrasing slows the page.' },
      ],
    },
    craft: {
      mode: 'baseline',
      summaryMarkdown: 'Craft is established here as the comparable baseline.',
      dimensions: craftDimensions({
        'Visual hierarchy': 4,
        'Information density': 3,
        Readability: 4,
        Coherence: 5,
        Durability: 3,
        Intentionality: 4,
      }),
    },
  };

  const built = buildEvaluation({
    context: prepared.context,
    responseText: JSON.stringify(response),
    model: 'test-model',
  });

  assert.equal(built.record.ai.craft.totalScore, 28);
  assert.match(built.markdown, /comparable craft baseline once/i);
  assert.match(built.markdown, /\*\*28\/35\*\*/);
  assert.match(built.markdown, /\| Singular message \| 4\/5 \|/);

  writeArtifacts(rootDir, reportPath, built);
});

test('exact reuse across weeks and lenses keeps craft separate from new primary scoring', () => {
  const rootDir = createRepoRoot();
  const baseline = createBaselineRecord({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W40_example-promise.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    lensTitle: 'Example promise clarity audit',
    lensBody: '### Primary lens\nPromise clarity',
  });

  fs.cpSync(
    path.join(rootDir, baseline.captureDir),
    path.join(rootDir, 'weekly-eval-bets/screenshots/2026-W41_example_RUN1'),
    { recursive: true }
  );

  const preparedWithCopiedEvidence = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W41_example-trust.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W41_example_RUN1',
    targetUrl: DEFAULT_URL,
    issue: {
      title: 'Example trust architecture check',
      body: '### Primary lens\nTrust architecture',
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  assert.equal(preparedWithCopiedEvidence.context.mode, 'reuse');
  assert.equal(preparedWithCopiedEvidence.context.lens, 'trust');
  assert.equal(countImages(preparedWithCopiedEvidence.requestContent), 4);

  const built = buildEvaluation({
    context: preparedWithCopiedEvidence.context,
    responseText: JSON.stringify({
      summaryMarkdown: 'Trust can be reviewed without rescoring craft.',
      primary: {
        noteMarkdown: 'Trust architecture is scored independently.',
        inconclusive: false,
        items: [
          { name: 'Sequence', score: 4, rationale: 'Proof follows the promise in a sensible order.' },
          { name: 'Specificity', score: 3, rationale: 'Some claims need clearer evidence.' },
          { name: 'Social proof quality', score: 2, rationale: 'Social proof is generic.' },
          { name: 'Friction to first action', score: 4, rationale: 'The first action stays easy to find.' },
          { name: 'Risk reduction', score: 3, rationale: 'Risk language exists but stays thin.' },
        ],
      },
      craft: {
        mode: 'reuse',
        summaryMarkdown: 'Craft remains aligned with the existing comparable baseline.',
      },
    }),
    model: 'test-model',
  });

  assert.match(built.markdown, /Craft scores are reused from the comparable baseline/);
  assert.doesNotMatch(built.markdown, /\| Visual hierarchy \| 1x \|/);
  assert.doesNotMatch(built.markdown, /### Human craft review/);
  assert.equal(built.record.ai.craft.referenceStatus, 'reused');
  assert.equal(
    built.record.ai.craft.provenance.baselineReportPath,
    'weekly-eval-bets/2026-W40_example-promise.md'
  );
});

test('unchanged craft-primary repeat reuse does not duplicate a primary craft section', () => {
  const rootDir = createRepoRoot();
  const baseline = createBaselineRecord({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W40_example-craft.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    lensTitle: 'Example first-impression craft evaluation',
    lensBody: '### Primary lens\nCraft',
  });

  fs.cpSync(
    path.join(rootDir, baseline.captureDir),
    path.join(rootDir, 'weekly-eval-bets/screenshots/2026-W41_example_RUN1'),
    { recursive: true }
  );

  const prepared = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W41_example-craft.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W41_example_RUN1',
    targetUrl: DEFAULT_URL,
    issue: {
      title: 'Example first-impression craft evaluation',
      body: '### Primary lens\nCraft',
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  assert.equal(prepared.context.mode, 'reuse');
  assert.equal(prepared.context.lens, 'craft');

  const built = buildEvaluation({
    context: prepared.context,
    responseText: JSON.stringify({
      summaryMarkdown: 'The evidence matches the stored comparable craft baseline.',
      primary: {
        noteMarkdown: '',
        inconclusive: false,
        items: [],
      },
      craft: {
        mode: 'reuse',
        summaryMarkdown: 'No new craft scoring is needed.',
      },
    }),
    model: 'test-model',
  });

  assert.doesNotMatch(built.markdown, /## Primary lens review/);
  assert.match(built.markdown, /Craft scores are reused from the comparable baseline/);
});

test('changed evidence only reports reassessed craft dimensions and composes totals correctly', () => {
  const rootDir = createRepoRoot();
  createBaselineRecord({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W40_example-promise.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    lensTitle: 'Example promise clarity audit',
    lensBody: '### Primary lens\nPromise clarity',
  });

  const captureDir = 'weekly-eval-bets/screenshots/2026-W41_example_RUN2';
  createCapture(rootDir, captureDir, { seed: 'baseline-b', overrides: { 'mid-page.png': 'changed-mid' } });

  const prepared = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W41_example-promise.md',
    captureDir,
    targetUrl: DEFAULT_URL,
    issue: {
      title: 'Example promise clarity audit',
      body: '### Primary lens\nPromise clarity',
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  assert.equal(prepared.context.mode, 'delta');
  assert.equal(countImages(prepared.requestContent), 8);
  assert.match(prepared.requestContent.map((item) => item.text || '').join('\n'), /Baseline page text/);

  const built = buildEvaluation({
    context: prepared.context,
    responseText: JSON.stringify({
      summaryMarkdown: 'The page shifted enough to reassess only the materially affected craft dimensions.',
      primary: {
        noteMarkdown: 'Promise clarity moved slightly with the new proof block.',
        inconclusive: false,
        items: [
          { name: 'Singular message', score: 4, rationale: 'The message stays focused.' },
          { name: 'Audience alignment', score: 3, rationale: 'The page still fits the buyer.' },
          { name: 'CTA focus', score: 4, rationale: 'The CTA remains easy to spot.' },
          { name: 'Claim specificity', score: 3, rationale: 'New proof adds some specificity.' },
          { name: 'Redundancy', score: 3, rationale: 'Repeated phrasing still exists.' },
        ],
      },
      craft: {
        mode: 'delta',
        summaryMarkdown: 'Only hierarchy and readability needed reassessment.',
        changedDimensions: [
          {
            name: 'Visual hierarchy',
            score: 5,
            rationale: 'The new proof card now anchors the fold with a stronger entry point.',
            changeEvidence: 'A prominent mid-page proof block adds a clearer focal sequence.',
          },
          {
            name: 'Readability',
            score: 5,
            rationale: 'The revised proof copy is shorter and easier to scan.',
            changeEvidence: 'The updated mid-page module replaces dense copy with shorter lines.',
          },
        ],
      },
    }),
    model: 'test-model',
  });

  assert.equal(built.record.ai.craft.totalScore, 30);
  assert.deepEqual(
    built.record.ai.craft.reassessedDimensions,
    ['Visual hierarchy', 'Readability']
  );
  assert.match(built.markdown, /\| Visual hierarchy \| 4\/5 \| 5\/5 \|/);
  assert.match(built.markdown, /\| Readability \| 4\/5 \| 5\/5 \|/);
  assert.doesNotMatch(built.markdown, /\| Durability \| 3\/5 \| 3\/5 \|/);
});

test('no material change keeps the originating baseline reference for later exact reuse', () => {
  const rootDir = createRepoRoot();
  createBaselineRecord({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W40_example-promise.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    lensTitle: 'Example promise clarity audit',
    lensBody: '### Primary lens\nPromise clarity',
  });

  const changedCaptureDir = 'weekly-eval-bets/screenshots/2026-W41_example_RUN2';
  createCapture(rootDir, changedCaptureDir, { seed: 'baseline-c', overrides: { 'page-text.txt': 'counter 102' } });

  const prepared = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W41_example-promise.md',
    captureDir: changedCaptureDir,
    targetUrl: DEFAULT_URL,
    issue: {
      title: 'Example promise clarity audit',
      body: '### Primary lens\nPromise clarity',
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  const built = buildEvaluation({
    context: prepared.context,
    responseText: JSON.stringify({
      summaryMarkdown: 'The evidence changed, but only with a dynamic counter update.',
      primary: {
        noteMarkdown: 'Promise clarity remains substantially the same.',
        inconclusive: false,
        items: [
          { name: 'Singular message', score: 4, rationale: 'The message is unchanged.' },
          { name: 'Audience alignment', score: 3, rationale: 'Audience framing is unchanged.' },
          { name: 'CTA focus', score: 4, rationale: 'CTA placement is unchanged.' },
          { name: 'Claim specificity', score: 2, rationale: 'Claims remain broad.' },
          { name: 'Redundancy', score: 3, rationale: 'Repeated phrasing remains.' },
        ],
      },
      craft: {
        mode: 'delta',
        summaryMarkdown: 'No craft dimension changed in a materially relevant way.',
        changedDimensions: [],
        noMaterialChangeExplanation: 'Only a live counter changed. Layout, content hierarchy, and readability stayed materially the same.',
      },
    }),
    model: 'test-model',
  });

  writeArtifacts(rootDir, 'weekly-eval-bets/2026-W41_example-promise.md', built);

  assert.equal(built.record.ai.craft.evaluationMode, 'no-material-change');
  assert.equal(
    built.record.ai.craft.provenance.baselineReportPath,
    'weekly-eval-bets/2026-W40_example-promise.md'
  );

  const preparedAgain = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W42_example-trust.md',
    captureDir: changedCaptureDir,
    targetUrl: DEFAULT_URL,
    issue: {
      title: 'Example trust architecture check',
      body: '### Primary lens\nTrust architecture',
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  assert.equal(preparedAgain.context.mode, 'reuse');
  assert.equal(
    preparedAgain.context.comparison.baselineReportPath,
    'weekly-eval-bets/2026-W40_example-promise.md'
  );
  assert.equal(
    preparedAgain.context.comparison.sourceReportPath,
    'weekly-eval-bets/2026-W41_example-promise.md'
  );
});

test('prior human edits in markdown are not ingested back into craft reuse decisions', () => {
  const rootDir = createRepoRoot();
  const baseline = createBaselineRecord({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W40_example-promise.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    lensTitle: 'Example promise clarity audit',
    lensBody: '### Primary lens\nPromise clarity',
  });

  const markdownPath = path.join(rootDir, baseline.reportPath);
  fs.appendFileSync(markdownPath, '\n\nHuman override: Visual hierarchy 1/5, everything else 5/5.\n');

  fs.cpSync(
    path.join(rootDir, baseline.captureDir),
    path.join(rootDir, 'weekly-eval-bets/screenshots/2026-W41_example_RUN1'),
    { recursive: true }
  );

  const prepared = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W41_example-trust.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W41_example_RUN1',
    targetUrl: DEFAULT_URL,
    issue: {
      title: 'Example trust architecture check',
      body: '### Primary lens\nTrust architecture',
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  assert.equal(prepared.context.mode, 'reuse');
  assert.equal(
    prepared.context.comparison.baselineScores.find((item) => item.name === 'Visual hierarchy').score,
    4
  );
});

test('different canonical URL, capture context, or rubric hash prevents automatic reuse', () => {
  const rootDir = createRepoRoot();
  createBaselineRecord({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W40_example-promise.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    lensTitle: 'Example promise clarity audit',
    lensBody: '### Primary lens\nPromise clarity',
  });

  const sameCaptureDir = 'weekly-eval-bets/screenshots/2026-W40_example_RUN1';

  const queryChanged = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W41_example-query.md',
    captureDir: sameCaptureDir,
    targetUrl: 'https://example.com/product?view=pricing#hero',
    issue: { title: 'Example promise clarity audit', body: '### Primary lens\nPromise clarity' },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });
  assert.equal(queryChanged.context.mode, 'baseline');

  const contextChanged = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W41_example-context.md',
    captureDir: sameCaptureDir,
    targetUrl: DEFAULT_URL,
    issue: { title: 'Example promise clarity audit', body: '### Primary lens\nPromise clarity' },
    rubric: DEFAULT_RUBRIC,
    captureContext: { viewport: 'mobile', locale: 'en-US' },
  });
  assert.equal(contextChanged.context.mode, 'baseline');

  const rubricChanged = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W41_example-rubric.md',
    captureDir: sameCaptureDir,
    targetUrl: DEFAULT_URL,
    issue: { title: 'Example promise clarity audit', body: '### Primary lens\nPromise clarity' },
    rubric: { id: 'rubric-v2', dimensions: ['craft', 'trust'] },
    captureContext: DEFAULT_CONTEXT,
  });
  assert.equal(rubricChanged.context.mode, 'baseline');
});

test('legacy reports without matching schema metadata are ignored', () => {
  const rootDir = createRepoRoot();
  createCapture(rootDir, 'weekly-eval-bets/screenshots/2026-W40_example_RUN1', { seed: 'legacy-a' });
  fs.writeFileSync(
    path.join(rootDir, 'weekly-eval-bets/legacy.json'),
    JSON.stringify({ schemaVersion: 'legacy/v0', junk: true })
  );
  fs.writeFileSync(path.join(rootDir, 'weekly-eval-bets/legacy.md'), '# Legacy report');

  const prepared = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W40_example-new.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    targetUrl: DEFAULT_URL,
    issue: {
      title: 'Example promise clarity audit',
      body: '### Primary lens\nPromise clarity',
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  assert.equal(prepared.context.mode, 'baseline');
});

test('recognized malformed metadata or broken referenced artifacts are rejected explicitly', async (t) => {
  await t.test('corrupt recognized sidecar throws', () => {
    const rootDir = createRepoRoot();
    createCapture(rootDir, 'weekly-eval-bets/screenshots/2026-W40_example_RUN1', { seed: 'corrupt-a' });
    fs.writeFileSync(
      path.join(rootDir, 'weekly-eval-bets/corrupt.json'),
      `{"schemaVersion":"eval-scoring/v1","broken":`
    );

    assert.throws(
      () =>
        prepareEvaluation({
          rootDir,
          reportPath: 'weekly-eval-bets/2026-W40_example-new.md',
          captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
          targetUrl: DEFAULT_URL,
          issue: { title: 'Example promise clarity audit', body: '### Primary lens\nPromise clarity' },
          rubric: DEFAULT_RUBRIC,
          captureContext: DEFAULT_CONTEXT,
        }),
      /Corrupt recognized record/
    );
  });

  await t.test('missing referenced screenshot throws', () => {
    const rootDir = createRepoRoot();
    createBaselineRecord({
      rootDir,
      reportPath: 'weekly-eval-bets/2026-W40_example-promise.md',
      captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
      lensTitle: 'Example promise clarity audit',
      lensBody: '### Primary lens\nPromise clarity',
    });
    createCapture(rootDir, 'weekly-eval-bets/screenshots/2026-W41_example_RUN2', { seed: 'broken-b' });
    fs.rmSync(
      path.join(rootDir, 'weekly-eval-bets/screenshots/2026-W40_example_RUN1/mobile.png')
    );

    assert.throws(
      () =>
        prepareEvaluation({
          rootDir,
          reportPath: 'weekly-eval-bets/2026-W41_example-new.md',
          captureDir: 'weekly-eval-bets/screenshots/2026-W41_example_RUN2',
          targetUrl: DEFAULT_URL,
          issue: { title: 'Example promise clarity audit', body: '### Primary lens\nPromise clarity' },
          rubric: DEFAULT_RUBRIC,
          captureContext: DEFAULT_CONTEXT,
        }),
      /Missing required capture artifact/
    );
  });
});

test('invalid model output is rejected for missing, unknown, duplicate, and invalid scores', () => {
  const rootDir = createRepoRoot();
  createCapture(rootDir, 'weekly-eval-bets/screenshots/2026-W40_example_RUN1', { seed: 'invalid-a' });
  const prepared = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W40_example-promise.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    targetUrl: DEFAULT_URL,
    issue: { title: 'Example promise clarity audit', body: '### Primary lens\nPromise clarity' },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  assert.throws(
    () =>
      buildEvaluation({
        context: prepared.context,
        responseText: JSON.stringify({
          summaryMarkdown: 'Bad response',
          primary: {
            noteMarkdown: '',
            inconclusive: false,
            items: [
              { name: 'Singular message', score: 4, rationale: 'ok' },
              { name: 'Audience alignment', score: 3, rationale: 'ok' },
              { name: 'CTA focus', score: 4, rationale: 'ok' },
              { name: 'Claim specificity', score: 2, rationale: 'ok' },
              { name: 'Redundancy', score: 3, rationale: 'ok' },
            ],
          },
          craft: {
            mode: 'baseline',
            summaryMarkdown: 'Missing one craft dimension.',
            dimensions: craftDimensions({
              'Visual hierarchy': 4,
              'Information density': 3,
              Readability: 4,
              Coherence: 5,
              Durability: 3,
            }),
          },
        }),
        model: 'test-model',
      }),
    /exactly 6 craft dimensions/
  );

  assert.throws(
    () =>
      buildEvaluation({
        context: prepared.context,
        responseText: JSON.stringify({
          summaryMarkdown: 'Bad response',
          primary: {
            noteMarkdown: '',
            inconclusive: false,
            items: [
              { name: 'Singular message', score: 4, rationale: 'ok' },
              { name: 'Audience alignment', score: 3, rationale: 'ok' },
              { name: 'CTA focus', score: 4, rationale: 'ok' },
              { name: 'Unknown dimension', score: 2, rationale: 'ok' },
              { name: 'Redundancy', score: 3, rationale: 'ok' },
            ],
          },
          craft: {
            mode: 'baseline',
            summaryMarkdown: 'Unknown primary dimension.',
            dimensions: craftDimensions({
              'Visual hierarchy': 4,
              'Information density': 3,
              Readability: 4,
              Coherence: 5,
              Durability: 3,
              Intentionality: 4,
            }),
          },
        }),
        model: 'test-model',
      }),
    /Unexpected primary dimension/
  );

  const deltaRoot = createRepoRoot();
  createBaselineRecord({
    rootDir: deltaRoot,
    reportPath: 'weekly-eval-bets/2026-W40_example-promise.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    lensTitle: 'Example promise clarity audit',
    lensBody: '### Primary lens\nPromise clarity',
  });
  createCapture(deltaRoot, 'weekly-eval-bets/screenshots/2026-W41_example_RUN2', {
    seed: 'invalid-b',
    overrides: { 'page-content.html': '<html>changed</html>' },
  });
  const deltaPrepared = prepareEvaluation({
    rootDir: deltaRoot,
    reportPath: 'weekly-eval-bets/2026-W41_example-promise.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W41_example_RUN2',
    targetUrl: DEFAULT_URL,
    issue: { title: 'Example promise clarity audit', body: '### Primary lens\nPromise clarity' },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  assert.throws(
    () =>
      buildEvaluation({
        context: deltaPrepared.context,
        responseText: JSON.stringify({
          summaryMarkdown: 'Duplicate craft dimensions.',
          primary: {
            noteMarkdown: '',
            inconclusive: false,
            items: [
              { name: 'Singular message', score: 4, rationale: 'ok' },
              { name: 'Audience alignment', score: 3, rationale: 'ok' },
              { name: 'CTA focus', score: 4, rationale: 'ok' },
              { name: 'Claim specificity', score: 2, rationale: 'ok' },
              { name: 'Redundancy', score: 3, rationale: 'ok' },
            ],
          },
          craft: {
            mode: 'delta',
            summaryMarkdown: 'Duplicate changed dimensions.',
            changedDimensions: [
              {
                name: 'Visual hierarchy',
                score: 4,
                rationale: 'ok',
                changeEvidence: 'changed',
              },
              {
                name: 'Visual hierarchy',
                score: 5,
                rationale: 'ok',
                changeEvidence: 'changed again',
              },
            ],
          },
        }),
        model: 'test-model',
      }),
    /Duplicate craft dimension/
  );

  assert.throws(
    () =>
      buildEvaluation({
        context: prepared.context,
        responseText: JSON.stringify({
          summaryMarkdown: 'Invalid score.',
          primary: {
            noteMarkdown: '',
            inconclusive: false,
            items: [
              { name: 'Singular message', score: 4, rationale: 'ok' },
              { name: 'Audience alignment', score: 3, rationale: 'ok' },
              { name: 'CTA focus', score: 4, rationale: 'ok' },
              { name: 'Claim specificity', score: 2, rationale: 'ok' },
              { name: 'Redundancy', score: 3, rationale: 'ok' },
            ],
          },
          craft: {
            mode: 'baseline',
            summaryMarkdown: 'Invalid craft score.',
            dimensions: craftDimensions({
              'Visual hierarchy': 7,
              'Information density': 3,
              Readability: 4,
              Coherence: 5,
              Durability: 3,
              Intentionality: 4,
            }),
          },
        }),
        model: 'test-model',
      }),
    /integer from 1 to 5/
  );
});

test('audience role hypotheses stay separate from representative human validation', () => {
  const rootDir = createRepoRoot();
  createCapture(rootDir, 'weekly-eval-bets/screenshots/2026-W40_example_RUN1', { seed: 'audience-a' });

  const prepared = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W40_example-audience.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    targetUrl: DEFAULT_URL,
    issue: {
      title: 'Example audience segmentation/coherence review',
      body: '### Primary lens\nAudience fit',
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  const built = buildEvaluation({
    context: prepared.context,
    responseText: JSON.stringify({
      summaryMarkdown: 'The page suggests two plausible audience roles, but both need real-user validation.',
      primary: {
        noteMarkdown: 'Audience hypotheses should be validated by representative roles.',
        inconclusive: false,
        items: [
          {
            role: 'Design system lead',
            hypothesis: 'Likely sees the page as a standards-oriented operations offer.',
            rationale: 'The copy emphasizes repeatability and system coherence.',
            dimensions: audienceDimensions(),
          },
          {
            role: 'Product design manager',
            hypothesis: 'Likely reads the page as an efficiency play for cross-functional delivery.',
            rationale: 'The proof points emphasize faster alignment and execution.',
            dimensions: audienceDimensions(),
          },
        ],
      },
      craft: {
        mode: 'baseline',
        summaryMarkdown: 'Craft is still established once because there is no comparable prior baseline.',
        dimensions: craftDimensions({
          'Visual hierarchy': 4,
          'Information density': 3,
          Readability: 4,
          Coherence: 5,
          Durability: 3,
          Intentionality: 4,
        }),
      },
    }),
    model: 'test-model',
  });

  const primarySection = between(built.markdown, '## Primary lens review', '## Craft review');
  assert.match(primarySection, /Reserved for representative roles/);
  assert.match(primarySection, /\| Representative role \| AI role hypothesis \| Rationale \|/);
  assert.match(primarySection, /\| Design system lead \| Recognition \| 4\/5 \|/);
  assert.match(primarySection, /AI hypotheses, not human-validated/);
  assert.match(primarySection, /\| Representative role \| Dimension \| AI score \| Human score \| Notes \|/);
});

test('other primary lens can stay explicitly inconclusive without invented numeric scores', () => {
  const rootDir = createRepoRoot();
  createCapture(rootDir, 'weekly-eval-bets/screenshots/2026-W40_example_RUN1', { seed: 'other-a' });

  const prepared = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/2026-W40_example-other.md',
    captureDir: 'weekly-eval-bets/screenshots/2026-W40_example_RUN1',
    targetUrl: DEFAULT_URL,
    issue: {
      title: 'Example custom review',
      body: '### Primary lens\nOther',
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });

  const built = buildEvaluation({
    context: prepared.context,
    responseText: JSON.stringify({
      summaryMarkdown: 'The evidence supports an inconclusive custom review because the claim cannot be verified from the capture alone.',
      primary: {
        noteMarkdown: 'This custom review focuses on evidence sufficiency, not a forced numeric score.',
        inconclusive: true,
        items: [
          {
            name: 'Evidence sufficiency',
            rationale: 'The capture shows the layout, but not enough product state to verify the operational claim.',
          },
        ],
      },
      craft: {
        mode: 'baseline',
        summaryMarkdown: 'Craft is still captured once for later comparable reuse.',
        dimensions: craftDimensions({
          'Visual hierarchy': 4,
          'Information density': 3,
          Readability: 4,
          Coherence: 5,
          Durability: 3,
          Intentionality: 4,
        }),
      },
    }),
    model: 'test-model',
  });

  const primarySection = between(built.markdown, '## Primary lens review', '## Craft review');
  assert.match(primarySection, /explicitly inconclusive/);
  assert.doesNotMatch(primarySection, /Total/);
  assert.doesNotMatch(primarySection, /\/5/);
});

test('explicit issue-form lens overrides a conflicting title and respects blank lines', () => {
  const { prepared } = responseFixture({
    title: 'Example first-impression craft',
    body: '### Bet title\n\nExample\n\n### Primary lens\n\nTrust architecture\n\n### Target page\n\nhttps://example.com/',
  });
  assert.equal(prepared.context.lens, 'trust');
  assert.throws(() => responseFixture({ title: 'Trust architecture', body: '### Primary lens\n\nUnknown lens' }), /Unsupported explicit Primary lens/);
});

test('full stored evidence is fingerprinted while model text inputs are bounded', () => {
  const { prepared, rootDir } = responseFixture({ title: 'Craft', body: '### Primary lens\nCraft' });
  fs.writeFileSync(path.join(rootDir, prepared.context.captureDir, 'page-content.html'), 'x'.repeat(200000));
  const next = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/next.md',
    captureDir: prepared.context.captureDir,
    targetUrl: DEFAULT_URL,
    issue: { title: 'Example first-impression craft', body: '' },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });
  assert.notEqual(next.context.evidenceHash, prepared.context.evidenceHash);
  const html = next.requestContent.find(item => item.text?.startsWith('Current HTML snapshot:')).text;
  assert.ok(html.length < 51000);
  assert.match(html, /Truncated for model input/);
});

test('malformed primary fields and unscored custom totals fail explicitly', () => {
  const { prepared, response } = responseFixture({ title: 'Custom check', body: '' });
  const build = value => buildEvaluation({ context: prepared.context, responseText: JSON.stringify(value), model: 'test' });
  assert.throws(() => build({ ...response, primary: { ...response.primary, items: null } }), /items array/);
  assert.throws(() => build({ ...response, primary: { ...response.primary, inconclusive: 'false' } }), /boolean/);
  assert.throws(() => build({ ...response, primary: { ...response.primary, inconclusive: false } }), /Unscored custom criteria/);
  assert.throws(() => build(null), /JSON object/);
});

test('delta rejects a replacement full table instead of treating it as no change', () => {
  const { rootDir, prepared, response } = responseFixture();
  const built = buildEvaluation({ context: prepared.context, responseText: JSON.stringify(response), model: 'test' });
  writeArtifacts(rootDir, prepared.context.reportPath, built);
  createCapture(rootDir, 'weekly-eval-bets/screenshots/changed', { seed: 'changed' });
  const next = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/changed.md',
    captureDir: 'weekly-eval-bets/screenshots/changed',
    targetUrl: DEFAULT_URL,
    issue: { title: 'Example first-impression craft', body: '' },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });
  assert.equal(next.context.mode, 'delta');
  assert.throws(() => buildEvaluation({
    context: next.context,
    responseText: JSON.stringify({
      ...response,
      craft: { mode: 'delta', summaryMarkdown: 'Same craft.', dimensions: response.craft.dimensions, noMaterialChangeExplanation: 'No changes.' },
    }),
    model: 'test',
  }), /only a changedDimensions array/);
});

test('recognized metadata cannot silently misstate its capture context', () => {
  const { rootDir, prepared, response } = responseFixture();
  const built = buildEvaluation({ context: prepared.context, responseText: JSON.stringify(response), model: 'test' });
  built.record.captureContextHash = 'incorrect';
  writeArtifacts(rootDir, prepared.context.reportPath, built);
  assert.throws(() => prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/next.md',
    captureDir: prepared.context.captureDir,
    targetUrl: DEFAULT_URL,
    issue: { title: 'Example trust architecture', body: '' },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  }), /comparison metadata mismatch/);
});

test('generated reports keep human verdicts and scores unfilled', () => {
  const { prepared, response } = responseFixture();
  const { markdown } = buildEvaluation({ context: prepared.context, responseText: JSON.stringify(response), model: 'test' });
  assert.match(markdown, /## Human verdict\n\nReviewed:\n\n\[ \] Confirmed/);
  assert.match(markdown, /\| Coherence \(2x\) \| 4\/5 \|  \|  \|/);
  assert.match(markdown, /\| \*\*Total\*\* \| \*\*28\/35\*\* \|  \|  \|/);
});

test('narrative cannot bypass scoped scoring with its own score table', () => {
  const { prepared, response } = responseFixture();
  response.summaryMarkdown = '| Dimension | Score |\n|---|---|\n| Visual hierarchy | 1/5 |';
  assert.throws(() => buildEvaluation({
    context: prepared.context, responseText: JSON.stringify(response), model: 'test',
  }), /must not contain score tables/);
});

function responseFixture(issue = { title: 'Example first-impression craft', body: '' }) {
  const rootDir = createRepoRoot();
  const captureDir = 'weekly-eval-bets/screenshots/fixture';
  createCapture(rootDir, captureDir, { seed: 'fixture' });
  const prepared = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/fixture.md',
    captureDir,
    targetUrl: DEFAULT_URL,
    issue,
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });
  return {
    rootDir,
    prepared,
    response: {
      summaryMarkdown: 'Fixture assessment.',
      primary: baselinePrimaryForLens(prepared.context.lens),
      craft: {
        mode: 'baseline',
        summaryMarkdown: 'First baseline.',
        dimensions: craftDimensions({
          'Visual hierarchy': 4, 'Information density': 4, Readability: 4,
          Coherence: 4, Durability: 4, Intentionality: 4,
        }),
      },
    },
  };
}

test('inherited scores must agree with the linked baseline sidecar', () => {
  const { rootDir, prepared, response } = responseFixture();
  writeArtifacts(rootDir, prepared.context.reportPath, buildEvaluation({
    context: prepared.context, responseText: JSON.stringify(response), model: 'test',
  }));
  const options = {
    rootDir,
    reportPath: 'weekly-eval-bets/reuse.md',
    captureDir: prepared.context.captureDir,
    targetUrl: DEFAULT_URL,
    issue: { title: 'Example first-impression craft', body: '' },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  };
  const reuse = prepareEvaluation(options);
  const child = buildEvaluation({
    context: reuse.context,
    responseText: JSON.stringify({ ...response, craft: { mode: 'reuse', summaryMarkdown: 'Same evidence.' } }),
    model: 'test',
  });
  child.record.ai.craft.scores[0].score = 1;
  writeArtifacts(rootDir, options.reportPath, child);
  assert.throws(() => prepareEvaluation({ ...options, reportPath: 'weekly-eval-bets/next.md' }), /Inherited craft scores/);
});

test('craft provenance cannot point to a baseline for another page', () => {
  const { rootDir, prepared, response } = responseFixture();
  writeArtifacts(rootDir, prepared.context.reportPath, buildEvaluation({
    context: prepared.context, responseText: JSON.stringify(response), model: 'test',
  }));
  const options = {
    rootDir,
    reportPath: 'weekly-eval-bets/reuse.md',
    captureDir: prepared.context.captureDir,
    targetUrl: DEFAULT_URL,
    issue: { title: 'Example first-impression craft', body: '' },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  };
  const child = buildEvaluation({
    context: prepareEvaluation(options).context,
    responseText: JSON.stringify({ ...response, craft: { mode: 'reuse', summaryMarkdown: 'Same evidence.' } }),
    model: 'test',
  });
  child.record.targetUrl = child.record.canonicalUrl = 'https://example.com/another-page';
  writeArtifacts(rootDir, options.reportPath, child);
  assert.throws(() => prepareEvaluation({
    ...options, reportPath: 'weekly-eval-bets/next.md', targetUrl: child.record.targetUrl,
  }), /Incompatible craft provenance/);
});

test('unrelated broken captures do not block a new page baseline', () => {
  const { rootDir, prepared, response } = responseFixture();
  writeArtifacts(rootDir, prepared.context.reportPath, buildEvaluation({
    context: prepared.context, responseText: JSON.stringify(response), model: 'test',
  }));
  fs.rmSync(path.join(rootDir, prepared.context.captureDir, 'mobile.png'));
  createCapture(rootDir, 'weekly-eval-bets/screenshots/unrelated', { seed: 'another-page' });
  const unrelated = prepareEvaluation({
    rootDir,
    reportPath: 'weekly-eval-bets/unrelated.md',
    captureDir: 'weekly-eval-bets/screenshots/unrelated',
    targetUrl: 'https://another.example.com/product',
    issue: { title: 'Example first-impression craft', body: '' },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });
  assert.equal(unrelated.context.mode, 'baseline');
});

function createBaselineRecord({ rootDir, reportPath, captureDir, lensTitle, lensBody }) {
  createCapture(rootDir, captureDir, { seed: captureDir });
  const prepared = prepareEvaluation({
    rootDir,
    reportPath,
    captureDir,
    targetUrl: DEFAULT_URL,
    issue: {
      title: lensTitle,
      body: lensBody,
    },
    rubric: DEFAULT_RUBRIC,
    captureContext: DEFAULT_CONTEXT,
  });
  const built = buildEvaluation({
    context: prepared.context,
    responseText: JSON.stringify({
      summaryMarkdown: 'Baseline roundtrip record for later comparison.',
      primary: baselinePrimaryForLens(prepared.context.lens),
      craft: {
        mode: 'baseline',
        summaryMarkdown: 'Comparable craft baseline.',
        dimensions: craftDimensions({
          'Visual hierarchy': 4,
          'Information density': 3,
          Readability: 4,
          Coherence: 5,
          Durability: 3,
          Intentionality: 4,
        }),
      },
    }),
    model: 'test-model',
  });
  writeArtifacts(rootDir, reportPath, built);
  return { captureDir, reportPath, built, prepared };
}

function baselinePrimaryForLens(lens) {
  if (lens === 'promise') {
    return {
      noteMarkdown: 'Primary baseline.',
      inconclusive: false,
      items: [
        { name: 'Singular message', score: 4, rationale: 'ok' },
        { name: 'Audience alignment', score: 3, rationale: 'ok' },
        { name: 'CTA focus', score: 4, rationale: 'ok' },
        { name: 'Claim specificity', score: 2, rationale: 'ok' },
        { name: 'Redundancy', score: 3, rationale: 'ok' },
      ],
    };
  }
  if (lens === 'trust') {
    return {
      noteMarkdown: 'Primary baseline.',
      inconclusive: false,
      items: [
        { name: 'Sequence', score: 4, rationale: 'ok' },
        { name: 'Specificity', score: 3, rationale: 'ok' },
        { name: 'Social proof quality', score: 2, rationale: 'ok' },
        { name: 'Friction to first action', score: 4, rationale: 'ok' },
        { name: 'Risk reduction', score: 3, rationale: 'ok' },
      ],
    };
  }
  if (lens === 'audience') {
    return {
      noteMarkdown: 'Primary baseline.',
      inconclusive: false,
      items: [
        { role: 'Role one', hypothesis: 'Hypothesis one', rationale: 'ok', dimensions: audienceDimensions() },
      ],
    };
  }
  if (lens === 'craft') {
    return {
      noteMarkdown: '',
      inconclusive: false,
      items: [],
    };
  }
  return {
    noteMarkdown: 'Primary baseline.',
    inconclusive: true,
    items: [{ name: 'Evidence sufficiency', rationale: 'ok' }],
  };
}

function craftDimensions(scoreMap) {
  return [
    makeCraftDimension('Visual hierarchy', scoreMap['Visual hierarchy']),
    makeCraftDimension('Information density', scoreMap['Information density']),
    makeCraftDimension('Readability', scoreMap.Readability),
    makeCraftDimension('Coherence', scoreMap.Coherence),
    makeCraftDimension('Durability', scoreMap.Durability),
    makeCraftDimension('Intentionality', scoreMap.Intentionality),
  ].filter(Boolean);
}

function makeCraftDimension(name, score) {
  if (score == null) {
    return null;
  }
  return {
    name,
    score,
    rationale: `${name} rationale for score ${score}.`,
  };
}

function createRepoRoot() {
  const rootDir = fs.mkdtempSync(TEST_ROOT_PREFIX);
  testRoots.push(rootDir);
  fs.mkdirSync(path.join(rootDir, 'weekly-eval-bets', 'screenshots'), { recursive: true });
  return rootDir;
}

function audienceDimensions() {
  return ['Recognition', 'Vocabulary fit', 'CTA fit', 'Cross-audience distraction', 'Intentionality']
    .map(name => ({ name, score: 4, rationale: 'AI role hypothesis, not human validation.' }));
}

function createCapture(rootDir, captureDir, { seed, overrides = {} }) {
  const absoluteDir = path.join(rootDir, captureDir);
  fs.mkdirSync(absoluteDir, { recursive: true });
  const defaults = {
    'page-text.txt': `text ${seed}`,
    'page-content.html': `<html><body>${seed}</body></html>`,
    'above-the-fold.png': `above ${seed}`,
    'full-page.png': `full ${seed}`,
    'mid-page.png': `mid ${seed}`,
    'mobile.png': `mobile ${seed}`,
  };
  for (const [name, content] of Object.entries({ ...defaults, ...overrides })) {
    fs.writeFileSync(path.join(absoluteDir, name), content);
  }
}

function writeArtifacts(rootDir, reportPath, built) {
  fs.writeFileSync(path.join(rootDir, reportPath), built.markdown);
  fs.writeFileSync(
    path.join(rootDir, reportPath.replace(/\.md$/, '.json')),
    JSON.stringify(built.record, null, 2)
  );
}

function countImages(content) {
  return content.filter((item) => item.type === 'input_image').length;
}

function between(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  return text.slice(start, end === -1 ? undefined : end);
}
