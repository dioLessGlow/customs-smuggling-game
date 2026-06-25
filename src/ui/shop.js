var _shopCurrentTab = 'equipment';
var _shopPendingItem = null;
var _shopCurrentTutor = null;

function _shopCardState(item, tab, save) {
  var owned = tab === 'knowledge' ? save.shopKnowledge.indexOf(item.id) >= 0 : save.shopItems.indexOf(item.id) >= 0;
  var prereqOk = !item.prerequisite || save.shopItems.indexOf(item.prerequisite) >= 0;
  var canBuy = !owned && prereqOk && save.permanentDao >= item.cost;
  var insufficient = !owned && prereqOk && save.permanentDao < item.cost;
  var locked = !owned && !prereqOk;
  return { owned: !!owned, canBuy: !!canBuy, insufficient: !!insufficient, locked: !!locked, prereqOk: !!prereqOk };
}

function _visibleChainItems(items, ownedIds) {
  var visible = [];
  var added = {};
  items.forEach(function(item) {
    var hasDependent = items.some(function(o) { return o.prerequisite === item.id; });
    var isStandalone = !item.prerequisite && !hasDependent;
    if (isStandalone) {
      if (!added[item.id]) { visible.push(item); added[item.id] = true; }
      return;
    }
    var isEntry = !item.prerequisite || ownedIds[item.prerequisite];
    if (isEntry && !ownedIds[item.id]) {
      if (!added[item.id]) { visible.push(item); added[item.id] = true; }
    }
    if (!hasDependent && ownedIds[item.id]) {
      if (!added[item.id]) { visible.push(item); added[item.id] = true; }
    }
  });
  return visible;
}

function _isChainItem(item, allItems) {
  return item.prerequisite || allItems.some(function(o) { return o.prerequisite === item.id; });
}

function _showUpgradeModal(item, tab, save) {
  var allItems = SHOP[tab] || [];
  var prevItem = item.prerequisite ? allItems.find(function(i) { return i.id === item.prerequisite; }) : null;
  var nextItem = allItems.find(function(i) { return i.prerequisite === item.id; });
  var ownedPrev = prevItem && save.shopItems.indexOf(prevItem.id) >= 0;
  var ownedCur = save.shopItems.indexOf(item.id) >= 0;

  document.getElementById('su-icon').textContent = item.icon;
  document.getElementById('su-name').textContent = item.name;

  // Current column
  if (prevItem && ownedPrev) {
    document.getElementById('su-current-name').textContent = prevItem.name;
    document.getElementById('su-current-desc').textContent = prevItem.desc;
  } else if (prevItem) {
    document.getElementById('su-current-name').textContent = '(未解锁)';
    document.getElementById('su-current-desc').textContent = '需先购买 ' + prevItem.name;
  } else if (ownedCur) {
    document.getElementById('su-current-name').textContent = item.name;
    document.getElementById('su-current-desc').textContent = item.desc;
  } else {
    document.getElementById('su-current-name').textContent = '-';
    document.getElementById('su-current-desc').textContent = '未拥有';
  }

  // Next column
  if (ownedCur && nextItem) {
    document.getElementById('su-next-name').textContent = nextItem.name;
    document.getElementById('su-next-desc').textContent = nextItem.desc;
    item = nextItem;
  } else if (ownedCur && !nextItem) {
    document.getElementById('su-next-name').textContent = '✓ 已满级';
    document.getElementById('su-next-desc').textContent = '所有升级已完成';
  } else {
    document.getElementById('su-next-name').textContent = item.name;
    document.getElementById('su-next-desc').textContent = item.desc;
  }

  // Accumulated bonus note
  var noteEl = document.getElementById('su-effect-note');
  if (prevItem && ownedPrev) {
    noteEl.textContent = '累计加成: ' + item.desc;
    noteEl.style.display = 'block';
  } else if (ownedCur && nextItem) {
    noteEl.textContent = '累计加成: ' + nextItem.desc;
    noteEl.style.display = 'block';
  } else {
    noteEl.style.display = 'none';
  }

  var cost = (ownedCur && nextItem) ? nextItem.cost : item.cost;
  document.getElementById('su-cost').textContent = '升级消耗: ' + cost + ' 功勋';
  document.getElementById('su-balance').textContent = '当前功勋: ' + save.permanentDao;
  document.getElementById('shop-upgrade').classList.add('show');
  _shopPendingItem = { item: item, cost: cost };
}

function _renderShop(tab, save) {
  var container = document.getElementById('shop-list');
  container.innerHTML = '';
  var items = SHOP[tab] || [];

  if (tab === 'knowledge' && _shopCurrentTutor) {
    items = items.filter(function(k) { return k.tutor === _shopCurrentTutor; });
  }

  var ownedIds = {};
  if (tab === 'knowledge') save.shopKnowledge.forEach(function(id) { ownedIds[id] = true; });
  else save.shopItems.forEach(function(id) { ownedIds[id] = true; });

  if (tab === 'equipment' || tab === 'skills') {
    items = _visibleChainItems(items, ownedIds);
  }

  items.forEach(function(item) {
    var state = _shopCardState(item, tab, save);
    var isUpgrade = false;
    if (!state.owned && !state.locked && item.prerequisite && ownedIds[item.prerequisite]) isUpgrade = true;

    var stateClass = state.owned ? 'owned' : isUpgrade ? 'can-buy' : state.canBuy ? 'can-buy' : state.insufficient ? 'insufficient' : 'locked';
    var card = document.createElement('div');
    card.className = 'shop-card ' + stateClass;

    var statusText = '';
    var statusClass = '';
    if (state.owned) { statusText = '✓ 已拥有'; statusClass = 'owned'; }
    else if (isUpgrade) { statusText = '↑ 升级'; statusClass = 'upgrade'; }
    else if (state.canBuy) { statusText = '购买'; statusClass = 'upgrade'; }
    else if (state.insufficient) { var d = item.cost - save.permanentDao; statusText = '差' + d + '功勋'; statusClass = 'insufficient'; }
    else if (state.locked) { var pitem = items.find(function(x) { return x.id === item.prerequisite; }); statusText = '🔒' + (pitem ? pitem.name : '需前置'); statusClass = 'locked'; }

    card.innerHTML =
      '<div class="shop-card-icon">' + item.icon + '</div>' +
      '<div class="shop-card-name">' + item.name + '</div>' +
      '<div class="shop-card-desc">' + item.desc + '</div>' +
      '<div class="shop-card-footer">' +
      '<div class="shop-card-price">' + item.cost + '功勋</div>' +
      '<div class="shop-card-status ' + statusClass + '">' + statusText + '</div>' +
      '</div>';

    if (state.canBuy || isUpgrade) {
      card.addEventListener('click', function() {
        if ((tab === 'equipment' || tab === 'skills') && _isChainItem(item, SHOP[tab])) {
          _showUpgradeModal(item, tab, save);
        } else {
          _shopPendingItem = item;
          document.getElementById('sc-icon').textContent = item.icon;
          document.getElementById('sc-name').textContent = item.name;
          document.getElementById('sc-desc').textContent = item.desc;
          document.getElementById('sc-cost').textContent = '花费：' + item.cost + ' 功勋';
          document.getElementById('sc-remaining').textContent = '剩余：' + (save.permanentDao - item.cost) + ' 功勋';
          document.getElementById('shop-confirm').style.display = 'flex';
        }
      });
    }
    container.appendChild(card);
  });
}

function _buyItem(item, tab) {
  var save = SaveManager.load();
  if (save.permanentDao < item.cost) return;
  save.permanentDao -= item.cost;
  if (tab === 'knowledge') {
    save.shopKnowledge.push(item.id);
    if (item.effect && item.effect.tutor) SaveManager.addAffinity(item.effect.tutor, 3);
  } else {
    save.shopItems.push(item.id);
  }
  SaveManager.save(save);
  document.getElementById('shop-confirm').style.display = 'none';
  document.getElementById('shop-upgrade').classList.remove('show');
  document.getElementById('shop-dao').textContent = '功勋：' + save.permanentDao;
  soundManager.play('levelup');
  _renderShop(tab, save);
  if (tab === 'knowledge') _openKnowledgeLesson(item, save);
}

function _parseKnowledgeSections(text) {
  var sections = [];
  if (!text) return sections;
  var lines = text.split('\n');
  var currentLabel = '';
  var currentLines = [];
  function flush() {
    if (currentLines.length > 0) sections.push({ label: currentLabel, content: currentLines.join('\n') });
  }
  lines.forEach(function(line) {
    var t = line.trim();
    if (/^(识别要点|反制|典型案例|数据|法律依据|防控|效果)/.test(t)) {
      flush();
      currentLabel = t.replace(/[：:].*$/, '').trim();
      var rest = t.substring(currentLabel.length).replace(/^[：:]?\s*/, '');
      currentLines = rest ? [rest] : [];
    } else {
      if (t) currentLines.push(t);
    }
  });
  flush();
  return sections;
}

function _openKnowledgeLesson(item, save) {
  var lesson = document.getElementById('knowledge-lesson');
  lesson.style.display = 'block';
  var tutor = TUTOR_NAMES[item.effect.tutor] || '';
  document.getElementById('kl-tutor').textContent = '👨‍🏫 ' + tutor + '·私教课';
  document.getElementById('kl-title').textContent = item.icon + ' ' + item.name;
  var info = KNOWLEDGE_CARDS[item.id];
  document.getElementById('kl-info').textContent = info ? (info.title + '\n' + info.desc.split('\n')[0]) : (item.desc);

  var sectionsDiv = document.getElementById('kl-sections');
  sectionsDiv.innerHTML = '';
  if (info) {
    var sections = _parseKnowledgeSections(info.desc);
    var labelMap = { '识别要点':'🔍 识别要点', '反制':'⚔️ 反制手段', '典型案例':'📋 典型案例', '数据':'📊 数据', '法律依据':'⚖️ 法律依据', '防控':'🛡️ 防控措施', '效果':'✅ 效果' };
    sections.forEach(function(sec) {
      var block = document.createElement('div');
      block.style.cssText = 'margin-bottom:6px;padding:8px;background:#0f172a;border-radius:4px;';
      var title = document.createElement('div');
      title.style.cssText = 'font-size:10px;color:' + (labelMap[sec.label] ? '#ffd700' : '#94a3b8') + ';font-weight:900;margin-bottom:3px;';
      title.textContent = labelMap[sec.label] || sec.label;
      block.appendChild(title);
      var body = document.createElement('div');
      body.style.cssText = 'font-size:9px;color:#e2e8f0;line-height:1.6;white-space:pre-line;';
      body.textContent = sec.content;
      block.appendChild(body);
      sectionsDiv.appendChild(block);
    });
  }

  var quizData = SHOP_QUIZ[item.id];
  var quizDiv = document.getElementById('kl-quiz');
  quizDiv.innerHTML = '';
  if (!quizData) { quizDiv.innerHTML = '<div style="color:#64748b;text-align:center;font-size:11px;">已学习完毕，效果永久生效</div>'; return; }
  var bonusGiven = save.quizResults[item.id];
  quizData.q.forEach(function(q, qi) {
    var qDiv = document.createElement('div');
    qDiv.className = 'quiz-q';
    qDiv.innerHTML = '<div class="quiz-q-text">' + (qi+1) + '. ' + q.q + '</div>';
    q.a.forEach(function(opt, oi) {
      var btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = String.fromCharCode(65+oi) + '. ' + opt;
      if (bonusGiven) { btn.disabled = true; if (oi === q.c) btn.className += ' correct'; }
      btn.addEventListener('click', function() {
        if (bonusGiven) return;
        qDiv.querySelectorAll('.quiz-opt').forEach(function(b) { b.disabled = true; });
        var correct = oi === q.c;
        btn.className += correct ? ' correct' : ' wrong';
        if (!correct) qDiv.querySelectorAll('.quiz-opt')[q.c].className += ' correct';
        _checkQuizDone(item.id, quizData);
      });
      qDiv.appendChild(btn);
    });
    quizDiv.appendChild(qDiv);
  });
  if (!bonusGiven) {
    var resultDiv = document.createElement('div');
    resultDiv.id = 'qr-' + item.id;
    resultDiv.className = 'quiz-result';
    resultDiv.textContent = '完成3道测验题';
    quizDiv.appendChild(resultDiv);
  }
}

function _checkQuizDone(kid, quizData) {
  var quizDiv = document.getElementById('kl-quiz');
  var allAnswered = true;
  var correctCount = 0;
  quizData.q.forEach(function(q, qi) {
    var optDivs = quizDiv.querySelectorAll('.quiz-q:nth-child(' + (qi+1) + ') .quiz-opt');
    var answered = false;
    optDivs.forEach(function(b, oi) {
      if (b.disabled && b.className.indexOf('correct') >= 0 && oi === q.c) { correctCount++; }
      if (b.disabled) answered = true;
    });
    if (!answered) allAnswered = false;
  });
  if (!allAnswered) return;
  var save = SaveManager.load();
  if (save.quizResults[kid]) return;
  var bonus = 0;
  var affAmt = 0;
  if (correctCount === 3) { bonus = 5; affAmt = 5; }
  else if (correctCount === 2) { bonus = 2; affAmt = 2; }
  if (bonus > 0) { save.permanentDao += bonus; save.quizResults[kid] = bonus; SaveManager.save(save); }
  var sk = SHOP.knowledge.find(function(s) { return s.id === kid; });
  if (sk && sk.effect && sk.effect.tutor && affAmt > 0) SaveManager.addAffinity(sk.effect.tutor, affAmt);
  document.getElementById('shop-dao').textContent = '功勋：' + save.permanentDao;
  var resultDiv = document.getElementById('qr-' + kid);
  if (resultDiv) {
    if (correctCount === 3) resultDiv.innerHTML = '🎉 全对！+5功勋 <span style="color:#4ecca3">效果已永久激活</span>';
    else if (correctCount === 2) resultDiv.innerHTML = '👍 错1题 +2功勋 <span style="color:#4ecca3">效果已永久激活</span>';
    else resultDiv.innerHTML = '💪 继续努力，知识点已激活';
  }
}

// Confirm modal (simples)
document.getElementById('shop-confirm').addEventListener('click', function(e) {
  if (e.target.id === 'sc-cancel' || e.target === this) { document.getElementById('shop-confirm').style.display = 'none'; return; }
  if (e.target.id === 'sc-confirm' && _shopPendingItem) { _buyItem(_shopPendingItem, _shopCurrentTab); _shopPendingItem = null; }
});

// Upgrade modal
document.getElementById('su-cancel').addEventListener('click', function() {
  document.getElementById('shop-upgrade').classList.remove('show');
});
document.getElementById('su-confirm').addEventListener('click', function() {
  if (!_shopPendingItem) return;
  var save = SaveManager.load();
  var item = _shopPendingItem.item;
  var cost = _shopPendingItem.cost;
  if (save.permanentDao < cost) return;
  save.permanentDao -= cost;
  save.shopItems.push(item.id);
  SaveManager.save(save);
  document.getElementById('shop-upgrade').classList.remove('show');
  document.getElementById('shop-dao').textContent = '功勋：' + save.permanentDao;
  soundManager.play('levelup');
  _renderShop(_shopCurrentTab, SaveManager.load());
});

document.getElementById('kl-back').addEventListener('click', function() {
  document.getElementById('knowledge-lesson').style.display = 'none';
});

UI.on('shop', function () {
  var save = SaveManager.load();
  document.getElementById('shop-dao').textContent = '功勋：' + save.permanentDao;
  _shopCurrentTab = 'equipment';
  _shopCurrentTutor = null;
  var oldSub = document.getElementById('shop-sub-tabs');
  if (oldSub) oldSub.remove();
  document.querySelectorAll('.shop-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelector('.shop-tab[data-tab="equipment"]').classList.add('active');
  _renderShop('equipment', save);
});

document.querySelectorAll('.shop-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    var save = SaveManager.load();
    _shopCurrentTab = this.getAttribute('data-tab');
    _shopCurrentTutor = null;
    var oldSub = document.getElementById('shop-sub-tabs');
    if (oldSub) oldSub.remove();
    document.querySelectorAll('.shop-tab').forEach(function(t) { t.classList.remove('active'); });
    this.classList.add('active');

    if (_shopCurrentTab === 'knowledge') {
      var sub = document.createElement('div');
      sub.id = 'shop-sub-tabs';
      sub.className = 'shop-sub-tabs';
      _shopCurrentTutor = TUTOR_POOL[0].id;
      TUTOR_POOL.forEach(function(t) {
        var btn = document.createElement('button');
        btn.className = 'shop-sub-tab' + (t.id === _shopCurrentTutor ? ' active' : '');
        btn.textContent = t.icon + ' ' + t.name;
        btn.addEventListener('click', function() {
          _shopCurrentTutor = t.id;
          sub.querySelectorAll('.shop-sub-tab').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          _renderShop('knowledge', SaveManager.load());
        });
        sub.appendChild(btn);
      });
      document.getElementById('screen-shop').insertBefore(sub, document.getElementById('shop-list'));
    }
    _renderShop(_shopCurrentTab, save);
  });
});