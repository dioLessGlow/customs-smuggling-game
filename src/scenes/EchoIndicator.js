class EchoIndicator {
  constructor(scene, x, y) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.bg = scene.add.rectangle(0, 0, 180, 36, 0x000000, 0.7).setStrokeStyle(1, 0xffd700);
    this.icon = scene.add.text(-75, 0, '', { fontSize: '18px' }).setOrigin(0.5);
    this.name = scene.add.text(-45, 0, '', { fontSize: '13px', color: '#ffd700', fontFamily:'Arial Black, sans-serif' }).setOrigin(0, 0.5);
    this.container.add([this.bg, this.icon, this.name]);
    this.container.setAlpha(0);
  }

  show(echo) {
    if (!echo) return;
    this.icon.setText(echo.icon);
    this.name.setText(echo.name);
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 200 });
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({ targets: this.container, alpha: 0, duration: 300 });
    });
  }

  hide() {
    this.container.setAlpha(0);
  }
}
