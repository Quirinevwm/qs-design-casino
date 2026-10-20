'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Shared by minimal diagnostics and full scoring, loaded from the workflow revision.
function createDryRunRecorder({ directory, summaryPath, phase, endpoint, apiKey, timeoutMs = 180000, fetchImpl = fetch }) {
  const attempts = [];
  let outcome = 'attempted';
  const persist = () => {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, `${phase}.json`), JSON.stringify({ phase, outcome, attempts }, null, 2) + '\n');
  };
  const safeHeader = (response, name, pattern) => {
    const value = response?.headers?.get(name);
    return typeof value === 'string' && value.length <= 128 && pattern.test(value)
      && ![apiKey, endpoint].some(secret => secret && value.includes(secret))
      ? value : null;
  };
  return {
    async fetch(url, options) {
      const payload = JSON.parse(options.body);
      const content = Array.isArray(payload.input) ? payload.input.flatMap(item => item.content || []) : [];
      const attempt = {
        attempt: attempts.length + 1,
        requested_model: payload.model,
        payload_bytes: Buffer.byteLength(options.body),
        text_chars: typeof payload.input === 'string' ? payload.input.length
          : content.reduce((sum, item) => sum + (item.type === 'input_text' ? item.text.length : 0), 0),
        image_count: content.filter(item => item.type === 'input_image').length,
        http_status: null,
        elapsed_ms: null,
        headers: {},
        request_id: null,
        response_status: null,
        error_code: null,
      };
      attempts.push(attempt);
      persist();
      const start = Date.now();
      const controller = new AbortController();
      let timer;
      try {
        const response = await Promise.race([
          (async () => {
            const response = await fetchImpl(url, {
              ...options,
              signal: options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal,
            });
            attempt.http_status = response.status;
            for (const name of ['retry-after', 'retry-after-ms', 'x-ms-retry-after-ms',
              'x-ratelimit-limit-requests', 'x-ratelimit-limit-tokens', 'x-ratelimit-remaining-requests',
              'x-ratelimit-remaining-tokens', 'x-ratelimit-reset-requests', 'x-ratelimit-reset-tokens']) {
              const pattern = name === 'retry-after'
                ? /^(?:\d+|[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT)$/
                : /^\d+(?:\.\d+)?(?:ms|s|m|h)?(?:\d+(?:\.\d+)?(?:ms|s|m|h))*$/;
              const value = safeHeader(response, name, pattern);
              if (value !== null) attempt.headers[name] = value;
            }
            attempt.request_id = ['x-request-id', 'apim-request-id', 'x-ms-request-id']
              .map(name => safeHeader(response, name, /^[A-Za-z0-9_-]{1,128}$/)).find(Boolean) || null;
            const body = await response.text();
            return { ok: response.ok, status: response.status, headers: response.headers, text: async () => body, json: async () => JSON.parse(body) };
          })(),
          new Promise((_, reject) => {
            timer = setTimeout(() => {
              const error = new Error('Foundry request and response body timed out');
              error.code = 'timeout';
              reject(error);
              controller.abort();
            }, timeoutMs);
          }),
        ]);
        let result;
        try { result = await response.json(); } catch { attempt.error_code = 'invalid_json'; }
        if (result) {
          attempt.response_status = ['completed', 'incomplete', 'failed', 'cancelled', 'queued', 'in_progress'].includes(result.status)
            ? result.status : 'unknown';
          const refusal = Boolean(result.refusal) || (Array.isArray(result.output) && result.output.some(item =>
            item.type === 'refusal' || (Array.isArray(item.content) && item.content.some(part => part.type === 'refusal'))));
          if (refusal) attempt.error_code = 'refusal';
          else if (result.status !== 'completed' || (Array.isArray(result.output)
            && result.output.some(item => item.type === 'message' && item.status && item.status !== 'completed'))) {
            attempt.error_code = 'response_not_completed';
          }
          if (result.usage) {
            attempt.usage = Object.fromEntries(['input_tokens', 'output_tokens', 'total_tokens']
              .filter(name => Number.isSafeInteger(result.usage[name]) && result.usage[name] >= 0)
              .map(name => [name, result.usage[name]]));
          }
        }
        if (!response.ok) attempt.error_code = 'http_error';
        return response;
      } catch (error) {
        attempt.error_code = error?.code === 'timeout' || error?.name === 'AbortError' ? 'timeout' : 'network_error';
        const failure = new Error(`Foundry dry-run ${attempt.error_code}`);
        failure.code = attempt.error_code;
        throw failure;
      } finally {
        clearTimeout(timer);
        attempt.elapsed_ms = Date.now() - start;
        persist();
        fs.appendFileSync(summaryPath, `\n### Dry-run ${phase}, attempt ${attempt.attempt}\n\n\`\`\`json\n${JSON.stringify(attempt, null, 2)}\n\`\`\`\n`);
      }
    },
    finish(value) {
      if (!attempts.length) return;
      outcome = value;
      persist();
      fs.appendFileSync(summaryPath, `\nDry-run ${phase}: ${outcome}.\n`);
    },
  };
}

module.exports = { createDryRunRecorder };
