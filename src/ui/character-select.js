UI.on('character-select', function () {
  var save = SaveManager.load();
  var current = sessionStorage.getItem('cs_current') || TUTOR_POOL[0].id;
  renderSelector(save, current);
  renderCards(save, current);
});

function renderSelector(save, currentId) {
  var el = document.getElementById('cs-selector');
  el.innerHTML = TUTOR_POOL.map(function (t) {
    var aff = save.tutorAffinity[t.id] || 0;
    var active = t.id === currentId ? ' active' : '';
    return '<div class="cs-avatar' + active + '" data-cs="' + t.id + '">' +
      '<div class="cs-avatar-circle">' + t.icon + '</div>' +
      '<span class="cs-avatar-name">' + t.name + '</span>' +
      '<span style="font-size:7px;color:#94a3b8;margin-top:1px;">' + aff + '</span>' +
    '</div>';
  }).join('');
  el.onclick = function (e) {
    var item = e.target.closest('.cs-avatar');
    if (!item) return;
    var id = item.dataset.cs;
    if (id === sessionStorage.getItem('cs_current')) return;
    sessionStorage.setItem('cs_current', id);
    document.querySelectorAll('#cs-event-card, #cs-dev-card').forEach(function (c) { c.classList.add('cs-switching'); });
    setTimeout(function () { UI.show('character-select'); }, 150);
  };
}

function renderCards(save, tutorId) {
  var tutor = TUTOR_POOL.find(function (t) { return t.id === tutorId; });
  if (!tutor) return;

  var aff = save.tutorAffinity[tutorId] || 0;

  var td = TUTOR_META[tutorId] || { age:'-', years:null, title:tutor.role, field:'缉私', trait:'-', quote:'-', story:tutor.role + '是一名缉私人员。' };

  var affLevel, affColor;
  if (aff >= 81) { affLevel = '传承'; affColor = '#ffd700'; }
  else if (aff >= 61) { affLevel = '敬佩'; affColor = '#ea80fc'; }
  else if (aff >= 41) { affLevel = '信任'; affColor = '#4ab3e0'; }
  else if (aff >= 21) { affLevel = '熟悉'; affColor = '#00e676'; }
  else { affLevel = '陌生'; affColor = '#94a3b8'; }

  var starStr = '';
  if (aff >= 81) starStr = '⭐⭐⭐⭐⭐';
  else if (aff >= 61) starStr = '⭐⭐⭐⭐';
  else if (aff >= 41) starStr = '⭐⭐⭐';
  else if (aff >= 21) starStr = '⭐⭐';
  else starStr = '⭐';

  var lvls = LEVELS.filter(function (l) { return l.tutor === tutorId; });
  var doneK = lvls.filter(function (l) { return save.completed.indexOf(l.id) >= 0; }).length;
  var totalK = lvls.length;

  var agePct = td.age === '50+' ? 85 : td.age === '55' ? 100 : td.age === '38' ? 70 : td.age === '32' ? 58 : td.age === '28' ? 50 : td.age === '25' ? 45 : 50;
  var yearsPct = td.years !== null ? Math.round(td.years / 40 * 100) : 0;
  var kPct = totalK > 0 ? Math.round(doneK / totalK * 100) : 0;

  document.getElementById('cs-event-card').innerHTML =
    '<div class="cs-card-header">' +
      '<div class="cs-card-img" style="background:linear-gradient(135deg,#0d2a50,#0a1628)">' +
        '<span class="cs-emoji">' + tutor.icon + '</span>' +
      '</div>' +
      '<div class="cs-card-info">' +
        '<div class="cs-name-row">' +
          '<span class="cs-name">' + tutor.name + '</span>' +
          '<span class="cs-title-tag">' + td.title + '</span>' +
        '</div>' +
        '<div class="cs-tags">' +
          '<span class="cs-tag cs-tag-field">' + td.field + '</span>' +
          '<span class="cs-tag cs-tag-trait">' + td.trait + '</span>' +
        '</div>' +
        '<div class="cs-stats">' +
          '<div class="cs-stat"><span class="cs-stat-label">年龄</span><div class="cs-stat-bar-wrap"><div class="cs-stat-bar"><div class="cs-stat-bar-fill" style="width:' + agePct + '%;background:#4ab3e0;"></div></div><span class="cs-stat-val">' + td.age + '</span></div></div>' +
          (td.years !== null ? '<div class="cs-stat"><span class="cs-stat-label">工龄</span><div class="cs-stat-bar-wrap"><div class="cs-stat-bar"><div class="cs-stat-bar-fill" style="width:' + yearsPct + '%;background:#00d4a0;"></div></div><span class="cs-stat-val">' + td.years + '年</span></div></div>' : '') +
          '<div class="cs-stat"><span class="cs-stat-label">知识点</span><div class="cs-stat-bar-wrap"><div class="cs-stat-bar"><div class="cs-stat-bar-fill" style="width:' + kPct + '%;background:#a090ff;"></div></div><span class="cs-stat-val">' + doneK + '/' + totalK + '</span></div></div>' +
          '<div class="cs-stat"><span class="cs-stat-label">亲密度</span><div class="cs-stat-bar-wrap"><div class="cs-stat-bar"><div class="cs-stat-bar-fill" style="width:' + aff + '%;background:#f0c040;"></div></div><span class="cs-stat-val">' + aff + '</span></div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="cs-desc">' + td.quote + '<br><span style="font-size:10px;color:#3a6aaa;">' + td.story + '</span></div>';

  var pips = '';
  for (var pi = 0; pi < 6; pi++) {
    var l = lvls[pi];
    if (!l) { pips += '<div class="cs-pip todo">-</div>'; continue; }
    var d = save.completed.indexOf(l.id) >= 0;
    pips += '<div class="cs-pip ' + (d ? 'done' : 'todo') + '" title="' + l.name + '">' + (pi + 1) + '</div>';
  }

  var progPct = Math.round((doneK / totalK * 0.5 + aff / 100 * 0.5) * 100);
  if (totalK === 0) progPct = 0;

  document.getElementById('cs-dev-card').innerHTML =
    '<div class="cs-dev-body">' +
      '<div class="cs-dev-row">' +
        '<div><p class="cs-dev-label">知识点</p><div class="cs-pips">' + pips + '</div></div>' +
        '<div><p class="cs-dev-label">亲密度</p><p class="cs-dev-value" style="color:' + affColor + ';">' + affLevel + ' ' + starStr + '<br><span style="font-size:9px;color:#5a8ab0;">' + aff + '/100</span></p></div>' +
        '<div><p class="cs-dev-label">领域</p><p class="cs-dev-value">' + td.field + '</p></div>' +
      '</div>' +
      '<div class="cs-prog-wrap">' +
        '<p class="cs-dev-label">总体培养进度</p>' +
        '<div class="cs-prog-track"><div class="cs-prog-fill" style="width:' + progPct + '%;"></div></div>' +
        '<div class="cs-prog-labels"><span class="cs-prog-label">0%</span><span class="cs-prog-label center">' + progPct + '%</span><span class="cs-prog-label">100%</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="cs-action"><button class="cs-btn" id="cs-quiz-btn">📝 开始测验</button></div>';

  document.getElementById('cs-quiz-btn').onclick = function () {
    soundManager.play('click');
    _startTutorQuiz(tutorId);
  };

  requestAnimationFrame(function () {
    document.getElementById('cs-event-card').classList.remove('cs-switching');
    document.getElementById('cs-dev-card').classList.remove('cs-switching');
  });
}

var TUTOR_META = {
  linrui: {
    age: '50+', years: 28, title: '水客识别专家', field: '通关走私', trait: '眼神锐利',
    quote: '"先看鞋，再看脸，最后看行李"',
    story: '林锐在口岸工作了28年，独创的"三步观察法"让无数水客无所遁形。曾凭鞋底红土识破未申报名表。'
  },
  chenfeng: {
    age: '32', years: null, title: '缉毒先锋', field: '毒品查缉', trait: '善于伪装',
    quote: '"毒贩不会写在脸上"',
    story: '陈锋乔装地勤连续跟踪72小时，凌晨收网查获5公斤海洛因，手腕刀疤来自那次抓捕。'
  },
  zhaohai: {
    age: '38', years: 15, title: '海上猎手', field: '海上缉私', trait: '皮肤黝黑',
    quote: '"海上的风比走私分子的话更真实"',
    story: '赵海在海上缉私15年，风浪中追3小时拦截改装快艇，夹层藏千万冻品。'
  },
  baiwei: {
    age: '28', years: null, title: '防疫卫士', field: '防疫检疫', trait: '温柔坚定',
    quote: '"国门第一道防线，不能从我这里失守"',
    story: '白薇疫情期间连续200多天没回家，按流程排查确诊新冠病例，手机屏保是父母和猫。'
  },
  laozhou: {
    age: '55', years: 37, title: '守岛人', field: '加工贸易', trait: '腰板挺直',
    quote: '"岛很小，但责任很大"',
    story: '老周18岁主动上岛，一守37年。用查船机器人将监管半径从3公里拓展到25公里。'
  },
  xiaohui: {
    age: '25', years: null, title: '缉私烈士', field: '综合缉私', trait: '阳光笑脸',
    quote: '"平安归来，是对家人最大的责任"',
    story: '小辉在追缉中坚守岗位控制方向，壮烈牺牲。他的《缉私手册》扉页写着"平安归来"。'
  }
};

function _startTutorQuiz(tutorId) {
  var allQ = [];
  LEVELS.forEach(function (lvl) {
    if (lvl.tutor !== tutorId) return;
    var qz = SHOP_QUIZ[lvl.id];
    if (qz) qz.q.forEach(function (q) { allQ.push(q); });
  });
  if (allQ.length === 0) return;

  var picked = [];
  var pool = allQ.slice();
  for (var i = 0; i < 3 && pool.length > 0; i++) {
    var idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }

  var tutor = TUTOR_POOL.find(function (t) { return t.id === tutorId; });
  var overlay = document.getElementById('tutor-quiz-overlay');
  var body = document.getElementById('tutor-quiz-body');
  overlay.style.display = 'flex';
  document.getElementById('tq-x').onclick = function () { overlay.style.display = 'none'; };
  body.innerHTML = '<div style="font-size:14px;font-weight:700;color:#ffd700;margin-bottom:8px;text-align:center;">' + tutor.icon + ' ' + tutor.name + ' 测验</div>';

  var selections = [];
  var qDivs = [];
  picked.forEach(function (q, qi) {
    selections.push(-1);
    var qDiv = document.createElement('div');
    qDiv.style.cssText = 'margin-bottom:10px;';
    var qText = document.createElement('div');
    qText.style.cssText = 'font-size:11px;color:#e2e8f0;margin-bottom:4px;';
    qText.textContent = (qi + 1) + '. ' + q.q;
    qDiv.appendChild(qText);
    q.a.forEach(function (opt, oi) {
      var btn = document.createElement('button');
      btn.textContent = String.fromCharCode(65 + oi) + '. ' + opt;
      btn.style.cssText = 'display:block;width:100%;background:transparent;border:1px solid #475569;border-radius:4px;padding:4px 8px;font-size:10px;color:#e2e8f0;cursor:pointer;margin:2px 0;font-family:inherit;text-align:left;';
      btn.addEventListener('click', function () {
        qDiv.querySelectorAll('button').forEach(function (b) { b.style.background = 'transparent'; b.style.color = '#e2e8f0'; });
        btn.style.background = '#3b82f6';
        btn.style.color = '#fff';
        selections[qi] = oi;
      });
      qDiv.appendChild(btn);
    });
    qDivs.push(qDiv);
    body.appendChild(qDiv);
  });

  var submitBtn = document.createElement('button');
  submitBtn.textContent = '提交答案';
  submitBtn.style.cssText = 'display:block;width:100%;background:#00c853;border:none;border-radius:4px;padding:6px 0;font-size:12px;font-weight:700;color:#fff;cursor:pointer;font-family:inherit;margin-top:4px;';
  submitBtn.addEventListener('click', function () {
    if (submitBtn.disabled) return;
    var correct = 0;
    picked.forEach(function (q, qi) {
      var btns = qDivs[qi].querySelectorAll('button');
      btns.forEach(function (b) { b.disabled = true; });
      var sel = selections[qi];
      btns.forEach(function (b, oi) {
        if (oi === q.c) { b.style.background = '#00c853'; b.style.color = '#fff'; }
        else if (oi === sel && sel !== q.c) { b.style.background = '#ff1744'; b.style.color = '#fff'; }
      });
      if (sel === q.c) correct++;
    });
    submitBtn.disabled = true;
    submitBtn.style.background = '#475569';
    submitBtn.style.color = '#ffd700';
    submitBtn.textContent = '亲密度 +' + correct;
    var save2 = SaveManager.load();
    save2.tutorAffinity[tutorId] = Math.min(100, (save2.tutorAffinity[tutorId] || 0) + correct);
    SaveManager.save(save2);
    soundManager.play('click');
    document.getElementById('tq-x').onclick = function () { overlay.style.display = 'none'; UI.show('character-select'); };
  });
  body.appendChild(submitBtn);
}
