var _ITEM2ICON = {
  '走私手机':'📱','假包':'👛','水客药品':'💉','毒品':'💊','走私名表':'⌚',
  '走私香烟':'🚬','走私燕窝':'🥣','假香水':'🌸','假化妆品':'🧪','走私药材':'🌿',
  '走私冻肉':'🥩','走私海鲜':'🦀','走私鹅肝':'🫘','走私鱼翅':'🦈','走私鲍鱼':'🪼',
  '走私海参':'🪸','走私和牛':'🐄','走私黄油':'🧈','疫区冻肉':'⚠️',
  '象牙':'🐘','犀牛角':'🦏','虎骨':'🐅','珍稀皮草':'🦊','象牙手镯':'📿',
  '象牙印章':'🖊️','穿山甲鳞片':'🦔','玳瑁':'🐢','熊胆':'🧪','麝香':'🌸',
  '象牙手串(伪塑料)':'📿',
  '珍稀龟':'🐢','蛇卵':'🥚','毒蜘蛛':'🕷️','珍稀鸟类':'🦜','箭毒蛙':'🐸',
  '食人鱼':'🐟','变色龙':'🦎','蝎子':'🦂','蟒蛇':'🐍','剧毒海螺':'🐚',
  '枪支零件':'🔫','弹药':'💣','武器配件':'🎯','自制枪械':'⚔️','消音器':'🔇',
  '枪管':'🪠','瞄准镜':'🔭','子弹模具':'🔄','火药':'🧨','防弹衣':'🛡️',
  '海洛因':'💉','冰毒':'🧪','摇头丸':'💊','制毒原料':'⚗️','可卡因':'❄️',
  '大麻':'🍃','吗啡':'🩸','鸦片':'☠️','迷幻剂':'💧','K粉':'🧂',
  '裙子藏毒':'👗','轴承藏毒':'🔩','净水器藏毒':'🚰',
  '伪报电子产品':'💻','瞒报文物':'🏺','瞒报奢侈品':'👛','瞒报冻肉':'🥩',
  '伪报药材':'🌿','伪报化妆品':'💄','瞒报烟酒':'🚬','瞒报珠宝':'💎',
  '瞒报现金':'💰','瞒报药品':'💉',
  '仿冒手袋':'👛','假名表':'⏰','假珠宝':'📿','洗钱油画':'🎨','仿冒香水':'🧪',
  '仿冒包':'🥊','仿冒鞋':'👞','仿冒领带':'👔','仿冒眼镜':'🔍','仿冒礼服':'👘',
  '翻新手机':'📲','盗版芯片':'🟫','走私硬盘':'💿','走私显卡':'🎮','山寨耳机':'📻',
  '走私CPU':'🔲','走私内存':'🧩','走私主板':'⚡','走私电池':'🪫','走私屏幕':'📺',
  'CD碟片藏毒':'💿','肥皂藏毒':'🧼',
  '出土青铜器':'🥉','古画':'🎨','恐龙化石':'🦴','古佛像':'🧘','古剑':'🗡️',
  '古钱币':'👑','古玉器':'💠','古瓷器':'⚱️','古书籍':'📜','古壁画':'🧱',
  '碳14测年伪造品':'⏳',
  '海上走私烟':'🚬','海上走私酒':'🍷','走私石油':'🛢️','珍稀珊瑚':'🪸',
  '走私濒危鱼类':'🐠','走私海龟':'🐢','走私玳瑁':'🐚','走私珍珠':'📿',
  '走私海马':'🌿','走私鲸牙':'🦷','走私鱼鳔(加州黄花鱼)':'🫧',
  '医疗废物':'☣️','电子垃圾':'💻','有毒废料':'🧪','核废料':'☢️',
  '化工废料':'⚗️','废机油':'🛢️','废灯管':'💡','废油漆':'🎨','废溶剂':'🧴',
  '废酸液':'💧','医疗废物(注射器)':'💉'
};

var _CAT2ICON = {
  '电子产品':'📱','假冒伪劣':'👛','药品':'💊','毒品':'☠️','濒危物种':'🐘',
  '异宠':'🦎','武器':'🔫','文物':'🏺','烟草':'🚬','冻品':'❄️',
  '食品':'🍖','珠宝':'💎','能源':'🛢️','危险废物':'☢️','放射性物质':'☢️',
  '伪报':'📋','奢侈品':'⌚','化妆品':'💄','工艺品':'🎭'
};

function _getItemIcon(name, cat) {
  return _ITEM2ICON[name] || _CAT2ICON[cat] || '📦';
}

function _showArchiveModal(icon, name, detail, desc) {
  var modal = document.getElementById('archive-modal');
  var box = modal.querySelector('.archive-modal-box');
  var fcContainer = document.getElementById('fc-container');
  var enc = ITEM_ENCYCLOPEDIA && ITEM_ENCYCLOPEDIA[name];

  var closeModal = function () {
    modal.classList.remove('show');
    var card = fcContainer.querySelector('.flip-card');
    if (card) card.classList.remove('open');
  };
  document.getElementById('am-close').onclick = closeModal;

  box.style.display = 'none';
  fcContainer.style.display = 'block';

  var riskColors = { '低':'#4ecca3', '中':'#ffd700', '高':'#ff8c00', '严重':'#e94560' };
  var rc = riskColors[enc && enc.riskType] || '#94a3b8';
  var metaParts = [];
  if (enc && enc.cat) metaParts.push('分类：' + enc.cat);
  if (enc && enc.riskType) metaParts.push('风险等级：<span style="color:' + rc + ';font-weight:900">' + enc.riskType + '</span>');
  if (!metaParts.length && detail) metaParts.push(detail);

  var sections = [];
  if (enc) {
    var secData = [
      enc.what && { label: '📖 科普介绍', text: enc.what },
      enc.why && { label: '⚠️ 为何违法', text: enc.why },
      enc.how && { label: '🔍 走私手法', text: enc.how },
      enc.impact && { label: '📊 社会影响', text: enc.impact },
      enc.law && { label: '⚖️ 相关法律', text: enc.law },
      enc.tip && { label: '💡 查验技巧', text: enc.tip }
    ];
    secData.forEach(function (s) { if (s) sections.push(s); });
  }
  if (!sections.length) {
    sections.push({ label: '📋 说明', text: desc || detail || '暂无详细说明' });
  }

  var badgeText = (enc && enc.riskType) ? '⚠️ 违禁品' : '📋 物品';
  var innerHtml = '';
  innerHtml += '<div class="fc-title"><h4>' + name + '</h4><span class="fc-badge">' + badgeText + '</span></div>';
  if (metaParts.length) innerHtml += '<div class="fc-meta">' + metaParts.join(' &nbsp;|&nbsp; ') + '</div>';
  sections.forEach(function (s) {
    innerHtml += '<div class="fc-sec"><div class="fc-sec-title">' + s.label + '</div><p>' + s.text + '</p></div>';
  });
  innerHtml += '<div class="fc-tag">缉私科普知识卡</div>';

  fcContainer.innerHTML =
    '<div class="flip-card-wrap">' +
    '<div class="flip-card" id="fc-card">' +
    '<div class="front">' +
    '<div class="front-icon">' + icon + '</div>' +
    '<div class="front-name">' + name + '</div>' +
    '<div class="front-hint">👆 点击翻开</div>' +
    '</div>' +
    '<div class="inner">' + innerHtml + '</div>' +
    '</div>' +
    '</div>';

  var cardEl = document.getElementById('fc-card');
  cardEl.onclick = function () {
    this.classList.toggle('open');
  };
  modal.classList.add('show');
}

function _renderArchiveItems() {
  var content = document.getElementById('archive-content');
  if (!content) return;
  var names = Object.keys(ITEM_ENCYCLOPEDIA);
  var cats = {};
  names.forEach(function (n) {
    var e = ITEM_ENCYCLOPEDIA[n];
    var c = e && e.cat || '其他';
    if (!cats[c]) cats[c] = [];
    cats[c].push(n);
  });
  var html = '';
  html += '<div class="archive-total">共 ' + names.length + ' 种违禁品/走私方式</div>';
  var catKeys = Object.keys(cats).sort();
  catKeys.forEach(function (cat) {
    html += '<div class="archive-group-title">' + (_CAT2ICON[cat] || '📋') + ' ' + cat + '</div>';
    html += '<div class="archive-grid">';
    cats[cat].forEach(function (n) {
      var icon = _getItemIcon(n, cat);
      var risk = ITEM_ENCYCLOPEDIA[n] && ITEM_ENCYCLOPEDIA[n].riskType;
      var cls = risk === '高' || risk === '严重' ? 'archive-item illegal' : 'archive-item';
      html += '<div class="' + cls + '" data-item="' + n.replace(/"/g, '&quot;') + '" data-icon="' + icon + '" data-cat="' + cat + '">';
      html += '<div class="archive-icon">' + icon + '</div>';
      html += '<div class="archive-tag">' + n.substring(0, 6) + '</div>';
      html += '</div>';
    });
    html += '</div>';
  });
  content.innerHTML = html;
  content.querySelectorAll('.archive-item').forEach(function (el) {
    el.addEventListener('click', function () {
      var name = el.dataset.item;
      var icon = el.dataset.icon;
      var cat = el.dataset.cat;
      _showArchiveModal(icon, name, cat, '');
    });
  });
}

function _renderArchiveFragments() {
  var content = document.getElementById('archive-content');
  if (!content) return;
  var save = SaveManager.load();
  var unlocked = save.fragments || [];
  var html = '';
  unlocked.forEach(function (id) {
    var text = FRAGMENTS[id] || '暂无内容';
    html += '<div class="archive-frag">';
    html += '<span>' + id + ': ' + text.substring(0, 60) + '</span>';
    html += '</div>';
  });
  if (!unlocked.length) {
    html = '<div style="text-align:center;color:#64748b;font-size:13px;padding:40px 0">暂无解锁的剧情碎片</div>';
  }
  html = '<div class="archive-total">已解锁 ' + unlocked.length + '/' + Object.keys(FRAGMENTS).length + '</div>' + html;
  content.innerHTML = html;
}

function _renderArchiveTutors() {
  var content = document.getElementById('archive-content');
  if (!content) return;
  var save = SaveManager.load();
  var aff = save.tutorAffinity || {};
  var html = '<div class="archive-tutor-grid">';
  TUTOR_POOL.forEach(function (t) {
    var a = aff[t.id] || 0;
    html += '<div class="archive-tutor-row" data-tutor="' + t.id + '">';
    html += '<div class="archive-tutor-icon">' + t.icon + '</div>';
    html += '<div class="archive-tutor-name">' + t.name + '</div>';
    html += '<div class="archive-tutor-bar-bg"><div class="archive-tutor-bar-fill" style="width:' + a + '%"></div></div>';
    html += '<div class="archive-tutor-aff">' + a + '/100</div>';
    html += '</div>';
  });
  html += '</div>';
  content.innerHTML = html;
}

function _renderArchiveIntuitions() {
  var content = document.getElementById('archive-content');
  if (!content) return;
  var save = SaveManager.load();
  var unlocked = save.echoSkills || [];
  var html = '<div class="archive-total">已解锁 ' + unlocked.length + '/' + ECHO_POOL.length + '</div>';
  html += '<div class="archive-echos">';
  ECHO_POOL.forEach(function (e) {
    var has = unlocked.indexOf(e.id) >= 0;
    html += '<div class="archive-echo" style="' + (has ? '' : 'opacity:0.4') + '" data-id="' + e.id + '">';
    html += '<div style="font-size:28px">' + e.icon + '</div>';
    html += '<div style="font-size:11px;color:' + (has ? '#ffd700' : '#64748b') + ';font-weight:900">' + e.name + '</div>';
    html += '<div style="font-size:9px;color:' + (has ? '#e2e8f0' : '#475569') + ';text-align:center">' + e.desc + '</div>';
    if (!has) html += '<div style="font-size:8px;color:#475569;margin-top:2px">🔒 未解锁</div>';
    html += '</div>';
  });
  html += '</div>';
  content.innerHTML = html;
}

function _updateArchiveStats(tab) {
  var names = Object.keys(ITEM_ENCYCLOPEDIA);
  document.getElementById('as-total').textContent = names.length;
  var save = SaveManager.load();
  var unlocked = 0;
  if (tab === 'items') unlocked = names.length;
  else if (tab === 'fragments') unlocked = (save.fragments || []).length;
  else if (tab === 'tutors') {
    var aff = save.tutorAffinity || {};
    unlocked = TUTOR_POOL.filter(function (t) { return (aff[t.id] || 0) > 0; }).length;
  } else if (tab === 'intuitions') unlocked = (save.echoSkills || []).length;
  document.getElementById('as-unlocked').textContent = unlocked;
}

var _tabHandlers = {
  items: function () { _renderArchiveItems(); _updateArchiveStats('items'); },
  fragments: function () { _renderArchiveFragments(); _updateArchiveStats('fragments'); },
  tutors: function () { _renderArchiveTutors(); _updateArchiveStats('tutors'); },
  intuitions: function () { _renderArchiveIntuitions(); _updateArchiveStats('intuitions'); }
};

UI.on('archive', function () {
  document.getElementById('phaser-container').style.display = 'none';
  var activeTab = document.querySelector('.archive-tab.active');
  var tab = activeTab ? activeTab.dataset.archiveTab : 'items';
  if (_tabHandlers[tab]) _tabHandlers[tab]();
});

document.addEventListener('click', function (e) {
  var btn = e.target.closest('.archive-tab');
  if (btn) {
    document.querySelectorAll('.archive-tab').forEach(function (t) { t.classList.remove('active'); });
    btn.classList.add('active');
    var tab = btn.dataset.archiveTab;
    if (_tabHandlers[tab]) _tabHandlers[tab]();
    return;
  }
});

document.querySelector('#archive-modal .archive-modal-close').addEventListener('click', function () {
  document.getElementById('archive-modal').classList.remove('show');
  var card = document.getElementById('fc-card');
  if (card) card.classList.remove('open');
});
document.getElementById('archive-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    this.classList.remove('show');
    var card = document.getElementById('fc-card');
    if (card) card.classList.remove('open');
  }
});
