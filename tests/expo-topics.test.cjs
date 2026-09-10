const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const expo = html.match(/<section id="expo"[\s\S]*?<\/section>/)[0];

test('方案展只罗列原文十五类卡点标题，无新增梗概、问题或切换交互', () => {
  const list = expo.match(/<ul class="expo-topic-list"[\s\S]*?<\/ul>/)[0];
  const labels = [...list.matchAll(/<h3>(.*?)<\/h3>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
  assert.deepEqual(labels, ['学生卡点','学习卡点','课程卡点','教师卡点','评价卡点','技术卡点','场景卡点','组织卡点','安全卡点','合规卡点','公平卡点','时间卡点','考试卡点','负担卡点','经费卡点']);
  assert.equal((list.match(/<li>/g) || []).length, 15);
  assert.match(list, /对象变了，我们没准备好接住/);
  assert.match(list, /让有限的经费产生最大的变革杠杆效应/);
  assert.doesNotMatch(expo, /data-expo-topic|expo-intro|expo-topic-detail|代表性问题|我们共同面对的问题|aria-pressed/);
  assert.doesNotMatch(html, /src="assets\/expo-topics\.js/);
});

test('移除三块逛展说明，卡点列表后保留征集入口', () => {
  assert.ok(expo.indexOf('class="expo-topic-list"') < expo.indexOf('class="expo-callout"'));
  assert.doesNotMatch(expo, /expo-grid|expo-card|链接方案|逛展攻略|AI共创/);
  assert.ok(expo.includes('我想加入'));
  assert.match(expo, /data-form-url=""/);
});
