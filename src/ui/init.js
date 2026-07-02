// 导航按钮绑定
document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-nav]');
  if (!btn) return;
  soundManager.play('click');
  UI.show(btn.dataset.nav);
});

// 事件监听（Phaser → UI）
window.addEventListener('game:levelEnd', function (e) {
  UI.show('result', e.detail);
});
window.addEventListener('game:cycleEnd', function (e) {
  UI.show('cycle-summary', e.detail);
});

// 首次用户交互解锁音频
var _audioUnlocked = false;
document.addEventListener('pointerdown', function __unlockAudio() {
  if (_audioUnlocked) return;
  _audioUnlocked = true;
  soundManager.unlock();
  document.removeEventListener('pointerdown', __unlockAudio);
});

// 启动
var dpr = Math.min(window.devicePixelRatio || 1, 2);
TidesBg.init(390, 844, dpr);
var tideCanvas = TidesBg.getCanvas();
tideCanvas.style.position = 'absolute';
tideCanvas.style.top = '0';
tideCanvas.style.left = '0';
tideCanvas.style.width = '390px';
tideCanvas.style.height = '844px';
tideCanvas.style.zIndex = '0';
tideCanvas.style.pointerEvents = 'none';
document.getElementById('app').insertBefore(tideCanvas, document.getElementById('app').firstChild);

var game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 390, height: 844,
  parent: 'phaser-container',
  transparent: true,
  audio: { noAudio: true },
  render: { roundPixels: true, antialias: false, pixelArt: true, resolution: dpr },
  scale: { mode: Phaser.Scale.NONE },
  scene: []
});
game.scene.add('GenericLevelScene', GenericLevelScene, false);
game.scene.add('RatScene', RatScene, false);
game.scene.add('TigerScene', TigerScene, false);
game.scene.add('SnakeScene', SnakeScene, false);
window.game = game;

function tideLoop() {
  TidesBg.update();
  var app = document.getElementById('app');
  var luma = TidesBg.getCurrentLuminance();
  app.classList.toggle('bg-light', luma > 0.5);
  var txt = TidesBg.getTextColors();
  app.style.setProperty('--txt-primary', txt.primary);
  app.style.setProperty('--txt-secondary', txt.secondary);
  app.style.setProperty('--txt-shadow', txt.shadow);
  requestAnimationFrame(tideLoop);
}
tideLoop();

fitApp();
window.addEventListener('resize', function () { setTimeout(fitApp, 200); });
SaveManager.checkDailyLogin();

// 自动保存
function _doAutoSave() {
  try {
    var s = SaveManager.load();
    if (s && s.settings && s.settings.auto_save !== false) {
      SaveManager.save(s);
    }
  } catch(e) {}
}
setInterval(_doAutoSave, 30000);
document.addEventListener('visibilitychange', function() {
  if (document.hidden) _doAutoSave();
});
window.addEventListener('beforeunload', _doAutoSave);

var saved = null;
try { saved = sessionStorage.getItem('ui_screen'); } catch (e) {}
if (saved && saved !== 'boot') {
  UI.show(saved);
} else {
  UI.show('boot');
  setTimeout(function () { UI.show('menu'); }, 1200);
}
