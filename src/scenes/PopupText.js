class PopupText extends Phaser.GameObjects.Text {
  constructor(scene, x, y, text, color, size) {
    color = color || '#ffffff';
    size = size || 28;
    super(scene, x, y, text, {
      fontSize: size + 'px',
      fontFamily: 'Arial Black, "PingFang SC", sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    });
    scene.add.existing(this);
    this.setOrigin(0.5);
    scene.tweens.add({
      targets: this, y: y - 60, scale: 1.3, alpha: 0, duration: 800, ease: 'Power2',
      onComplete: () => this.destroy()
    });
  }
}
