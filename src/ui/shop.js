var _shopCurrentTab = 'equipment';
var _shopPendingItem = null;
var _shopCurrentTutor = null;
var _shopCurrentFloor = 1;
var _shopIsMoving = false;

var _floorMap = {
  '1': { tab: 'shop', label: '我的小店', icon: '🏪' },
  '2': { tab: 'equipment', label: '装备库', icon: '🔧' },
  '3': { tab: 'skills', label: '训练室', icon: '💪' },
  '4': { tab: 'intuitions', label: '灵感室', icon: '🧠' },
  '5': { tab: 'knowledge', label: '知识殿堂', icon: '📚' }
};

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
  var container = document.getElementById('sfpGrid');
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
  if (document.getElementById('shopFloorPage').style.display === 'flex') {
    document.getElementById('sfpDao').textContent = '功勋：' + save.permanentDao;
  }
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
      block.style.cssText = 'margin-bottom:6px;padding:6px;background:#fff;border:1px solid #e0d5c0;border-radius:4px;';
      var title = document.createElement('div');
      title.style.cssText = 'font-size:9px;color:' + (labelMap[sec.label] ? '#8b5e3c' : '#8b5e3c') + ';font-weight:900;margin-bottom:2px;';
      title.textContent = labelMap[sec.label] || sec.label;
      block.appendChild(title);
      var body = document.createElement('div');
      body.style.cssText = 'font-size:8px;color:#3c1e0e;line-height:1.6;white-space:pre-line;';
      body.textContent = sec.content;
      block.appendChild(body);
      sectionsDiv.appendChild(block);
    });
  }

  var quizData = SHOP_QUIZ[item.id];
  var quizDiv = document.getElementById('kl-quiz');
  quizDiv.innerHTML = '';
  if (!quizData) { quizDiv.innerHTML = '<div style="color:#8b5e3c;text-align:center;font-size:10px;">已学习完毕，效果永久生效</div>'; return; }
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
    if (correctCount === 3) resultDiv.innerHTML = '🎉 全对！+5功勋 <span style="color:#155724">效果已永久激活</span>';
    else if (correctCount === 2) resultDiv.innerHTML = '👍 错1题 +2功勋 <span style="color:#155724">效果已永久激活</span>';
    else resultDiv.innerHTML = '💪 继续努力，知识点已激活';
  }
}

// -- Elevator functions --

function _showFloor(floorNum) {
  if (_shopIsMoving) return;
  if (floorNum === _shopCurrentFloor) return;
  _shopIsMoving = true;
  var save = SaveManager.load();
  var targetData = _floorMap[String(floorNum)];
  var currentData = _floorMap[String(_shopCurrentFloor)];
  if (!targetData) { _shopIsMoving = false; return; }
  var direction = floorNum > _shopCurrentFloor ? 'up' : 'down';

  var cabin = document.getElementById('elevatorCabin');
  var display = document.getElementById('floorDisplay');
  var indicator = document.getElementById('elevatorIndicator');
  var navBtns = document.querySelectorAll('.elevator-nav a');

  navBtns.forEach(function(b) { b.classList.remove('focus'); });
  navBtns.forEach(function(b) {
    if (parseInt(b.dataset.floor) === floorNum) b.classList.add('focus');
  });

  indicator.classList.remove('up', 'down');
  indicator.classList.add(direction);

  cabin.classList.remove('open');

  var travelTime = Math.max(500, Math.abs(floorNum - _shopCurrentFloor) * 350);

  setTimeout(function() {
    _animateFloorNumber(_shopCurrentFloor, floorNum, travelTime);

    setTimeout(function() {
      _shopCurrentFloor = floorNum;
      display.textContent = floorNum;
      _shopCurrentTab = targetData.tab;
      _shopCurrentTutor = null;

      var oldSub = document.getElementById('shop-sub-tabs');
      if (oldSub) oldSub.remove();

      navBtns.forEach(function(b) { b.classList.remove('active', 'focus'); });
      navBtns.forEach(function(b) {
        if (parseInt(b.dataset.floor) === floorNum) b.classList.add('active');
      });

      cabin.classList.add('open');
      indicator.classList.remove('up', 'down');

      setTimeout(function() {
        _shopIsMoving = false;
        if (floorNum === 1) {
          _goToExterior();
        } else {
          _showFloorPage(floorNum, targetData, save);
        }
      }, 600);
    }, travelTime);
  }, 600);
}

function _showFloorPage(floorNum, targetData, save) {
  var elevator = document.getElementById('shop-elevator');
  elevator.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
  elevator.style.transform = 'scale(1.1)';
  elevator.style.opacity = '0';
  var page = document.getElementById('shopFloorPage');
  page.style.display = 'flex';
  page.style.transform = 'scale(1.1)';
  page.style.opacity = '0';
  page.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
  setTimeout(function() {
    elevator.style.display = 'none';
    elevator.style.transform = 'scale(1)';
    elevator.style.opacity = '1';
    page.style.transform = 'scale(1)';
    page.style.opacity = '1';
  }, 350);
  var oldSub = document.getElementById('shop-sub-tabs');
  if (oldSub) oldSub.remove();
  document.getElementById('sfpLabel').textContent = targetData.label;
  document.getElementById('sfpDao').textContent = '功勋：' + save.permanentDao;
  if (targetData.tab === 'knowledge' && !_shopCurrentTutor) _shopCurrentTutor = TUTOR_POOL[0].id;
  if (targetData.tab === 'knowledge' && TUTOR_POOL.every(function(t){return t.id!==_shopCurrentTutor})) _shopCurrentTutor = TUTOR_POOL[0].id;
  _saveShopState();
  _renderShop(targetData.tab, save);

  if (targetData.tab === 'knowledge') {
    var sub = document.createElement('div');
    sub.id = 'shop-sub-tabs';
    sub.className = 'shop-sub-tabs';
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
    var grid = document.getElementById('sfpGrid');
    page.insertBefore(sub, grid);
  }
}

document.getElementById('sfpBack').addEventListener('click', function() {
  var page = document.getElementById('shopFloorPage');
  var elevator = document.getElementById('shop-elevator');
  elevator.style.display = 'flex';
  elevator.style.transform = 'scale(1.1)';
  elevator.style.opacity = '0';
  elevator.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
  document.getElementById('elevatorCabin').classList.remove('open');
  page.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
  page.style.transform = 'scale(1.1)';
  page.style.opacity = '0';
  setTimeout(function() {
    page.style.display = 'none';
    page.style.transform = 'scale(1)';
    page.style.opacity = '1';
    elevator.style.transform = 'scale(1)';
    elevator.style.opacity = '1';
  }, 350);
  var navBtns = document.querySelectorAll('.elevator-nav a');
  navBtns.forEach(function(b) { b.classList.remove('active'); });
  navBtns.forEach(function(b) {
    if (parseInt(b.dataset.floor) === _shopCurrentFloor) b.classList.add('active');
  });
  document.getElementById('floorDisplay').textContent = String(_shopCurrentFloor);
  document.getElementById('elevatorIndicator').className = 'indicator';
});

function _saveShopState() {
  try { sessionStorage.setItem('shop_floor', String(_shopCurrentFloor)); } catch(e) {}
  try { sessionStorage.setItem('shop_tab', _shopCurrentTab); } catch(e) {}
  try { sessionStorage.setItem('shop_tutor', _shopCurrentTutor || ''); } catch(e) {}
}
function _clearShopState() {
  try { sessionStorage.removeItem('shop_floor'); } catch(e) {}
  try { sessionStorage.removeItem('shop_tab'); } catch(e) {}
  try { sessionStorage.removeItem('shop_tutor'); } catch(e) {}
}

function _goToExterior() {
  document.getElementById('shopFloorPage').style.display = 'none';
  document.getElementById('shop-elevator').style.display = 'none';
  document.getElementById('elevatorCabin').classList.remove('open');
  _clearShopState();
  var ex = document.getElementById('shop-exterior');
  ex.style.display = 'flex';
  ex.style.opacity = '1';
  ex.style.transform = 'scale(1)';
  ex.style.transition = 'none';
}

function _animateFloorNumber(from, to, duration) {
  var display = document.getElementById('floorDisplay');
  var startTime = Date.now();
  var diff = to - from;
  function update() {
    var elapsed = Date.now() - startTime;
    var progress = Math.min(elapsed / duration, 1);
    var current = Math.round(from + diff * progress);
    display.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
  }
  update();
}

// -- Entry point --

UI.on('shop', function (data) {
  var savedFloor = null;
  try { savedFloor = parseInt(sessionStorage.getItem('shop_floor')); } catch(e) {}
  if (savedFloor && savedFloor > 1) {
    document.getElementById('shop-exterior').style.display = 'none';
    document.getElementById('shop-elevator').style.display = 'none';
    document.getElementById('shopFloorPage').style.display = 'none';
    var save = SaveManager.load();
    _shopCurrentFloor = savedFloor;
    _shopCurrentTab = _floorMap[String(savedFloor)].tab;
    _shopCurrentTutor = null;
    try { var st = sessionStorage.getItem('shop_tutor'); if (st) _shopCurrentTutor = st; } catch(e) {}
    _shopIsMoving = false;
    document.getElementById('floorDisplay').textContent = String(savedFloor);
    document.getElementById('elevatorIndicator').className = 'indicator';
    var navBtns = document.querySelectorAll('.elevator-nav a');
    navBtns.forEach(function(b) { b.classList.remove('active'); });
    navBtns.forEach(function(b) {
      if (parseInt(b.dataset.floor) === savedFloor) b.classList.add('active');
    });
    var targetData = _floorMap[String(savedFloor)];
    _showFloorPage(savedFloor, targetData, save);
    return;
  }
  _clearShopState();
  var ex = document.getElementById('shop-exterior');
  ex.style.display = 'flex';
  ex.style.opacity = '1';
  ex.style.transform = 'scale(1)';
  ex.style.transition = 'none';
  document.getElementById('shop-elevator').style.display = 'none';
  document.getElementById('shopFloorPage').style.display = 'none';
  var save = SaveManager.load();
  _shopCurrentFloor = 1;
  _shopCurrentTutor = null;
  _shopIsMoving = false;
  var oldSub = document.getElementById('shop-sub-tabs');
  if (oldSub) oldSub.remove();
  var wrap = document.querySelector('.shop-exterior .scene-wrap');
  wrap.style.transform = 'scale(1.7)';
});

document.getElementById('shopEnterBtn').addEventListener('click', function () {
  var exterior = document.getElementById('shop-exterior');
  exterior.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
  exterior.style.transform = 'scale(1.2)';
  exterior.style.opacity = '0';
  setTimeout(function () {
    exterior.style.display = 'none';
    exterior.style.transform = 'scale(1)';
    var elevator = document.getElementById('shop-elevator');
    elevator.style.display = 'flex';
    elevator.style.transform = 'scale(0.85)';
    elevator.style.opacity = '0';
    elevator.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
    requestAnimationFrame(function() {
      elevator.style.transform = 'scale(1)';
      elevator.style.opacity = '1';
    });
    document.getElementById('elevatorCabin').classList.remove('open');
    var navBtns = document.querySelectorAll('.elevator-nav a');
    navBtns.forEach(function(b) { b.classList.remove('active'); });
    navBtns.forEach(function(b) {
      if (parseInt(b.dataset.floor) === 1) b.classList.add('active');
    });
    _shopCurrentFloor = 1;
    _shopCurrentTab = 'shop';
    _shopCurrentTutor = null;
    document.getElementById('floorDisplay').textContent = '1';
    document.getElementById('elevatorIndicator').className = 'indicator';
  }, 350);
});

// Elevator nav click
document.querySelectorAll('.elevator-nav a').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    var floor = parseInt(this.dataset.floor);
    if (floor === 1) {
      _goToExterior();
      return;
    }
    var elevator = document.getElementById('shop-elevator');
    if (elevator.style.display !== 'flex') {
      elevator.style.display = 'flex';
      document.getElementById('shopFloorPage').style.display = 'none';
    }
    _showFloor(floor);
  });
});

// Confirm modal
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
