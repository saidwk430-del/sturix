(function () {
  const $ = id => document.getElementById(id);
  const WORKER_URL = 'PUT_YOUR_WORKER_URL_HERE';

  /* ===== الذكاء الاصطناعي ===== */
  function bubble(text, cls) {
    const box = $('cbox');
    const d = document.createElement('div');
    d.className = 'bub ' + cls;
    d.textContent = text;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
    return d;
  }

  function localReply(t) {
    const q = t.trim();
    if (/^[0-9+\-*\/.() ×÷]+$/.test(q)) {
      try {
        const s = q.replace(/×/g, '*').replace(/÷/g, '/');
        return 'النتيجة: ' + Function('"use strict";return (' + s + ')')();
      } catch (e) {}
    }
    if (q.includes('الساعة') || q.includes('الوقت')) return 'الوقت الآن: ' + new Date().toLocaleTimeString('ar');
    if (q.includes('التاريخ') || q.includes('اليوم')) return 'اليوم: ' + new Date().toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (q.includes('مرحبا') || q.includes('السلام')) return 'وعليكم السلام ورحمة الله! كيف أساعدك؟';
    return 'لا أستطيع الإجابة عن هذا الآن، لأن خدمة الذكاء الاصطناعي غير متصلة. جرّب لاحقاً، أو اسألني عن الوقت أو عملية حسابية.';
  }

  async function ask(question) {
    if (WORKER_URL.startsWith('PUT_')) throw new Error('no worker');
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: ctl.signal
      });
      const d = await r.json();
      if (!r.ok || !d.answer) throw new Error('bad response');
      return d.answer;
    } finally {
      clearTimeout(timer);
    }
  }

  window.smsg = async function () {
    const input = $('cinput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    bubble(text, 'me');
    const wait = bubble('يكتب...', 'bot');
    try {
      wait.textContent = await ask(text);
    } catch (e) {
      wait.textContent = localReply(text);
    }
    $('cbox').scrollTop = $('cbox').scrollHeight;
  };

  /* ===== الترجمة ===== */
  async function getJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }

  window.translate = async function () {
    const txt = $('tIn').value.trim();
    const out = $('tOut');
    if (!txt) { out.textContent = 'الرجاء كتابة نص للترجمة'; return; }
    const [sl, tl] = $('tPair').value.split('|');
    out.textContent = 'جارٍ الترجمة...';
    try {
      const d = await getJson('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(txt) + '&langpair=' + sl + '|' + tl);
      const t = d.responseData && d.responseData.translatedText;
      if (!t) throw new Error('empty');
      out.textContent = t;
    } catch (e) {
      try {
        const d = await getJson('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + sl + '&tl=' + tl + '&dt=t&q=' + encodeURIComponent(txt));
        out.textContent = d[0].map(x => x[0]).join('');
      } catch (e2) {
        out.textContent = 'تعذرت الترجمة. تحقق من اتصال الإنترنت وجرّب مرة أخرى.';
      }
    }
  };

  /* ===== مواعيد الصلاة ===== */
  const style = document.createElement('style');
  style.textContent = '.prow{display:flex;justify-content:space-between;padding:10px 4px;border-bottom:1px solid #1e293b}.prow.now{color:#00f2fe;font-weight:bold}';
  document.head.appendChild(style);

  const NAMES = { Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
  const ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  let lastTimings = null, lastLabel = '';

  const toMin = hhmm => { const [h, m] = hhmm.split(' ')[0].split(':').map(Number); return h * 60 + m; };

  function nextPrayer(t) {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    for (const k of ORDER) {
      if (toMin(t[k]) > mins) return { k, at: toMin(t[k]), mins };
    }
    return { k: 'Fajr', at: toMin(t.Fajr) + 1440, mins };
  }

  function showPrayer(t, label) {
    const n = nextPrayer(t);
    const left = n.at - n.mins;
    const rows = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(k =>
      `<div class="prow${k === n.k ? ' now' : ''}"><span>${NAMES[k]}</span><b>${t[k].split(' ')[0]}</b></div>`
    ).join('');
    $('pOut').innerHTML =
      `<div class="muted">${label}</div>` +
      `<div class="res">الصلاة القادمة: <b>${NAMES[n.k]}</b> بعد ${Math.floor(left / 60)} ساعة و${left % 60} دقيقة</div>` +
      rows;
  }

  async function loadByCoords(lat, lng) {
    const d = new Date();
    const url = `https://api.aladhan.com/v1/timings/${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}?latitude=${lat}&longitude=${lng}&method=4`;
    const j = await getJson(url);
    lastTimings = j.data.timings;
    lastLabel = 'موقعك الحالي';
    showPrayer(lastTimings, lastLabel);
  }

  async function loadByCity(city) {
    const j = await getJson('https://api.aladhan.com/v1/timingsByCity?city=' + encodeURIComponent(city) + '&country=&method=4');
    lastTimings = j.data.timings;
    lastLabel = 'مدينة: ' + city;
    showPrayer(lastTimings, lastLabel);
  }

  window.loadPrayerGeo = function () {
    if (!$('pOut')) return;
    $('pOut').textContent = 'جارٍ تحديد موقعك...';
    if (!navigator.geolocation) {
      $('pOut').textContent = 'المتصفح لا يدعم تحديد الموقع، اكتب اسم مدينتك بالأعلى.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => loadByCoords(p.coords.latitude, p.coords.longitude).catch(() => { $('pOut').textContent = 'تعذر جلب المواعيد، تحقق من الإنترنت.'; }),
      () => { $('pOut').textContent = 'لم تُمنح إذن الموقع. اكتب اسم مدينتك بالأعلى.'; },
      { timeout: 15000 }
    );
  };

  window.loadPrayerCity = function () {
    const c = $('pCity').value.trim();
    if (!c) return;
    $('pOut').textContent = 'جارٍ جلب المواعيد...';
    loadByCity(c).catch(() => { $('pOut').textContent = 'تعذر إيجاد هذه المدينة، جرّب اسماً آخر.'; });
  };

  setInterval(() => {
    if (lastTimings && $('pOut') && $('pOut').isConnected) showPrayer(lastTimings, lastLabel);
  }, 60000);

  if (typeof VIEWS !== 'undefined' && typeof TOOLS !== 'undefined') {
    VIEWS.prayer = {
      html: `<h2>مواعيد الصلاة</h2>
        <div class="row">
          <input id="pCity" class="inp" style="margin:0;flex:1" placeholder="اسم مدينتك...">
          <button class="send" onclick="loadPrayerCity()">بحث</button>
        </div>
        <button class="btn" onclick="loadPrayerGeo()">📍 استخدم موقعي</button>
        <div id="pOut" class="muted" style="margin-top:12px"></div>`,
      init: () => loadPrayerGeo()
    };
    TOOLS.splice(TOOLS.length - 1, 0, ['prayer', '🕌', 'مواعيد الصلاة', 'أوقات الصلاة حسب موقعك', '#00f2fe']);
    $('grid').innerHTML = TOOLS.map(t =>
      `<div class="card ${t[5] ? 'wide' : ''}" style="--c:${t[4]}" onclick="openTool('${t[0]}')"><span class="ic">${t[1]}</span><div><b>${t[2]}</b><small>${t[3]}</small></div></div>`
    ).join('');
  }
})();
