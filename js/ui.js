/* واجهة المستخدم (HTML فوق اللعبة): الشاشات، العدادات، الأزرار */
window.SA = window.SA || {};

SA.UI = (function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var els = {};
  var toastTimer = null;
  var touchMode = false;
  var lastResult = null;   // آخر نتيجة (للتسجيل في لوحة الأبطال)
  var boardReturn = 'menu'; // الشاشة التي نرجع لها من لوحة الأبطال

  var HEART_SHAPE = '<rect x="1" y="0" width="2" height="1"/><rect x="4" y="0" width="2" height="1"/><rect x="0" y="1" width="7" height="2"/><rect x="1" y="3" width="5" height="1"/><rect x="2" y="4" width="3" height="1"/><rect x="3" y="5" width="1" height="1"/>';
  var HEART_FULL = '<svg viewBox="0 0 7 6" aria-hidden="true"><g fill="#d8344a">' + HEART_SHAPE + '</g><rect x="1" y="1" width="1" height="1" fill="#ff9aa4"/></svg>';
  var HEART_EMPTY = '<svg viewBox="0 0 7 6" aria-hidden="true" class="empty"><g fill="rgba(255,240,214,.3)">' + HEART_SHAPE + '</g></svg>';
  var STAR_SHAPE = '<rect x="3" y="0" width="1" height="1"/><rect x="2" y="1" width="3" height="1"/><rect x="0" y="2" width="7" height="1"/><rect x="1" y="3" width="5" height="2"/><rect x="1" y="5" width="2" height="1"/><rect x="4" y="5" width="2" height="1"/><rect x="0" y="6" width="2" height="1"/><rect x="5" y="6" width="2" height="1"/>';
  var STAR = function (on) {
    return '<svg viewBox="0 0 7 7" class="star' + (on ? ' on' : '') + '" aria-hidden="true">' + STAR_SHAPE + '</svg>';
  };

  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function show(name) {
    ['menu', 'pause', 'result', 'board'].forEach(function (n) { els[n].hidden = (n !== name); });
    var playing = (name === null);
    els.hud.hidden = !(playing || name === 'pause');
    els.touch.hidden = !(playing && touchMode);
    if (name === 'menu' && !touchMode && els.playerName && !els.playerName.value) {
      setTimeout(function () { try { els.playerName.focus({ preventScroll: true }); } catch (e) { /* */ } }, 30);
    } else if (name) {
      var first = els[name].querySelector('.btn.primary');
      if (first && !touchMode) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) { /* */ } }, 30);
    } else if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }

  function syncMute() {
    var m = SA.Sound.isMuted();
    els.btnMute.classList.toggle('muted', m);
    els.btnMute.setAttribute('aria-label', m ? 'تشغيل الصوت' : 'كتم الصوت');
    els.btnMute.title = m ? 'تشغيل الصوت' : 'كتم الصوت';
    els.btnMuteMenu.textContent = m ? 'الصوت: مكتوم' : 'الصوت: يعمل';
    els.btnMutePause.textContent = m ? 'الصوت: مكتوم' : 'الصوت: يعمل';
  }

  // متى تظهر أزرار اللمس؟
  // - تلقائيًا على الأجهزة التي مؤشرها الأساسي لمس وبدون تمرير فأرة (الجوال والتابلت).
  // - تظهر فورًا عند أول لمسة للشاشة (مثل لابتوب بشاشة لمس).
  // - تختفي إذا استُخدم مفتاح لعب من لوحة مفاتيح حقيقية، وتعود مع أول لمسة.
  function detectTouch() {
    try {
      touchMode = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    } catch (e) {
      touchMode = ('ontouchstart' in window) && navigator.maxTouchPoints > 0;
    }
    document.documentElement.classList.toggle('is-touch', touchMode);
  }

  function setTouchMode(on, app) {
    if (touchMode === on) return;
    touchMode = on;
    document.documentElement.classList.toggle('is-touch', on);
    els.touch.hidden = !(on && app.mode === 'playing');
    if (app.onTouchModeChange) app.onTouchModeChange(on);
  }

  /* ---------- لوحة الأبطال ---------- */
  function renderBoard(res, highlightRank) {
    var list = els.boardList;
    list.textContent = '';
    if (!res.rows.length) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'لا توجد نتائج بعد. كن أول بطل!';
      list.appendChild(li);
    }
    res.rows.forEach(function (r, i) {
      var li = document.createElement('li');
      if (highlightRank && i + 1 === highlightRank) li.className = 'me';
      var rk = document.createElement('span'); rk.className = 'rk'; rk.textContent = i + 1;
      var cv = document.createElement('canvas'); cv.width = 16; cv.height = 21; cv.setAttribute('aria-hidden', 'true');
      try { SA.Art.drawPreview(cv, r.character === 'girl' ? 'girl' : 'boy'); } catch (e) { /* */ }
      var nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = r.name;
      var sc = document.createElement('span'); sc.className = 'sc'; sc.textContent = r.score;
      li.appendChild(rk); li.appendChild(cv); li.appendChild(nm); li.appendChild(sc);
      list.appendChild(li);
    });
    var note = res.online ? 'أفضل 10 نتائج لكل اللاعبين' : 'أفضل 10 نتائج على هذا الجهاز';
    if (res.error) note += ' (تعذّر الاتصال بالإنترنت)';
    els.boardNote.textContent = note;
  }

  function openBoard(from, preloaded, rank) {
    boardReturn = from;
    show('board');
    if (preloaded) { renderBoard(preloaded, rank); return; }
    els.boardNote.textContent = 'جاري التحميل...';
    els.boardList.textContent = '';
    SA.Leaderboard.top().then(function (res) { renderBoard(res, 0); });
  }

  function closeBoard() { show(boardReturn); }

  // يتحقق من الاسم ثم يبدأ اللعب
  function tryStart(app) {
    var name = SA.Leaderboard.cleanName(els.playerName.value);
    if (!name) {
      els.nameMsg.textContent = 'اكتب اسمك أولًا عشان يطلع في لوحة الأبطال';
      els.playerName.classList.add('invalid');
      try { els.playerName.focus({ preventScroll: true }); } catch (e) { els.playerName.focus(); }
      return false;
    }
    els.playerName.value = name;
    SA.Leaderboard.setName(name);
    if (els.playerName.blur) els.playerName.blur();
    app.start();
    return true;
  }

  // يحفظ النتيجة تلقائيًا باسم اللاعب
  function autoSave(d) {
    var name = SA.Leaderboard.lastName();
    els.lastBoard = null;
    els.lastRank = 0;
    if (!name || SA.Leaderboard.score(d) <= 0) { els.saveMsg.textContent = ''; return; }
    els.saveMsg.textContent = 'جاري حفظ نتيجتك...';
    SA.Leaderboard.submit(name, d).then(function (res) {
      var msg;
      if (!res.rank) msg = 'تم حفظ نتيجتك يا ' + name + '، لكنك خارج العشرة الأوائل هذه المرة';
      else if (res.best > res.score) msg = name + '، ترتيبك ' + res.rank + ' بأفضل نتيجة لك (' + res.best + ')';
      else msg = 'مبروك ' + name + '! ترتيبك ' + res.rank + ' في لوحة الأبطال';
      if (res.error) msg += ' (حُفظت على هذا الجهاز لأن الاتصال تعذّر)';
      els.saveMsg.textContent = msg;
      els.lastBoard = res;
      els.lastRank = res.rank;
    });
  }

  return {
    init: function (app) {
      ['hud', 'menu', 'pause', 'result', 'touch', 'toast', 'coinCount', 'coinTotal', 'hearts',
        'btnStart', 'btnMute', 'btnPause', 'btnMuteMenu', 'btnResume', 'btnRestart', 'btnMutePause',
        'btnToMenu', 'btnAgain', 'btnResultMenu', 'resultTitle', 'resultText', 'resultStats', 'resultStars',
        'board', 'boardList', 'boardNote', 'btnBoardMenu', 'btnBoardBack', 'btnResultBoard',
        'resultScore', 'startForm', 'playerName', 'nameMsg', 'saveMsg']
        .forEach(function (id) { els[id] = $(id); });

      detectTouch();
      window.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') setTouchMode(true, app);
      }, true);
      this.keyboardUsed = function () { setTouchMode(false, app); };

      function click(el, fn) {
        el.addEventListener('click', function (e) { e.preventDefault(); fn(); el.blur(); });
      }
      click(els.btnPause, function () { app.togglePause(); });
      click(els.btnResume, function () { app.resume(); });
      click(els.btnRestart, function () { app.restartLevel(); });
      click(els.btnToMenu, function () { app.toMenu(); });
      click(els.btnAgain, function () { app.restartLevel(); });
      click(els.btnResultMenu, function () { app.toMenu(); });
      click(els.btnBoardMenu, function () { openBoard('menu'); });
      click(els.btnResultBoard, function () { openBoard('result', els.lastBoard, els.lastRank); });
      click(els.btnBoardBack, closeBoard);
      // اسم اللاعب قبل البداية
      els.playerName.value = SA.Leaderboard.lastName();
      els.startForm.addEventListener('submit', function (e) { e.preventDefault(); tryStart(app); });
      els.playerName.addEventListener('input', function () {
        els.playerName.classList.remove('invalid');
        els.nameMsg.textContent = '';
      });
      var toggleMute = function () { SA.Sound.toggle(); SA.Sound.unlock(); syncMute(); };
      click(els.btnMute, toggleMute);
      click(els.btnMuteMenu, toggleMute);
      click(els.btnMutePause, toggleMute);
      syncMute();

      // اختيار الشخصية
      var picks = document.querySelectorAll('.pick[data-char]');
      function selectChar(ch) {
        app.setCharacter(ch);
        for (var i = 0; i < picks.length; i++) {
          picks[i].setAttribute('aria-pressed', picks[i].getAttribute('data-char') === ch ? 'true' : 'false');
        }
      }
      for (var i = 0; i < picks.length; i++) {
        (function (btn) {
          var cv = btn.querySelector('canvas');
          if (cv && SA.Art.drawPreview) SA.Art.drawPreview(cv, btn.getAttribute('data-char'));
          btn.addEventListener('click', function (e) { e.preventDefault(); selectChar(btn.getAttribute('data-char')); });
        })(picks[i]);
      }
      selectChar(app.character);
    },

    show: show,

    setCoins: function (n, total) {
      els.coinCount.textContent = n;
      els.coinTotal.textContent = total;
    },

    setLives: function (n) {
      var slots = Math.max(n, SA.CONFIG.lives), html = '';
      for (var i = 0; i < slots; i++) html += (i < n ? HEART_FULL : HEART_EMPTY);
      els.hearts.innerHTML = html;
      els.hearts.setAttribute('aria-label', 'المحاولات المتبقية: ' + Math.max(0, n));
    },

    toast: function (msg) {
      els.toast.textContent = msg;
      els.toast.hidden = false;
      els.toast.classList.remove('in');
      void els.toast.offsetWidth;
      els.toast.classList.add('in');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { els.toast.hidden = true; }, 2200);
    },

    showResult: function (win, data) {
      els.result.classList.toggle('win', win);
      els.result.classList.toggle('lose', !win);
      if (win) {
        var ratio = data.total ? data.coins / data.total : 0;
        var stars = ratio >= 1 ? 3 : ratio >= 0.6 ? 2 : 1;
        els.resultTitle.textContent = 'أحسنت! وصلت القرية';
        els.resultText.textContent = ratio >= 1 ? 'جمعت كل العملات. مغامرة كاملة!' : 'حاول تجمع كل العملات في المرة القادمة.';
        els.resultStars.innerHTML = STAR(stars >= 1) + STAR(stars >= 2) + STAR(stars >= 3);
        els.resultStars.hidden = false;
        els.resultStats.innerHTML =
          '<div><dt>العملات</dt><dd>' + data.coins + ' / ' + data.total + '</dd></div>' +
          '<div><dt>الوقت</dt><dd>' + fmtTime(data.time) + '</dd></div>' +
          '<div><dt>القلوب</dt><dd>' + data.lives + '</dd></div>';
        els.btnAgain.textContent = 'العب مرة أخرى';
      } else {
        els.resultTitle.textContent = 'انتهت المحاولات';
        els.resultText.textContent = 'لا بأس! سترجع إلى بداية المرحلة بثلاثة قلوب جديدة.';
        els.resultStars.hidden = true;
        els.resultStats.innerHTML = '<div><dt>العملات</dt><dd>' + data.coins + ' / ' + data.total + '</dd></div>';
        els.btnAgain.textContent = 'ابدأ من البداية';
      }
      // النقاط والحفظ التلقائي باسم اللاعب
      lastResult = { coins: data.coins, time: data.time || 0, lives: data.lives || 0, win: win, character: data.character };
      els.resultScore.textContent = SA.Leaderboard.score(lastResult);
      autoSave(lastResult);
      show('result');
    },

    isTouch: function () { return touchMode; },
    isBoardOpen: function () { return !els.board.hidden; },
    tryStart: function (app) { return tryStart(app); },
    closeBoard: closeBoard
  };
})();
