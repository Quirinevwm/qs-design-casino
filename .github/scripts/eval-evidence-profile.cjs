'use strict';

function compactEvidenceContent(content) {
  if (!Array.isArray(content)) throw new TypeError('Request content must be an array');
  return [
    {
      type: 'input_text',
      text: 'Experimental compact evidence profile: raw HTML is omitted and rendered page text is limited to 12000 characters per capture. All screenshots, scoring instructions, and rubric are retained. Do not infer omitted content. State any resulting evidence limitations.',
    },
    ...content.map(item => {
      if (!item || typeof item !== 'object') throw new TypeError('Request content items must be objects');
      if (item.type !== 'input_text') return item;
      if (typeof item.text !== 'string') throw new TypeError('Text content must be a string');
      for (const capture of ['Current', 'Baseline']) {
        const htmlLabel = `${capture} HTML snapshot:\n`;
        if (item.text.startsWith(htmlLabel)) {
          return { ...item, text: `${htmlLabel}[Omitted from compact model input. The full HTML is stored and fingerprinted. Do not infer unseen content.]` };
        }
        const textLabel = `${capture} page text:\n`;
        if (item.text.startsWith(textLabel)) {
          const value = item.text.slice(textLabel.length);
          return value.length <= 12000 ? item : {
            ...item,
            text: `${textLabel}${value.slice(0, 12000)}\n[Truncated for compact model input. The full rendered text is stored and fingerprinted. Do not infer unseen content.]`,
          };
        }
      }
      return item;
    }),
  ];
}

module.exports = { compactEvidenceContent };
