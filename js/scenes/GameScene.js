/* مشهد اللعب: يبني المرحلة من بيانات level1.js ويدير الفيزياء والتصادمات */
window.SA = window.SA || {};

if (window.Phaser) {
SA.GameScene = class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    var T = SA.TILE;
    this.L = SA.Levels.level1;
    this.cfg = SA.CONFIG;
    this.worldW = this.L.width * T;
    this.worldH = SA.ROWS * T;

    // حالة اللعب
    this.coins = 0;
    this.lives = this.cfg.lives;
    this.dead = false;
    this.won = false;
    this.invulnUntil = 0;
    this.elapsed = 0;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.jumpHeld = false;
    this.cpReached = false;
    this.riding = null;
    this.ch = (SA.App && SA.App.character) || 'boy'; // الشخصية المختارة: boy أو girl

    this.physics.world.setBounds(0, 0, this.worldW, this.worldH + 600);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.buildGrid();
    this.buildBackground();
    this.buildDecor();
    this.buildTerrain();
    this.buildMovers();
    this.buildItems();
    this.buildEnemies();
    this.buildGoals();
    this.buildPlayer();
    this.buildColliders();

    var cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    cam.startFollow(this.player, true, 0.12, 0.12);
    this.setTouchView(SA.UI.isTouch());
    cam.setDeadzone(120, 80);
    cam.setRoundPixels(true);

    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 60, max: 160 }, lifespan: 450, scale: { start: 1, end: 0 },
      gravityY: 200, emitting: false
    }).setDepth(20);

    SA.UI.setCoins(0, this.totalCoins);
    SA.UI.setLives(this.lives);
    SA.Input.consumeJump();
  }

  /* ---------- شبكة المواد الصلبة ---------- */
  buildGrid() {
    var L = this.L, W = L.width, R = SA.ROWS;
    var grid = [];
    for (var r = 0; r < R; r++) grid.push(new Uint8Array(W));
    L.ground.forEach(function (g) {
      for (var c = g.from; c <= g.to; c++) for (var rr = g.top; rr < R; rr++) grid[rr][c] = 1;
    });
    L.blocks.forEach(function (b) {
      for (var c = b.col; c < b.col + b.len; c++) grid[b.row][c] = 2;
    });
    this.grid = grid;
  }

  isSolidAt(px, py) {
    var c = Math.floor(px / SA.TILE), r = Math.floor(py / SA.TILE);
    if (r < 0 || r >= SA.ROWS) return false;
    if (c < 0 || c >= this.L.width) return true;
    return this.grid[r][c] > 0;
  }

  groundTop(col) {
    for (var r = 0; r < SA.ROWS; r++) if (this.grid[r][col] === 1) return r;
    return SA.ROWS;
  }

  surfaceTop(col) {
    for (var r = 0; r < SA.ROWS; r++) if (this.grid[r][col] > 0) return r;
    return SA.ROWS;
  }

  /* ---------- الخلفية ---------- */
  buildBackground() {
    var W = SA.WIDTH;
    this.add.image(0, 0, 'sky').setOrigin(0).setScrollFactor(0).setDisplaySize(W, SA.HEIGHT).setDepth(-10);
    this.add.image(790, 96, 'sun').setScrollFactor(0).setDepth(-9);
    this.bgClouds = this.add.tileSprite(0, 30, W, 160, 'clouds').setOrigin(0).setScrollFactor(0).setDepth(-8).setAlpha(0.9);
    this.bgFar = this.add.tileSprite(0, 214, W, 240, 'bg_far').setOrigin(0).setScrollFactor(0, 1).setDepth(-7);
    this.bgVillage = this.add.tileSprite(0, 220, W, 270, 'bg_village').setOrigin(0).setScrollFactor(0, 1).setDepth(-6);
    this.add.rectangle(0, 486, W, SA.HEIGHT - 486 + SA.TOUCH_VIEW_EXTRA, 0xe6c286).setOrigin(0).setScrollFactor(0, 1).setDepth(-6);
  }

  buildDecor() {
    var T = SA.TILE, self = this;
    this.L.houses.forEach(function (h) {
      var baseCol = Math.floor(h.col);
      var y = self.groundTop(baseCol) * T;
      self.add.image(h.col * T, y + 2, h.type).setOrigin(0, 1).setDepth(-3);
    });
    this.L.palms.forEach(function (col) {
      var y = self.groundTop(col) * T;
      if (y >= self.worldH) return;
      self.add.image(col * T + 16, y + 4, 'palm').setOrigin(0.5, 1).setDepth(-2);
    });
  }

  /* ---------- الأرض والمنصات ---------- */
  buildTerrain() {
    var T = SA.TILE, R = SA.ROWS, W = this.L.width, grid = this.grid;
    var r, c;
    // الرسم
    for (r = 0; r < R; r++) {
      for (c = 0; c < W; c++) {
        var v = grid[r][c];
        if (!v) continue;
        var key;
        if (v === 2) key = 't_brick';
        else key = (r === 0 || grid[r - 1][c] !== 1) ? 't_sand' : 't_dirt';
        this.add.image(c * T, r * T, key).setOrigin(0).setDepth(1);
      }
    }
    // صفوف تراب إضافية تحت المرحلة (للعرض فقط، تظهر في وضع الجوال)
    var extraRows = Math.ceil(SA.TOUCH_VIEW_EXTRA / T);
    for (c = 0; c < W; c++) {
      if (!grid[R - 1][c]) continue;
      for (var er = 0; er < extraRows; er++) this.add.image(c * T, (R + er) * T, 't_dirt').setOrigin(0).setDepth(1);
    }
    // الحفر: ظل داكن يوضح أنها عميقة وخطرة
    for (c = 0; c < W; c++) {
      if (this.groundTop(c) < R) continue;
      var depthH = 3 * T + SA.TOUCH_VIEW_EXTRA;
      this.add.rectangle(c * T, 14 * T, T, depthH, 0x7a4a26).setOrigin(0).setDepth(0);
      this.add.rectangle(c * T, 14 * T + 24, T, depthH - 24, 0x4a2a14).setOrigin(0).setDepth(0);
      this.add.rectangle(c * T, 14 * T + 56, T, depthH - 56, 0x2a160b).setOrigin(0).setDepth(0);
    }
    // الأجسام الفيزيائية: دمج الخلايا في مستطيلات كبيرة (أداء أفضل وبدون تعلّق عند الحواف)
    this.solids = this.physics.add.staticGroup();
    var used = [];
    for (r = 0; r < R; r++) used.push(new Uint8Array(W));
    for (r = 0; r < R; r++) {
      for (c = 0; c < W; c++) {
        if (!grid[r][c] || used[r][c]) continue;
        var c2 = c;
        while (c2 + 1 < W && grid[r][c2 + 1] && !used[r][c2 + 1]) c2++;
        var r2 = r;
        var ok = true;
        while (ok && r2 + 1 < R) {
          for (var k = c; k <= c2; k++) if (!grid[r2 + 1][k] || used[r2 + 1][k]) { ok = false; break; }
          if (ok) r2++;
        }
        for (var rr = r; rr <= r2; rr++) for (var cc = c; cc <= c2; cc++) used[rr][cc] = 1;
        var zone = this.add.zone(c * T, r * T, (c2 - c + 1) * T, (r2 - r + 1) * T).setOrigin(0);
        this.solids.add(zone);
      }
    }
    this.solidCount = this.solids.getLength();
  }

  buildMovers() {
    var T = SA.TILE, self = this;
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    this.L.movers.forEach(function (m) {
      var w = m.len * T;
      var p = self.movers.create(m.fromCol * T + w / 2, m.row * T + 8, 'plank');
      p.setDisplaySize(w, 16).setDepth(2);
      p.body.setSize(p.width, p.height);
      p.body.allowGravity = false;
      p.body.immovable = true;
      p.minX = m.fromCol * T + w / 2;
      p.maxX = m.toCol * T + w / 2;
      p.speed = m.speed || 70;
      p.lastX = p.x;
      p.dx = 0;
      p.body.setVelocityX(p.speed);
    });
  }

  /* ---------- العملات والتمر والأشواك ---------- */
  buildItems() {
    var T = SA.TILE, self = this;
    this.coinGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.L.coins.forEach(function (line) {
      for (var i = 0; i < line.n; i++) {
        var coin = self.coinGroup.create((line.col + i) * T + 16, line.row * T + 16, 'coin0');
        coin.setDepth(6);
        coin.body.setSize(18, 20);
        coin.body.allowGravity = false;
        coin.anims.play({ key: 'coinSpin', startFrame: (line.col + i) % 4 });
      }
    });
    this.totalCoins = this.coinGroup.getLength();

    this.dateGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.L.dates.forEach(function (d) {
      var it = self.dateGroup.create(d.col * T + 16, d.row * T + 16, 'date').setDepth(6);
      it.body.allowGravity = false;
      self.tweens.add({ targets: it, y: it.y - 5, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });

    this.spikeGroup = this.physics.add.staticGroup();
    this.L.spikes.forEach(function (s) {
      for (var i = 0; i < s.len; i++) {
        var col = s.col + i;
        var top = self.surfaceTop(col);
        var sp = self.spikeGroup.create(col * T + 16, (top - 1) * T + 16, 'spikes').setDepth(3);
        sp.body.setSize(26, 14, false);
        sp.body.setOffset(3, 18);
      }
    });
  }

  buildEnemies() {
    var T = SA.TILE, self = this;
    this.enemies = this.physics.add.group();
    this.L.enemies.forEach(function (e) {
      var top = self.surfaceTop(e.col);
      var en = self.enemies.create(e.col * T + 16, top * T - 12, 'sc1').setDepth(7);
      en.body.setSize(30, 14).setOffset(3, 6);
      en.dir = -1;
      en.alive = true;
      en.anims.play('scorp');
    });
  }

  buildGoals() {
    var T = SA.TILE;
    // نقطة الحفظ
    var cpCol = this.L.checkpoint.col;
    var cpTop = this.groundTop(cpCol) * T;
    this.add.image(cpCol * T + 16, cpTop, 'pole').setOrigin(0.5, 1).setDepth(4);
    this.cpFlag = this.add.image(cpCol * T + 19, cpTop - 124, 'flag_off').setOrigin(0, 0).setDepth(4);
    this.cpZone = this.add.zone(cpCol * T + 16, cpTop - 64, 40, 128);
    this.physics.add.existing(this.cpZone, true);

    // بوابة النهاية
    var fCol = this.L.finish.col;
    var fTop = this.groundTop(fCol) * T;
    this.add.image(fCol * T + 16, fTop + 2, 'gate').setOrigin(0.5, 1).setDepth(-1);
    this.add.image(fCol * T - 50, fTop, 'pole').setOrigin(0.5, 1).setScale(1, 1.5).setDepth(4);
    this.finishFlag = this.add.image(fCol * T - 47, fTop - 188, 'flag_big').setOrigin(0, 0).setDepth(4);
    this.finishZone = this.add.zone(fCol * T + 16, fTop - 80, 48, 160);
    this.physics.add.existing(this.finishZone, true);

    this.respawnPoint = this.spawnAt(this.L.start.col);
  }

  // وضع الجوال: الكاميرا تنزل قليلًا فيرتفع سطح الأرض فوق أزرار اللمس
  // (لا يغيّر الفيزياء ولا المرحلة؛ على الكمبيوتر تبقى الكاميرا كما هي)
  setTouchView(on) {
    var cam = this.cameras.main;
    var extra = on ? SA.TOUCH_VIEW_EXTRA : 0;
    cam.setBounds(0, 0, this.worldW, this.worldH + extra);
    if (!on) cam.scrollY = 0;
  }

  spawnAt(col) {
    return { x: col * SA.TILE + 16, y: this.surfaceTop(col) * SA.TILE - 22 };
  }

  buildPlayer() {
    var sp = this.respawnPoint;
    var p = this.physics.add.sprite(sp.x, sp.y, this.ch + '_idle').setDepth(10);
    p.body.setSize(18, 38).setOffset(7, 4);
    p.body.setMaxVelocity(500, 950);
    p.setCollideWorldBounds(true);
    p.anims.play(this.ch + '_idle');
    this.player = p;
  }

  buildColliders() {
    var self = this;
    this.physics.add.collider(this.player, this.solids);
    // المنصة المتحركة: تصادم من الأعلى فقط
    this.physics.add.collider(this.player, this.movers, function (pl, mv) {
      if (pl.body.touching.down) self.riding = mv; // اللاعب واقف على المنصة
    }, function (pl, mv) {
      return pl.body.velocity.y >= 0 && pl.body.prev.y + pl.body.height <= mv.body.top + 10;
    });
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.dateGroup, this.collectDate, null, this);
    this.physics.add.overlap(this.player, this.spikeGroup, function () { self.hurt(); });
    this.physics.add.overlap(this.player, this.enemies, this.touchEnemy, null, this);
    this.physics.add.overlap(this.player, this.cpZone, this.reachCheckpoint, null, this);
    this.physics.add.overlap(this.player, this.finishZone, this.reachFinish, null, this);
  }

  /* ---------- الأحداث ---------- */
  collectCoin(player, coin) {
    if (!coin.body.enable) return;
    coin.body.enable = false;
    this.coins++;
    SA.UI.setCoins(this.coins, this.totalCoins);
    SA.Sound.play('coin');
    this.sparks.explode(5, coin.x, coin.y);
    this.tweens.add({ targets: coin, y: coin.y - 24, alpha: 0, duration: 250, onComplete: function () { coin.destroy(); } });
  }

  collectDate(player, item) {
    if (!item.body.enable) return;
    item.body.enable = false;
    this.tweens.killTweensOf(item);
    if (this.lives < this.cfg.maxLives) {
      this.lives++;
      SA.UI.setLives(this.lives);
      SA.UI.toast('تمرة! قلب إضافي');
    } else {
      SA.UI.toast('تمرة لذيذة!');
    }
    SA.Sound.play('item');
    this.tweens.add({ targets: item, scale: 1.8, alpha: 0, duration: 300, onComplete: function () { item.destroy(); } });
  }

  touchEnemy(player, enemy) {
    if (!enemy.alive || this.dead || this.won || SA.App.mode !== 'playing') return;
    var pb = player.body, eb = enemy.body;
    var wasAbove = pb.prev.y + pb.height <= eb.prev.y + 8;
    if (pb.velocity.y > 0 && (wasAbove || pb.bottom <= eb.top + 10)) {
      this.stomp(enemy);
    } else {
      this.hurt();
    }
  }

  stomp(enemy) {
    enemy.alive = false;
    enemy.body.enable = false;
    enemy.anims.stop();
    enemy.setFlipY(true);
    this.player.body.setVelocityY(-430);
    this.jumpHeld = true;
    SA.Sound.play('stomp');
    this.sparks.explode(6, enemy.x, enemy.y);
    var self = this;
    this.tweens.add({
      targets: enemy, y: enemy.y - 20, duration: 160, ease: 'Quad.out',
      onComplete: function () {
        self.tweens.add({ targets: enemy, y: self.worldH + 60, alpha: 0.5, duration: 600, ease: 'Quad.in', onComplete: function () { enemy.destroy(); } });
      }
    });
  }

  reachCheckpoint() {
    if (this.cpReached || this.dead) return;
    this.cpReached = true;
    this.cpFlag.setTexture('flag_on');
    this.respawnPoint = this.spawnAt(this.L.checkpoint.col);
    SA.Sound.play('checkpoint');
    SA.UI.toast('نقطة حفظ: ستكمل من هنا إذا خسرت محاولة');
  }

  reachFinish() {
    if (this.won || this.dead) return;
    this.won = true;
    var p = this.player;
    p.body.setVelocityX(0);
    p.anims.play(this.ch + '_jump');
    SA.Sound.play('win');
    this.sparks.explode(24, this.finishZone.x, this.finishZone.y - 40);
    this.tweens.add({ targets: this.finishFlag, y: this.finishFlag.y - 10, duration: 300, yoyo: true, repeat: 2 });
    var self = this;
    this.time.delayedCall(1300, function () {
      SA.App.onWin({ coins: self.coins, total: self.totalCoins, time: self.elapsed, lives: self.lives });
    });
  }

  hurt() {
    if (SA.App.mode !== 'playing') return;
    if (this.dead || this.won || this.time.now < this.invulnUntil) return;
    this.loseLife(false);
  }

  loseLife(fell) {
    if (this.dead || this.won) return;
    this.dead = true;
    this.lives--;
    SA.UI.setLives(this.lives);
    SA.Sound.play('hurt');
    this.cameras.main.shake(180, 0.006);
    var p = this.player, self = this;
    p.body.setVelocity(0, 0);
    p.body.enable = false;
    p.anims.play(this.ch + '_jump');
    p.setTint(0xff9a9a);
    if (!fell) {
      this.tweens.add({
        targets: p, y: p.y - 48, duration: 260, ease: 'Quad.out',
        onComplete: function () {
          self.tweens.add({ targets: p, y: self.worldH + 80, duration: 650, ease: 'Quad.in' });
        }
      });
    }
    this.time.delayedCall(1100, function () {
      if (self.lives > 0) self.respawn();
      else self.gameOver();
    });
  }

  respawn() {
    var p = this.player, sp = this.respawnPoint;
    this.tweens.killTweensOf(p);
    p.clearTint();
    p.setAlpha(1);
    p.enableBody(true, sp.x, sp.y, true, true);
    p.body.setVelocity(0, 0);
    p.setFlipX(false);
    this.dead = false;
    this.coyote = 0;
    this.jumpBuf = 0;
    SA.Input.consumeJump();
    this.invulnUntil = this.time.now + this.cfg.invulnTime;
  }

  gameOver() {
    SA.Sound.play('gameover');
    SA.App.onGameOver({ coins: this.coins, total: this.totalCoins });
  }

  /* ---------- التحديث كل إطار ---------- */
  update(time, delta) {
    var dt = Math.min(delta, 50) / 1000;
    var cam = this.cameras.main;
    this.bgClouds.tilePositionX = cam.scrollX * 0.05 + time * 0.004;
    this.bgFar.tilePositionX = cam.scrollX * 0.15;
    this.bgVillage.tilePositionX = cam.scrollX * 0.35;

    this.updateMovers();
    this.updateEnemies();

    var playing = SA.App.mode === 'playing';
    if (playing && !this.dead && !this.won) this.elapsed += dt;
    this.updatePlayer(dt, playing);
  }

  updateMovers() {
    this.movers.getChildren().forEach(function (m) {
      m.dx = m.x - m.lastX; // كم تحركت المنصة في هذا الإطار
      m.lastX = m.x;
      if (m.x <= m.minX && m.body.velocity.x <= 0) m.body.setVelocityX(m.speed);
      else if (m.x >= m.maxX && m.body.velocity.x >= 0) m.body.setVelocityX(-m.speed);
    });
    // تحريك اللاعب مع المنصة التي يقف عليها
    var p = this.player;
    if (this.riding && !this.dead && p.body.enable) p.x += this.riding.dx;
    this.riding = null;
  }

  updateEnemies() {
    var self = this, speed = this.cfg.enemySpeed;
    this.enemies.getChildren().forEach(function (e) {
      if (!e.alive) return;
      var b = e.body;
      if (b.blocked.left) e.dir = 1;
      else if (b.blocked.right) e.dir = -1;
      if (b.blocked.down) {
        var aheadX = e.dir < 0 ? b.left - 2 : b.right + 2;
        if (!self.isSolidAt(aheadX, b.bottom + 4)) e.dir = -e.dir;
      }
      b.setVelocityX(e.dir * speed);
      e.setFlipX(e.dir > 0);
      if (e.y > self.worldH + 100) { e.alive = false; e.destroy(); }
    });
  }

  updatePlayer(dt, playing) {
    var p = this.player, b = p.body, cfg = this.cfg, In = SA.Input;
    var jumpPressed = In.consumeJump();

    if (this.dead) return;
    if (p.y > this.worldH + 40) { this.loseLife(true); return; }

    var active = playing && !this.won;
    var dir = 0;
    if (active) {
      if (In.isDown('left')) dir -= 1;
      if (In.isDown('right')) dir += 1;
    }
    var onGround = b.blocked.down || b.touching.down;

    // حركة أفقية بتسارع سلس
    var target = dir * cfg.runSpeed;
    var accel = onGround ? cfg.groundAccel : cfg.airAccel;
    var vx = b.velocity.x;
    if (vx < target) vx = Math.min(target, vx + accel * dt);
    else if (vx > target) vx = Math.max(target, vx - accel * dt);
    b.setVelocityX(vx);
    if (dir !== 0) p.setFlipX(dir < 0);

    // القفز مع سماحية الحافة وذاكرة الضغطة
    this.coyote = onGround ? cfg.coyoteTime : this.coyote - dt;
    this.jumpBuf = (active && jumpPressed) ? cfg.jumpBuffer : this.jumpBuf - dt;
    if (this.jumpBuf > 0 && this.coyote > 0) {
      b.setVelocityY(-cfg.jumpVelocity);
      this.jumpBuf = 0;
      this.coyote = 0;
      this.jumpHeld = true;
      SA.Sound.play('jump');
    }
    // قفزة أقصر عند ترك الزر مبكرًا
    if (this.jumpHeld && !In.isDown('jump')) {
      if (b.velocity.y < -220) b.setVelocityY(b.velocity.y * 0.5);
      this.jumpHeld = false;
    }
    if (b.velocity.y >= 0) this.jumpHeld = false;

    // الرسوم
    var ch = this.ch;
    if (!onGround) p.anims.play(ch + '_jump', true);
    else if (Math.abs(vx) > 20) p.anims.play(ch + '_walk', true);
    else p.anims.play(ch + '_idle', true);

    // وميض الحماية بعد خسارة محاولة
    if (this.time.now < this.invulnUntil) p.setAlpha(Math.floor(this.time.now / 80) % 2 ? 0.35 : 1);
    else if (p.alpha !== 1) p.setAlpha(1);
  }
};
}
