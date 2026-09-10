const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/key-visual.js'), 'utf8');

test('countdown is removed from every homepage variant and no update loop remains', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../assets/key-visual.css'), 'utf8');
  assert.doesNotMatch(html, /id="countdown"|id="cd-[dhms]"|setInterval\(tick/);
  assert.doesNotMatch(source + css, /countdown|cd-cell/);
  assert.match(source, /originalHost\.appendChild\(actions\)/);
});

test('desktop river hero restores the full fifth artboard in a viewport-height stage', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../assets/key-visual.css'), 'utf8');
  const template = html.match(/<template id="key-visual-river">([\s\S]*?)<\/template>/)[1];
  assert.match(template, /kv-river-web-desktop\.webp" width="2560" height="1440"/);
  assert.doesNotMatch(template, /kv-river-designer-pc/);
  assert.doesNotMatch(template, /key-visual-river-lettering|background-desktop/);
  const desktop = css.split('@media(max-width:760px)')[0];
  assert.match(desktop, /\.key-visual-river-picture img\{object-fit:contain;object-position:center;\}/);
  assert.match(desktop, /\.key-visual-stage\{[^}]*height:100vh;height:100dvh;/);
  assert.doesNotMatch(desktop, /aspect-ratio:8 \/ 3|min-height:37\.5vw/);
  const mobile = css.split('@media(max-width:760px)')[1];
  assert.match(mobile, /\.key-visual-river-picture img\{object-fit:cover;\}/);
  assert.match(template, /media="\(max-width:760px\)" srcset="assets\/kv-river-web-mobile-no-date\.webp"/);
  assert.match(template, /2026\.12\/01 - 12\/05/);
});

test('restored full artboard uses the approved native side extension on wide desktop only', () => {
  const css = fs.readFileSync(path.join(__dirname, '../assets/key-visual.css'), 'utf8');
  assert.match(css, /@media\(min-width:761px\) and \(min-aspect-ratio:16\/9\)\{\s*html\[data-key-visual="river"\] \.key-visual-media::before\{[^}]*kv-river-web-native-extended-desktop\.webp[^}]*center\/auto 100% no-repeat/);
  assert.doesNotMatch(css, /kv-river-web-extended-desktop\.png|kv-river-designer-pc/);
  assert.ok(fs.existsSync(path.join(__dirname, '../assets/kv-river-web-desktop.webp')));
  assert.ok(fs.existsSync(path.join(__dirname, '../assets/kv-river-web-native-extended-desktop.webp')));
});

for (const [search, expected] of [
  ['', 'river'],
  ['?queryRole=buyer', 'river'],
  ['?visual=', 'river'],
  ['?visual=unknown', 'river'],
  ['?visual=river', 'river'],
  ['?visual=planet', 'planet'],
  ['?visual=original', 'original'],
]) {
  test(`homepage visual ${search || '(bare URL)'} selects ${expected}`, () => {
    const dataset = {};
    const events = [];
    vm.runInNewContext(source, {
      URLSearchParams,
      location: { search },
      document: {
        documentElement: { dataset },
        addEventListener: (name, callback) => events.push({ name, callback }),
      },
    });
    assert.equal(dataset.keyVisual, expected);
    assert.equal(events.length, 1);
    assert.equal(events[0].name, 'DOMContentLoaded');
    assert.equal(typeof events[0].callback, 'function');
  });
}
