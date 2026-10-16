'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { waitUntil, runDiagnostics, renderSummary } = require('./eval-diagnostics.cjs');

const FIXTURE_ROOT = path.join(__dirname, '.eval-diagnostics-test-fixtures');
const PNG_BYTES = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8ffff3f0005fe02fea757a90000000049454e44ae426082', 'hex');

test.before(() => fs.mkdirSync(FIXTURE_ROOT, { recursive: true }));
test.after(() => fs.rmSync(FIXTURE_ROOT, { recursive: true, force: true }));

test('runDiagnostics succeeds twice, sends expected payloads, and never leaks secrets', async () => {
  const imagePath = writeFixture('ok.png', PNG_BYTES);
  const calls = [];
  const apiKey = 'super-secret-key';
  const result = await runDiagnostics({
    endpoint: 'https://example.com/openai/v1/responses',
    model: 'gpt-6.1-sol',
    apiKey,
    imagePath,
    fetchImpl: async (_url, options) => {
      calls.push({ body: JSON.parse(options.body), headers: options.headers });
      assert.equal(options.headers['api-key'], apiKey);
      assert.equal(options.signal.aborted, false);
      return responseFixture(200, {
        status: 'completed',
        model: 'gpt-6.1-sol',
        output: [{ type: 'message', content: [{ type: 'output_text', text: calls.length === 1 ? 'OK' : 'A clear screenshot.' }] }],
      }, { 'x-request-id': `req-${calls.length}` });
    },
  });
  assert.equal(result.success, true);
  assert.equal(result.results.length, 2);
  assert.equal(calls[0].body.input, 'Reply with OK');
  assert.deepEqual(calls[0].body.reasoning, { effort: 'low' });
  assert.equal(calls[1].body.input[0].content[0].text, 'Describe this screenshot in one sentence.');
  assert.match(calls[1].body.input[0].content[1].image_url, /^data:image\/png;base64,/);
  assert.doesNotMatch(JSON.stringify(result), /super-secret-key|data:image\/png;base64/);
});

test('text 429 skips the image request', async () => {
  const imagePath = writeFixture('rate-limit.png', PNG_BYTES);
  let calls = 0;
  const result = await runDiagnostics({
    endpoint: 'https://example.com/openai/v1/responses',
    model: 'gpt-4.1',
    apiKey: 'secret',
    imagePath,
    fetchImpl: async () => {
      calls += 1;
      return responseFixture(429, '<html>slow down</html>', { 'apim-request-id': 'req-text' }, 'text/html');
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.success, false);
  assert.equal(result.results[0].errorCode, 'unavailable');
  assert.equal(result.results[1].outcome, 'skipped');
});

test('image 503 fails after a successful text check', async () => {
  const imagePath = writeFixture('image-503.png', PNG_BYTES);
  let calls = 0;
  const result = await runDiagnostics({
    endpoint: 'https://example.com/openai/v1/responses',
    model: 'gpt-4.1',
    apiKey: 'secret',
    imagePath,
    fetchImpl: async () => responseFixture(calls++ === 0 ? 200 : 503, calls === 1
      ? { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'OK' }] }] }
      : { error: { message: 'backend unavailable' } }),
  });
  assert.equal(result.success, false);
  assert.equal(result.results[1].errorCode, 'unavailable');
});

test('HTTP 200 incomplete and refusal responses fail clearly', async () => {
  const imagePath = writeFixture('200-fails.png', PNG_BYTES);
  const incomplete = await runDiagnostics({
    endpoint: 'https://example.com/openai/v1/responses',
    model: 'gpt-4.1',
    apiKey: 'secret',
    imagePath,
    fetchImpl: async () => responseFixture(200, { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }),
  });
  assert.equal(incomplete.results[0].errorCode, 'incomplete');
  const refusal = await runDiagnostics({
    endpoint: 'https://example.com/openai/v1/responses',
    model: 'gpt-4.1',
    apiKey: 'secret',
    imagePath,
    fetchImpl: async () => responseFixture(200, { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'nope' }] }] }),
  });
  assert.equal(refusal.results[0].errorCode, 'refusal');
  assert.match(renderSummary(refusal), /Full evaluation not yet attempted/);
});

test('request timeout and body timeout return failed results', async () => {
  const imagePath = writeFixture('timeout.png', PNG_BYTES);
  const requestTimeout = await runDiagnostics({
    endpoint: 'https://example.com/openai/v1/responses',
    model: 'gpt-4.1',
    apiKey: 'secret',
    imagePath,
    timeoutMs: 5,
    fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(abortError()), { once: true });
    }),
  });
  assert.equal(requestTimeout.results[0].errorCode, 'timeout');
  const bodyTimeout = await runDiagnostics({
    endpoint: 'https://example.com/openai/v1/responses',
    model: 'gpt-4.1',
    apiKey: 'secret',
    imagePath,
    timeoutMs: 5,
    fetchImpl: async (_url, options) => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: () => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(abortError()), { once: true });
      }),
    }),
  });
  assert.equal(bodyTimeout.results[0].errorCode, 'timeout');
});

test('invalid image and oversize image throw before any network request', async () => {
  await assert.rejects(() => runDiagnostics({
    endpoint: 'https://example.com/openai/v1/responses',
    model: 'gpt-4.1',
    apiKey: 'secret',
    imagePath: writeFixture('bad.txt', Buffer.from('not an image')),
    fetchImpl: async () => { throw new Error('should not fetch'); },
  }), /PNG or JPEG/);
  await assert.rejects(() => runDiagnostics({
    endpoint: 'https://example.com/openai/v1/responses',
    model: 'gpt-4.1',
    apiKey: 'secret',
    imagePath: writeFixture('large.png', Buffer.concat([PNG_BYTES, Buffer.alloc(1024 * 1024)])),
    fetchImpl: async () => { throw new Error('should not fetch'); },
  }), /1MB or smaller/);
});

test('waitUntil rejects bad timestamps and accepts immediate values', async () => {
  await assert.rejects(() => waitUntil({ notBefore: '2026-10-16T05:00Z' }), /ISO8601 UTC/);
  await assert.rejects(() => waitUntil({ notBefore: '2026-10-16T05:00:00Z', now: () => Date.parse('2026-10-16T06:30:01Z') }), /1 hour in the past/);
  await assert.rejects(() => waitUntil({ notBefore: '2026-10-16T05:00:00Z', now: () => Date.parse('2026-10-16T00:59:59Z') }), /4 hours in the future/);
  await waitUntil({ notBefore: '' });
  await waitUntil({});
});

test('waitUntil handles a fake 3 hour clock without spinning', async () => {
  let current = Date.parse('2026-10-16T02:00:00Z');
  const sleeps = [];
  await waitUntil({
    notBefore: '2026-10-16T05:00:00Z',
    now: () => current,
    sleep: async (ms) => {
      sleeps.push(ms);
      current += ms;
    },
  });
  assert.equal(current, Date.parse('2026-10-16T05:00:00Z'));
  assert.equal(new Set(sleeps).size, 1);
  assert.equal(sleeps[0], 60000);
  assert.equal(sleeps.length, 180);
});

function writeFixture(name, buffer) {
  const file = path.join(FIXTURE_ROOT, `${process.pid}-${name}`);
  fs.writeFileSync(file, buffer);
  return file;
}

function responseFixture(status, body, headers = {}, contentType = 'application/json') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        const lower = name.toLowerCase();
        if (lower === 'content-type') return contentType;
        return Object.entries(headers).find(([key]) => key.toLowerCase() === lower)?.[1] || null;
      },
    },
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
  };
}

function abortError() {
  const error = new Error('aborted');
  error.name = 'AbortError';
  return error;
}
