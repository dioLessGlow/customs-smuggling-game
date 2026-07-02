var _settingsSection = 'sound';

function _renderAllPanels() {
  var c = document.getElementById('settings-content');
  c.innerHTML = '';
  var ids = ['sound', 'music', 'control', 'save', 'about'];
  ids.forEach(function (id) {
    var panel = document.createElement('div');
    panel.className = 'panel' + (id === _settingsSection ? '' : ' noshow');
    panel.id = 'panel-' + id;
    _renderPanel(id, panel);
    c.appendChild(panel);
  });
}

function _renderPanel(section, panel) {
  var save = SaveManager.load();

  if (section === 'sound') {
    panel.innerHTML = '<h1>音效</h1>';
    _addToggle(panel, '主音量', 'sound_master', save, function(on) {
      soundManager.enabled = on;
      if (!on) soundManager.stopBGM();
    });
    _addSlider(panel, '游戏音效', 'sound_game', save, function(v) { soundManager.setGameVol(v); });
    _addSlider(panel, '提示音效', 'sound_hint', save, function(v) { soundManager.setHintVol(v); });
    _addSlider(panel, 'UI音效', 'sound_ui', save, function(v) { soundManager.setUIVol(v); });
    _addToggle(panel, '震动反馈', 'vibration', save);
  } else if (section === 'music') {
    panel.innerHTML = '<h1>音乐</h1>';
    _addSlider(panel, 'BGM音量', 'music_volume', save, function(v) {
      soundManager.setBGMVolume(v / 100);
    });
    _addToggle(panel, '音乐开关', 'music_enabled', save, function(on) {
      if (on) soundManager.playTrack(save.settings.music_track || 0);
      else soundManager.stopBGM();
    });
    var tracks = ['缉私进行曲', '十二时辰·晨', '十二时辰·午', '十二时辰·暮', '十二时辰·夜'];
    var curTrack = save.settings.music_track || 0;
    var row = document.createElement('div');
    row.className = 'set-row';
    row.style.flexDirection = 'column';
    row.style.alignItems = 'stretch';
    row.innerHTML = '<span class="set-label" style="margin-bottom:5px;">曲目选择</span>';
    var tg = document.createElement('div');
    tg.className = 'set-radio-group';
    tg.style.flexDirection = 'column';
    tracks.forEach(function (t, i) {
      var b = document.createElement('button');
      b.className = 'set-radio' + (i === curTrack ? ' active' : '');
      b.textContent = t;
      b.addEventListener('click', function () {
        save.settings.music_track = i;
        SaveManager.save(save);
        tg.querySelectorAll('.set-radio').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        if (save.settings.music_enabled !== false) soundManager.playTrack(i);
      });
      tg.appendChild(b);
    });
    row.appendChild(tg);
    panel.appendChild(row);
  } else if (section === 'control') {
    panel.innerHTML = '<h1>操作</h1>';
    _addToggle(panel, '自动保存', 'auto_save', save);

  } else if (section === 'save') {
    panel.innerHTML = '<h1>存档</h1>';
    var row = document.createElement('div');
    row.className = 'set-row';
    row.innerHTML = '<span class="set-label">当前进度</span><span style="font-size:10px;color:#8b5e3c;font-weight:600;">周期' + save.currentCycle + ' | 功勋' + save.permanentDao + '</span>';
    panel.appendChild(row);
    var d = document.createElement('div');
    d.style.cssText = 'margin-top:10px;text-align:center;';
    var resetBtn = document.createElement('button');
    resetBtn.className = 'set-btn';
    resetBtn.textContent = '🗑️ 重置全部存档';
    resetBtn.addEventListener('click', function () {
      document.getElementById('reset-overlay').style.display = 'flex';
    });
    d.appendChild(resetBtn);
    panel.appendChild(d);
  } else if (section === 'about') {
    panel.innerHTML =
      '<h1>关于</h1>' +
      '<div style="text-align:center;font-size:24px;margin:4px 0;">🚔</div>' +
      '<div style="text-align:center;font-size:13px;color:#3c1e0e;font-weight:900;">缉私十二时辰</div>' +
      '<div style="text-align:center;font-size:9px;color:#c4a882;margin-bottom:6px;">v1.0.0</div>' +
      '<div style="text-align:center;font-size:9px;color:#3c1e0e;line-height:1.4;margin-bottom:4px;">反走私教育游戏，十二时辰周期挑战了解海关缉私知识。</div>';
  }
}

function _addToggle(container, label, key, save, onChange) {
  var val = save.settings[key] !== undefined ? save.settings[key] : true;
  var row = document.createElement('div');
  row.className = 'set-row';
  var lbl = document.createElement('span');
  lbl.className = 'set-label';
  lbl.textContent = label;
  row.appendChild(lbl);
  var toggle = document.createElement('div');
  toggle.className = 'toggle';
  var bg = document.createElement('div');
  bg.className = 'toggle-bg';
  bg.style.background = val ? '#c4956a' : '#e0d5c0';
  toggle.appendChild(bg);
  var knob = document.createElement('div');
  knob.className = 'toggle-knob';
  knob.style.left = val ? '18px' : '0px';
  toggle.appendChild(knob);
  toggle.addEventListener('click', function () {
    var nv = !val;
    val = nv;
    bg.style.background = nv ? '#c4956a' : '#e0d5c0';
    knob.style.left = nv ? '18px' : '0px';
    save.settings[key] = nv;
    SaveManager.save(save);
    if (onChange) onChange(nv);
  });
  row.appendChild(toggle);
  container.appendChild(row);
}

function _addSlider(container, label, key, save, onChange) {
  var val = save.settings[key] || 70;
  var row = document.createElement('div');
  row.className = 'set-row';
  var lbl = document.createElement('span');
  lbl.className = 'set-label';
  lbl.textContent = label;
  lbl.style.flex = 'none';
  lbl.style.marginRight = '4px';
  row.appendChild(lbl);
  var sr = document.createElement('div');
  sr.className = 'set-slider-row';
  var slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'set-slider';
  slider.min = 0; slider.max = 100;
  slider.value = val;
  var valSpan = document.createElement('span');
  valSpan.className = 'set-val';
  valSpan.textContent = val;
  slider.addEventListener('input', function () {
    valSpan.textContent = this.value;
    save.settings[key] = parseInt(this.value);
    SaveManager.save(save);
    if (onChange) onChange(parseInt(this.value));
  });
  sr.appendChild(slider);
  sr.appendChild(valSpan);
  row.appendChild(sr);
  container.appendChild(row);
}

UI.on('settings', function () {
  _settingsSection = 'sound';
  var nav = document.getElementById('settings-nav');
  nav.innerHTML = '';
  var sections = [
    { id: 'sound', icon: '🔊', label: '音效' },
    { id: 'music', icon: '🎵', label: '音乐' },
    { id: 'control', icon: '🎮', label: '操作' },
    { id: 'save', icon: '💾', label: '存档' },
    { id: 'about', icon: 'ℹ️', label: '关于' }
  ];
  sections.forEach(function (s) {
    var b = document.createElement('button');
    b.className = 'settings-nav-btn' + (s.id === _settingsSection ? ' active' : '');
    b.innerHTML = '<span class="nav-icon">' + s.icon + '</span>';
    b.title = s.label;
    b.addEventListener('click', function () {
      _settingsSection = s.id;
      nav.querySelectorAll('.settings-nav-btn').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      document.querySelectorAll('#settings-content .panel').forEach(function (p) { p.classList.add('noshow'); });
      document.getElementById('panel-' + s.id).classList.remove('noshow');
    });
    nav.appendChild(b);
  });
  _renderAllPanels();
});

var resetConfirm = document.getElementById('reset-confirm');
var resetCancel = document.getElementById('reset-cancel');
var resetOverlay = document.getElementById('reset-overlay');

if (resetConfirm) {
  resetConfirm.addEventListener('click', function () {
    try {
      if (typeof localStorage !== 'undefined' && window.location.protocol !== 'file:') {
        localStorage.removeItem(SAVE_KEY);
      }
    } catch (e) { }
    _memoryStore = null;
    if (resetOverlay) resetOverlay.style.display = 'none';
    UI.show('menu');
  });
}
if (resetCancel) {
  resetCancel.addEventListener('click', function () {
    if (resetOverlay) resetOverlay.style.display = 'none';
  });
}
