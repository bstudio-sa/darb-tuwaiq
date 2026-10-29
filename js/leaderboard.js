/*
  لوحة الأبطال (أفضل 10 نتائج)
  ------------------------------------------------------------
  تعمل بطريقتين:
  1) على الجهاز (تلقائيًا): النتائج محفوظة في متصفح اللاعب فقط.
  2) أونلاين (Supabase): كل اللاعبين من أي جهاز في لوحة واحدة.
     تتفعل تلقائيًا إذا عبّيتِ supabaseUrl و supabaseKey في js/config.js
     (خطوات الإعداد في README.md).
*/
window.SA = window.SA || {};

SA.Leaderboard = (function () {
  'use strict';

  var LOCAL_KEY = 'sa_scores_v1';
  var NAME_KEY = 'sa_player_name';
  var TOP = 10;

  /* ---------- حساب النقاط ---------- */
  // عملة = 10 | الوصول للبوابة = 500 | كل قلب متبقٍ عند الفوز = 100
  // مكافأة السرعة عند الفوز: 5 نقاط لكل ثانية تحت 3 دقائق
  function score(d) {
    var s = d.coins * 10;
    if (d.win) {
      s += 500 + d.lives * 100 + Math.max(0, 180 - Math.floor(d.time)) * 5;
    }
    return s;
  }

  function cfg() {
    var c = SA.LEADERBOARD || {};
    var url = (c.supabaseUrl || '').replace(/\/+$/, '');
    return { url: url, key: c.supabaseKey || '', table: c.table || 'scores' };
  }

  function isOnline() {
    var c = cfg();
    return !!(c.url && c.key);
  }

  function cleanName(n) {
    return String(n || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  }

  function sortRows(rows) {
    return rows.sort(function (a, b) { return (b.score - a.score) || (a.time_sec - b.time_sec); });
  }

  // كل اسم يظهر مرة واحدة بأفضل نتيجة له
  function bestPerName(rows) {
    var seen = {}, out = [];
    sortRows(rows.slice()).forEach(function (r) {
      var k = String(r.name).toLowerCase();
      if (seen[k]) return;
      seen[k] = true;
      out.push(r);
    });
    return out;
  }

  /* ---------- على الجهاز ---------- */
  function localRead() {
    try {
      var rows = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch (e) { return []; }
  }

  function localAdd(row) {
    var rows = sortRows(localRead().concat([row])).slice(0, 200);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows)); } catch (e) { /* */ }
    return rows;
  }

  /* ---------- أونلاين (Supabase REST) ---------- */
  function headers(extra) {
    var c = cfg();
    var h = { apikey: c.key, Authorization: 'Bearer ' + c.key, 'Content-Type': 'application/json' };
    for (var k in extra) h[k] = extra[k];
    return h;
  }

  function onlineTop() {
    var c = cfg();
    var q = '?select=name,score,coins,time_sec,character,win&order=score.desc,time_sec.asc&limit=100';
    return fetch(c.url + '/rest/v1/' + c.table + q, { headers: headers({}) }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function onlineAdd(row) {
    var c = cfg();
    return fetch(c.url + '/rest/v1/' + c.table, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(row)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
    });
  }

  /* ---------- الواجهة العامة ---------- */
  return {
    TOP: TOP,
    score: score,
    isOnline: isOnline,
    cleanName: cleanName,

    lastName: function () {
      if (this._name) return this._name;
      try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; }
    },

    setName: function (name) {
      this._name = cleanName(name);
      try { localStorage.setItem(NAME_KEY, this._name); } catch (e) { /* */ }
    },

    // يرجع { rows, online, error }
    top: function () {
      if (!isOnline()) return Promise.resolve({ rows: bestPerName(localRead()).slice(0, TOP), online: false });
      return onlineTop().then(function (rows) {
        return { rows: bestPerName(rows).slice(0, TOP), online: true };
      }).catch(function (err) {
        return { rows: bestPerName(localRead()).slice(0, TOP), online: false, error: String(err && err.message || err) };
      });
    },

    // يحفظ النتيجة ويرجع { rows, online, rank, error }
    submit: function (name, d) {
      var row = {
        name: cleanName(name),
        score: score(d),
        coins: d.coins,
        time_sec: Math.max(1, Math.round(d.time)),
        character: d.character === 'girl' ? 'girl' : 'boy',
        win: !!d.win
      };
      try { localStorage.setItem(NAME_KEY, row.name); } catch (e) { /* */ }
      var self = this;
      // ترتيب اللاعب = مكان اسمه في اللوحة، و best = أفضل نتيجة له فيها
      function withRank(res) {
        res.rank = 0;
        for (var i = 0; i < res.rows.length; i++) {
          if (String(res.rows[i].name).toLowerCase() === row.name.toLowerCase()) {
            res.rank = i + 1;
            res.best = res.rows[i].score;
            break;
          }
        }
        res.score = row.score;
        return res;
      }
      if (!isOnline()) {
        localAdd(row);
        return Promise.resolve(withRank({ rows: bestPerName(localRead()).slice(0, TOP), online: false }));
      }
      return onlineAdd(row).then(function () {
        localAdd(row);
        return self.top();
      }).then(withRank).catch(function (err) {
        localAdd(row);
        var res = withRank({ rows: bestPerName(localRead()).slice(0, TOP), online: false });
        res.error = String(err && err.message || err);
        return res;
      });
    }
  };
})();
