'use strict';

const fs = require('node:fs');

const MAX_WAIT_MS = 4 * 60 * 60 * 1000;
const MAX_PAST_MS = 60 * 60 * 1000;
const MAX_SLEEP_MS = 60 * 1000;
const MAX_IMAGE_BYTES = 1024 * 1024;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

async function waitUntil({ notBefore, now = () => Date.now(), sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  if (notBefore == null || notBefore === '') return;
  if (typeof notBefore !== 'string' || !ISO_UTC.test(notBefore)) {
    throw new Error('notBefore must be an ISO8601 UTC timestamp like YYYY-MM-DDTHH:mm:ssZ');
  }
  const target = new Date(notBefore);
  if (Number.isNaN(target.getTime())) {
    throw new Error('notBefore must be a valid ISO8601 UTC timestamp like YYYY-MM-DDTHH:mm:ssZ');
  }
  const canonical = target.toISOString().replace('.000Z', 'Z');
  if (canonical !== notBefore) throw new Error('notBefore must be a valid ISO8601 UTC timestamp like YYYY-MM-DDTHH:mm:ssZ');
  const firstNow = Number(now());
  const delta = target.getTime() - firstNow;
  if (delta > MAX_WAIT_MS) throw new Error('notBefore is more than 4 hours in the future');
  if (delta < -MAX_PAST_MS) throw new Error('notBefore is more than 1 hour in the past');
  while (true) {
    const remaining = target.getTime() - Number(now());
    if (remaining <= 0) return;
    await sleep(Math.max(1, Math.min(remaining, MAX_SLEEP_MS)));
  }
}

async function runDiagnostics({
  endpoint,
  model,
  apiKey,
  imagePath,
  fetchImpl = fetch,
  timeoutMs = 90000,
}) {
  const url = parseHttpsUrl(endpoint, 'endpoint');
  const requestedModel = assertNonEmpty(model, 'model');
  const secret = assertNonEmpty(apiKey, 'apiKey');
  const image = readImageFixture(imagePath);
  const results = [];

  const textPayload = {
    model: requestedModel,
    input: 'Reply with OK',
    max_output_tokens: 512,
    ...reasoningPayload(requestedModel),
  };
  const textResult = await performCheck({
    check: 'text',
    endpoint: url.toString(),
    payload: textPayload,
    requestedModel,
    apiKey: secret,
    fetchImpl,
    timeoutMs,
    secret,
  });
  results.push(textResult);
  if (!textResult.success) {
    results.push(skippedImageResult(requestedModel));
    return { success: false, results };
  }

  const imagePayload = {
    model: requestedModel,
    input: [{
      role: 'user',
      content: [
        { type: 'input_text', text: 'Describe this screenshot in one sentence.' },
        { type: 'input_image', image_url: `data:${image.mime};base64,${image.base64}` },
      ],
    }],
    max_output_tokens: 512,
    ...reasoningPayload(requestedModel),
  };
  const imageResult = await performCheck({
    check: 'image',
    endpoint: url.toString(),
    payload: imagePayload,
    requestedModel,
    apiKey: secret,
    fetchImpl,
    timeoutMs,
    secret,
  });
  results.push(imageResult);
  return { success: results.every((result) => result.outcome === 'passed'), results };
}

function renderSummary(result) {
  const byCheck = new Map((result && Array.isArray(result.results) ? result.results : []).map((item) => [item.check, item]));
  const rows = ['text', 'image'].map((check) => byCheck.get(check) || (check === 'image' ? skippedImageResult('n/a') : defaultMissingResult()));
  return [
    '| Check | Outcome | HTTP | Response | Model | Request ID | Message |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${escapeCell(row.check)} | ${escapeCell(row.outcome)} | ${escapeCell(row.httpStatus == null ? '' : String(row.httpStatus))} | ${escapeCell(row.responseStatus || '')} | ${escapeCell(row.model || '')} | ${escapeCell(row.requestId || '')} | ${escapeCell(row.message || '')} |`),
  ].join('\n');
}

function parseHttpsUrl(value, fieldName) {
  const url = new URL(assertNonEmpty(value, fieldName));
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error(`${fieldName} must be an HTTPS URL without credentials`);
  }
  return url;
}

function assertNonEmpty(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${fieldName} must be a non-empty string`);
  return value;
}

function readImageFixture(imagePath) {
  const stat = fs.statSync(imagePath);
  if (!stat.isFile()) throw new Error('imagePath must point to a file');
  if (stat.size > MAX_IMAGE_BYTES) throw new Error('imagePath must be 1MB or smaller');
  const buffer = fs.readFileSync(imagePath);
  const mime = detectImageMime(buffer);
  if (!mime) throw new Error('imagePath must be a PNG or JPEG image');
  return { mime, base64: buffer.toString('base64') };
}

function detectImageMime(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  return null;
}

function reasoningPayload(model) {
  return /^gpt-6\.1([-.]|$)/i.test(model) ? { reasoning: { effort: 'low' } } : {};
}

async function performCheck({ check, endpoint, payload, requestedModel, apiKey, fetchImpl, timeoutMs, secret }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  let rawBody = '';
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    rawBody = await response.text();
  } catch (error) {
    if (error && error.name === 'AbortError') return failureResult({ check, requestedModel, errorCode: 'timeout', message: 'Request timed out', response });
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const parsed = safeJsonParse(rawBody);
  const httpStatus = response.status ?? null;
  const responseStatus = parsed && typeof parsed.status === 'string' ? parsed.status : null;
  const returnedModel = parsed && typeof parsed.model === 'string' ? parsed.model : requestedModel;
  const requestId = headerValue(response, 'x-request-id') || headerValue(response, 'apim-request-id');

  if (httpStatus === 429 || httpStatus === 503) {
    const errorCode = typeof parsed?.error?.code === 'string' ? sanitize(parsed.error.code, secret) : 'unavailable';
    return baseResult(check, 'failed', httpStatus, responseStatus, returnedModel, requestId, errorCode, messageFromFailure(parsed, rawBody, secret, 'Service unavailable'));
  }
  if (!(response.ok === true)) {
    const errorCode = typeof parsed?.error?.code === 'string' ? sanitize(parsed.error.code, secret) : 'http_error';
    return baseResult(check, 'failed', httpStatus, responseStatus, returnedModel, requestId, errorCode, messageFromFailure(parsed, rawBody, secret, `HTTP ${httpStatus || 'error'}`));
  }
  if (!parsed || typeof parsed !== 'object') {
    return baseResult(check, 'failed', httpStatus, responseStatus, returnedModel, requestId, 'invalid_response', sanitize('Response body was not valid JSON', secret));
  }
  if (responseStatus !== 'completed') {
    return baseResult(check, 'failed', httpStatus, responseStatus, returnedModel, requestId, responseStatus === 'incomplete' ? 'incomplete' : 'response_status', messageFromFailure(parsed, rawBody, secret, `Response status ${responseStatus || 'unknown'}`));
  }
  if (hasRefusal(parsed)) {
    return baseResult(check, 'failed', httpStatus, responseStatus, returnedModel, requestId, 'refusal', messageFromFailure(parsed, rawBody, secret, 'Model refusal'));
  }
  const outputText = extractOutputText(parsed);
  if (!outputText) {
    return baseResult(check, 'failed', httpStatus, responseStatus, returnedModel, requestId, 'missing_output', sanitize('Completed response did not include output text', secret));
  }
  return baseResult(check, 'passed', httpStatus, responseStatus, returnedModel, requestId, null, sanitize(outputText, secret));
}

function extractOutputText(parsed) {
  if (typeof parsed.output_text === 'string' && parsed.output_text.trim() !== '') return parsed.output_text.trim();
  const parts = [];
  for (const item of Array.isArray(parsed.output) ? parsed.output : []) {
    if (!Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && content.type === 'output_text' && typeof content.text === 'string' && content.text.trim() !== '') parts.push(content.text.trim());
    }
  }
  return parts.join('\n').trim();
}

function hasRefusal(parsed) {
  return (Array.isArray(parsed.output) ? parsed.output : []).some((item) => Array.isArray(item.content) && item.content.some((content) => content && content.type === 'refusal'));
}

function messageFromFailure(parsed, rawBody, secret, fallback) {
  const parsedMessage = parsed && typeof parsed.error?.message === 'string' ? parsed.error.message
    : parsed && typeof parsed.incomplete_details?.reason === 'string' ? parsed.incomplete_details.reason
    : parsed && typeof parsed.refusal?.reason === 'string' ? parsed.refusal.reason
    : refusalText(parsed);
  return sanitize(parsedMessage || String(rawBody || '').trim() || fallback, secret);
}

function refusalText(parsed) {
  for (const item of Array.isArray(parsed && parsed.output) ? parsed.output : []) {
    for (const content of Array.isArray(item.content) ? item.content : []) {
      if (content && content.type === 'refusal') {
        if (typeof content.refusal === 'string' && content.refusal.trim() !== '') return content.refusal;
        if (typeof content.text === 'string' && content.text.trim() !== '') return content.text;
      }
    }
  }
  return null;
}

function sanitize(message, secret) {
  return String(message || '')
    .replaceAll(secret, '[REDACTED]')
    .replace(/\s+/g, ' ')
    .slice(0, 500) || 'No details available';
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function headerValue(response, name) {
  return response && response.headers && typeof response.headers.get === 'function' ? response.headers.get(name) : null;
}

function skippedImageResult(model) {
  return baseResult('image', 'skipped', null, null, model, null, null, 'Full evaluation not yet attempted because the text check failed');
}

function defaultMissingResult() {
  return baseResult('text', 'failed', null, null, '', null, 'missing_result', 'Result missing');
}

function failureResult({ check, requestedModel, errorCode, message, response }) {
  return baseResult(check, 'failed', response?.status ?? null, null, requestedModel, headerValue(response, 'x-request-id') || headerValue(response, 'apim-request-id'), errorCode, message);
}

function baseResult(check, outcome, httpStatus, responseStatus, model, requestId, errorCode, message) {
  return { check, outcome, httpStatus, responseStatus, model, requestId, errorCode, message, success: outcome === 'passed' };
}

function escapeCell(value) {
  return String(value || '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

module.exports = { waitUntil, runDiagnostics, renderSummary };
