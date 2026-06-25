var _settingsSection = 'sound';

function _renderSettingsSection(section) {
  var c = document.getElementById('settings-content');
  c.innerHTML = '';
  var save = SaveManager.load();

  if (section === 'sound') {
    c.innerHTML = '<div class="section-title">🔊 音效设置</div>';
    _addToggle(c, '主音量', 'sound_master', save);
    _addSlider(c, '游戏音效', 'sound_game', save);
    _addSlider(c, '提示音效', 'sound_hint', save);
    _addSlider(c, 'UI音效', 'sound_ui', save);
    _addToggle(c, '震动反馈', 'vibration', save);
  } else if (section === 'music') {
    c.innerHTML = '<div class="section-title">🎵 音乐设置</div>';
    _addSlider(c, 'BGM音量', 'music_volume', save);
    _addToggle(c, '音乐开关', 'music_enabled', save);
    var tracks = ['缉私进行曲', '十二时辰·晨', '十二时辰·午', '十二时辰·暮', '十二时辰·夜'];
    var tr = document.createElement('div');
    tr.className = 'set-row';
    tr.innerHTML = '<span class="set-label">曲目选择</span>';
    var tg = document.createElement('div');
    tg.className = 'set-radio-group';
    tracks.forEach(function(t, i) {
      var b = document.createElement('button');
      b.className = 'set-radio' + (i === 0 ? ' active' : '');
      b.textContent = t;
      tg.appendChild(b);
    });
    tr.appendChild(tg);
    c.appendChild(tr);
  } else if (section === 'control') {
    c.innerHTML = '<div class="section-title">🎮 操作设置</div>';
    var modes = { click: '点击模式', swipe: '滑动模式', hold: '长按模式' };
    var mr = document.createElement('div');
    mr.className = 'set-row';
    mr.innerHTML = '<span class="set-label">操作模式</span>';
    var mg = document.createElement('div');
    mg.className = 'set-radio-group';
    Object.keys(modes).forEach(function(k) {
      var b = document.createElement('button');
      b.className = 'set-radio' + ((save.settings.control_mode || 'click') === k ? ' active' : '');
      b.textContent = modes[k];
      b.addEventListener('click', function() {
        save.settings.control_mode = k; SaveManager.save(save);
        mg.querySelectorAll('.set-radio').forEach(function(x) { x.classList.remove('active'); });
        b.classList.add('active');
      });
      mg.appendChild(b);
    });
    mr.appendChild(mg);
    c.appendChild(mr);
    _addToggle(c, '自动保存设置', 'auto_save', save);
    _addToggle(c, '新手引导提示', 'show_tutorial', save);
  } else if (section === 'display') {
    c.innerHTML = '<div class="section-title">📱 显示设置</div>';
    var quals = { low: '流畅', standard: '标准', high: '高清', ultra: '极致' };
    var qr = document.createElement('div');
    qr.className = 'set-row';
    qr.innerHTML = '<span class="set-label">画质等级</span>';
    var qg = document.createElement('div');
    qg.className = 'set-radio-group';
    Object.keys(quals).forEach(function(k) {
      var b = document.createElement('button');
      b.className = 'set-radio' + ((save.settings.quality || 'standard') === k ? ' active' : '');
      b.textContent = quals[k];
      b.addEventListener('click', function() {
        save.settings.quality = k; SaveManager.save(save);
        qg.querySelectorAll('.set-radio').forEach(function(x) { x.classList.remove('active'); });
        b.classList.add('active');
      });
      qg.appendChild(b);
    });
    qr.appendChild(qg);
    c.appendChild(qr);
    _addToggle(c, '高帧率模式(60FPS)', 'high_fps', save);
    _addToggle(c, '粒子特效', 'particles', save);
  } else if (section === 'save') {
    c.innerHTML = '<div class="section-title">💾 存档管理</div>';
    var slot = document.createElement('div');
    slot.className = 'set-row';
    slot.innerHTML = '<span class="set-label">当前进度</span><span class="set-stat-val">周期' + save.currentCycle + ' | 功勋' + save.permanentDao + ' | 图鉴' + (save.seenItems ? save.seenItems.length : 0) + '件</span>';
    c.appendChild(slot);
    var d = document.createElement('div');
    d.style.cssText = 'margin-top:10px;';
    var resetBtn = document.createElement('button');
    resetBtn.className = 'set-btn';
    resetBtn.textContent = '🗑️ 重置全部存档';
    resetBtn.addEventListener('click', function() {
      document.getElementById('reset-overlay').style.display = 'flex';
    });
    d.appendChild(resetBtn);
    c.appendChild(d);
  } else if (section === 'stats') {
    c.innerHTML = '<div class="section-title">📊 数据统计</div>';
    var itemsTotal = save.seenItems ? save.seenItems.length : 0;
    var illegalCount = save.seenItems ? save.seenItems.filter(function(s) { return s.type === 'illegal'; }).length : 0;
    var fragCollected = save.fragments.length;
    var fragTotal = Object.keys(FRAGMENTS).length;
    var dataRows = [
      ['当前周期', '第' + save.currentCycle + '周期'],
      ['永久功勋', save.permanentDao],
      ['物品收集', itemsTotal + '件 (违禁' + illegalCount + ')'],
      ['剧情碎片', fragCollected + '/' + fragTotal],
      ['已激活直觉', save.echoSkills.length + '个'],
      ['已购买商品', (save.shopItems ? save.shopItems.length : 0) + '件'],
      ['掌握知识', (save.shopKnowledge ? save.shopKnowledge.length : 0) + '个']
    ];
    dataRows.forEach(function(r) {
      var row = document.createElement('div');
      row.className = 'set-stat-row';
      row.innerHTML = '<span>' + r[0] + '</span><span class="set-stat-val">' + r[1] + '</span>';
      c.appendChild(row);
    });
  } else if (section === 'help') {
    c.innerHTML = '<div class="section-title">❓ 帮助教程</div>';
    var helps = [
      '🎯 游戏目标：在限定时间内从物品中识别违禁品',
      '📦 物品类型：包裹中有合法品和违禁品，点击违禁品得分',
      '⭐ 功勋获取：关卡通过+功勋，全对额外奖励',
      '🔄 周期系统：每10关为一个周期，通过≥6关进入下一周期',
      '🏪 功勋商店：使用永久功勋购买装备/技能/直觉/知识',
      '📖 图鉴系统：收集物品和碎片，解锁剧情',
      '👥 导师亲密度：通关/购买知识/完成测验增加亲密度'
    ];
    helps.forEach(function(h) {
      var d = document.createElement('div');
      d.className = 'set-help-block';
      d.textContent = h;
      c.appendChild(d);
    });
  } else if (section === 'about') {
    c.innerHTML =
      '<div class="section-title">ℹ️ 关于我们</div>' +
      '<div style="text-align:center;font-size:28px;margin:10px 0;">🚔</div>' +
      '<div style="text-align:center;font-size:14px;color:#ffd700;font-weight:900;">缉私十二时辰</div>' +
      '<div style="text-align:center;font-size:10px;color:#64748b;margin-bottom:10px;">v1.0.0</div>' +
      '<div class="set-help-block">一款以反走私为主题的教育游戏，通过十二时辰周期挑战，了解海关缉私知识。</div>' +
      '<div class="set-stat-row"><span>更新日期</span><span class="set-stat-val">2026-06-23</span></div>';
  }
}

function _addToggle(container, label, key, save) {
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
  bg.style.background = val ? '#4ecca3' : '#475569';
  toggle.appendChild(bg);
  var knob = document.createElement('div');
  knob.className = 'toggle-knob';
  knob.style.left = val ? '18px' : '0px';
  toggle.appendChild(knob);
  toggle.addEventListener('click', function() {
    var nv = !val;
    val = nv;
    bg.style.background = nv ? '#4ecca3' : '#475569';
    knob.style.left = nv ? '18px' : '0px';
    save.settings[key] = nv;
    SaveManager.save(save);
  });
  row.appendChild(toggle);
  container.appendChild(row);
}

function _addSlider(container, label, key, save) {
  var val = save.settings[key] || 70;
  var row = document.createElement('div');
  row.className = 'set-row';
  var lbl = document.createElement('span');
  lbl.className = 'set-label';
  lbl.textContent = label;
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
  slider.addEventListener('input', function() {
    valSpan.textContent = this.value;
    save.settings[key] = parseInt(this.value);
    SaveManager.save(save);
  });
  sr.appendChild(slider);
  sr.appendChild(valSpan);
  row.appendChild(sr);
  container.appendChild(row);
}

UI.on('settings', function () {
  _settingsSection = 'sound';
  var c = document.getElementById('settings-content');
  c.innerHTML = '';
  // Nav bar
  var nav = document.getElementById('settings-nav');
  if (!nav) {
    nav = document.createElement('div');
    nav.id = 'settings-nav';
    document.getElementById('screen-settings').insertBefore(nav, c);
  }
  nav.innerHTML = '';
  var sections = [
    { id: 'sound', icon: '🔊', label: '音效' },
    { id: 'music', icon: '🎵', label: '音乐' },
    { id: 'control', icon: '🎮', label: '操作' },
    { id: 'display', icon: '📱', label: '显示' },
    { id: 'save', icon: '💾', label: '存档' },
    { id: 'stats', icon: '📊', label: '统计' },
    { id: 'help', icon: '❓', label: '帮助' },
    { id: 'about', icon: 'ℹ️', label: '关于' }
  ];
  sections.forEach(function(s) {
    var b = document.createElement('button');
    b.className = 'settings-nav-btn' + (s.id === _settingsSection ? ' active' : '');
    b.textContent = s.icon + ' ' + s.label;
    b.addEventListener('click', function() {
      _settingsSection = s.id;
      nav.querySelectorAll('.settings-nav-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active');
      _renderSettingsSection(s.id);
    });
    nav.appendChild(b);
  });
  _renderSettingsSection('sound');
});

// Reset overlay handlers
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