'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { compactEvidenceContent } = require('./eval-evidence-profile.cjs');

test('compact profile retains rubric, issue, instructions and all images without mutating evidence', () => {
  const content = [
    { type: 'input_text', text: 'Scoring instructions and rubric payload' },
    { type: 'input_text', text: 'Issue title and body' },
    { type: 'input_text', text: 'Current page text:\nRendered evidence' },
    { type: 'input_text', text: 'Current HTML snapshot:\n' + '<div>large HTML</div>'.repeat(2500) },
    ...Array.from({ length: 4 }, (_, index) => ({ type: 'input_image', image_url: `data:image/png;base64,image-${index}` })),
  ];
  const original = JSON.stringify(content);
  const compact = compactEvidenceContent(content);
  assert.equal(JSON.stringify(content), original);
  assert.match(compact[0].text, /Experimental compact evidence/);
  assert.match(compact[0].text, /State any resulting evidence limitations/);
  assert.equal(compact[1], content[0]);
  assert.equal(compact[2], content[1]);
  assert.equal(compact[3], content[2]);
  assert.match(compact[4].text, /Omitted from compact model input/);
  assert.doesNotMatch(compact[4].text, /large HTML/);
  assert.deepEqual(compact.filter(item => item.type === 'input_image'), content.filter(item => item.type === 'input_image'));
  assert.ok(Buffer.byteLength(JSON.stringify(compact)) < Buffer.byteLength(original) / 10);
});

test('compact profile bounds both current and baseline page text with explicit omission markers', () => {
  for (const capture of ['Current', 'Baseline']) {
    const content = [
      { type: 'input_text', text: `${capture} page text:\n${'x'.repeat(13000)}TAIL` },
      { type: 'input_text', text: `${capture} HTML snapshot:\nPRIVATE_HTML` },
    ];
    const compact = compactEvidenceContent(content);
    assert.ok(compact[1].text.startsWith(`${capture} page text:\n${'x'.repeat(12000)}\n[`));
    assert.match(compact[1].text, /Truncated for compact model input/);
    assert.doesNotMatch(compact[1].text, /TAIL/);
    assert.doesNotMatch(compact[2].text, /PRIVATE_HTML/);
  }
});

test('invalid compact evidence fails explicitly rather than dropping items', () => {
  assert.throws(() => compactEvidenceContent(null), /must be an array/);
  assert.throws(() => compactEvidenceContent([null]), /must be objects/);
  assert.throws(() => compactEvidenceContent([{ type: 'input_text', text: 1 }]), /must be a string/);
});
