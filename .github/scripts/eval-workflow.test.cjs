const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const workflow = fs.readFileSync(path.join(__dirname, '../workflows/weekly-eval-bet.yml'), 'utf8');
const scoringModel = workflow.match(/^  SCORING_MODEL: '([^']+)'/m)?.[1];
const responsesEndpoint = 'https://scoring.example/api/projects/test/openai/v1/responses';
const testResponsesEndpoint = 'https://test-scoring.example/openai/v1/responses';
const connectionSecrets = {
  FOUNDRY_RESPONSES_ENDPOINT: responsesEndpoint,
  FOUNDRY_SCORING_API_KEY: 'fake-test-key',
  FOUNDRY_TEST_RESPONSES_ENDPOINT: testResponsesEndpoint,
  FOUNDRY_TEST_API_KEY: 'fake-dedicated-test-key',
};
const connectionSteps = ['Validate scoring inputs', 'Check minimal text and image requests', 'Auto-score with Copilot'];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const dimensions = ['Visual hierarchy', 'Information density', 'Readability', 'Coherence', 'Durability', 'Intentionality'];
const emptyPrimary = { items: [], inconclusive: false, noteMarkdown: '' };
const baselineResponse = {
  summaryMarkdown: 'First baseline.',
  primary: emptyPrimary,
  craft: { mode: 'baseline', summaryMarkdown: 'Baseline craft.', dimensions: dimensions.map(name => ({ name, score: 4, rationale: 'Evidence.' })) },
};

function stepSource(name) {
  const step = workflow.split(`- name: ${name}\n`)[1]?.split('\n      - name:')[0];
  assert.ok(step, `Missing workflow step: ${name}`);
  return step;
}

function selectedEnvironment(stepName, { eventName = 'workflow_dispatch', inputs = {}, secrets = connectionSecrets } = {}) {
  // These bindings use shared JS/Actions operators. Unset Actions context properties resolve to ''.
  const context = (values) => new Proxy(values, { get: (object, key) => object[key] ?? '' });
  const bindings = { github: { event_name: eventName }, inputs: context(inputs), secrets: context(secrets) };
  const globalEnv = workflow.split('\nenv:\n')[1].split('\npermissions:')[0];
  const env = {};
  for (const source of [globalEnv, stepSource(stepName)]) {
    for (const [, name, expression] of source.matchAll(/^\s+([A-Z_]+): \$\{\{ (.*) \}\}$/gm)) {
      if (['DRY_RUN', 'TEST_MODEL', 'TEST_CONNECTION', 'TEST_MAX_OUTPUT_TOKENS', 'TEST_COMPACT_EVIDENCE', 'TEST_STRUCTURED_OUTPUT', 'FOUNDRY_RESPONSES_ENDPOINT', 'FOUNDRY_API_KEY'].includes(name)) {
        env[name] = vm.runInNewContext(expression, bindings);
      }
    }
  }
  return { SCORING_MODEL: scoringModel, ...env };
}

function validateScoringInputs(env) {
  return vm.runInNewContext(embeddedNode('Validate scoring inputs'), { process: { env }, URL });
}

test('report template matches the configured scoring model and pending-review status', () => {
  const template = fs.readFileSync(path.join(__dirname, '../../weekly-eval-bets/_template.md'), 'utf8');
  assert.ok(template.includes(`*Scoring model: ${scoringModel}*`));
  assert.ok(template.includes('*Status: auto-scored, pending human review*'));
});

test('scoring runs at 04:15 Pacific Monday through Thursday across daylight saving changes', () => {
  const schedule = workflow.split('  schedule:\n')[1].split('  workflow_dispatch:')[0];
  const cronEntries = [...schedule.matchAll(/- cron: '([^']+)'/g)];
  assert.equal(cronEntries.length, 1, 'Only one scoring schedule should run each eligible day');
  const [minute, hour, day, month, weekdays] = cronEntries[0][1].split(' ');
  assert.deepEqual([minute, hour, day, month, weekdays], ['15', '4', '*', '*', '1-4']);
  const timezone = schedule.match(/^\s+timezone: '([^']+)'/m)?.[1];
  assert.equal(timezone, 'America/Los_Angeles');
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const scheduledTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  for (const [timestamp, expectedTime, eligible] of [
    ['2026-10-15T11:15:00Z', '04:15', true],
    ['2026-11-02T12:15:00Z', '04:15', true],
    ['2027-03-11T12:15:00Z', '04:15', true],
    ['2027-03-15T11:15:00Z', '04:15', true],
    ['2026-11-02T11:15:00Z', '03:15', false],
    ['2026-10-16T11:15:00Z', '04:15', false],
    ['2026-10-17T11:15:00Z', '04:15', false],
    ['2026-10-18T11:15:00Z', '04:15', false],
  ]) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map(part => [part.type, part.value]));
    const localTime = `${parts.hour}:${parts.minute}`;
    assert.equal(localTime, expectedTime, timestamp);
    assert.equal(['Mon', 'Tue', 'Wed', 'Thu'].includes(parts.weekday) && localTime === scheduledTime, eligible, timestamp);
  }
});

function embeddedNode(stepName) {
  const step = stepSource(stepName);
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
    process: { env: { GITHUB_OUTPUT: '/outputs', RUNNER_TEMP: '/runner' } },
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
  const dir = fs.mkdtempSync(path.join(__dirname, '.eval-capture-'));
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
  assert.ok(workflow.includes('content: modelContent'));
  assert.ok(workflow.includes(': requestContent;'));
  assert.ok(!workflow.includes('use the craft rubric as a secondary lens'));
});

test('one-time diagnostics wait on GitHub and gate scoring without changing the regular schedule', () => {
  assert.equal(scoringModel, 'gpt-6.1-sol');
  assert.equal(selectedEnvironment('Check minimal text and image requests', { eventName: 'schedule' }).FOUNDRY_RESPONSES_ENDPOINT, responsesEndpoint);
  assert.ok(workflow.includes('timeout-minutes: 330'));
  assert.ok(workflow.includes('ref: ${{ github.sha }}'));
  assert.ok(workflow.includes('path: .eval-diagnostics-tools'));
  const wait = workflow.indexOf('- name: Wait for the requested one-time start');
  const checks = workflow.indexOf('- name: Check minimal text and image requests');
  const find = workflow.indexOf('- name: Find ready bet');
  assert.ok(wait >= 0 && checks > wait && find > checks);
  assert.ok(workflow.includes("if (!success) throw new Error('Minimal Foundry checks failed"));
  assert.ok(workflow.includes('fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, renderSummary(result))'));
  const tools = workflow.split('- name: Check out diagnostic tools from the workflow revision')[1].split('- name: Wait')[0];
  assert.ok(tools.includes("if: github.event_name == 'workflow_dispatch'"));
  const checkStep = workflow.split('- name: Check minimal text and image requests')[1].split('- name: Find ready bet')[0];
  assert.ok(checkStep.includes("if: github.event_name == 'workflow_dispatch' && inputs.diagnostics_first"));
});

test('diagnostics and scoring use secret-backed configuration without public service identifiers', () => {
  const condition = "github.event_name == 'workflow_dispatch' && inputs.dry_run && inputs.test_connection";
  const endpointBinding = `FOUNDRY_RESPONSES_ENDPOINT: \${{ secrets[${condition} && 'FOUNDRY_TEST_RESPONSES_ENDPOINT' || 'FOUNDRY_RESPONSES_ENDPOINT'] }}`;
  const keyBinding = `FOUNDRY_API_KEY: \${{ secrets[${condition} && 'FOUNDRY_TEST_API_KEY' || 'FOUNDRY_SCORING_API_KEY'] }}`;
  for (const name of connectionSteps) {
    assert.ok(stepSource(name).includes(endpointBinding), `${name} must select the endpoint secret name before dereferencing`);
    assert.ok(stepSource(name).includes(keyBinding), `${name} must select the key secret name before dereferencing`);
  }
  assert.equal(workflow.split(endpointBinding).length - 1, connectionSteps.length);
  assert.equal(workflow.split(keyBinding).length - 1, connectionSteps.length);
  assert.doesNotMatch(workflow.split('\nenv:\n')[1].split('\npermissions:')[0], /FOUNDRY_/);
  assert.doesNotMatch(embeddedNode('Validate scoring inputs'), /GITHUB_ENV|GITHUB_OUTPUT|console\./);
  assert.ok(!workflow.includes('secrets.FOUNDRY_API_KEY'));
  assert.ok(!workflow.includes('.services.ai.azure.com'));
});

function scoringFixture(t) {
  const rootDir = fs.mkdtempSync(path.join(__dirname, '.eval-scoring-workflow-'));
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
  const runnerDir = path.join(rootDir, 'runner');
  fs.mkdirSync(runnerDir);

  async function score({
    filename = 'candidate-test.md', capture = 'original', title = 'Product first-impression craft',
    response = baselineResponse, expectedImages = 4, dryRun = false, testModel = '', testConnection = false,
    eventName = 'workflow_dispatch', secrets = connectionSecrets,
    replies, fetchImpl, timeoutMs, maxOutputTokens = 0, compactEvidence = false, structuredOutput = false,
  } = {}) {
    const outputs = {};
    const failures = [];
    const waits = [];
    const requests = [];
    const writes = [];
    const inputs = { dry_run: dryRun, test_model: testModel, test_connection: testConnection, test_max_output_tokens: maxOutputTokens, test_compact_evidence: compactEvidence, test_structured_output: structuredOutput };
    const env = selectedEnvironment('Auto-score with Copilot', { eventName, inputs, secrets });
    validateScoringInputs(selectedEnvironment('Validate scoring inputs', { eventName, inputs, secrets }));
    const useTestConnection = eventName === 'workflow_dispatch' && dryRun && testConnection;
    const expectedEndpoint = useTestConnection ? testResponsesEndpoint : responsesEndpoint;
    const expectedKey = useTestConnection ? 'fake-dedicated-test-key' : 'fake-test-key';
    const expectedModel = eventName === 'workflow_dispatch' && testModel || scoringModel;
    const mockFetch = async (url, options) => {
      assert.equal(url, expectedEndpoint);
      assert.equal(options.headers['api-key'], expectedKey);
      const request = JSON.parse(options.body);
      requests.push(request);
      assert.equal(request.model, expectedModel);
      const bounded = eventName === 'workflow_dispatch' && dryRun && maxOutputTokens !== 0;
      const structured = eventName === 'workflow_dispatch' && dryRun && structuredOutput;
      assert.deepEqual(Object.keys(request).sort(), ['input', 'model', ...(bounded ? ['max_output_tokens'] : []), ...(structured ? ['text'] : [])].sort(), 'Only explicit dry-run flags may change output parameters');
      if (bounded) assert.equal(request.max_output_tokens, Number(maxOutputTokens));
      const images = request.input[0].content.filter(item => item.type === 'input_image');
      assert.equal(images.length, expectedImages);
      for (const image of images) {
        assert.match(image.image_url, /^data:image\/png;base64,/);
        assert.match(Buffer.from(image.image_url.split(',')[1], 'base64').toString(), /^Fixture .+\.png$/);
      }
      assert.ok(request.input[0].content.some(item => item.type === 'input_text' && item.text.includes('Fixture rubric')));
      if (fetchImpl) return fetchImpl(url, options);
      const reply = replies?.[requests.length - 1] || {};
      return {
        ok: (reply.status || 200) < 400,
        status: reply.status || 200,
        headers: { get: (name) => reply.headers?.[name] || null },
        text: async () => typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body || {
          status: 'completed',
          usage: { input_tokens: 12000, output_tokens: 1400, total_tokens: 13400 },
          output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(response) }] }],
        }),
        json: async function () { return JSON.parse(await this.text()); },
      };
    };
    const bindings = {
      require: (name) => {
        if (name.endsWith('eval-scoring.cjs')) return require('./eval-scoring.cjs');
        if (name.endsWith('eval-response-schema.cjs')) {
          assert.equal(name, path.join(rootDir, '.eval-diagnostics-tools/.github/scripts/eval-response-schema.cjs'));
          return require('./eval-response-schema.cjs');
        }
        if (name.endsWith('eval-evidence-profile.cjs')) {
          assert.equal(name, path.join(rootDir, '.eval-diagnostics-tools/.github/scripts/eval-evidence-profile.cjs'));
          return require('./eval-evidence-profile.cjs');
        }
        if (name.endsWith('eval-dry-run.cjs')) {
          assert.equal(name, path.join(rootDir, '.eval-diagnostics-tools/.github/scripts/eval-dry-run.cjs'));
          return {
            getRetryDelayMs: require('./eval-dry-run.cjs').getRetryDelayMs,
            createDryRunRecorder: (options) => require('./eval-dry-run.cjs').createDryRunRecorder({
              ...options, fetchImpl: mockFetch, ...(timeoutMs ? { timeoutMs } : {}),
            }),
          };
        }
        if (name === 'path') return { ...path, resolve: (...parts) => path.resolve(rootDir, ...parts) };
        if (name === 'fs') return {
          readFileSync: (file, encoding) => file === path.join(runnerDir, 'issue.json')
            ? JSON.stringify({ title, body: '' })
            : fs.readFileSync(path.resolve(rootDir, file), encoding),
          writeFileSync: (file, data) => {
            writes.push(file);
            fs.writeFileSync(path.resolve(rootDir, file), data);
          },
        };
        throw new Error(`Unexpected workflow dependency: ${name}`);
      },
      __original_require__: require,
      github: {},
      octokit: {},
      context: Object.freeze({ repo: { owner: 'example', repo: 'eval-fixture' } }),
      core: {
        setOutput: (name, value) => { outputs[name] = value; },
        setFailed: (message) => { failures.push(message); },
        warning: () => {},
      },
      exec: {},
      glob: {},
      io: {},
      process: {
        cwd: () => rootDir,
        env: {
          FILENAME: filename,
          TARGET_URL: 'https://example.com/product',
          CAPTURE_DIR: captures + capture,
          ...env,
          RUNNER_TEMP: runnerDir,
          GITHUB_STEP_SUMMARY: path.join(runnerDir, 'summary'),
        },
      },
      fetch: mockFetch,
      setTimeout: (callback, ms) => {
        waits.push(ms);
        callback();
      },
    };
    const run = new AsyncFunction(...Object.keys(bindings), source);
    await run(...Object.values(bindings));
    const directory = path.join(runnerDir, 'eval-dry-run');
    const outputPath = dryRun ? path.join(directory, 'candidate.md') : path.join(rootDir, 'weekly-eval-bets', filename);
    return {
      outputs, failures, waits, requests, writes,
      markdown: fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : null,
      record: fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath.replace(/\.md$/, '.json'), 'utf8')) : null,
      metadata: dryRun && fs.existsSync(path.join(directory, 'scoring.json'))
        ? JSON.parse(fs.readFileSync(path.join(directory, 'scoring.json'), 'utf8')) : null,
      summary: fs.existsSync(path.join(runnerDir, 'summary')) ? fs.readFileSync(path.join(runnerDir, 'summary'), 'utf8') : '',
    };
  }
  return { rootDir, captures, runnerDir, score };
}

test('scoring step runs with github-script bindings for baseline, reuse, and a focused delta', async (t) => {
  const { rootDir, captures, score: runScore } = scoringFixture(t);
  const score = async (options) => {
    const published = await runScore(options);
    assert.equal(published.outputs.evaluation, 'complete');
    assert.deepEqual(published.failures, []);
    assert.equal(published.record.model, 'gpt-6.1-sol');
    assert.ok(published.markdown.includes('*Scoring model: gpt-6.1-sol*'));
    return published;
  };

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

test('manual dry-run inputs are explicit booleans and reject a publishing override before any requests', () => {
  assert.match(workflow, /dry_run:\n(?:.*\n)*?        default: false\n        type: boolean/);
  assert.match(workflow, /test_connection:\n(?:.*\n)*?        default: false\n        type: boolean/);
  assert.match(workflow, /test_model:\n(?:.*\n)*?        type: string/);
  for (const [event, dryRun, model, expectedDryRun, expectedModel] of [
    ['schedule', true, 'gpt-5.6-sol', 'false', ''],
    ['workflow_dispatch', undefined, undefined, 'false', ''],
    ['workflow_dispatch', false, '', 'false', ''],
    ['workflow_dispatch', true, '', 'true', ''],
    ['workflow_dispatch', true, 'gpt-5.6-sol', 'true', 'gpt-5.6-sol'],
  ]) {
    const inputs = { dry_run: dryRun, test_model: model };
    const env = selectedEnvironment('Validate scoring inputs', { eventName: event, inputs });
    assert.equal(env.DRY_RUN, expectedDryRun);
    assert.equal(env.TEST_MODEL, expectedModel);
  }
  const validate = (DRY_RUN, TEST_MODEL, TEST_CONNECTION = 'false') => validateScoringInputs({
    ...selectedEnvironment('Validate scoring inputs'), DRY_RUN, TEST_MODEL, TEST_CONNECTION,
  });
  assert.throws(() => validate('false', 'gpt-5.6-sol'), /test_model is allowed only with dry_run=true/);
  assert.throws(() => validate('false', '', 'true'), /test_connection is allowed only with dry_run=true/);
  assert.throws(() => validate('false', 'gpt-5.6-sol', 'true'), /test_connection is allowed only with dry_run=true/);
  assert.throws(() => validate('true', 'https://example.com'), /deployment name/);
  assert.throws(() => validate('true', '$(echo unsafe)'), /deployment name/);
  validate('true', 'gpt-5.6-sol');
  validate('true', '');
  validate('false', '');
  assert.ok(workflow.indexOf('- name: Validate scoring inputs') < workflow.indexOf('- name: Check minimal text and image requests'));
  assert.ok(workflow.indexOf('- name: Validate scoring inputs') < workflow.indexOf('- name: Auto-score with Copilot'));
  assert.ok(!workflow.includes('${{ inputs.test_model }}'), 'Model input must not be interpolated into shell or JavaScript source');
  assert.ok(!workflow.includes('${{ inputs.test_connection }}'), 'Connection input must not be interpolated into shell or JavaScript source');
});

test('connection expressions select test secret names only for an explicitly opted-in manual dry run', () => {
  for (const eventName of ['schedule', 'push', 'workflow_dispatch']) {
    for (const dryRun of [undefined, false, true]) {
      for (const testConnection of [undefined, false, true]) {
        for (const testModel of ['', 'gpt-5.6-sol']) {
          const inputs = { dry_run: dryRun, test_connection: testConnection, test_model: testModel };
          const manual = eventName === 'workflow_dispatch';
          const selectedTest = manual && dryRun && testConnection;
          const environments = connectionSteps.map(step => selectedEnvironment(step, { eventName, inputs }));
          for (const env of environments) {
            assert.equal(env.DRY_RUN, manual && dryRun ? 'true' : 'false');
            assert.equal(env.TEST_CONNECTION, manual && testConnection ? 'true' : 'false');
            assert.equal(env.TEST_MODEL, manual ? testModel : '');
            assert.equal(env.FOUNDRY_RESPONSES_ENDPOINT, selectedTest ? testResponsesEndpoint : responsesEndpoint);
            assert.equal(env.FOUNDRY_API_KEY, selectedTest ? 'fake-dedicated-test-key' : 'fake-test-key');
          }
          assert.deepEqual(environments[0], environments[1]);
          assert.deepEqual(environments[1], environments[2]);
          if (manual && !dryRun && (testConnection || testModel)) {
            assert.throws(() => validateScoringInputs(environments[0]), /only with dry_run=true/);
          } else {
            validateScoringInputs(environments[0]);
          }
        }
      }
    }
  }
});

test('default connections do not require test secrets and selected tests do not require production secrets', () => {
  for (const [inputs, secrets] of [
    [{ dry_run: true }, { FOUNDRY_RESPONSES_ENDPOINT: responsesEndpoint, FOUNDRY_SCORING_API_KEY: 'fake-test-key' }],
    [{ dry_run: true, test_connection: true }, { FOUNDRY_TEST_RESPONSES_ENDPOINT: testResponsesEndpoint, FOUNDRY_TEST_API_KEY: 'fake-dedicated-test-key' }],
  ]) {
    for (const step of connectionSteps) {
      const env = selectedEnvironment(step, { inputs, secrets });
      validateScoringInputs(env);
      assert.ok(env.FOUNDRY_RESPONSES_ENDPOINT);
      assert.ok(env.FOUNDRY_API_KEY);
    }
  }
});

test('missing selected test secrets never fall back to populated production secrets', () => {
  for (const name of ['FOUNDRY_TEST_RESPONSES_ENDPOINT', 'FOUNDRY_TEST_API_KEY']) {
    for (const value of [undefined, '', '   ']) {
      const secrets = { ...connectionSecrets, [name]: value };
      const inputs = { dry_run: true, test_connection: true, test_model: 'gpt-5.6-sol' };
      for (const step of connectionSteps) {
        const env = selectedEnvironment(step, { inputs, secrets });
        const binding = name.endsWith('ENDPOINT') ? 'FOUNDRY_RESPONSES_ENDPOINT' : 'FOUNDRY_API_KEY';
        assert.equal(env[binding], value ?? '');
        assert.throws(() => validateScoringInputs(env), { message: `Missing test secret: ${name}.` });
      }
    }
  }
});

test('selected endpoint validation requires HTTPS without exposing the endpoint or credentials', () => {
  for (const testConnection of [false, true]) {
    const name = testConnection ? 'FOUNDRY_TEST_RESPONSES_ENDPOINT' : 'FOUNDRY_RESPONSES_ENDPOINT';
    for (const endpoint of ['invalid-private-value', 'http://example.com/responses', 'https://private-user:private-key@example.com/responses']) {
      const env = selectedEnvironment('Validate scoring inputs', {
        inputs: { dry_run: true, test_connection: testConnection },
        secrets: { ...connectionSecrets, [name]: endpoint },
      });
      assert.throws(() => validateScoringInputs(env), { message: `${name} must be a valid HTTPS URL without credentials.` });
    }
  }
});

test('invalid connection selection and missing test secrets stop full scoring before any fetch', async (t) => {
  const { score } = scoringFixture(t);
  let calls = 0;
  const fetchImpl = async () => { calls += 1; };
  await assert.rejects(score({ testConnection: true, fetchImpl }), /test_connection is allowed only with dry_run=true/);
  for (const name of ['FOUNDRY_TEST_RESPONSES_ENDPOINT', 'FOUNDRY_TEST_API_KEY']) {
    await assert.rejects(score({
      dryRun: true, testConnection: true, testModel: 'gpt-5.6-sol', fetchImpl,
      secrets: { ...connectionSecrets, [name]: '' },
    }), { message: `Missing test secret: ${name}.` });
  }
  assert.equal(calls, 0);
});

test('dry runs never publish, always retain attempted diagnostics, and load helpers from the feature revision', () => {
  for (const name of ['Commit and push', 'Comment on issue']) {
    const step = stepSource(name);
    assert.match(step, /if: env\.DRY_RUN != 'true' && steps\.auto-score\.outputs\.evaluation == 'complete' && steps\.find-bet\.outputs\.skip == 'false'/);
  }
  const upload = stepSource('Upload dry-run candidate and diagnostics');
  assert.match(upload, /if: always\(\) && env\.DRY_RUN == 'true'/);
  assert.match(upload, /uses: actions\/upload-artifact@v4/);
  assert.match(upload, /path: \$\{\{ runner\.temp \}\}\/eval-dry-run\//);
  assert.doesNotMatch(upload, /screenshots|issue\.json/);
  assert.match(workflow, /uses: actions\/checkout@v4\n        with:\n          ref: main/);
  const tools = stepSource('Check out diagnostic tools from the workflow revision');
  assert.match(tools, /inputs\.dry_run/);
  assert.match(tools, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(tools, /\.github\/scripts\/eval-dry-run\.cjs/);
  assert.match(tools, /\.github\/scripts\/eval-response-schema\.cjs/);
});

test('full dry-run scoring sends the selected deployment, all images and rubric, and writes only an isolated candidate', async (t) => {
  const { score, rootDir, runnerDir } = scoringFixture(t);
  const result = await score({
    dryRun: true, testModel: 'gpt-5-mini',
    replies: [{ headers: {
      'retry-after': '30', 'retry-after-ms': '30000', 'x-ms-retry-after-ms': '30000',
      'x-ratelimit-remaining-tokens': '12345', 'x-ratelimit-reset-tokens': '1m30s',
      'x-request-id': 'req-candidate', 'x-ratelimit-limit-requests': responsesEndpoint,
      'x-ratelimit-reset-requests': 'fake-test-key', 'x-private-endpoint': responsesEndpoint,
    } }],
  });
  assert.equal(result.outputs.evaluation, 'complete');
  assert.deepEqual(result.failures, []);
  assert.equal(result.record.model, 'gpt-5-mini');
  assert.match(result.markdown, /Scoring model: gpt-5-mini/);
  assert.deepEqual(result.writes, [path.join(runnerDir, 'eval-dry-run/candidate.md'), path.join(runnerDir, 'eval-dry-run/candidate.json')]);
  assert.deepEqual(fs.readdirSync(path.join(rootDir, 'weekly-eval-bets')), ['screenshots']);
  assert.equal(result.metadata.outcome, 'validated');
  const [attempt] = result.metadata.attempts;
  assert.equal(attempt.requested_model, 'gpt-5-mini');
  assert.equal(attempt.http_status, 200);
  assert.equal(attempt.response_status, 'completed');
  assert.equal(attempt.image_count, 4);
  assert.equal(attempt.payload_bytes, Buffer.byteLength(JSON.stringify(result.requests[0])));
  assert.equal(attempt.text_chars, result.requests[0].input[0].content.filter(item => item.type === 'input_text').reduce((sum, item) => sum + item.text.length, 0));
  assert.ok(attempt.elapsed_ms >= 0);
  assert.equal(attempt.request_id, 'req-candidate');
  assert.deepEqual(attempt.usage, { input_tokens: 12000, output_tokens: 1400, total_tokens: 13400 });
  assert.equal(attempt.headers['x-ratelimit-remaining-tokens'], '12345');
  assert.equal(attempt.headers['x-ratelimit-reset-tokens'], '1m30s');
  assert.equal(attempt.headers['x-ratelimit-limit-requests'], undefined);
  assert.match(result.summary, /Dry-run scoring, attempt 1/);
  assert.doesNotMatch(result.summary + JSON.stringify(result.metadata), /scoring\.example|fake-test-key|data:image|Fixture rubric|Fixture page/);
});

test('an empty override dry run uses the production deployment without publishing', async (t) => {
  for (const testConnection of [false, true]) {
    const result = await scoringFixture(t).score({ dryRun: true, testConnection });
    assert.equal(result.requests[0].model, scoringModel);
    assert.equal(result.record.model, scoringModel);
    assert.equal(result.metadata.attempts[0].requested_model, scoringModel);
    assert.equal(result.outputs.evaluation, 'complete');
  }
});

test('gpt-5.6-sol connection experiments preserve the original full image payload and output budget', async (t) => {
  const results = [];
  for (const testConnection of [false, true]) {
    const result = await scoringFixture(t).score({ dryRun: true, testConnection, testModel: 'gpt-5.6-sol' });
    assert.equal(result.outputs.evaluation, 'complete');
    assert.deepEqual(result.failures, []);
    assert.equal(result.record.model, 'gpt-5.6-sol');
    assert.equal(result.metadata.attempts[0].image_count, 4);
    assert.deepEqual(Object.keys(result.requests[0]).sort(), ['input', 'model']);
    assert.doesNotMatch(result.summary + JSON.stringify(result.metadata), /scoring\.example|fake-test-key|fake-dedicated-test-key|data:image/);
    results.push(result);
  }
  assert.deepEqual(results[0].requests, results[1].requests, 'Changing connections must not change the scoring schema, prompt, evidence, or output budget');
});

test('output budget is validated before requests and only applies to manual dry runs', async (t) => {
  for (const value of [-1, 1, 511, 32769, 8192.5, 'NaN', 'Infinity', '1e4', '8192;exit']) {
    const env = selectedEnvironment('Validate scoring inputs', {
      inputs: { dry_run: true, test_max_output_tokens: value },
    });
    assert.throws(() => validateScoringInputs(env), /test_max_output_tokens must be/);
  }
  for (const value of [0, 512, 8192, 32768]) {
    validateScoringInputs(selectedEnvironment('Validate scoring inputs', {
      inputs: { dry_run: true, test_max_output_tokens: value },
    }));
  }
  await assert.rejects(scoringFixture(t).score({ maxOutputTokens: 8192 }), /only with dry_run=true/);
  const scheduled = await scoringFixture(t).score({ eventName: 'schedule', maxOutputTokens: 8192 });
  assert.equal(scheduled.requests[0].max_output_tokens, undefined);
  assert.equal(scheduled.outputs.evaluation, 'complete');
});

test('bounded scoring preserves every image and input while recording the selected output budget', async (t) => {
  const { score } = scoringFixture(t);
  const original = await score({ dryRun: true, testConnection: true, testModel: 'gpt-5.6-sol' });
  const bounded = await score({ dryRun: true, testConnection: true, testModel: 'gpt-5.6-sol', maxOutputTokens: 8192 });
  assert.deepEqual(bounded.requests[0].input, original.requests[0].input);
  assert.equal(bounded.requests[0].max_output_tokens, 8192);
  assert.equal(bounded.metadata.attempts[0].max_output_tokens, 8192);
  assert.equal(bounded.outputs.evaluation, 'complete');
  assert.deepEqual(bounded.failures, []);
});

test('compact evidence is an explicit dry-run-only opt-in with truthful candidate attribution', async (t) => {
  await assert.rejects(scoringFixture(t).score({ compactEvidence: true }), /test_compact_evidence is allowed only with dry_run=true/);
  const scheduled = await scoringFixture(t).score({ eventName: 'schedule', compactEvidence: true });
  assert.equal(scheduled.record.dryRun, undefined);
  assert.ok(scheduled.requests[0].input[0].content.some(item => item.text?.includes('Fixture page-content.html')));
  const result = await scoringFixture(t).score({ dryRun: true, compactEvidence: true, maxOutputTokens: 8192 });
  assert.equal(result.outputs.evaluation, 'complete');
  assert.equal(result.requests[0].input[0].content.filter(item => item.type === 'input_image').length, 4);
  assert.ok(result.requests[0].input[0].content.some(item => item.text?.includes('Fixture rubric')));
  assert.ok(result.requests[0].input[0].content.some(item => item.text?.includes('Omitted from compact model input')));
  assert.ok(!result.requests[0].input[0].content.some(item => item.text?.includes('Fixture page-content.html')));
  assert.equal(result.metadata.attempts[0].evidence_profile, 'compact');
  assert.deepEqual(result.record.dryRun, { evidenceProfile: 'compact', maxOutputTokens: 8192 });
  assert.match(result.markdown, /Not a published full-evidence baseline/);
  assert.deepEqual(result.failures, []);
});

test('strict output is a dry-run-only opt-in that preserves full evidence and constrains craft placement', async (t) => {
  assert.match(workflow, /test_structured_output:\n(?:.*\n)*?        default: false\n        type: boolean/);
  await assert.rejects(scoringFixture(t).score({ structuredOutput: true }), /test_structured_output is allowed only with dry_run=true/);
  const scheduled = await scoringFixture(t).score({ eventName: 'schedule', structuredOutput: true });
  assert.equal(scheduled.requests[0].text, undefined);
  assert.equal(scheduled.requests[0].input.length, 1);
  assert.equal(scheduled.record.dryRun, undefined);
  const { score } = scoringFixture(t);
  const original = await score({ dryRun: true, testModel: 'gpt-5-mini', maxOutputTokens: 8192 });
  const structured = await score({ dryRun: true, testModel: 'gpt-5-mini', maxOutputTokens: 8192, structuredOutput: true });
  const request = structured.requests[0];
  assert.deepEqual(request.input[0], original.requests[0].input[0]);
  assert.equal(request.input[1].role, 'developer');
  assert.match(request.input[1].content[0].text, /Never put craft scores in primary\.items/);
  assert.equal(request.text.format.type, 'json_schema');
  assert.equal(request.text.format.strict, true);
  assert.equal(request.text.format.schema.properties.primary.properties.items.maxItems, 0);
  assert.equal(request.text.format.schema.properties.craft.properties.dimensions.minItems, 6);
  assert.equal(structured.metadata.attempts[0].response_format, 'json_schema');
  assert.equal(structured.record.dryRun.responseFormat, 'json_schema');
  assert.equal(structured.outputs.evaluation, 'complete');
  assert.deepEqual(structured.failures, []);
});

test('strict output requests keep runtime validation and cannot publish misplaced scores', async (t) => {
  const result = await scoringFixture(t).score({
    dryRun: true, structuredOutput: true,
    response: { ...baselineResponse, primary: {
      ...emptyPrimary,
      items: [{ name: 'Visual hierarchy', score: 4, rationale: 'Misplaced score.' }],
    } },
  });
  assert.match(result.failures.join(), /Craft lens must not return primary score items/);
  assert.equal(result.outputs.evaluation, undefined);
  assert.equal(result.markdown, null);
  assert.deepEqual(result.writes, []);
});

test('429 retries retain sanitized failure metadata and fail without a green fallback', async (t) => {
  const result = await scoringFixture(t).score({
    dryRun: true, testModel: 'gpt-5-mini',
    replies: [429, 429, 429].map((status, index) => ({
      status,
      headers: { 'retry-after': '45', 'x-ratelimit-remaining-requests': '0', 'apim-request-id': `req-${index}` },
      body: { error: { message: `Do not log ${responsesEndpoint} fake-test-key`, code: 'RateLimitReached' } },
    })),
  });
  assert.deepEqual(result.waits, [45000, 60000]);
  assert.match(result.failures.join(), /429/);
  assert.equal(result.outputs.evaluation, undefined);
  assert.equal(result.markdown, null);
  assert.deepEqual(result.writes, []);
  assert.equal(result.metadata.outcome, 'failed');
  assert.deepEqual(result.metadata.attempts.map(attempt => attempt.http_status), [429, 429, 429]);
  assert.ok(result.metadata.attempts.every(attempt => attempt.error_code === 'http_error' && attempt.elapsed_ms >= 0));
  assert.match(result.failures.join(), /RateLimitReached/);
  assert.doesNotMatch(result.summary + JSON.stringify(result.metadata), /scoring\.example|fake-test-key/);
});

test('dry-run HTTP failures surface the sanitized service code and explanation', async (t) => {
  const result = await scoringFixture(t).score({
    dryRun: true, maxOutputTokens: 8192,
    replies: Array.from({ length: 3 }, () => ({
      status: 429,
      body: { error: { code: 'rate_limit_exceeded', message: `Peak capacity unavailable at ${responsesEndpoint} fake-test-key` } },
    })),
  });
  assert.match(result.failures.join(), /rate_limit_exceeded/);
  assert.match(result.failures.join(), /Peak capacity unavailable/);
  assert.doesNotMatch(result.failures.join() + result.summary, /scoring\.example|fake-test-key/);
  assert.equal(result.markdown, null);
  assert.equal(result.outputs.evaluation, undefined);
});

test('dry-run retries respect Azure millisecond hints and do not retry sooner than requested', async (t) => {
  const result = await scoringFixture(t).score({
    dryRun: true,
    replies: [
      { status: 429, headers: { 'retry-after-ms': '45123' }, body: { error: { code: 'rate_limit_exceeded' } } },
      { status: 503, headers: { 'x-ms-retry-after-ms': '75000' }, body: { error: {} } },
      {},
    ],
  });
  assert.deepEqual(result.waits, [45123, 75000]);
  assert.equal(result.outputs.evaluation, 'complete');
  const blocked = await scoringFixture(t).score({
    dryRun: true,
    replies: [{ status: 429, headers: { 'retry-after-ms': '180000' }, body: { error: {} } }],
  });
  assert.deepEqual(blocked.waits, []);
  assert.equal(blocked.requests.length, 1);
  assert.match(blocked.failures.join(), /no early retry/);
});

test('a bounded incomplete response reports its reason and never publishes partial scores', async (t) => {
  const result = await scoringFixture(t).score({
    dryRun: true, maxOutputTokens: 8192,
    replies: [{ body: {
      status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' },
      output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(baselineResponse) }] }],
    } }],
  });
  assert.match(result.failures.join(), /max_output_tokens/);
  assert.equal(result.outputs.evaluation, undefined);
  assert.equal(result.markdown, null);
  assert.deepEqual(result.writes, []);
});

test('production and dry-run retries retain the 30/60-second policy and the identical full payload', async (t) => {
  for (const dryRun of [false, true]) {
    const result = await scoringFixture(t).score({
      dryRun, replies: [{ status: 500, body: { error: {} } }, { status: 503, body: { error: {} } }, {}],
    });
    assert.deepEqual(result.waits, [30000, 60000]);
    assert.equal(result.outputs.evaluation, 'complete');
    assert.deepEqual(result.failures, []);
    assert.equal(result.requests.length, 3);
    assert.deepEqual(result.requests[0], result.requests[1]);
    assert.deepEqual(result.requests[1], result.requests[2]);
  }
});

test('retry-after cannot turn a dry run into an hours-long wait', async (t) => {
  for (const retryAfter of ['20000', new Date(Date.now() + 3600000).toUTCString()]) {
    const result = await scoringFixture(t).score({
      dryRun: true, replies: [{ status: 429, headers: { 'retry-after': retryAfter }, body: { error: {} } }],
    });
    assert.equal(result.requests.length, 1);
    assert.deepEqual(result.waits, []);
    assert.match(result.failures.join(), /retry-after exceeds/);
    assert.equal(result.metadata.outcome, 'failed');
    assert.equal(result.metadata.attempts[0].headers['retry-after'], retryAfter);
  }
});

test('full scoring rejects incomplete HTTP 200, refusals, missing output, malformed JSON and invalid scores', async (t) => {
  for (const [body, errorCode] of [
    [{ status: 'incomplete', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(baselineResponse) }] }] }, 'response_not_completed'],
    [{ status: 'completed', output: [{ type: 'message', status: 'incomplete', content: [{ type: 'output_text', text: JSON.stringify(baselineResponse) }] }] }, 'response_not_completed'],
    [{ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: responsesEndpoint }] }] }, 'refusal'],
    [{ status: 'completed', refusal: 'Do not log this', output: [] }, 'refusal'],
    [{ status: 'completed', output: [] }, null],
    [{ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: '{"summaryMarkdown":"partial"}' }] }] }, null],
    ['not JSON', 'invalid_json'],
    [{ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(baselineResponse) }] }] }, 'response_not_completed'],
  ]) {
    const result = await scoringFixture(t).score({ dryRun: true, replies: [{ body }] });
    assert.equal(result.failures.length, 1, JSON.stringify(body));
    assert.equal(result.outputs.evaluation, undefined);
    assert.equal(result.markdown, null);
    assert.deepEqual(result.writes, []);
    assert.equal(result.metadata.outcome, 'failed');
    assert.equal(result.metadata.attempts[0].http_status, 200);
    assert.equal(result.metadata.attempts[0].error_code, errorCode);
    assert.doesNotMatch(result.summary, /scoring\.example|Do not log this/);
  }
});

test('non-transient HTTP and network failures retain sanitized diagnostics without retrying', async (t) => {
  for (const options of [
    { replies: [{ status: 400, body: { error: { message: responsesEndpoint } } }] },
    { fetchImpl: async () => { throw new Error(`${responsesEndpoint} fake-test-key`); } },
  ]) {
    const result = await scoringFixture(t).score({ dryRun: true, ...options });
    assert.equal(result.requests.length, 1);
    assert.deepEqual(result.waits, []);
    assert.equal(result.outputs.evaluation, undefined);
    assert.equal(result.failures.length, 1);
    assert.equal(result.metadata.outcome, 'failed');
    assert.equal(result.metadata.attempts[0].error_code, options.replies ? 'http_error' : 'network_error');
    assert.doesNotMatch(result.summary + result.failures.join(), /scoring\.example|fake-test-key/);
  }
});

test('post-response validation failures retain an actionable sanitized reason', async (t) => {
  const result = await scoringFixture(t).score({
    dryRun: true,
    replies: [{ body: {
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: '{"summaryMarkdown":"partial"}' }] }],
    } }],
  });
  assert.equal(result.metadata.outcome, 'failed');
  assert.match(result.metadata.failure.message, /response\.primary must be an object/);
  assert.match(result.failures.join(), /response\.primary must be an object/);
  assert.match(result.summary, /Dry-run failure/);
  assert.equal(result.outputs.evaluation, undefined);
});

test('dry-run request and response body timeouts fail clearly, retain metadata and clear their timers', async (t) => {
  for (const bodyTimeout of [false, true]) {
    let signal;
    const result = await scoringFixture(t).score({
      dryRun: true, timeoutMs: 5,
      fetchImpl: async (_url, options) => {
        signal = options.signal;
        if (!bodyTimeout) return new Promise(() => {});
        return { ok: true, status: 200, headers: { get: () => null }, text: () => new Promise(() => {}) };
      },
    });
    assert.equal(signal.aborted, true);
    assert.match(result.failures.join(), /timed out/);
    assert.equal(result.outputs.evaluation, undefined);
    assert.equal(result.metadata.outcome, 'failed');
    assert.equal(result.metadata.attempts[0].http_status, bodyTimeout ? 200 : null);
    assert.equal(result.metadata.attempts[0].error_code, 'timeout');
    assert.deepEqual(result.writes, []);
  }
  let signal;
  const result = await scoringFixture(t).score({
    dryRun: true, timeoutMs: 5,
    fetchImpl: async (_url, options) => {
      signal = options.signal;
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({
        status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(baselineResponse) }] }],
      }) };
    },
  });
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(signal.aborted, false, 'Successful requests must clear their timeout');
  assert.equal(result.outputs.evaluation, 'complete');
});

function minimalDiagnosticsFixture(t, {
  status = 200, dryRun = true, testConnection = false, testModel = 'gpt-5.6-sol',
  secrets = connectionSecrets, fetchImpl,
} = {}) {
  const inputs = { dry_run: dryRun, test_connection: testConnection, test_model: testModel };
  validateScoringInputs(selectedEnvironment('Validate scoring inputs', { inputs, secrets }));
  const env = selectedEnvironment('Check minimal text and image requests', { inputs, secrets });
  const { rootDir, runnerDir } = scoringFixture(t);
  const imagePath = path.join(rootDir, 'weekly-eval-bets/screenshots/original/above-the-fold.png');
  fs.writeFileSync(imagePath, Buffer.from('89504e470d0a1a0a', 'hex'));
  const calls = [];
  const summaryPath = path.join(runnerDir, 'summary');
  const mockFetch = async (url, options) => {
    assert.equal(url, testConnection ? testResponsesEndpoint : responsesEndpoint);
    assert.equal(options.headers['api-key'], testConnection ? 'fake-dedicated-test-key' : 'fake-test-key');
    calls.push(JSON.parse(options.body));
    if (fetchImpl) return fetchImpl(url, options);
    return {
      ok: status === 200, status, headers: { get: () => null },
      text: async () => JSON.stringify(status === 200
        ? { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'OK' }] }] }
        : { error: { message: `${env.FOUNDRY_RESPONSES_ENDPOINT} ${env.FOUNDRY_API_KEY}` } }),
    };
  };
  const run = vm.runInNewContext(embeddedNode('Check minimal text and image requests'), {
    require(name) {
      if (name === 'node:fs') return {
        ...fs,
        readdirSync: (dir, options) => fs.readdirSync(path.join(rootDir, dir), options),
        existsSync: (file) => fs.existsSync(path.resolve(rootDir, file)),
        statSync: (file) => fs.statSync(path.resolve(rootDir, file)),
      };
      if (name === 'node:path') return { ...path, join: (...parts) => parts[0] === 'weekly-eval-bets/screenshots' ? path.join(rootDir, ...parts) : path.join(...parts) };
      if (name === 'node:child_process') return { execFileSync: () => JSON.stringify({ state: 'open', labels: [{ name: 'status:ready' }] }) };
      if (name.endsWith('eval-diagnostics.cjs')) return {
        ...require('./eval-diagnostics.cjs'),
        runDiagnostics: (options) => require('./eval-diagnostics.cjs').runDiagnostics({ fetchImpl: mockFetch, ...options }),
      };
      if (name.endsWith('eval-dry-run.cjs')) return {
        createDryRunRecorder: (options) => require('./eval-dry-run.cjs').createDryRunRecorder({ ...options, fetchImpl: mockFetch }),
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    process: { env: {
      ...env,
      RUNNER_TEMP: runnerDir, GITHUB_STEP_SUMMARY: summaryPath, ISSUE_NUMBER: '54',
    } },
  });
  return { run, calls, runnerDir, summaryPath };
}

test('minimal dry-run diagnostics use the same deployment and retain sanitized failures', async (t) => {
  for (const [testConnection, status] of [[false, 200], [false, 429], [true, 200], [true, 429], [true, 503]]) {
    const { run, calls, runnerDir, summaryPath } = minimalDiagnosticsFixture(t, { testConnection, status });
    if (status === 200) await run;
    else await assert.rejects(run, /Minimal Foundry checks failed/);
    assert.equal(calls.length, status === 200 ? 2 : 1);
    assert.ok(calls.every(call => call.model === 'gpt-5.6-sol'));
    assert.equal(calls[0].input, 'Reply with OK');
    if (status === 200) assert.equal(calls[1].input[0].content.filter(item => item.type === 'input_image').length, 1);
    const metadata = JSON.parse(fs.readFileSync(path.join(runnerDir, 'eval-dry-run/diagnostics.json'), 'utf8'));
    assert.equal(metadata.outcome, status === 200 ? 'completed' : 'failed');
    assert.equal(metadata.attempts[0].http_status, status);
    if (status !== 200) assert.match(metadata.failure.message, new RegExp(`text check failed \\(HTTP ${status}\\)`));
    assert.doesNotMatch(fs.readFileSync(summaryPath, 'utf8') + JSON.stringify(metadata), /scoring\.example|fake-test-key|fake-dedicated-test-key/);
  }
});

test('invalid connection selection and missing test secrets stop minimal diagnostics before any fetch', (t) => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; };
  assert.throws(() => minimalDiagnosticsFixture(t, { dryRun: false, testConnection: true, fetchImpl }), /test_connection is allowed only with dry_run=true/);
  for (const name of ['FOUNDRY_TEST_RESPONSES_ENDPOINT', 'FOUNDRY_TEST_API_KEY']) {
    assert.throws(() => minimalDiagnosticsFixture(t, {
      testConnection: true, secrets: { ...connectionSecrets, [name]: '' }, fetchImpl,
    }), { message: `Missing test secret: ${name}.` });
  }
  assert.equal(calls, 0);
});
