'use strict';

const fs = require('node:fs');
const path = require('node:path');

const HTTP_DATE = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function headerValue(headers, name) {
  if (typeof headers?.get === 'function') return headers.get(name);
  if (!isRecord(headers)) return null;
  return Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1] ?? null;
}

function getRetryDelayMs({ headers, attempt, now = Date.now() }) {
  if (attempt !== 1 && attempt !== 2) throw new RangeError('Retry attempt must be 1 or 2');
  const delays = [attempt * 30000];
  for (const name of ['retry-after', 'retry-after-ms', 'x-ms-retry-after-ms']) {
    const value = headerValue(headers, name);
    if (typeof value !== 'string') continue;
    const text = value.trim();
    let delay;
    if (/^\d+$/.test(text)) {
      delay = Number(text) * (name === 'retry-after' ? 1000 : 1);
    } else if (name === 'retry-after' && HTTP_DATE.test(text) && Number.isSafeInteger(now)) {
      const date = Date.parse(text);
      if (Number.isFinite(date) && new Date(date).toUTCString() === text) delay = date - now;
    }
    if (Number.isSafeInteger(delay) && delay >= 0) delays.push(delay);
  }
  return Math.max(...delays);
}

function createSanitizer(apiKey, endpoint) {
  const secrets = [apiKey, endpoint];
  if (typeof endpoint === 'string' && endpoint) {
    try {
      const url = new URL(endpoint);
      secrets.push(url.hostname, url.hostname.split('.')[0]);
      const project = url.pathname.match(/\/projects\/([^/]+)/i)?.[1];
      if (project) {
        secrets.push(project);
        try { secrets.push(decodeURIComponent(project)); } catch (error) {
          if (!(error instanceof URIError)) throw error;
        }
      }
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
  }
  const redactions = new Set(secrets.filter(value => typeof value === 'string' && value));
  const protect = value => {
    if (typeof value !== 'string' || !value) return;
    redactions.add(value);
    redactions.add(JSON.stringify(value).slice(1, -1));
  };
  const sanitize = (value, limit = 1000) => {
    if (typeof value !== 'string') return null;
    let message = value;
    for (const secret of [...redactions].sort((a, b) => b.length - a.length)) message = message.replaceAll(secret, '[REDACTED]');
    return message
      .replace(/https:\/\/[^\s<>"'`]+/gi, '[REDACTED]')
      .replace(/\b(?:[a-z0-9-]+\.)*(?:(?:openai|cognitiveservices|services\.ai)\.azure\.(?:com|us|cn)|openai\.com)\b/gi, '[REDACTED]')
      .replace(/data:[^\s,]*;base64,[a-z0-9+/=_-]+/gi, '[REDACTED]')
      .replace(/(?:iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)[a-z0-9+/=_-]+/gi, '[REDACTED]')
      .replace(/[a-z0-9+/_-]{80,}={0,2}/gi, '[REDACTED]')
      .replace(/(\b(?:request(?: body)?|response body|prompt|input|output)\b["']?\s*[:=]\s*)[\s\S]*/gi, '$1[REDACTED]')
      .replace(/\bBearer\s+[a-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
      .replace(/[`~]/g, "'")
      .replace(/[\x00-\x1f\x7f-\x9f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, limit);
  };
  return { sanitize, protect };
}

// Shared by minimal diagnostics and full scoring, loaded from the workflow revision.
function createDryRunRecorder({ directory, summaryPath, phase, endpoint, apiKey, evidenceProfile = 'full', timeoutMs = 180000, fetchImpl = fetch }) {
  if (!['full', 'compact'].includes(evidenceProfile)) throw new Error('Unsupported evidence profile');
  const attempts = [];
  const { sanitize, protect } = createSanitizer(apiKey, endpoint);
  const serviceError = error => {
    if (!isRecord(error)) return null;
    const detail = {};
    for (const name of ['code', 'message', 'type', 'param']) {
      if (typeof error[name] === 'string') detail[name] = sanitize(error[name], name === 'message' ? 1000 : 128);
    }
    const additionalInfo = isRecord(error.additionalInfo) ? error.additionalInfo : {};
    if (typeof additionalInfo.rate_limit_source === 'string') detail.rate_limit_source = sanitize(additionalInfo.rate_limit_source, 128);
    const requestId = typeof error.request_id === 'string' ? error.request_id : additionalInfo.request_id;
    if (typeof requestId === 'string') detail.request_id = sanitize(requestId, 128);
    return Object.keys(detail).length ? detail : null;
  };
  let outcome = 'attempted';
  let failure = null;
  const persist = () => {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, `${phase}.json`), JSON.stringify({ phase, outcome, attempts, ...(failure ? { failure } : {}) }, null, 2) + '\n');
  };
  const safeHeader = (response, name, pattern) => {
    const value = headerValue(response?.headers, name);
    return typeof value === 'string' && value.length <= 128 && pattern.test(value)
      && sanitize(value, 128) === value
      ? value : null;
  };
  return {
    async fetch(url, options) {
      const payload = JSON.parse(options.body);
      const content = Array.isArray(payload?.input)
        ? payload.input.flatMap(item => isRecord(item) && Array.isArray(item.content) ? item.content : []).filter(isRecord) : [];
      protect(payload?.input);
      for (const item of content) if (item.type === 'input_text') protect(item.text);
      const attempt = {
        attempt: attempts.length + 1,
        requested_model: sanitize(payload?.model, 128),
        evidence_profile: evidenceProfile,
        payload_bytes: Buffer.byteLength(options.body),
        text_chars: typeof payload?.input === 'string' ? payload.input.length
          : content.reduce((sum, item) => sum + (item.type === 'input_text' && typeof item.text === 'string' ? item.text.length : 0), 0),
        image_count: content.filter(item => item.type === 'input_image').length,
        max_output_tokens: Number.isSafeInteger(payload?.max_output_tokens) && payload.max_output_tokens > 0
          ? payload.max_output_tokens : null,
        response_format: payload?.text?.format?.type === 'json_schema' ? 'json_schema' : null,
        http_status: null,
        elapsed_ms: null,
        headers: {},
        request_id: null,
        response_status: null,
        error_code: null,
        service_error: null,
        incomplete_reason: null,
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
        try { result = await response.json(); } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
          attempt.error_code = 'invalid_json';
          attempt.response_body_type = 'invalid_json';
        }
        if (isRecord(result)) {
          protect(result.output_text);
          protect(result.refusal);
          for (const item of Array.isArray(result.output) ? result.output : []) {
            if (!isRecord(item)) continue;
            for (const part of Array.isArray(item.content) ? item.content : []) {
              if (!isRecord(part)) continue;
              protect(part.text);
              protect(part.refusal);
            }
          }
          attempt.response_status = ['completed', 'incomplete', 'failed', 'cancelled', 'queued', 'in_progress'].includes(result.status)
            ? result.status : 'unknown';
          attempt.service_error = serviceError(result.error);
          if (isRecord(result.incomplete_details) && typeof result.incomplete_details.reason === 'string') {
            attempt.incomplete_reason = sanitize(result.incomplete_details.reason);
          }
          if (isRecord(result.failure_details) && typeof result.failure_details.reason === 'string') {
            attempt.failure_reason = sanitize(result.failure_details.reason);
          }
          const refusal = Boolean(result.refusal) || (Array.isArray(result.output) && result.output.some(item =>
            isRecord(item) && (item.type === 'refusal'
              || (Array.isArray(item.content) && item.content.some(part => isRecord(part) && part.type === 'refusal')))));
          if (refusal) attempt.error_code = 'refusal';
          else if (result.error != null) attempt.error_code = 'service_error';
          else if (result.status !== 'completed' || (Array.isArray(result.output)
            && result.output.some(item => isRecord(item) && item.type === 'message' && item.status && item.status !== 'completed'))) {
            attempt.error_code = 'response_not_completed';
          }
          if (isRecord(result.usage)) {
            attempt.usage = Object.fromEntries(['input_tokens', 'output_tokens', 'total_tokens']
              .filter(name => Number.isSafeInteger(result.usage[name]) && result.usage[name] >= 0)
              .map(name => [name, result.usage[name]]));
            const reasoningTokens = isRecord(result.usage.output_tokens_details) ? result.usage.output_tokens_details.reasoning_tokens : null;
            if (Number.isSafeInteger(reasoningTokens) && reasoningTokens >= 0) {
              attempt.usage.output_tokens_details = { reasoning_tokens: reasoningTokens };
            }
          }
        } else if (!attempt.error_code) {
          attempt.error_code = 'invalid_response';
          attempt.response_body_type = result === null ? 'null' : Array.isArray(result) ? 'array' : typeof result;
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
    lastErrorMessage() {
      const attempt = attempts.at(-1);
      if (!attempt?.error_code) return null;
      return sanitize([
        `HTTP ${attempt.http_status ?? 'unknown'}: ${attempt.error_code}`,
        attempt.service_error?.code, attempt.service_error?.message,
        attempt.incomplete_reason, attempt.failure_reason,
      ].filter(Boolean).join(': '));
    },
    recordFailure(error) {
      const message = sanitize(error?.message) || 'Unknown dry-run error';
      failure = { message };
      persist();
      fs.appendFileSync(summaryPath, `\nDry-run failure:\n\n\`\`\`text\n${message.replaceAll('`', "'")}\n\`\`\`\n`);
      return message;
    },
    finish(value) {
      if (!attempts.length) return;
      outcome = value;
      persist();
      fs.appendFileSync(summaryPath, `\nDry-run ${phase}: ${outcome}.\n`);
    },
  };
}

module.exports = { createDryRunRecorder, getRetryDelayMs };
