UI.on('cycle-summary', function (data) {
  var r = data.result;
  var isPassed = r.success;
  var save = SaveManager.load();

  document.getElementById('cs-title').textContent = isPassed ? '🎉 第 ' + r.cycle + ' 周期 · 突破成功！' : '💔 第 ' + r.cycle + ' 周期 · 重置';
  document.getElementById('cs-title').style.color = isPassed ? '#ffd700' : '#e94560';
  document.getElementById('cs-passrate').textContent = '通关 ' + r.passed + '/' + r.total + ' · ' + Math.round(r.passed / r.total * 100) + '%';
  document.getElementById('cs-passrate').style.color = isPassed ? '#4ecca3' : '#ff4444';

  var cond = document.getElementById('cs-condition');
  cond.style.display = 'block';
  if (isPassed) {
    cond.textContent = '✅ 周期成绩：' + r.passed + '/' + r.total + ' 通过（≥6关通过）';
    cond.style.color = '#4ecca3';
  } else {
    cond.textContent = '❌ 周期成绩：' + r.passed + '/' + r.total + ' 通过（需≥60%）';
    cond.style.color = '#ff4444';
  }

  var loss = document.getElementById('cs-loss');
  if (!isPassed && r.lostDao > 0) {
    loss.textContent = '⚠️ 失去周期功勋：' + r.lostDao;
    loss.style.display = 'block';
  } else if (isPassed && r.convertedDao > 0) {
    loss.textContent = '💰 周期功勋 +' + r.convertedDao + '（已转为永久）';
    loss.style.color = '#4ecca3';
    loss.style.display = 'block';
  } else {
    loss.style.display = 'none';
  }

  var retained = '';
  var parts = [];
  if (save.permanentDao > 0) parts.push('永久功勋:' + save.permanentDao);
  if (save.echoSkills.length > 0) parts.push('直觉:' + save.echoSkills.length + '个');
  if (save.fragments.length > 0) parts.push('碎片:' + save.fragments.length + '个');
  if (save.shopItems && save.shopItems.length > 0) parts.push('已购商品:' + save.shopItems.length + '件');
  retained = parts.length > 0 ? '💾 保留：' + parts.join(' | ') : '💾 所有记忆已重置...';
  document.getElementById('cs-retained').textContent = retained;
  document.getElementById('cs-dao').textContent = '永久功勋：' + save.permanentDao;

  // Echo unlock display
  var echoArea = document.getElementById('cs-echo-area');
  echoArea.innerHTML = '';
  if (isPassed && r.newEcho) {
    var ec = document.createElement('div');
    ec.className = 'cs-echo-card';
    ec.innerHTML =
      '<div class="cs-echo-icon">' + r.newEcho.icon + '</div>' +
      '<div><div class="cs-echo-name">🎁 ' + r.newEcho.name + '</div><div class="cs-echo-desc">' + (r.newEcho.desc || '新直觉已解锁') + '</div></div>';
    echoArea.appendChild(ec);
  }

  // Action buttons
  var actionArea = document.getElementById('cs-action-area');
  actionArea.innerHTML = '';
  var mainBtn = document.createElement('button');
  mainBtn.className = 'cs-btn';
  mainBtn.textContent = isPassed ? '继续下一周期 ▶' : '重新挑战 ↻';
  mainBtn.style.background = isPassed ? '#4ecca3' : '#ff9100';
  mainBtn.onclick = function () { soundManager.play('click'); UI.show('menu'); };
  actionArea.appendChild(mainBtn);
});
