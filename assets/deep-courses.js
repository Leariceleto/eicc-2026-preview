(function () {
  var cards = document.querySelectorAll('[data-deep-choice]');
  var panels = document.querySelectorAll('[data-deep-panel]');

  function show(id) {
    panels.forEach(function (panel) { panel.hidden = panel.id !== id; });
    cards.forEach(function (card) {
      card.setAttribute('aria-expanded', String(card.dataset.deepChoice === id));
    });
  }

  function restore() {
    var id = location.hash.slice(1);
    if (id === 'deep-onsite' || id === 'deep-offsite') show(id);
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      var id = card.dataset.deepChoice;
      show(id);
      location.hash = id;
      var panel = document.getElementById(id);
      panel.focus({ preventScroll: true });
      panel.scrollIntoView({ block: 'start' });
    });
  });
  window.addEventListener('hashchange', restore);
  restore();
}());
