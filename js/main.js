/* نقطة التشغيل: ينشئ اللعبة ويدير حالات الشاشات (قائمة / لعب / إيقاف / نتيجة) */
window.SA = window.SA || {};

SA.App = {
  mode: 'menu', // menu | playing | paused | result
  game: null,
  character: 'boy', // boy | girl

  setCharacter: function (ch) {
    if (ch !== 'boy' && ch !== 'girl') return;
    this.character = ch;
    try { localStorage.setItem('sa_character', ch); } catch (e) { /* */ }
    // تحديث الشخصية الظاهرة خلف شاشة البداية
    if (this.mode === 'menu' && this.game && this.game.scene.isActive('Game')) this.freshLevel();
  },

  init: function () {
    var self = this;
    if (!window.Phaser) {
      document.getElementById('loadError').hidden = false;
      document.getElementById('menu').hidden = true;
      return;
    }
    try {
      var saved = localStorage.getItem('sa_character');
      if (saved === 'boy' || saved === 'girl') this.character = saved;
    } catch (e) { /* */ }
    SA.UI.init(this);
    SA.Input.init({
      onPause: function () { self.togglePause(); },
      onKeyboardUsed: function () { if (SA.UI.keyboardUsed) SA.UI.keyboardUsed(); },
      isPlaying: function () { return self.mode === 'playing'; },
      onConfirm: function () {
        if (SA.UI.isBoardOpen()) { SA.UI.closeBoard(); return true; }
        if (self.mode === 'menu') { SA.UI.tryStart(self); return true; }
        if (self.mode === 'result') { self.restartLevel(); return true; }
        if (self.mode === 'paused') { self.resume(); return true; }
        return false;
      }
    });

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: SA.WIDTH,
      height: SA.HEIGHT,
      backgroundColor: '#8fd0ee',
      pixelArt: true,
      roundPixels: true,
      input: { keyboard: false },
      physics: { default: 'arcade', arcade: { gravity: { y: SA.CONFIG.gravity }, debug: false } },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [SA.BootScene, SA.GameScene]
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && self.mode === 'playing') self.pause();
    });
    window.addEventListener('blur', function () {
      if (self.mode === 'playing') self.pause();
    });
  },

  // عند ظهور/اختفاء أزرار اللمس يتعدل موضع الكاميرا
  onTouchModeChange: function (on) {
    var g = this.game && this.game.scene.getScene('Game');
    if (g && g.sys.isActive() && g.setTouchView) g.setTouchView(on);
  },

  onReady: function () {
    document.documentElement.classList.add('ready');
  },

  // يعيد تشغيل المرحلة من بدايتها (قلوب كاملة وعملات صفر)
  freshLevel: function () {
    var sm = this.game.scene;
    sm.stop('Game');
    sm.start('Game');
  },

  start: function () {
    SA.Sound.unlock();
    SA.Input.clear();
    this.mode = 'playing';
    this.freshLevel();
    SA.UI.show(null);
  },

  restartLevel: function () {
    this.start();
  },

  pause: function () {
    if (this.mode !== 'playing') return;
    this.mode = 'paused';
    this.game.scene.pause('Game');
    SA.Input.clear();
    SA.UI.show('pause');
  },

  resume: function () {
    if (this.mode !== 'paused') return;
    SA.Input.clear();
    this.mode = 'playing';
    this.game.scene.resume('Game');
    SA.UI.show(null);
  },

  togglePause: function () {
    if (this.mode === 'playing') this.pause();
    else if (this.mode === 'paused') this.resume();
  },

  toMenu: function () {
    this.mode = 'menu';
    SA.Input.clear();
    this.freshLevel();
    SA.UI.show('menu');
  },

  onWin: function (data) {
    if (this.mode !== 'playing') return;
    this.mode = 'result';
    data.character = this.character;
    SA.UI.showResult(true, data);
  },

  onGameOver: function (data) {
    if (this.mode !== 'playing') return;
    this.mode = 'result';
    data.character = this.character;
    SA.UI.showResult(false, data);
  }
};

window.addEventListener('load', function () { SA.App.init(); });
