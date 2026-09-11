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

test('desktop PC2 hero uses expanded artwork in a viewport-height stage', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../assets/key-visual.css'), 'utf8');
  const template = html.match(/<template id="key-visual-river">([\s\S]*?)<\/template>/)[1];
  assert.match(template, /hero-pc2-16x9\.png" width="3840" height="2160"/);
  assert.doesNotMatch(template, /kv-river-designer-pc/);
  assert.doesNotMatch(template, /key-visual-river-lettering|background-desktop/);
  const desktop = css.split('@media(max-width:760px)')[0];
  assert.match(desktop, /\.key-visual-river-picture img\{object-fit:contain;object-position:center;\}/);
  assert.match(desktop, /\.key-visual-stage\{[^}]*height:100vh;height:100dvh;/);
  assert.doesNotMatch(desktop, /aspect-ratio:8 \/ 3|min-height:37\.5vw/);
  const mobile = css.split('@media(max-width:760px)')[1];
  assert.match(mobile, /\.key-visual-river-picture img\{object-fit:cover;\}/);
  assert.match(template, /media="\(max-width:760px\)" srcset="assets\/hero-mobile-20260911\.png"/);
  assert.match(template, /2026\.12\/01 - 12\/05/);
});

test('both existing variants use their respective PC artwork', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  for (const [variant, number] of [['planet', 1], ['river', 2]]) {
    const template = html.split('<template id="key-visual-' + variant + '">')[1].split('</template>')[0];
    assert.ok(template.includes('assets/hero-pc' + number + '-16x9.png'));
    assert.ok(fs.existsSync(path.join(__dirname, '../assets/hero-pc' + number + '-16x9.png')));
  }
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
