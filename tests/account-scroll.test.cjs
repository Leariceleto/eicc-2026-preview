const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const router = html.split('// ===== Hash router:')[1].split('// ===== Mobile burger menu')[0];
const source = router.slice(router.indexOf('(function(){'));

function setup(hash = '#account') {
  const events = {}, documentEvents = {}, frames = new Map(), positions = [];
  let frameId = 0;
  const context = {
    location: {hash}, history: {scrollRestoration: 'auto'},
    window: {scrollY: 0, addEventListener: (name, fn) => {events[name] = fn;},
      scrollTo: ({top}) => {context.window.scrollY = top; positions.push(top); events.scroll();}},
    document: {querySelectorAll: () => [], getElementById: () => ({scrollIntoView: () => positions.push('anchor')}),
      addEventListener: (name, fn) => {documentEvents[name] = fn;}, body: {classList: {toggle() {}}}},
    requestAnimationFrame: fn => {frames.set(++frameId, fn); return frameId;},
    cancelAnimationFrame: id => frames.delete(id)
  };
  function flush() {const work = [...frames.values()]; frames.clear(); work.forEach(fn => fn());}
  vm.runInNewContext(source, context);
  flush();
  return {context, positions, flush,
    scroll: top => {context.window.scrollY = top; events.scroll();},
    navigate: (hash, click = true) => {
      if(click) documentEvents.click();
      context.location.hash = hash;
      // 模拟 hash 原生定位先于 hashchange，不能覆盖已保存的位置。
      context.window.scrollY = 0; events.scroll(); events.hashchange();
    }};
}

test('从任意卡片返回一键查询时恢复原位置，详情仍从顶部显示', () => {
  const app = setup();
  for(const route of ['hotel', 'passport', 'coins', 'help']) {
    app.scroll(720);
    app.navigate('#account/' + route); app.flush();
    assert.equal(app.positions.at(-1), 0);
    app.scroll(180);
    app.navigate('#account'); app.flush();
    assert.equal(app.positions.at(-1), 720);
  }
});

test('浏览器返回及详情内多级跳转不丢失查询总览位置', () => {
  const app = setup();
  app.scroll(960);
  app.navigate('#account/coins'); app.flush();
  app.navigate('#account/recharge'); app.flush();
  app.navigate('#account', false); app.flush();
  assert.equal(app.positions.at(-1), 960);
});

test('直接打开详情后返回从顶部显示，首页锚点行为不变', () => {
  const app = setup('#account/hotel');
  app.navigate('#account', false); app.flush();
  assert.equal(app.positions.at(-1), 0);
  app.navigate('#passport'); app.flush();
  assert.equal(app.positions.at(-1), 'anchor');
  assert.equal(app.context.history.scrollRestoration, 'auto');
  app.navigate('#account'); app.flush();
  assert.equal(app.positions.at(-1), 0);
});

test('快速切换路由不会执行过时的滚动回调', () => {
  const app = setup();
  app.scroll(500);
  app.navigate('#account/hotel');
  app.navigate('#account'); app.flush();
  assert.equal(app.positions.at(-1), 500);
});

test('返回时 DOM 重绘引发的临时滚动不会覆盖待恢复位置', () => {
  const app = setup();
  app.scroll(840);
  app.navigate('#account/hotel'); app.flush();
  app.navigate('#account');
  app.scroll(0);
  app.flush();
  assert.equal(app.positions.at(-1), 840);
});
