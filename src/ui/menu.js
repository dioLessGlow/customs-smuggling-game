UI.on('menu', function () {
  var save = SaveManager.load();
  var tutor = save.chosenCharacterId ? TUTOR_POOL.find(function (t) { return t.id === save.chosenCharacterId; }) : null;
  var cname = tutor && save.tutorNames && save.tutorNames[tutor.id] || (tutor && tutor.name) || '';
  var charTitle = tutor ? tutor.icon + ' ' + cname : '未选择角色';
  var charSub = tutor ? tutor.role : '点击选择';
  document.getElementById('menu-cycle').textContent = '第 ' + save.currentCycle + ' 周期  |  功勋：' + save.permanentDao;
  document.getElementById('menu-char-title').textContent = charTitle;
  document.getElementById('menu-char-sub').textContent = charSub;
  // highest tutor affinity
  var maxAff = 0; var maxName = '';
  TUTOR_POOL.forEach(function(t) {
    var a = save.tutorAffinity[t.id] || 0;
    if (a > maxAff) { maxAff = a; maxName = t.name; }
  });
  var affEl = document.getElementById('menu-affinity');
  if (!affEl) {
    affEl = document.createElement('div');
    affEl.id = 'menu-affinity';
    affEl.style.cssText = 'font-size:9px;color:#94a3b8;text-align:center;margin-top:2px;';
    document.querySelector('#screen-menu .game-info').after(affEl);
  }
  affEl.textContent = maxName ? '导师亲密度：' + maxName + ' ' + maxAff : '';
});