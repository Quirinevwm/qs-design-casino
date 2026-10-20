'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createDryRunRecorder, getRetryDelayMs } = require('./eval-dry-run.cjs');

const FIXTURE_ROOT = path.join(__dirname, `.eval-dry-run-test-fixtures-${process.pid}`);
const ENDPOINT = 'https://private-resource.services.ai.azure.com/api/projects/private-project/openai/v1/responses';
const API_KEY = 'fixture-private-api-key';
let fixtureNumber = 0;

test.before(() => fs.mkdirSync(FIXTURE_ROOT, { recursive: true }));
test.after(() => fs.rmSync(FIXTURE_ROOT, { recursive: true, force: true }));

function fixture(t, { fetchImpl, ...options } = {}) {
  const directory = path.join(FIXTURE_ROOT, String(++fixtureNumber));
  fs.mkdirSync(directory, { recursive: true });
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const summaryPath = path.join(directory, 'summary');
  const recorder = createDryRunRecorder({
    directory, summaryPath, phase: 'scoring', endpoint: ENDPOINT, apiKey: API_KEY,
    fetchImpl: fetchImpl || (async () => response(200, { status: 'completed' })),
    ...options,
  });
  return {
    recorder,
    send: (payload = {}) => recorder.fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'api-key': API_KEY },
      body: JSON.stringify({ model: 'gpt-5.6-sol', input: 'Private prompt not for logging', ...payload }),
    }),
    read: () => JSON.parse(fs.readFileSync(path.join(directory, 'scoring.json'), 'utf8')),
    artifacts: () => fs.readFileSync(path.join(directory, 'scoring.json'), 'utf8') + fs.readFileSync(summaryPath, 'utf8'),
  };
}

function response(status, body, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

test('429 records selected service details without changing HTTP failure classification or response', async (t) => {
  const body = {
    error: {
      code: 'RateLimitReached',
      message: 'Deployment capacity is temporarily exhausted. Please retry later.',
      type: 'rate_limit_error',
      param: 'max_output_tokens',
      additionalInfo: { rate_limit_source: 'deployment_capacity', request_id: 'body-request-123', ignored: 'PRIVATE_EXTRA' },
      ignored: 'PRIVATE_EXTRA',
    },
    output_text: 'PRIVATE_OUTPUT',
  };
  const f = fixture(t, { fetchImpl: async () => response(429, body, {
    'x-request-id': 'header-request-123',
    'retry-after-ms': '45000',
    'x-ratelimit-remaining-requests': '99',
    'x-ratelimit-remaining-tokens': '78000',
  }) });
  assert.equal(f.recorder.lastErrorMessage(), null);
  const result = await f.send();
  assert.equal(result.status, 429);
  assert.equal(result.ok, false);
  assert.deepEqual(await result.json(), body);
  assert.equal(await result.text(), JSON.stringify(body));
  const attempt = f.read().attempts[0];
  assert.equal(attempt.error_code, 'http_error');
  assert.deepEqual(attempt.service_error, {
    code: 'RateLimitReached',
    message: body.error.message,
    type: 'rate_limit_error',
    param: 'max_output_tokens',
    rate_limit_source: 'deployment_capacity',
    request_id: 'body-request-123',
  });
  assert.equal(attempt.request_id, 'header-request-123');
  assert.deepEqual(attempt.headers, {
    'retry-after-ms': '45000',
    'x-ratelimit-remaining-requests': '99',
    'x-ratelimit-remaining-tokens': '78000',
  });
  assert.equal(attempt.max_output_tokens, null);
  assert.equal(typeof attempt.elapsed_ms, 'number');
  assert.match(f.recorder.lastErrorMessage(), /HTTP 429: http_error: RateLimitReached: Deployment capacity/);
  assert.doesNotMatch(f.artifacts(), /PRIVATE_EXTRA|PRIVATE_OUTPUT|Private prompt/);
  f.recorder.finish('failed');
  assert.equal(f.read().outcome, 'failed');
});

test('401 and 403 preserve safe actionable service guidance', async (t) => {
  for (const [status, code, message] of [
    [401, 'Unauthorized', 'Authentication failed. Check the configured API key.'],
    [403, 'Forbidden', 'Access denied. Verify the caller has the required role.'],
  ]) {
    const f = fixture(t, { fetchImpl: async () => response(status, { error: { code, message, request_id: 'body-request' } }) });
    await f.send();
    assert.deepEqual(f.read().attempts[0].service_error, { code, message, request_id: 'body-request' });
    assert.equal(f.recorder.lastErrorMessage(), `HTTP ${status}: http_error: ${code}: ${message}`);
  }
});

test('non-JSON HTTP failures are flagged without persisting any body excerpt', async (t) => {
  const raw = `<html>PRIVATE_HTML ${API_KEY} ${ENDPOINT}</html>`;
  const f = fixture(t, { fetchImpl: async () => new Response(raw, { status: 503 }) });
  const result = await f.send();
  assert.equal(await result.text(), raw);
  await assert.rejects(result.json(), SyntaxError);
  assert.equal(f.read().attempts[0].error_code, 'http_error');
  assert.equal(f.read().attempts[0].response_body_type, 'invalid_json');
  assert.equal(f.read().attempts[0].service_error, null);
  assert.equal(f.recorder.lastErrorMessage(), 'HTTP 503: http_error');
  assert.doesNotMatch(f.artifacts(), /PRIVATE_HTML|<html>|fixture-private|private-resource|private-project/);
});

test('all captured service strings and recordFailure use the same bounded sanitizer', async (t) => {
  const unsafe = [
    API_KEY, ENDPOINT, 'private-resource.services.ai.azure.com', 'private-resource', 'private-project',
    'https://unrelated.example/projects/hidden?key=other-key', 'HTTPS://OTHER.EXAMPLE/hidden',
    'another.openai.azure.com', 'another.services.ai.azure.com', 'api.openai.com',
    'other.cognitiveservices.azure.com', '```json', '~~~html', '\x00\x1b\n\r\t\u202e\u2028',
    'data:image/png;base64,aGVsbG9wcml2YXRlaW1hZ2U=', 'Bearer unrelated-credential',
  ].join(' ');
  const f = fixture(t, { fetchImpl: async () => response(429, {
    error: {
      code: unsafe, type: unsafe, param: unsafe,
      message: `Capacity unavailable. ${unsafe} ${'retry later '.repeat(200)}`,
      additionalInfo: { rate_limit_source: unsafe, request_id: unsafe },
    },
  }, { 'x-request-id': 'private-resource' }) });
  await f.send();
  const attempt = f.read().attempts[0];
  assert.equal(attempt.request_id, null);
  assert.ok(attempt.service_error.message.length <= 1000);
  for (const name of ['code', 'type', 'param', 'rate_limit_source', 'request_id']) {
    assert.ok(attempt.service_error[name].length <= 128);
  }
  const message = f.recorder.recordFailure(new Error(`Capacity unavailable. ${unsafe} ${'retry later '.repeat(200)}`));
  assert.equal(message, attempt.service_error.message);
  assert.equal(f.read().failure.message, message);
  assert.ok(f.recorder.lastErrorMessage().length <= 1000);
  assert.match(message, /^Capacity unavailable\./);
  assert.doesNotMatch(JSON.stringify(f.read()) + f.recorder.lastErrorMessage(), /fixture-private|private-resource|private-project|https:|\.azure\.|openai\.com|other-key|unrelated-credential|aGVsbG9|```|~~~|\\u0000|\\u001b|\u202e|\u2028/i);
  assert.doesNotMatch(f.artifacts(), /fixture-private|private-resource|private-project|PRIVATE_HTML|data:image|base64/i);
});

test('malformed service detail primitives are not coerced into strings', async (t) => {
  const f = fixture(t, { fetchImpl: async () => response(400, {
    error: {
      code: ['PRIVATE_ARRAY'], message: { private: 'PRIVATE_OBJECT' }, type: 401, param: true,
      request_id: [], additionalInfo: { rate_limit_source: {}, request_id: ['PRIVATE_IGNORED'] },
    },
  }) });
  await f.send();
  assert.equal(f.read().attempts[0].service_error, null);
  assert.doesNotMatch(f.artifacts(), /PRIVATE_ARRAY|PRIVATE_OBJECT|PRIVATE_IGNORED|\[object Object\]/);
  for (const value of [null, 2, [], { message: {} }]) {
    assert.equal(f.recorder.recordFailure(value), 'Unknown dry-run error');
  }
});

test('reflected request, output and bare image data never enter persisted service or failure details', async (t) => {
  const image = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  const output = 'PRIVATE_MODEL_EXCERPT';
  const input = 'PRIVATE_PROMPT\nwith "quotes"';
  const f = fixture(t, { fetchImpl: async () => response(400, {
    error: {
      code: 'invalid_request_error',
      message: `Invalid image ${image}. ${input}. ${output}. Request body: ${JSON.stringify({ input, output })}`,
    },
    output_text: output,
  }) });
  await f.send({ input });
  assert.match(f.read().attempts[0].service_error.message, /Invalid image \[REDACTED\]/);
  assert.doesNotMatch(f.artifacts() + f.recorder.lastErrorMessage(), /R0lGOD|PRIVATE_MODEL_EXCERPT|PRIVATE_PROMPT|with.*quotes/);
  const message = f.recorder.recordFailure(new Error(`Invalid image ${image}. Output: ${output}`));
  assert.equal(message, 'Invalid image [REDACTED]. Output: [REDACTED]');
  assert.doesNotMatch(f.artifacts(), /R0lGOD|PRIVATE_MODEL_EXCERPT|PRIVATE_PROMPT/);
});

test('unknown labeled content and long bare encoded values are suppressed even without a request', (t) => {
  const f = fixture(t);
  for (const content of [
    'Request body: {"input":"PRIVATE_UNKNOWN_INPUT","model":"ignored"}',
    'Rejected input: "PRIVATE_UNKNOWN_INPUT"',
    'Rejected output: "PRIVATE_UNKNOWN_INPUT"',
  ]) {
    assert.doesNotMatch(f.recorder.recordFailure(new Error(content)), /PRIVATE_UNKNOWN_INPUT/);
  }
  assert.equal(f.recorder.recordFailure(new Error(`Invalid image ${'ABCD0123+/'.repeat(20)}`)), 'Invalid image [REDACTED]');
});

test('null, primitive and array JSON bodies remain available to callers and never break recording', async (t) => {
  for (const status of [200, 429]) {
    for (const body of [null, false, 0, 'PRIVATE_BODY', [], [null, 'PRIVATE_BODY']]) {
      const f = fixture(t, { fetchImpl: async () => response(status, body) });
      assert.deepEqual(await (await f.send()).json(), body);
      const attempt = f.read().attempts[0];
      assert.equal(attempt.error_code, status === 200 ? 'invalid_response' : 'http_error');
      assert.equal(attempt.response_body_type, body === null ? 'null' : Array.isArray(body) ? 'array' : typeof body);
      assert.doesNotMatch(f.artifacts(), /PRIVATE_BODY/);
    }
  }
});

test('incomplete HTTP 200 captures the reason, output budget and safe reasoning usage', async (t) => {
  const f = fixture(t, { fetchImpl: async () => response(200, {
    status: 'incomplete',
    incomplete_details: { reason: 'max_output_tokens' },
    usage: {
      input_tokens: 50, output_tokens: 512, total_tokens: 562,
      output_tokens_details: { reasoning_tokens: 500, private: 'PRIVATE_USAGE' },
      private: 'PRIVATE_USAGE',
    },
    output: [null, 'PRIVATE_OUTPUT', [], {
      type: 'message', status: 'incomplete',
      content: [null, false, [], { type: 'output_text', text: 'PRIVATE_OUTPUT' }],
    }],
  }) });
  await f.send({ max_output_tokens: 512 });
  const attempt = f.read().attempts[0];
  assert.equal(attempt.response_status, 'incomplete');
  assert.equal(attempt.error_code, 'response_not_completed');
  assert.equal(attempt.incomplete_reason, 'max_output_tokens');
  assert.equal(attempt.max_output_tokens, 512);
  assert.deepEqual(attempt.usage, {
    input_tokens: 50, output_tokens: 512, total_tokens: 562, output_tokens_details: { reasoning_tokens: 500 },
  });
  assert.match(f.recorder.lastErrorMessage(), /HTTP 200: response_not_completed: max_output_tokens/);
  assert.doesNotMatch(f.artifacts(), /PRIVATE_USAGE|PRIVATE_OUTPUT/);
});

test('HTTP 200 service errors fail even when the service says completed', async (t) => {
  for (const status of ['failed', 'completed']) {
    const f = fixture(t, { fetchImpl: async () => response(200, {
      status, error: { code: 'server_error', message: 'The service could not finish this request.' },
    }) });
    await f.send();
    assert.equal(f.read().attempts[0].error_code, 'service_error');
    assert.match(f.recorder.lastErrorMessage(), /HTTP 200: service_error: server_error: The service could not finish/);
  }
  const f = fixture(t, { fetchImpl: async () => response(200, {
    status: 'failed', failure_details: { reason: `Capacity unavailable at ${ENDPOINT}` },
  }) });
  await f.send();
  assert.equal(f.read().attempts[0].failure_reason, 'Capacity unavailable at [REDACTED]');
  assert.match(f.recorder.lastErrorMessage(), /Capacity unavailable at \[REDACTED\]/);
});

test('refusal and unfinished-message checks tolerate malformed output items without logging content', async (t) => {
  for (const [body, errorCode] of [
    [{ status: 'completed', refusal: 'PRIVATE_REFUSAL' }, 'refusal'],
    [{ status: 'completed', output: [null, 1, [], { type: 'refusal' }] }, 'refusal'],
    [{ status: 'completed', output: [null, { type: 'message', content: [null, [], { type: 'refusal', refusal: 'PRIVATE_REFUSAL' }] }] }, 'refusal'],
    [{ status: 'completed', output: [null, {}, { type: 'message', status: 'incomplete' }] }, 'response_not_completed'],
    [{ status: 'completed', output: [null, 3, false, [], { content: [null] }] }, null],
  ]) {
    const f = fixture(t, { fetchImpl: async () => response(200, body) });
    await f.send();
    assert.equal(f.read().attempts[0].error_code, errorCode);
    assert.equal(f.recorder.lastErrorMessage() === null, errorCode === null);
    assert.doesNotMatch(f.artifacts(), /PRIVATE_REFUSAL/);
  }
});

test('input counting and numeric metadata reject malformed values without recording inputs', async (t) => {
  const invalidValues = [null, '512', 0, -1, 1.5, {}, [], Number.MAX_SAFE_INTEGER + 1];
  for (const max_output_tokens of invalidValues) {
    const f = fixture(t, { fetchImpl: async () => response(200, {
      status: 'completed',
      usage: { input_tokens: '50', output_tokens: -1, total_tokens: 1.2, output_tokens_details: { reasoning_tokens: '20' } },
      incomplete_details: { reason: { private: 'PRIVATE_REASON' } },
      failure_details: { reason: ['PRIVATE_REASON'] },
    }) });
    await f.send({ max_output_tokens, input: [
      null, 'PRIVATE_INPUT', [], { content: null }, { content: [null, false, [], {
        type: 'input_text', text: 'abc',
      }, { type: 'input_text', text: {} }, { type: 'input_image', image_url: 'data:image/png;base64,PRIVATE_IMAGE' }] },
    ] });
    const attempt = f.read().attempts[0];
    assert.equal(attempt.max_output_tokens, null);
    assert.equal(attempt.text_chars, 3);
    assert.equal(attempt.image_count, 1);
    assert.deepEqual(attempt.usage, {});
    assert.equal(attempt.incomplete_reason, null);
    assert.equal(attempt.failure_reason, undefined);
    assert.doesNotMatch(f.artifacts(), /PRIVATE_INPUT|PRIVATE_IMAGE|PRIVATE_REASON|data:image/);
  }
});

test('lastErrorMessage reports only the most recent attempt and finish stays compatible', async (t) => {
  let calls = 0;
  const f = fixture(t, { fetchImpl: async () => ++calls === 1
    ? response(429, { error: { message: 'Retry later' } })
    : response(200, { status: 'completed' }) });
  f.recorder.finish('completed');
  assert.equal(f.recorder.lastErrorMessage(), null);
  await f.send();
  assert.match(f.recorder.lastErrorMessage(), /Retry later/);
  await f.send({ max_output_tokens: 1024 });
  assert.equal(f.recorder.lastErrorMessage(), null);
  f.recorder.finish('completed');
  assert.equal(f.read().outcome, 'completed');
  assert.equal(f.read().attempts[1].max_output_tokens, 1024);
});

test('network and body-read failures propagate sanitized errors rather than successful responses', async (t) => {
  for (const fetchImpl of [
    async () => { throw new Error(`${API_KEY} ${ENDPOINT}`); },
    async () => ({ status: 200, ok: true, headers: new Headers(), text: async () => { throw new TypeError(`${API_KEY} ${ENDPOINT}`); } }),
  ]) {
    const f = fixture(t, { fetchImpl });
    await assert.rejects(f.send(), { message: 'Foundry dry-run network_error', code: 'network_error' });
    assert.equal(f.read().attempts[0].error_code, 'network_error');
    assert.match(f.recorder.lastErrorMessage(), /network_error/);
    assert.doesNotMatch(f.artifacts(), /fixture-private|private-resource|private-project/);
  }
});

test('only SyntaxError is classified as invalid JSON, other parse errors use the sanitized failure path', async (t) => {
  const invalid = fixture(t, { fetchImpl: async () => new Response('PRIVATE_INVALID_JSON', { status: 200 }) });
  await invalid.send();
  assert.equal(invalid.read().attempts[0].error_code, 'invalid_json');
  assert.equal(invalid.read().attempts[0].response_body_type, 'invalid_json');
  assert.doesNotMatch(invalid.artifacts(), /PRIVATE_INVALID_JSON/);

  const unexpected = fixture(t, { fetchImpl: async () => ({
    status: 200, ok: true, headers: new Headers(),
    text: async () => ({ toString() { throw new TypeError(`${API_KEY} ${ENDPOINT}`); } }),
  }) });
  await assert.rejects(unexpected.send(), { message: 'Foundry dry-run network_error', code: 'network_error' });
  assert.equal(unexpected.read().attempts[0].response_body_type, undefined);
  assert.doesNotMatch(unexpected.artifacts(), /fixture-private|private-resource|private-project/);
});

test('timeouts remain explicit failures and retain safe per-attempt metadata', async (t) => {
  const f = fixture(t, { timeoutMs: 5, fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
  }) });
  await assert.rejects(f.send(), { message: 'Foundry dry-run timeout', code: 'timeout' });
  assert.equal(f.read().attempts[0].error_code, 'timeout');
  assert.equal(f.recorder.lastErrorMessage(), 'HTTP unknown: timeout');
});

test('getRetryDelayMs retains deterministic baseline delays and rejects unsupported attempts', () => {
  assert.equal(getRetryDelayMs({ attempt: 1 }), 30000);
  assert.equal(getRetryDelayMs({ attempt: 2, headers: null }), 60000);
  for (const attempt of [0, 3, -1, '1', null, undefined, true, NaN, Infinity, 1.5]) {
    assert.throws(() => getRetryDelayMs({ attempt }), RangeError);
  }
});

test('getRetryDelayMs parses seconds, millisecond headers and anchored HTTP dates', () => {
  const now = Date.parse('2026-10-16T05:00:00Z');
  for (const headers of [
    new Headers({ 'retry-after': '75' }),
    { 'Retry-After-Ms': '75000' },
    { 'X-MS-RETRY-AFTER-MS': '75000' },
    { 'retry-after': 'Fri, 16 Oct 2026 05:01:15 GMT' },
    { 'retry-after': ' 75 ' },
  ]) {
    assert.equal(getRetryDelayMs({ attempt: 1, headers, now }), 75000);
    assert.equal(getRetryDelayMs({ attempt: 2, headers, now }), 75000);
  }
  assert.equal(getRetryDelayMs({ attempt: 2, headers: { 'retry-after': '0' }, now }), 60000);
  assert.equal(getRetryDelayMs({ attempt: 1, headers: { 'retry-after': 'Fri, 16 Oct 2026 04:59:00 GMT' }, now }), 30000);
});

test('getRetryDelayMs ignores malformed, negative and unsafe values, never numeric-date parses', () => {
  const now = Date.parse('2026-10-16T05:00:00Z');
  const invalid = [
    '-1', 'Infinity', 'NaN', '1.5', '60s', '1e5', '0x10000', '+900', 'garbage',
    'Fri, 32 Oct 2026 05:01:15 GMT', 'Fri, 30 Feb 2026 05:01:15 GMT',
    'Thu, 16 Oct 2026 05:01:15 GMT', 'Fri, 16 Oct 2026 25:01:15 GMT',
    '2026-10-16T05:01:15Z', '1 Jan 2030', 'Fri, 16 Oct 2026 05:01:15 GMT trailing',
    '9'.repeat(400), '9007199254740992', {}, [], 900, null,
  ];
  for (const name of ['retry-after', 'retry-after-ms', 'x-ms-retry-after-ms']) {
    for (const value of invalid) {
      assert.equal(getRetryDelayMs({ attempt: 1, headers: { [name]: value }, now }), 30000, `${name}: ${JSON.stringify(value)}`);
    }
  }
  assert.equal(getRetryDelayMs({ attempt: 1, headers: { 'retry-after': '1' }, now: 0 }), 30000);
  assert.equal(getRetryDelayMs({ attempt: 1, headers: { 'retry-after': 'Fri, 16 Oct 2026 05:01:15 GMT' }, now: Infinity }), 30000);
  assert.equal(getRetryDelayMs({ attempt: 1, headers: { 'retry-after': '9007199254740' }, now }), 9007199254740000);
  assert.equal(getRetryDelayMs({ attempt: 1, headers: { 'retry-after': '9007199254741' }, now }), 30000);
});

test('getRetryDelayMs uses the longest valid suggestion without hiding long waits', () => {
  const headers = { 'retry-after': '180', 'retry-after-ms': '240000', 'x-ms-retry-after-ms': '360000' };
  assert.equal(getRetryDelayMs({ attempt: 1, headers }), 360000);
  assert.equal(getRetryDelayMs({ attempt: 2, headers }), 360000);
  assert.equal(getRetryDelayMs({ attempt: 1, headers: { ...headers, 'x-ms-retry-after-ms': 'bad' } }), 240000);
  assert.equal(getRetryDelayMs({ attempt: 2, headers: { 'retry-after': '30', 'retry-after-ms': '45000' } }), 60000);
});
