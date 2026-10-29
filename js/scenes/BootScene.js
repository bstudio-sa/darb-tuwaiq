/* مشهد التحميل: يولّد الرسومات ثم يشغّل المرحلة خلف شاشة البداية */
window.SA = window.SA || {};

if (window.Phaser) {
SA.BootScene = class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // لإضافة رسومات PNG احترافية لاحقًا:
    // this.load.image('t_sand', 'assets/sand.png');
  }

  create() {
    SA.Art.generate(this);
    this.scene.start('Game');
    if (SA.App && SA.App.onReady) SA.App.onReady();
  }
};
}
