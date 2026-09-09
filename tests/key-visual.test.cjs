const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/key-visual.js'), 'utf8');

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
