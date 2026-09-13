const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = JSON.parse(fs.readFileSync(path.join(root, 'content/main-forum-20260913.json'), 'utf8'));
const agenda = html.match(/<section id="agenda"[\s\S]*?<\/section>/)[0];
const deep = html.match(/<section id="deep"[\s\S]*?<\/section>/)[0];
const onsite = deep.slice(deep.indexOf('<div class="program-body program-deep"'), deep.indexOf('<div class="deep-coming-soon"'));
const program = agenda + onsite;
const normalize = text => text.replace(/\s+/g, '');
const decode = text => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

test('年会议程保持年会概况之后、票种之前的唯一板块', () => {
  const ids = [...html.matchAll(/<section id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids.slice(0, 3), ['about', 'agenda', 'tickets']);
  assert.equal(ids.filter(id => id === 'agenda').length, 1);
});

test('PDF 指定首尾范围的全部文字按原顺序进入年会议程和场内深研课，不含打印杂项', () => {
  const paragraphs = [...program.matchAll(/<p(?: [^>]*)?>([\s\S]*?)<\/p>/g)].map(m => decode(m[1].replace(/<[^>]+>/g, '')));
  assert.equal(source.raw_text_blocks[0], '生命是有限的。');
  assert.equal(source.raw_text_blocks.at(-1), '北京市海淀工读学校');
  assert.equal(normalize(paragraphs.join('')), normalize(source.raw_text_blocks.join('')));
  assert.doesNotMatch(program, /此为临时预览链接|tempkey=|revision 5294/);
});

test('全部议程图按原顺序引用且本地资源齐全', () => {
  // The duplicate section title was removed at the user's request.
  const images = source.items.filter(i => i.kind === 'image').slice(1);
  assert.equal(images.length, 46);
  assert.doesNotMatch(agenda, /program-section-heading/);
  assert.deepEqual([...program.matchAll(/<img src="([^"]+)"/g)].map(m => m[1]), images.map(i => i.src));
  images.forEach(i => assert.ok(fs.statSync(path.join(root, i.src)).size > 0, i.src));
});

test('全部议程连续展示，移除日期切换并保留学习护照锚点', () => {
  assert.doesNotMatch(agenda, /data-day=|agenda-tab-|agenda-panel|class="tabs"/);
  for (let n = 1; n <= 4; n++) assert.ok(agenda.includes('class="program-body" id="d' + n + '"'));
  assert.doesNotMatch(agenda, /program-deep|场内深研课|北京市海淀工读学校/);
  assert.match(agenda, /42\.webp[\s\S]*program-end-rule/);
  assert.ok(onsite.includes('没有坏孩子，只有走不下去的路——专门学校的教育转化方法论'));
  for (const id of ['deep-onsite', 'deep-offsite']) {
    assert.ok(deep.includes('href="#' + id + '"'));
    assert.ok(deep.includes('aria-controls="' + id + '"'));
    assert.ok(deep.includes('id="' + id + '" data-deep-panel'));
  }
  assert.match(deep, /id="deep-offsite"[^>]*hidden><p>精彩待续<\/p>/);
});
