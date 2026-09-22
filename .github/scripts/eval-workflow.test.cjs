const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const workflow = fs.readFileSync(path.join(__dirname, '../workflows/weekly-eval-bet.yml'), 'utf8');

function embeddedNode(stepName) {
  const step = workflow.split(`- name: ${stepName}\n`)[1]?.split('\n      - name:')[0];
  assert.ok(step, `Missing workflow step: ${stepName}`);
  const source = step.match(/          node <<\s*'?EOF'?\n([\s\S]*?)\n          EOF/);
  assert.ok(source, `Missing embedded Node script: ${stepName}`);
  return source[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
}

function resolveTarget(body) {
  let output = '';
  const source = embeddedNode('Resolve target page');
  vm.runInNewContext(source, {
    require(name) {
      assert.equal(name, 'fs');
      return {
        readFileSync: () => JSON.stringify({ body }),
        appendFileSync: (file, data) => {
          assert.equal(file, '/outputs');
          output += data;
        },
      };
    },
    process: { env: { GITHUB_OUTPUT: '/outputs' } },
    URL,
  });
  return output;
}

test('target field takes precedence over a reference URL', () => {
  const body = 'Reference https://example.com/issue\n\n### Target page\n\nhttps://example.com/product?view=team\n\n### Primary lens\n\nTrust architecture';
  assert.equal(resolveTarget(body), 'url=https://example.com/product?view=team\n');
});

test('legacy issues and empty target fields use the first HTTPS link', () => {
  assert.equal(resolveTarget('Evaluate https://example.com/product'), 'url=https://example.com/product\n');
  assert.equal(resolveTarget('### Target page\n\n_No response_\n\n### Source\n\nhttps://example.com/product'), 'url=https://example.com/product\n');
});

test('a missing or invalid explicit target fails instead of scoring the reference', () => {
  assert.throws(() => resolveTarget('No page available.'), /target page HTTPS URL/);
  assert.throws(() => resolveTarget('### Target page\n\nnot-a-url\n\n### Source\n\nhttps://example.com/issue'), /target page HTTPS URL/);
});

async function captureFixture(t, status = 200) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-capture-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const calls = [];
  const page = {
    goto: async (url) => {
      calls.push(['goto', url]);
      return { ok: () => status < 400, status: () => status };
    },
    waitForTimeout: async () => {},
    locator: () => ({ innerText: async () => 'Rendered product page' }),
    content: async () => '<html><body>Rendered product page</body></html>',
    screenshot: async (options) => {
      calls.push(['screenshot', path.basename(options.path)]);
      fs.writeFileSync(options.path, 'screenshot fixture');
    },
    evaluate: async () => {},
    setViewportSize: async (viewport) => calls.push(['viewport', viewport]),
  };
  const browser = {
    version: () => 'test-browser',
    newContext: async (options) => {
      calls.push(['context', options]);
      return { newPage: async () => page };
    },
    close: async () => calls.push(['close']),
  };
  const chromium = { use: () => {}, launch: async () => browser };
  const run = vm.runInNewContext(embeddedNode('Capture screenshots with Playwright (stealth)'), {
    require(name) {
      if (name === 'fs') return fs;
      if (name === 'playwright-extra') return { chromium };
      if (name === 'puppeteer-extra-plugin-stealth') return () => ({});
      throw new Error(`Unexpected dependency: ${name}`);
    },
    process: { env: { URL: 'https://example.com/product', SCREENSHOT_DIR: dir } },
  });
  return { dir, calls, run };
}

test('capture stores rendered evidence and the actual comparison context', async (t) => {
  const { dir, calls, run } = await captureFixture(t);
  await run;
  assert.equal(fs.readFileSync(path.join(dir, 'page-text.txt'), 'utf8'), 'Rendered product page');
  assert.equal(fs.readFileSync(path.join(dir, 'page-content.html'), 'utf8'), '<html><body>Rendered product page</body></html>');
  const context = JSON.parse(fs.readFileSync(path.join(dir, 'capture-context.json'), 'utf8'));
  assert.equal(context.browserVersion, 'test-browser');
  assert.equal(context.colorScheme, 'light');
  assert.deepEqual(context.viewport, { width: 1440, height: 900 });
  assert.deepEqual(context.mobileViewport, { width: 390, height: 844 });
  assert.equal(context.deviceScaleFactor, 2);
  assert.deepEqual(calls.filter(call => call[0] === 'screenshot').map(call => call[1]), [
    'full-page.png', 'above-the-fold.png', 'mid-page.png', 'mobile.png',
  ]);
  assert.ok(calls.some(call => call[0] === 'close'));
});

test('failed target responses do not produce baseline evidence', async (t) => {
  const { dir, calls, run } = await captureFixture(t, 404);
  await assert.rejects(run, /Desktop capture failed: 404/);
  assert.deepEqual(fs.readdirSync(dir), []);
  assert.ok(calls.some(call => call[0] === 'close'));
});

test('workflow keeps immutable report and capture paths and commits the sidecar', () => {
  assert.ok(workflow.includes('CAPTURE_ID="${WEEK}_${SLUG}_${GITHUB_RUN_ID}_${GITHUB_RUN_ATTEMPT}"'));
  assert.ok(workflow.includes('SLUG="${SLUG:0:160}"'));
  assert.ok(`2026-W40_${'a'.repeat(160)}_12345678901234567890_123456.json`.length < 255);
  assert.ok(workflow.includes('filename=${CAPTURE_ID}.md'));
  assert.ok(workflow.includes('git add "weekly-eval-bets/${FILENAME%.md}.json" "$CAPTURE_DIR"'));
  assert.ok(workflow.includes('group: daily-eval-scoring'));
  assert.ok(workflow.includes('content: requestContent'));
  assert.ok(!workflow.includes('use the craft rubric as a secondary lens'));
});

test('actual scoring step publishes a baseline, then lens-only reuse and a focused delta', async (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-scoring-workflow-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  const captures = 'weekly-eval-bets/screenshots/';
  fs.mkdirSync(path.join(rootDir, captures, 'original'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'skills'));
  fs.writeFileSync(path.join(rootDir, 'skills/first-impression-craft-rubric.md'), 'Fixture rubric');
  for (const name of ['page-text.txt', 'page-content.html', 'above-the-fold.png', 'full-page.png', 'mid-page.png', 'mobile.png']) {
    fs.writeFileSync(path.join(rootDir, captures, 'original', name), `Fixture ${name}`);
  }
  fs.writeFileSync(path.join(rootDir, captures, 'original', 'capture-context.json'), JSON.stringify({ viewport: 'desktop' }));
  const source = workflow.split('          script: |\n')[1].split('\n          github-token:')[0]
    .split('\n').map(line => line.replace(/^            /, '')).join('\n');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction('require', 'process', 'fetch', 'core', source);
  const dimensions = ['Visual hierarchy', 'Information density', 'Readability', 'Coherence', 'Durability', 'Intentionality'];
  const emptyPrimary = { items: [], inconclusive: false, noteMarkdown: '' };

  async function score({ filename, capture = 'original', title, response, expectedImages }) {
    const outputs = {};
    await run(
      (name) => {
        if (name.endsWith('eval-scoring.cjs')) return require('./eval-scoring.cjs');
        if (name === 'path') return { ...path, resolve: (...parts) => path.resolve(rootDir, ...parts) };
        if (name === 'fs') return {
          readFileSync: (file, encoding) => file === '/tmp/issue.json'
            ? JSON.stringify({ title, body: '' })
            : fs.readFileSync(path.resolve(rootDir, file), encoding),
          writeFileSync: (file, data) => fs.writeFileSync(path.resolve(rootDir, file), data),
        };
        throw new Error(`Unexpected workflow dependency: ${name}`);
      },
      {
        cwd: () => rootDir,
        env: {
          FILENAME: filename,
          TARGET_URL: 'https://example.com/product',
          CAPTURE_DIR: captures + capture,
          FOUNDRY_API_KEY: 'fake-test-key',
        },
      },
      async (url, options) => {
        assert.ok(url.endsWith('/openai/v1/responses'));
        const request = JSON.parse(options.body);
        assert.equal(request.input[0].content.filter(item => item.type === 'input_image').length, expectedImages);
        return { ok: true, json: async () => ({
          output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(response) }] }],
        }) };
      },
      {
        setOutput: (name, value) => { outputs[name] = value; },
        setFailed: (message) => { throw new Error(message); },
        warning: (message) => { throw new Error(`Unexpected retry: ${message}`); },
      }
    );
    assert.equal(outputs.evaluation, 'complete');
    return {
      markdown: fs.readFileSync(path.join(rootDir, 'weekly-eval-bets', filename), 'utf8'),
      record: JSON.parse(fs.readFileSync(path.join(rootDir, 'weekly-eval-bets', filename.replace(/\.md$/, '.json')), 'utf8')),
    };
  }

  const baseline = await score({
    filename: 'baseline.md',
    title: 'Product first-impression craft',
    expectedImages: 4,
    response: {
      summaryMarkdown: 'First baseline.',
      primary: emptyPrimary,
      craft: { mode: 'baseline', summaryMarkdown: 'Baseline craft.', dimensions: dimensions.map(name => ({ name, score: 4, rationale: 'Evidence.' })) },
    },
  });
  assert.equal(baseline.record.ai.craft.totalScore, 28);
  const reused = await score({
    filename: 'trust.md',
    title: 'Product trust architecture',
    expectedImages: 4,
    response: {
      summaryMarkdown: 'Trust only.',
      primary: {
        items: ['Sequence', 'Specificity', 'Social proof quality', 'Friction to first action', 'Risk reduction']
          .map(name => ({ name, score: 3, rationale: 'Trust evidence.' })),
        inconclusive: false, noteMarkdown: 'Trust lens.',
      },
      craft: { mode: 'reuse', summaryMarkdown: 'Exact evidence match.' },
    },
  });
  assert.match(reused.markdown, /\| Sequence \| 3\/5 \|/);
  assert.doesNotMatch(reused.markdown, /### Human craft review/);
  assert.equal(reused.record.ai.craft.provenance.baselineReportPath, 'weekly-eval-bets/baseline.md');
  fs.cpSync(path.join(rootDir, captures, 'original'), path.join(rootDir, captures, 'changed'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, captures, 'changed', 'page-text.txt'), 'Changed hierarchy.');
  const changed = await score({
    filename: 'changed.md',
    capture: 'changed',
    title: 'Product first-impression craft',
    expectedImages: 8,
    response: {
      summaryMarkdown: 'Only hierarchy changed.',
      primary: emptyPrimary,
      craft: {
        mode: 'delta', summaryMarkdown: 'Focused change.',
        changedDimensions: [{ name: 'Visual hierarchy', score: 3, rationale: 'More competition.', changeEvidence: 'A second headline appeared.' }],
      },
    },
  });
  assert.equal(changed.record.ai.craft.totalScore, 27);
  assert.deepEqual(changed.record.ai.craft.reassessedDimensions, ['Visual hierarchy']);
  assert.doesNotMatch(changed.markdown.split('### Human craft review')[1], /\| Durability/);
});
