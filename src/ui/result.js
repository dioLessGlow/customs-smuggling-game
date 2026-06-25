UI.on('result', function (data) {
  var width = 390, height = 844;
  var r = data;
  var score = r.score || 0;
  var correct = r.correct || 0;
  var wrong = r.wrong || 0;
  var passed = r.passed;
  var dao = r.dao || 0;
  var combo = r.combo || 0;
  var required = r.required || 4;

  var stars = 0;
  if (passed) {
    if (correct >= required + 1) stars = 3;
    else if (correct >= required) stars = 2;
    else stars = 1;
  }

  document.getElementById('result-title').textContent = passed ? '关卡通过' : '关卡失败';
  document.getElementById('result-title').style.color = passed ? '#00e676' : '#ff4444';
  document.getElementById('result-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('result-score').textContent = score;
  document.getElementById('result-dao').textContent = '+' + dao;
  document.getElementById('result-correct').textContent = correct;
  document.getElementById('result-wrong').textContent = wrong;
  document.getElementById('result-combo').textContent = combo;

  var echoSpan = document.getElementById('result-echo');
  var save = SaveManager.load();
  if (save.echoSkills.length > 0) {
    var echos = save.echoSkills.map(function (id) {
      var e = ECHO_POOL.find(function (x) { return x.id === id; });
      return e ? e.icon : '';
    }).join(' ');
    echoSpan.textContent = '已激活直觉：' + echos;
    echoSpan.style.display = 'block';
  } else {
    echoSpan.style.display = 'none';
  }

  var sceneKey = r.sceneKey || 'GenericLevelScene';

  document.getElementById('result-retry').onclick = function () {
    soundManager.play('click');
    UI.hide();
    document.getElementById('phaser-container').style.display = 'block';
    game.scene.start(sceneKey, { levelId: r.levelId });
  };

  // Next level button
  var nextBtn = document.getElementById('result-next');
  var levelIdx = LEVELS.findIndex(function (l) { return l.id === r.levelId; });
  var hasNext = levelIdx >= 0 && levelIdx < LEVELS.length - 1 && LEVELS[levelIdx].tutor === LEVELS[levelIdx + 1].tutor;
  if (passed && hasNext) {
    var nextId = LEVELS[levelIdx + 1].id;
    nextBtn.style.display = '';
    nextBtn.onclick = function () {
      soundManager.play('click');
      UI.hide();
      document.getElementById('phaser-container').style.display = 'block';
      game.scene.start(sceneKey, { levelId: nextId });
    };
  } else {
    nextBtn.style.display = 'none';
  }

  document.getElementById('result-map').onclick = function () {
    soundManager.play('click');
    UI.show('level-select');
  };

  // 知识卡片（通关后显示）
  if (passed && KNOWLEDGE_CARDS[r.levelId]) {
    var kc = KNOWLEDGE_CARDS[r.levelId];
    document.getElementById('kc-title').textContent = kc.title;
    document.getElementById('kc-desc').textContent = kc.desc;
    document.getElementById('knowledge-overlay').style.display = 'flex';
  } else {
    document.getElementById('knowledge-overlay').style.display = 'none';
  }

  if (FRAGMENTS[r.levelId] && passed) {
    document.getElementById('frag-text').textContent = FRAGMENTS[r.levelId];
    document.getElementById('frag-overlay').style.display = 'flex';
  } else {
    document.getElementById('frag-overlay').style.display = 'none';
  }

  if (passed) soundManager.play('levelup');
});

document.getElementById('knowledge-overlay').addEventListener('click', function () {
  document.getElementById('knowledge-overlay').style.display = 'none';
});

document.getElementById('frag-overlay').addEventListener('click', function () {
  document.getElementById('frag-overlay').style.display = 'none';
});
