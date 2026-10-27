const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');
const { test } = require('node:test');

const workflow = fs.readFileSync(path.join(__dirname, '../workflows/weekly-eval-bet.yml'), 'utf8');

function stepSource(name) {
  const source = workflow.split(`- name: ${name}\n`)[1]?.split('\n      - name:')[0];
  assert.ok(source, `Missing workflow step: ${name}`);
  return source;
}

function shellSource(name) {
  const source = stepSource(name).split('        run: |\n')[1];
  assert.ok(source, `Missing shell script: ${name}`);
  return source.split('\n').map(line => line.replace(/^          /, '')).join('\n');
}

function evaluate(expression, context) {
  return vm.runInNewContext(expression.replace(/steps\.([a-z-]+)\.outputs/g, 'steps["$1"].outputs'), context);
}

function fixture(t, { issue = {}, candidates, selectedNumber, fail = '' } = {}) {
  const root = fs.mkdtempSync(path.join(__dirname, '.eval-publishing-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bin = path.join(root, 'bin');
  const runner = path.join(root, 'runner with spaces');
  fs.mkdirSync(bin);
  fs.mkdirSync(runner);
  fs.symlinkSync(process.execPath, path.join(bin, 'node'));
  fs.writeFileSync(path.join(root, 'fixture.json'), JSON.stringify({
    issue: { state: 'OPEN', labels: [{ name: 'status:ready' }], title: 'Product craft', body: 'Target https://example.com', ...issue },
    candidates: candidates ?? [{ number: 42, createdAt: '2026-10-01', state: 'OPEN', labels: ['weekly-eval-bet', 'status:ready'] }],
    selectedNumber,
    fail,
  }));
  const mock = `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const tool = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const fixture = JSON.parse(fs.readFileSync('fixture.json', 'utf8'));
fs.appendFileSync('calls.jsonl', JSON.stringify([tool, ...args]) + '\\n');
if (tool === 'git' && fs.readFileSync(process.env.GITHUB_OUTPUT, 'utf8').includes('published=')) {
  throw new Error('Publication was reported before a successful push.');
}
const operation = tool + ':' + args[0] + (tool === 'gh' ? ':' + args[1] : '');
if (fixture.fail === operation) process.exit(19);
if (tool === 'gh' && args[0] === 'issue' && args[1] === 'view') {
  process.stdout.write(JSON.stringify(fixture.issue));
} else if (tool === 'gh' && args[0] === 'issue' && args[1] === 'list') {
  const expected = ['issue', 'list', '--label', 'weekly-eval-bet', '--label', 'status:ready', '--state', 'open',
    '--json', 'number,createdAt', '--jq', 'sort_by(.createdAt) | .[0].number'];
  if (JSON.stringify(args) !== JSON.stringify(expected)) throw new Error('Unexpected queue selection arguments.');
  const candidates = fixture.candidates.filter(item => item.state.toLowerCase() === 'open'
    && item.labels.includes('weekly-eval-bet') && item.labels.includes('status:ready'));
  candidates.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  process.stdout.write(String(fixture.selectedNumber ?? candidates[0]?.number ?? 'null'));
} else if (tool === 'gh' && (args[1] === 'comment' || args[1] === 'edit')) {
  if (args[0] !== 'issue') throw new Error('Unexpected issue command.');
} else if (tool !== 'git') {
  throw new Error('Unexpected command: ' + tool + ' ' + args.join(' '));
}
`;
  for (const command of ['gh', 'git']) {
    fs.writeFileSync(path.join(bin, command), mock, { mode: 0o755 });
  }
  const calls = () => {
    const file = path.join(root, 'calls.jsonl');
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];
  };
  const summary = () => {
    const file = path.join(root, 'summary');
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  };
  function run(name, { issueNumber = '', dryRun = 'false', evaluation = 'complete', skip = 'false', published = '' } = {}) {
    const context = {
      env: { DRY_RUN: dryRun },
      inputs: { issue_number: issueNumber },
      secrets: { GITHUB_TOKEN: 'mock-token' },
      steps: {
        'find-bet': { outputs: {
          skip, issue_number: issueNumber || '42', filename: '2026-W40_product-craft_123_2.md',
          capture_id: '2026-W40_product-craft_123_2',
        } },
        'auto-score': { outputs: { evaluation } },
        publish: { outputs: { published } },
      },
    };
    const source = stepSource(name);
    const condition = source.match(/^        if: (.+)$/m)?.[1];
    if (condition && !evaluate(condition, context)) return { skipped: true, outputs: {} };
    const outputPath = path.join(root, `${name.replace(/ /g, '-')}.output`);
    fs.writeFileSync(outputPath, '');
    const env = {
      PATH: `${bin}:/usr/bin:/bin`,
      RUNNER_TEMP: runner,
      GITHUB_OUTPUT: outputPath,
      GITHUB_STEP_SUMMARY: path.join(root, 'summary'),
      GITHUB_RUN_ID: '123',
      GITHUB_RUN_ATTEMPT: '2',
      DRY_RUN: dryRun,
    };
    const header = source.split('        run: |\n')[0];
    for (const [, key, value] of header.matchAll(/^          ([A-Z_]+): (.+)$/gm)) {
      env[key] = value.replace(/\$\{\{ (.*?) \}\}/g, (_, expression) => String(evaluate(expression, context)));
    }
    const result = spawnSync('/bin/bash', ['-c', shellSource(name)], { cwd: root, env, encoding: 'utf8' });
    assert.ifError(result.error);
    const output = fs.readFileSync(outputPath, 'utf8');
    return {
      ...result, output,
      outputs: Object.fromEntries(output.trim().split('\n').filter(Boolean).map(line => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      })),
    };
  }
  return { root, runner, calls, summary, run };
}

function publishAndComment(f, options = {}) {
  const publish = f.run('Commit and push', options);
  const comment = !publish.skipped && publish.status !== 0
    ? { skipped: true }
    : f.run('Comment on issue', { ...options, published: publish.outputs.published });
  return { publish, comment };
}

test('manual issue selection uses an environment binding, never source interpolation or diagnostics gating', () => {
  const source = stepSource('Find ready bet');
  assert.match(source, /ISSUE_NUMBER: \$\{\{ inputs\.issue_number \}\}/);
  assert.doesNotMatch(shellSource('Find ready bet'), /\$\{\{/);
  assert.doesNotMatch(source, /steps\.diagnostics|^\s+if:/m);
});

test('ready issues retain safe issue metadata and immutable capture identity in every selection mode', (t) => {
  for (const issueNumber of ['', '42']) {
    for (const dryRun of ['false', 'true']) {
      const f = fixture(t);
      const result = f.run('Find ready bet', { issueNumber, dryRun });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.outputs.skip, 'false');
      assert.equal(result.outputs.issue_number, '42');
      assert.equal(result.outputs.title, 'Product craft');
      assert.equal(result.outputs.slug, 'product-craft');
      assert.match(result.outputs.week, /^\d{4}-W\d{2}$/);
      assert.equal(result.outputs.capture_id, `${result.outputs.week}_product-craft_123_2`);
      assert.equal(result.outputs.filename, `${result.outputs.capture_id}.md`);
      assert.deepEqual(f.calls().at(-1), ['gh', 'issue', 'view', '42', '--json', 'state,labels,title,body']);
      assert.equal(f.calls().length, issueNumber ? 1 : 2);
      assert.equal(JSON.parse(fs.readFileSync(path.join(f.runner, 'issue.json'), 'utf8')).body, 'Target https://example.com');
      assert.equal(f.summary(), '');
    }
  }
});

test('automatic selection preserves oldest open ready weekly bet ordering', (t) => {
  const ready = ['weekly-eval-bet', 'status:ready'];
  const f = fixture(t, { candidates: [
    { number: 81, createdAt: '2026-10-10', state: 'OPEN', labels: ready },
    { number: 7, createdAt: '2026-01-01', state: 'CLOSED', labels: ready },
    { number: 8, createdAt: '2026-01-02', state: 'OPEN', labels: ['weekly-eval-bet', 'status:reviewed'] },
    { number: 9, createdAt: '2026-01-03', state: 'OPEN', labels: ['status:ready'] },
    { number: 42, createdAt: '2026-10-01', state: 'OPEN', labels: ready },
  ] });
  const result = f.run('Find ready bet');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.outputs.issue_number, '42');
});

test('reviewed, closed and missing-ready issues skip all reports and queue changes in every mode', (t) => {
  for (const issue of [
    { labels: [{ name: 'status:reviewed' }] },
    { labels: [{ name: 'status:ready' }, { name: 'status:reviewed' }] },
    { state: 'CLOSED' },
    { state: 'closed', labels: [{ name: 'status:reviewed' }] },
    { labels: [{ name: 'weekly-eval-bet' }] },
    { labels: [] },
  ]) {
    for (const issueNumber of ['', '42']) {
      for (const dryRun of ['false', 'true']) {
        const f = fixture(t, { issue });
        const result = f.run('Find ready bet', { issueNumber, dryRun });
        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(result.outputs, { skip: 'true' });
        assert.match(f.summary(), /no longer open and ready/);
        for (const name of ['Check minimal text and image requests', 'Resolve target page', 'Capture screenshots with Playwright (stealth)', 'Auto-score with Copilot']) {
          const condition = stepSource(name).match(/^        if: (.+)$/m)?.[1];
          assert.ok(condition, `${name} must have a readiness gate`);
          assert.equal(evaluate(condition, {
            env: { DRY_RUN: dryRun },
            github: { event_name: 'workflow_dispatch' },
            inputs: { diagnostics_first: true },
            steps: { 'find-bet': { outputs: result.outputs } },
          }), false, name);
        }
        const { publish, comment } = publishAndComment(f, { dryRun, skip: result.outputs.skip });
        assert.equal(publish.skipped, true);
        assert.equal(comment.skipped, true);
        assert.ok(f.calls().every(call => call[0] === 'gh' && ['list', 'view'].includes(call[2])));
        assert.equal(fs.existsSync(path.join(f.root, 'weekly-eval-bets')), false);
      }
    }
  }
});

test('readiness is checked before optional diagnostics and every scoring mode', () => {
  const find = workflow.indexOf('- name: Find ready bet');
  for (const name of ['Check minimal text and image requests', 'Resolve target page', 'Capture screenshots with Playwright (stealth)', 'Auto-score with Copilot']) {
    assert.ok(find < workflow.indexOf(`- name: ${name}`), name);
  }
});

test('an empty automatic queue skips explicitly without fetching or publishing', (t) => {
  for (const selectedNumber of ['null', '']) {
    const f = fixture(t, { selectedNumber });
    const result = f.run('Find ready bet');
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.outputs, { skip: 'true' });
    assert.match(f.summary(), /No ready bets found/);
    assert.equal(f.calls().length, 1);
    assert.equal(fs.existsSync(path.join(f.runner, 'issue.json')), false);
  }
});

test('invalid or malicious manual numbers fail before any gh call or shell execution', (t) => {
  for (const issueNumber of [
    '0', '-1', '1.5', '1e2', 'NaN', 'Infinity', 'null', ' 42', '42 ', ' ', '01',
    '9007199254740992', '99999999999999999999999999', '--help',
    '$(touch injected)', '`touch injected`', '42; touch injected', '42"\n touch injected\n#',
    '42\nskip=false', '42\rpublished=true',
  ]) {
    const f = fixture(t);
    const result = f.run('Find ready bet', { issueNumber });
    assert.notEqual(result.status, 0, issueNumber);
    assert.match(result.stderr, /positive safe integer/);
    assert.deepEqual(result.outputs, {});
    assert.deepEqual(f.calls(), []);
    assert.equal(fs.existsSync(path.join(f.root, 'injected')), false);
    assert.equal(fs.existsSync(path.join(f.runner, 'issue.json')), false);
  }
});

test('invalid automatic selections fail before fetching selected issue details', (t) => {
  for (const selectedNumber of ['0', '9007199254740992', '$(touch injected)']) {
    const f = fixture(t, { selectedNumber });
    const result = f.run('Find ready bet');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /positive safe integer/);
    assert.equal(f.calls().length, 1);
    assert.equal(fs.existsSync(path.join(f.root, 'injected')), false);
  }
});

test('the maximum positive safe integer is accepted without rounding', (t) => {
  const f = fixture(t);
  const result = f.run('Find ready bet', { issueNumber: '9007199254740991' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.outputs.issue_number, '9007199254740991');
  assert.equal(f.calls()[0][3], '9007199254740991');
});

test('untrusted titles cannot execute shell code or inject output metadata and slugs stay bounded', (t) => {
  for (const title of ['%s "$(touch injected)" `touch injected`\nskip=true\rpublished=true', 'A'.repeat(200)]) {
    const f = fixture(t, { issue: { title } });
    const result = f.run('Find ready bet', { issueNumber: '42' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.outputs.title, title.replace(/[\r\n]/g, ' '));
    assert.equal(result.outputs.skip, 'false');
    assert.equal(result.outputs.published, undefined);
    assert.equal(Object.keys(result.outputs).length, 7);
    assert.equal(result.output.split('\nskip=').length, 2);
    assert.match(result.outputs.slug, /^[a-z0-9-]+$/);
    assert.ok(result.outputs.slug.length <= 160);
    assert.equal(fs.existsSync(path.join(f.root, 'injected')), false);
  }
});

test('queue listing or selected issue fetch failures fail closed with no readiness output', (t) => {
  for (const fail of ['gh:issue:list', 'gh:issue:view']) {
    const f = fixture(t, { fail });
    const result = f.run('Find ready bet');
    assert.notEqual(result.status, 0);
    assert.deepEqual(result.outputs, {});
    assert.ok(f.calls().every(call => ['list', 'view'].includes(call[2])));
  }
});

test('publishing gates require a complete non-dry-run ready evaluation', (t) => {
  assert.match(stepSource('Commit and push'), /^        id: publish$/m);
  for (const options of [
    { dryRun: 'true' }, { evaluation: '' }, { evaluation: 'failed' }, { skip: 'true' }, { skip: '' },
  ]) {
    const f = fixture(t);
    const { publish, comment } = publishAndComment(f, options);
    assert.equal(publish.skipped, true);
    assert.equal(comment.skipped, true);
    assert.deepEqual(f.calls(), []);
  }
});

test('successful publishing pushes HEAD to main before exposing published and updates the queue last', (t) => {
  const f = fixture(t);
  const { publish, comment } = publishAndComment(f);
  assert.equal(publish.status, 0, publish.stderr);
  assert.deepEqual(publish.outputs, { published: 'true' });
  assert.equal(comment.status, 0, comment.stderr);
  const calls = f.calls();
  assert.deepEqual(calls.slice(0, 4), [
    ['git', 'config', 'user.name', 'github-actions[bot]'],
    ['git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'],
    ['git', 'add', 'weekly-eval-bets/2026-W40_product-craft_123_2.md'],
    ['git', 'add', 'weekly-eval-bets/2026-W40_product-craft_123_2.json', 'weekly-eval-bets/screenshots/2026-W40_product-craft_123_2'],
  ]);
  assert.deepEqual(calls[4], ['git', 'commit', '-m',
    'Auto-score eval bet #42\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>']);
  assert.deepEqual(calls[5], ['git', 'pull', '--rebase', 'origin', 'main']);
  assert.deepEqual(calls[6], ['git', 'push', 'origin', 'HEAD:main']);
  assert.deepEqual(calls[7], ['gh', 'issue', 'comment', '42', '--body',
    'Auto-scored evaluation committed to `weekly-eval-bets/2026-W40_product-craft_123_2.md`. Pending human review on Friday.']);
  assert.deepEqual(calls[8], ['gh', 'issue', 'edit', '42', '--remove-label', 'status:ready', '--add-label', 'status:reviewed']);
  assert.equal(calls.length, 9);
});

test('add, commit, pull and push failures stop immediately without publication or queue updates', (t) => {
  for (const command of ['config', 'add', 'commit', 'pull', 'push']) {
    const f = fixture(t, { fail: `git:${command}` });
    const { publish, comment } = publishAndComment(f);
    assert.notEqual(publish.status, 0, command);
    assert.equal(publish.outputs.published, undefined, command);
    assert.equal(publish.output, '', command);
    assert.equal(comment.skipped, true, command);
    const calls = f.calls();
    assert.equal(calls.at(-1)[1], command);
    assert.ok(calls.every(call => call[0] === 'git'));
    const gatedComment = f.run('Comment on issue', { published: publish.outputs.published });
    assert.equal(gatedComment.skipped, true);
    assert.deepEqual(f.calls(), calls);
  }
});

test('comments require an explicit successful push output even when all other conditions pass', (t) => {
  for (const published of ['', 'false', 'TRUE']) {
    const f = fixture(t);
    assert.equal(f.run('Comment on issue', { published }).skipped, true);
    assert.deepEqual(f.calls(), []);
  }
});

test('a failed issue comment never removes the ready label', (t) => {
  const f = fixture(t, { fail: 'gh:issue:comment' });
  const { publish, comment } = publishAndComment(f);
  assert.equal(publish.status, 0, publish.stderr);
  assert.notEqual(comment.status, 0);
  assert.deepEqual(f.calls().at(-1).slice(0, 3), ['gh', 'issue', 'comment']);
  assert.ok(!f.calls().some(call => call[0] === 'gh' && call[2] === 'edit'));
});
