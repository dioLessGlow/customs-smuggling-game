const UI = {
  _current: null,
  _data: {},
  _handlers: {},
  on(name, fn) { this._handlers[name] = fn; },
  show(name, data) {
    this._current = name;
    this._data = data || {};
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.querySelector(`[data-screen="${name}"]`);
    if (el) el.classList.add('active');
    if (this._handlers[name]) this._handlers[name](this._data);
    try { sessionStorage.setItem('ui_screen', name); } catch (e) {}
  },
  hide() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    this._current = null;
    try { sessionStorage.removeItem('ui_screen'); } catch (e) {}
  }
};

function fitApp() {
  var app = document.querySelector('#app');
  var w = window.innerWidth;
  var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.body.style.height = h + 'px';
  var scale = Math.min(w / 390, h / 844);
  app.style.transform = 'scale(' + scale + ')';
  app.style.left = (w - 390 * scale) / 2 + 'px';
  app.style.top = (h - 844 * scale) / 2 + 'px';
}
