/*
  التحكم: لوحة المفاتيح + أزرار اللمس (ضغط مستمر).
  الحالة محفوظة هنا ويقرأها مشهد اللعب كل إطار.
*/
window.SA = window.SA || {};

SA.Input = (function () {
  'use strict';

  var sources = { left: {}, right: {}, jump: {} };
  var jumpQueued = false;
  var handlers = { pause: null, confirm: null, keyboardUsed: null, isPlaying: null };

  var KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    Space: 'jump', ArrowUp: 'jump', KeyW: 'jump'
  };

  function count(action) { return Object.keys(sources[action]).length; }

  function set(action, src, down) {
    var before = count(action) > 0;
    if (down) sources[action][src] = true;
    else delete sources[action][src];
    if (action === 'jump' && down && !before) jumpQueued = true;
  }

  function clearAll() {
    sources = { left: {}, right: {}, jump: {} };
    jumpQueued = false;
    touchPointers = {};
    var btns = document.querySelectorAll('.tbtn.active');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  }

  // الكتابة في خانة نصية (مثل اسم اللاعب) لا تُعتبر أوامر لعب
  function isTyping(e) {
    var t = e.target;
    return !!(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable));
  }

  function onKeyDown(e) {
    if (isTyping(e)) return;
    var code = e.code || '';
    // دعم لوحات مفاتيح بدون e.code
    if (!code) {
      if (e.key === ' ') code = 'Space';
      else if (e.key === 'Escape') code = 'Escape';
      else if (e.key === 'Enter') code = 'Enter';
      else if (/^Arrow/.test(e.key)) code = e.key;
    }
    if (code === 'Escape' || code === 'KeyP') {
      e.preventDefault();
      if (!e.repeat && handlers.pause) handlers.pause();
      return;
    }
    if (code === 'Enter' || code === 'NumpadEnter') {
      if (!e.repeat && handlers.confirm && handlers.confirm()) e.preventDefault();
      return;
    }
    var action = KEYMAP[code];
    if (action) {
      e.preventDefault(); // يمنع تمرير الصفحة وتفعيل الأزرار بالمسافة
      if (!e.repeat) set(action, 'k:' + code, true);
      if (handlers.keyboardUsed) handlers.keyboardUsed();
    }
  }

  function onKeyUp(e) {
    if (isTyping(e)) return;
    var code = e.code || (e.key === ' ' ? 'Space' : e.key);
    var action = KEYMAP[code];
    if (action) {
      e.preventDefault();
      set(action, 'k:' + code, false);
    }
  }

  /* ---------- أزرار اللمس ----------
     كل إصبع (pointerId) يُتابَع وحده، ويُحدَّد الزر الذي تحته في كل حركة:
     - الضغط المستمر = حركة مستمرة، ورفع الإصبع يوقفها فورًا.
     - خروج الإصبع من الزر يوقف الحركة، وانزلاقه لزر آخر يفعّل الزر الجديد.
     - أكثر من إصبع معًا (اتجاه + قفز) مدعوم.
     الأزرار تغذي نفس حالة لوحة المفاتيح (set)، فلا يوجد نظام حركة منفصل. */
  var touchPointers = {}; // pointerId -> 'left' | 'right' | 'jump' | null
  var touchRoot = null;

  function actionAt(x, y) {
    var el = document.elementFromPoint(x, y);
    var btn = el && el.closest ? el.closest('.tbtn[data-act]') : null;
    return (btn && touchRoot && touchRoot.contains(btn) && !touchRoot.hidden) ? btn.getAttribute('data-act') : null;
  }

  function refreshActive() {
    if (!touchRoot) return;
    var on = {};
    Object.keys(touchPointers).forEach(function (id) { if (touchPointers[id]) on[touchPointers[id]] = true; });
    var btns = touchRoot.querySelectorAll('.tbtn[data-act]');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', !!on[btns[i].getAttribute('data-act')]);
  }

  function setPointer(id, action) {
    var prev = touchPointers[id] || null;
    if (prev === action) return;
    if (prev) set(prev, 'p:' + id, false);
    if (action) set(action, 'p:' + id, true);
    touchPointers[id] = action;
    refreshActive();
  }

  function endPointer(e) {
    if (!(e.pointerId in touchPointers)) return;
    setPointer(e.pointerId, null);
    delete touchPointers[e.pointerId];
  }

  function bindTouchControls(root) {
    touchRoot = root;
    root.addEventListener('pointerdown', function (e) {
      var btn = e.target.closest ? e.target.closest('.tbtn[data-act]') : null;
      if (!btn) return;
      e.preventDefault();
      // اللمس يمسك الإصبع بالعنصر تلقائيًا؛ نفكّه حتى نعرف متى يخرج الإصبع من الزر
      try { if (e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId); } catch (err) { /* */ }
      setPointer(e.pointerId, btn.getAttribute('data-act'));
    });
    root.addEventListener('gotpointercapture', function (e) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (err) { /* */ }
    });
    window.addEventListener('pointermove', function (e) {
      if (e.pointerId in touchPointers) setPointer(e.pointerId, actionAt(e.clientX, e.clientY));
    }, { passive: true });
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
    root.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  return {
    init: function (opts) {
      handlers.pause = opts.onPause || null;
      handlers.confirm = opts.onConfirm || null;
      handlers.keyboardUsed = opts.onKeyboardUsed || null;
      handlers.isPlaying = opts.isPlaying || function () { return true; };
      window.addEventListener('keydown', onKeyDown, { passive: false });
      window.addEventListener('keyup', onKeyUp, { passive: false });
      window.addEventListener('blur', clearAll);
      document.addEventListener('visibilitychange', function () { if (document.hidden) clearAll(); });
      var root = document.getElementById('touch');
      if (root) bindTouchControls(root);
      // منع تمرير الصفحة والتكبير باللمس أثناء اللعب فقط (القوائم تبقى قابلة للتمرير)
      document.addEventListener('touchmove', function (e) {
        var t = e.target;
        var inControls = t.closest && t.closest('#touch, #game');
        if (inControls || (handlers.isPlaying() && !(t.closest && t.closest('.scrollable')))) e.preventDefault();
      }, { passive: false });
      document.addEventListener('gesturestart', function (e) { if (handlers.isPlaying()) e.preventDefault(); });
    },
    isDown: function (action) { return count(action) > 0; },
    consumeJump: function () { var j = jumpQueued; jumpQueued = false; return j; },
    clear: clearAll,
    // للاختبار الآلي
    _set: set
  };
})();
