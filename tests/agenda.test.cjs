const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const agenda = html.match(/<section id="agenda"[\s\S]*?<\/section>/)[0];
const panels = [...agenda.matchAll(/<div class="agenda-panel(?: active)?" id="(d[1-4])"([\s\S]*?)(?=<div class="agenda-panel|<p class="agenda-update-note")/g)];

test('主论坛日程移到大会概况之后，历程图及手机重排逻辑移除', () => {
  const ids = [...html.matchAll(/<section id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids.slice(0, 3), ['about', 'agenda', 'tickets']);
  assert.equal(ids.filter(id => id === 'agenda').length, 1);
  assert.doesNotMatch(html, /class="about-history"|class="annual-timeline"|placeHistorySection|src="assets\/annual-history/);
  assert.match(html, /class="history-video-slot"/);
});

test('四天议程与源文档 revision 5294 的条目数一致', () => {
  assert.deepEqual(panels.map(p => p[1]), ['d1', 'd2', 'd3', 'd4']);
  assert.deepEqual(panels.map(p => (p[2].match(/<li[ >]/g) || []).length), [16, 17, 19, 13]);
  assert.equal((agenda.match(/class="agenda-panel active"/g) || []).length, 1);
});

test('新版嘉宾归属、顺序及待定内容保留，旧报告不混入', () => {
  const [d1, d2, d3, d4] = panels.map(p => p[2]);
  for (const name of ['陈敏生', '安德烈亚斯·施莱歇尔', '叶语沛']) assert.ok(d1.includes(name));
  assert.ok(d2.indexOf('俞正强') < d2.indexOf('席酉民'));
  assert.ok(d2.includes('题目待定') && d2.includes('陈丽霞') && d2.includes('郑琰'));
  for (const name of ['陈一帆', '侯明飞', '田俊', 'MacKenzie Price', '快刀青衣']) assert.ok(d3.includes(name));
  for (const name of ['万玮', 'Asyia Kazmi', '高喆生', '2026中国学生创新节学生代表']) assert.ok(d4.includes(name));
  for (const text of ['李若谷', '郑腾飞', 'TUMO', '他山之石', '用AI，把教师可外包的能力外包出去', '同意']) assert.ok(!agenda.includes(text));
  assert.ok(!d2.includes('10分钟'));
  assert.ok(d3.includes('10分钟'));
});

test('日期按钮保留原锚点并暴露选中状态', () => {
  for (let n = 1; n <= 4; n++) {
    assert.ok(agenda.includes('data-day="d' + n + '" aria-controls="d' + n + '" aria-pressed="' + (n === 1) + '"'));
    assert.ok(agenda.includes('aria-labelledby="agenda-tab-d' + n + '"'));
  }
});
