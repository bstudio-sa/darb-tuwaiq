/*
  الرسومات: كلها Pixel Art مرسومة بالكود (لا توجد ملفات صور خارجية).
  ------------------------------------------------------------
  لاستبدالها برسومات احترافية لاحقًا:
  ضعي ملفات PNG في مجلد assets/ وحمّليها في BootScene.preload بنفس المفاتيح
  (مثلاً this.load.image('t_sand', 'assets/sand.png'))، ثم احذفي سطر توليدها هنا.
  المفاتيح المستخدمة مذكورة في قائمة KEYS أسفل الملف.
*/
window.SA = window.SA || {};

(function () {
  'use strict';

  var PX = 2; // كل بكسل في الرسومة الصغيرة = 2×2 على الشاشة

  var PAL = {
    // الشخصية
    W: '#f8f5ee', w: '#d6cfc0', R: '#c62a3d', K: '#2a2224', S: '#e3a978',
    s: '#a9643f', E: '#2a1a10', B: '#6b4226', p: '#ec8f7c',
    // العملة
    G: '#9c6210', Y: '#f6c33b', H: '#fff4b8', O: '#d9921e',
    // التمر
    D: '#8b3a1a', d: '#c9703c', k: '#5a2210', g: '#3f8a3a',
    // العقرب
    A: '#b8732f', Z: '#4e2c10', X: '#120a04',
    // خط الإطار + البنت
    o: '#3a2418', J: '#5b2a4c', j: '#84476f', N: '#262129', n: '#4a4152', T: '#d9a43a'
  };

  /* ---------- رسومات بكسلية (كل حرف = لون) ---------- */
  // الولد: ثوب أبيض وشماغ أحمر وعقال
  var BOY_HEAD = [
    '....oooooooo....',
    '...oKKKKKKKKo...',
    '..oRWRWRWRWRWo..',
    '..oWRWRWRWRWRWo.',
    '.oRWRSSSSSSSWRo.',
    '.oWRSSSSESSESRo.',
    '.oRWSSSSESSESWo.',
    '.oWRSpSSSSSSpRo.',
    '.oRWSSSSssSSSWo.',
    '.oWRWSSSSSSSRWo.',
    '.oRWoWWWWWWoWRo.',
    '..ooWWWWWWWWoo..'
  ];
  var BOY_BODY = [
    '...oWWWWWWWWo...',
    '..oWWWWwWWWWWo..',
    '..oSWWWwWWWWSo..',
    '...oWWWwWWWWo...',
    '...oWWWwWWWWo...',
    '...oWWWWWWWWo...',
    '...owWWWWWWwo...'
  ];
  var BOY_BODY_JUMP = [
    '.SoWWWWWWWWoS...',
    '..oWWWWwWWWWWo..',
    '..oWWWwWWWWWo...',
    '...oWWWwWWWWo...',
    '...oWWWwWWWWo...',
    '...oWWWWWWWWo...',
    '...owWWWWWWwo...'
  ];
  // البنت: عباية سوداء بحاشية ذهبية وحجاب
  var GIRL_HEAD = [
    '....oooooooo....',
    '...oJJJJJJJJo...',
    '..oJJjJJJJJJJo..',
    '..oJjJJJJJJJJJo.',
    '.oJJJSSSSSSSJJo.',
    '.oJJSSSSESSESJo.',
    '.oJJSSSSESSESJo.',
    '.oJJSpSSSSSSpJo.',
    '.oJJSSSSssSSSJo.',
    '.oJJJSSSSSSSJJo.',
    '.oJJJJJJJJJJJJo.',
    '..oJJJJJJJJJJo..'
  ];
  var GIRL_BODY = [
    '...oNNNNNNNNo...',
    '..oNNNNTNNNNNo..',
    '..oSNNNTNNNNSo..',
    '..oNNNNTNNNNNo..',
    '..oNNNNTNNNNNo..',
    '.oNNNNNTNNNNNNo.',
    '.oNnNNNTNNNNnNo.'
  ];
  var GIRL_BODY_JUMP = [
    '.SoNNNNNNNNoS...',
    '..oNNNNTNNNNNo..',
    '..oNNNNTNNNNNo..',
    '..oNNNNTNNNNNo..',
    '..oNNNNTNNNNNo..',
    '.oNNNNNTNNNNNNo.',
    '.oNnNNNTNNNNnNo.'
  ];
  var FEET = {
    idle: ['....oBBooBBo....', '...oBBBooBBBo...'],
    walk1: ['...oBBo..oBBo...', '..oBBBo..oBBBo..'],
    walk2: ['.....oBBBBo.....', '....oBBBBBBo....'],
    jump: ['....oBBo.oBBo...', '................']
  };
  function character(head, body, bodyJump) {
    return {
      idle: head.concat(body, FEET.idle),
      walk1: head.concat(body, FEET.walk1),
      walk2: head.concat(body, FEET.walk2),
      jump: head.concat(bodyJump, FEET.jump)
    };
  }
  var CHARACTERS = {
    boy: character(BOY_HEAD, BOY_BODY, BOY_BODY_JUMP),
    girl: character(GIRL_HEAD, GIRL_BODY, GIRL_BODY_JUMP)
  };

  // شعار النخلة والسيفين (للرايات)
  var EMBLEM = [
    '..W.W.W..',
    '.WWWWWWW.',
    'W.WWWWW.W',
    '...WWW...',
    '.W..W..W.',
    '..W.W.W..',
    '...WWW...',
    '....W....',
    '...WWW...',
    '..W...W..',
    '.Y.....Y.'
  ];

  var SPRITES = {
    coin: [
      '....GGGG....',
      '..GGYYYYGG..',
      '.GYYHHYYYOG.',
      '.GYHYYYYYOG.',
      'GYHYYOOYYYOG',
      'GYYYOYYOYYOG',
      'GYYYOYYOYYOG',
      'GYYYYOOYYYOG',
      '.GYYYYYYYOG.',
      '.GOYYYYYOOG.',
      '..GGOOOOGG..',
      '....GGGG....'
    ],

    date: [
      '.....gg...',
      '....g.....',
      '...DDDD...',
      '..DdDDDD..',
      '.DdDDDDDD.',
      '.DdDDDDDD.',
      '.DDDDDDDD.',
      '.DDDDDDDD.',
      '.DDDDDDDk.',
      '..DDDDDk..',
      '...kkkk...',
      '..........'
    ],

    sc1: [
      '............ZAZ...',
      '...........ZA.AZ..',
      '..............AZ..',
      '..............AZ..',
      '.AA..ZZZZZZZZAZ...',
      'AZA.ZAAAAAAAAZ....',
      '.AZZAAXAAAAAAZ....',
      '..ZAAAAAAAAAZ.....',
      '...Z.Z.Z.Z.Z......',
      '..Z.Z.Z.Z.Z.......'
    ],
    sc2: [
      '............ZAZ...',
      '...........ZA.AZ..',
      '..............AZ..',
      '..............AZ..',
      '.AA..ZZZZZZZZAZ...',
      'AZA.ZAAAAAAAAZ....',
      '.AZZAAXAAAAAAZ....',
      '..ZAAAAAAAAAZ.....',
      '..Z.Z.Z.Z.Z.......',
      '...Z.Z.Z.Z.Z......'
    ]
  };

  /* ---------- أدوات ---------- */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pixRows(scene, key, rows, scale) {
    if (scene.textures.exists(key)) return;
    var h = rows.length, w = rows[0].length;
    var tex = scene.textures.createCanvas(key, w * scale, h * scale);
    var ctx = tex.getContext();
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var ch = rows[y][x];
        if (ch === '.' || ch === ' ') continue;
        ctx.fillStyle = PAL[ch] || '#ff00ff';
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    tex.refresh();
  }

  // ترسم على لوحة صغيرة ثم تكبّرها بدون تنعيم (للحفاظ على شكل البكسل)
  function lowRes(scene, key, w, h, scale, draw) {
    if (scene.textures.exists(key)) return;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var cx = c.getContext('2d');
    draw(cx, w, h);
    var tex = scene.textures.createCanvas(key, w * scale, h * scale);
    var tc = tex.getContext();
    tc.imageSmoothingEnabled = false;
    tc.drawImage(c, 0, 0, w * scale, h * scale);
    tex.refresh();
  }

  function px(c, color, x, y, w, h) {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w || 1, h || 1);
  }

  /* ---------- البلاطات ---------- */
  function tiles(scene) {
    lowRes(scene, 't_sand', 16, 16, PX, function (c) {
      var r = rng(11);
      px(c, '#e0b066', 0, 0, 16, 16);
      px(c, '#f2cd8a', 0, 0, 16, 4);
      px(c, '#fbe4b0', 0, 0, 16, 1);
      px(c, '#e8bd78', 0, 4, 16, 1);
      for (var i = 0; i < 16; i++) {
        px(c, r() < 0.5 ? '#c9964a' : '#edc583', Math.floor(r() * 16), 5 + Math.floor(r() * 11));
      }
      px(c, '#cf9d55', 2, 9, 4, 1);
      px(c, '#cf9d55', 9, 13, 5, 1);
    });

    lowRes(scene, 't_dirt', 16, 16, PX, function (c) {
      var r = rng(23);
      px(c, '#cf9a55', 0, 0, 16, 16);
      px(c, '#c08946', 0, 6, 16, 2);
      px(c, '#d9a965', 0, 12, 16, 1);
      for (var i = 0; i < 14; i++) {
        px(c, r() < 0.6 ? '#b07a3c' : '#e3b679', Math.floor(r() * 16), Math.floor(r() * 16));
      }
      px(c, '#9e6c36', 4, 3, 2, 1);
      px(c, '#9e6c36', 11, 10, 2, 1);
    });

    // طوب طيني (لِبن)
    lowRes(scene, 't_brick', 16, 16, PX, function (c) {
      var r = rng(5);
      px(c, '#c98b52', 0, 0, 16, 16);
      px(c, '#e2a86c', 0, 0, 16, 1);
      px(c, '#9a6236', 0, 7, 16, 1);
      px(c, '#9a6236', 0, 15, 16, 1);
      px(c, '#9a6236', 7, 0, 1, 7);
      px(c, '#9a6236', 3, 8, 1, 7);
      px(c, '#9a6236', 11, 8, 1, 7);
      px(c, '#dca064', 0, 8, 16, 1);
      for (var i = 0; i < 9; i++) {
        px(c, '#ebc387', Math.floor(r() * 16), 1 + Math.floor(r() * 14), r() < 0.5 ? 2 : 1, 1);
      }
    });

    // أشواك حجرية
    lowRes(scene, 'spikes', 16, 16, PX, function (c) {
      for (var i = 0; i < 3; i++) {
        var x0 = 1 + i * 5;
        for (var r = 0; r < 9; r++) {
          var y = 6 + r;
          var half = Math.min(2, Math.floor(r / 3));
          for (var x = x0 + 2 - half; x <= x0 + 2 + half; x++) {
            var col = x <= x0 + 2 ? '#efe4cf' : '#a99a86';
            if (r < 2) col = '#8a2433';
            px(c, col, x, y);
          }
        }
      }
      px(c, '#7c5a3a', 0, 15, 16, 1);
    });

    // لوح خشب نخيل للمنصة المتحركة (3 بلاطات)
    lowRes(scene, 'plank', 48, 8, PX, function (c) {
      px(c, '#8a5a2b', 0, 0, 48, 8);
      px(c, '#b07a40', 0, 0, 48, 2);
      px(c, '#5e3a1a', 0, 7, 48, 1);
      for (var x = 0; x < 48; x += 8) px(c, '#5e3a1a', x, 2, 1, 5);
      [6, 24, 41].forEach(function (x) {
        px(c, '#e2cfa0', x, 0, 2, 8);
        px(c, '#b9a477', x + 1, 0, 1, 8);
      });
    });
  }

  /* ---------- العملة: 4 إطارات دوران ---------- */
  function coinFrames(scene) {
    pixRows(scene, 'coin_base', SPRITES.coin, PX);
    var widths = [1, 0.66, 0.25, 0.66];
    var base = scene.textures.get('coin_base').getSourceImage();
    widths.forEach(function (f, i) {
      var key = 'coin' + i;
      if (scene.textures.exists(key)) return;
      var tex = scene.textures.createCanvas(key, 24, 24);
      var ctx = tex.getContext();
      ctx.imageSmoothingEnabled = false;
      var w = Math.max(4, Math.round(24 * f / 2) * 2);
      ctx.drawImage(base, (24 - w) / 2, 0, w, 24);
      tex.refresh();
    });
  }

  /* ---------- الزينة ---------- */
  function decor(scene) {
    // نخلة
    lowRes(scene, 'palm', 48, 72, 3, function (c) {
      var top = 22, base = 71;
      for (var y = top; y <= base; y++) {
        var t = (base - y) / (base - top);
        var x = 20 + Math.round(Math.sin(t * 1.3) * 3);
        px(c, (y % 4 < 2) ? '#8a5a2b' : '#704620', x, y, 4, 1);
        px(c, '#a87038', x, y, 1, 1);
        if (y % 4 === 0) px(c, '#5c3818', x + 3, y, 1, 1);
      }
      var cx = 24, cy = 20;
      // عذوق التمر
      [[21, 23], [23, 24], [25, 23], [27, 24], [22, 25], [26, 25]].forEach(function (p) {
        px(c, '#d9822b', p[0], p[1], 2, 2);
        px(c, '#a85a1c', p[0] + 1, p[1] + 1, 1, 1);
      });
      var dirs = [168, 145, 118, 92, 64, 38, 12, -14, 194];
      dirs.forEach(function (deg, idx) {
        var a = deg * Math.PI / 180;
        var len = (idx === 3) ? 13 : 19;
        for (var s = 0; s <= len; s++) {
          var x = cx + Math.cos(a) * s;
          var y = cy - Math.sin(a) * s + s * s * 0.035;
          px(c, '#2f7a34', x, y, 2, 1);
          px(c, '#57ad4e', x, y - 1, 1, 1);
          if (s > 3 && s % 2 === 0) {
            px(c, '#1f5a26', x, y + 1, 1, 2);
          }
        }
      });
      px(c, '#3f8a3a', cx - 2, cy - 1, 5, 3);
    });

    // بيت طيني نجدي
    lowRes(scene, 'house', 64, 46, 3, function (c) {
      var r = rng(31);
      var main = '#c99863', shade = '#b1804e', light = '#e0b582';
      px(c, main, 4, 12, 40, 34);
      px(c, shade, 44, 18, 16, 28);
      px(c, light, 4, 12, 40, 1);
      px(c, '#c48f58', 44, 18, 16, 1);
      // شرفات مسننة على السطح
      for (var x = 4; x < 44; x += 5) {
        px(c, main, x + 1, 9, 3, 3);
        px(c, main, x + 2, 7, 1, 2);
      }
      for (var x2 = 44; x2 < 60; x2 += 5) {
        px(c, shade, x2 + 1, 15, 3, 3);
        px(c, shade, x2 + 2, 13, 1, 2);
      }
      // فتحات مثلثة
      for (var x3 = 8; x3 < 42; x3 += 6) {
        px(c, '#6e4024', x3, 17, 3, 1);
        px(c, '#6e4024', x3 + 1, 16, 1, 1);
      }
      // مرازيم خشبية
      [20, 34].forEach(function (yy) {
        px(c, '#6b3d1f', 2, yy, 2, 1);
        px(c, '#6b3d1f', 60, yy + 2, 2, 1);
      });
      // باب خشبي
      px(c, '#8a5a2b', 13, 29, 11, 17);
      px(c, '#6b3d1f', 14, 30, 9, 16);
      px(c, '#8a5226', 18, 30, 1, 16);
      [[16, 33], [20, 33], [16, 39], [20, 39]].forEach(function (p) { px(c, '#d9b04a', p[0], p[1]); });
      // نافذة
      px(c, '#6b3d1f', 31, 23, 7, 7);
      px(c, '#3b2414', 32, 24, 5, 5);
      px(c, '#8a5a2b', 34, 24, 1, 5);
      px(c, '#6b3d1f', 49, 28, 5, 6);
      px(c, '#3b2414', 50, 29, 3, 4);
      // ملمس
      for (var i = 0; i < 40; i++) {
        var tx = 5 + Math.floor(r() * 54), ty = 13 + Math.floor(r() * 32);
        px(c, r() < 0.5 ? '#d8ab78' : '#b98653', tx, ty);
      }
      px(c, '#9a6a3c', 4, 45, 56, 1);
    });

    // برج طيني
    lowRes(scene, 'tower', 34, 62, 3, function (c) {
      var r = rng(9);
      for (var y = 10; y < 62; y++) {
        var inset = Math.floor((62 - y) / 18);
        px(c, '#c99863', 3 + inset, y, 28 - inset * 2, 1);
        px(c, '#b1804e', 22, y, 9 - inset, 1);
      }
      for (var x = 4; x < 30; x += 5) {
        px(c, '#c99863', x + 1, 7, 3, 3);
        px(c, '#c99863', x + 2, 5, 1, 2);
      }
      px(c, '#e0b582', 4, 10, 26, 1);
      [16, 30, 44].forEach(function (yy) {
        px(c, '#3b2414', 10, yy, 2, 5);
        px(c, '#3b2414', 16, yy, 2, 5);
      });
      for (var x3 = 7; x3 < 28; x3 += 5) {
        px(c, '#6e4024', x3, 13, 3, 1);
        px(c, '#6e4024', x3 + 1, 12, 1, 1);
      }
      for (var i = 0; i < 30; i++) px(c, r() < 0.5 ? '#d8ab78' : '#b98653', 5 + Math.floor(r() * 24), 11 + Math.floor(r() * 50));
      px(c, '#9a6a3c', 3, 61, 28, 1);
    });

    // بوابة القرية (نهاية المرحلة)
    lowRes(scene, 'gate', 60, 64, 3, function (c) {
      var main = '#c99863', shade = '#a87547';
      px(c, main, 2, 14, 16, 50);
      px(c, main, 42, 14, 16, 50);
      px(c, main, 2, 14, 56, 14);
      px(c, shade, 14, 28, 4, 36);
      px(c, shade, 54, 28, 4, 36);
      px(c, '#e0b582', 2, 14, 56, 1);
      for (var x = 2; x < 58; x += 5) {
        px(c, main, x + 1, 11, 3, 3);
        px(c, main, x + 2, 9, 1, 2);
      }
      // قوس الباب
      for (var y = 28; y < 64; y++) {
        var t = y < 36 ? Math.round(Math.sqrt(64 - (36 - y) * (36 - y))) : 8;
        var w = Math.min(12, 4 + t);
        px(c, '#4a2c18', 30 - w, y, w * 2, 1);
      }
      px(c, '#7a4a28', 18, 30, 3, 34);
      px(c, '#7a4a28', 39, 30, 3, 34);
      for (var x3 = 7; x3 < 54; x3 += 6) {
        px(c, '#6e4024', x3, 19, 3, 1);
        px(c, '#6e4024', x3 + 1, 18, 1, 1);
      }
    });

    // سارية
    lowRes(scene, 'pole', 3, 64, 2, function (c) {
      px(c, '#6b4226', 0, 2, 3, 62);
      px(c, '#8f5e36', 0, 2, 1, 62);
      px(c, '#e0a82e', 0, 0, 3, 3);
    });
    // راية نقطة الحفظ: مطفأة ومضاءة
    lowRes(scene, 'flag_off', 20, 14, 2, function (c) {
      px(c, '#e8dcc2', 0, 0, 18, 14);
      px(c, '#e8dcc2', 18, 2, 2, 10);
      px(c, '#c9b896', 0, 12, 18, 2);
    });
    // رايات خضراء عليها شعار النخلة والسيفين
    function emblem(c, ox, oy) {
      for (var y = 0; y < EMBLEM.length; y++) for (var x = 0; x < EMBLEM[y].length; x++) {
        var ch = EMBLEM[y][x];
        if (ch === 'W') px(c, '#ffffff', ox + x, oy + y);
        else if (ch === 'Y') px(c, '#f2d27a', ox + x, oy + y);
      }
    }
    lowRes(scene, 'flag_on', 20, 14, 2, function (c) {
      px(c, '#1f7a3f', 0, 0, 18, 14);
      px(c, '#1f7a3f', 18, 2, 2, 10);
      px(c, '#16602f', 0, 13, 18, 1);
      emblem(c, 5, 1);
    });
    lowRes(scene, 'flag_big', 28, 16, 2, function (c) {
      px(c, '#1f7a3f', 0, 0, 26, 16);
      px(c, '#1f7a3f', 26, 3, 2, 10);
      px(c, '#16602f', 0, 15, 26, 1);
      emblem(c, 9, 2);
    });
    pixRows(scene, 'date', SPRITES.date, PX);

    // جزيئات صغيرة
    lowRes(scene, 'spark', 3, 3, 2, function (c) {
      px(c, '#fff4b8', 1, 0, 1, 3);
      px(c, '#fff4b8', 0, 1, 3, 1);
    });
    lowRes(scene, 'dust', 2, 2, 2, function (c) { px(c, '#f1d9a6', 0, 0, 2, 2); });
  }

  /* ---------- الخلفيات ---------- */
  function backgrounds(scene) {
    if (!scene.textures.exists('sky')) {
      var t = scene.textures.createCanvas('sky', 8, 544);
      var ctx = t.getContext();
      var g = ctx.createLinearGradient(0, 0, 0, 544);
      g.addColorStop(0, '#4fa9de');
      g.addColorStop(0.55, '#a6dcf2');
      g.addColorStop(0.8, '#f3e2bb');
      g.addColorStop(1, '#f6dca6');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 8, 544);
      t.refresh();
    }

    lowRes(scene, 'sun', 20, 20, 4, function (c) {
      for (var y = 0; y < 20; y++) for (var x = 0; x < 20; x++) {
        var d = Math.hypot(x - 9.5, y - 9.5);
        if (d < 7) px(c, '#fff6cf', x, y);
        else if (d < 8.5) px(c, '#ffe28f', x, y);
        else if (d < 10 && (x + y) % 2 === 0) px(c, '#fff0b8', x, y);
      }
    });

    lowRes(scene, 'clouds', 240, 40, 4, function (c) {
      function cloud(x, y, w) {
        px(c, '#ffffff', x, y, w, 4);
        px(c, '#ffffff', x + 3, y - 3, w - 8, 3);
        px(c, '#ffffff', x + 7, y - 5, Math.max(4, w - 18), 2);
        px(c, '#dbeef8', x, y + 3, w, 1);
      }
      cloud(10, 14, 28); cloud(90, 24, 20); cloud(150, 10, 34); cloud(205, 28, 18);
    });

    var TAU = Math.PI * 2;
    // كثبان بعيدة (قابلة للتكرار أفقيًا)
    lowRes(scene, 'bg_far', 240, 60, 4, function (c, w, h) {
      for (var x = 0; x < w; x++) {
        var y = 26 + 7 * Math.sin(TAU * x / w * 2) + 4 * Math.sin(TAU * x / w * 5 + 1);
        px(c, '#efd29a', x, y, 1, h - y);
        px(c, '#f8e2b5', x, y, 1, 1);
        var y2 = 40 + 5 * Math.sin(TAU * x / w * 3 + 2) + 2 * Math.sin(TAU * x / w * 7);
        px(c, '#e8c385', x, y2, 1, h - y2);
      }
    });

    // قرية بعيدة: بيوت ونخيل بألوان باهتة
    lowRes(scene, 'bg_village', 320, 90, 3, function (c, w, h) {
      var housesData = [[12, 46, 34, 20], [54, 40, 16, 26], [120, 48, 40, 18], [176, 44, 22, 22], [236, 50, 30, 16], [282, 42, 14, 24]];
      housesData.forEach(function (hd) {
        var x = hd[0], y = hd[1], hw = hd[2], hh = hd[3];
        px(c, '#d4aa7c', x, y, hw, hh + 20);
        px(c, '#c39667', x + hw - 5, y + 2, 5, hh + 18);
        for (var i = x; i < x + hw - 1; i += 4) px(c, '#d4aa7c', i + 1, y - 2, 2, 2);
        for (var j = x + 3; j < x + hw - 3; j += 6) px(c, '#9f744c', j, y + 5, 2, 1);
        px(c, '#9f744c', x + 4, y + hh - 4, 3, 5);
      });
      [36, 100, 108, 214, 270, 308].forEach(function (x) {
        var top = 30 + (x % 7);
        px(c, '#8d7a5a', x, top, 2, 70 - top);
        [[-6, 0], [-4, -2], [3, -2], [6, 0], [-5, 2], [5, 2]].forEach(function (o) {
          px(c, '#7f9a5e', x + o[0], top + o[1], 6, 1);
        });
        px(c, '#7f9a5e', x - 1, top - 2, 4, 2);
      });
      for (var x2 = 0; x2 < w; x2++) {
        var y2 = 62 + 4 * Math.sin(TAU * x2 / w * 2 + 0.5) + 2 * Math.sin(TAU * x2 / w * 6);
        px(c, '#e6c286', x2, y2, 1, h - y2);
        px(c, '#efd09a', x2, y2, 1, 1);
      }
    });
  }

  function anims(scene) {
    var a = scene.anims;
    ['boy', 'girl'].forEach(function (ch) {
      if (!a.exists(ch + '_walk')) a.create({ key: ch + '_walk', frames: [{ key: ch + '_walk1' }, { key: ch + '_idle' }, { key: ch + '_walk2' }, { key: ch + '_idle' }], frameRate: 11, repeat: -1 });
      if (!a.exists(ch + '_idle')) a.create({ key: ch + '_idle', frames: [{ key: ch + '_idle' }], frameRate: 1 });
      if (!a.exists(ch + '_jump')) a.create({ key: ch + '_jump', frames: [{ key: ch + '_jump' }], frameRate: 1 });
    });
    if (!a.exists('scorp')) a.create({ key: 'scorp', frames: [{ key: 'sc1' }, { key: 'sc2' }], frameRate: 6, repeat: -1 });
    if (!a.exists('coinSpin')) a.create({ key: 'coinSpin', frames: [{ key: 'coin0' }, { key: 'coin1' }, { key: 'coin2' }, { key: 'coin3' }], frameRate: 8, repeat: -1 });
  }

  // رسم معاينة الشخصية في شاشة البداية (بدون Phaser)
  function drawPreview(canvas, ch) {
    var rows = CHARACTERS[ch].idle, h = rows.length, w = rows[0].length;
    var scale = Math.floor(Math.min(canvas.width / w, canvas.height / h));
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var ox = Math.floor((canvas.width - w * scale) / 2), oy = Math.floor((canvas.height - h * scale) / 2);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var c = rows[y][x];
      if (c === '.') continue;
      ctx.fillStyle = PAL[c];
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
  }

  SA.Art = {
    SPRITES: SPRITES,
    CHARACTERS: CHARACTERS,
    EMBLEM: EMBLEM,
    PAL: PAL,
    drawPreview: drawPreview,
    // مفاتيح الشخصيات: boy_idle, boy_walk1, boy_walk2, boy_jump (ونفسها لـ girl)
    KEYS: ['boy_idle', 'girl_idle', 'coin0', 'coin1', 'coin2', 'coin3', 'date', 'sc1', 'sc2',
      't_sand', 't_dirt', 't_brick', 'spikes', 'plank', 'palm', 'house', 'tower', 'gate', 'pole', 'flag_off',
      'flag_on', 'flag_big', 'spark', 'dust', 'sky', 'sun', 'clouds', 'bg_far', 'bg_village'],
    generate: function (scene) {
      Object.keys(CHARACTERS).forEach(function (ch) {
        Object.keys(CHARACTERS[ch]).forEach(function (pose) {
          pixRows(scene, ch + '_' + pose, CHARACTERS[ch][pose], PX);
        });
      });
      ['sc1', 'sc2'].forEach(function (k) { pixRows(scene, k, SPRITES[k], PX); });
      coinFrames(scene);
      tiles(scene);
      decor(scene);
      backgrounds(scene);
      anims(scene);
    }
  };
})();
