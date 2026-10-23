(function () {
  const $ = id => document.getElementById(id);

  /* ===== وضع القراءة الليلية ===== */
  const night = document.createElement('div');
  night.id = 'nightLayer';
  night.style.cssText = 'position:fixed;inset:0;pointer-events:none;background:rgba(255,140,0,.35);mix-blend-mode:multiply;z-index:150;display:none';
  document.body.appendChild(night);

  window.setNight = function (on) {
    night.style.display = on ? 'block' : 'none';
    try { localStorage.setItem('sturix_night', on ? '1' : '0'); } catch (e) {}
    const b = $('nightBtn');
    if (b) b.textContent = on ? 'إيقاف الوضع الليلي' : 'تشغيل الوضع الليلي';
  };
  window.toggleNight = () => setNight(night.style.display === 'none');
  let nightOn = false;
  try { nightOn = localStorage.getItem('sturix_night') === '1'; } catch (e) {}
  setNight(nightOn);

  /* ===== محوّل التوقيت العالمي ===== */
  const ZONES = [
    ['Africa/Algiers', 'الجزائر'], ['Asia/Riyadh', 'الرياض'], ['Asia/Dubai', 'دبي'],
    ['Europe/Istanbul', 'إسطنبول'], ['Europe/Paris', 'باريس'], ['Europe/London', 'لندن'],
    ['America/New_York', 'نيويورك'], ['Asia/Tokyo', 'طوكيو']
  ];

  function tzOffset(date, tz) {
    const p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
      .formatToParts(date).forEach(x => p[x.type] = +x.value);
    const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return asUTC - Math.floor(date.getTime() / 1000) * 1000;
  }

  function wallToInstant(str, tz) {
    const [dp, tp] = str.split('T');
    const [Y, M, D] = dp.split('-').map(Number);
    const [h, mi] = tp.split(':').map(Number);
    const t = Date.UTC(Y, M - 1, D, h, mi);
    const off1 = tzOffset(new Date(t), tz);
    const guess = t - off1;
    const off2 = tzOffset(new Date(guess), tz);
    return off1 === off2 ? guess : t - off2;
  }

  window.convertTz = function () {
    const v = $('tzIn').value;
    if (!v) return;
    const inst = new Date(wallToInstant(v, $('tzFrom').value));
    const fmt = tz => new Intl.DateTimeFormat('ar', { timeZone: tz, dateStyle: 'full', timeStyle: 'short' }).format(inst);
    $('tzOut').innerHTML = '<b>' + fmt($('tzTo').value) + '</b>';
  };

  function zoneOptions(sel) {
    return ZONES.map(z => `<option value="${z[0]}"${z[0] === sel ? ' selected' : ''}>${z[1]}</option>`).join('');
  }

  /* ===== تنبيه اكتمال الشحن ===== */
  let notified = false;

  function getThr() {
    return +(localStorage.getItem('sturix_bthr') || 80);
  }

  function notify(msg) {
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Sturix', { body: msg });
    else alert(msg);
  }

  function checkBattery() {
    if (!navigator.getBattery) return;
    navigator.getBattery().then(b => {
      const lvl = Math.round(b.level * 100), thr = getThr();
      if (lvl < thr) notified = false;
      if (b.charging && lvl >= thr && !notified) {
        notified = true;
        notify('البطارية وصلت إلى ' + lvl + '% وهي تشحن. افصل الشاحن.');
      }
      const s = $('batStatus');
      if (s) s.textContent = 'النسبة الحالية: ' + lvl + '%' + (b.charging ? ' (تشحن الآن)' : ' (غير مشحونة)');
    }).catch(() => {});
  }

  window.saveThr = function () {
    const v = +$('bThr').value;
    if (!v || v < 1 || v > 100) { $('batMsg').textContent = 'أدخل نسبة بين 1 و100'; return; }
    localStorage.setItem('sturix_bthr', v);
    notified = false;
    $('batMsg').textContent = 'تم الحفظ، سينبهك عند ' + v + '% أثناء الشحن';
    checkBattery();
  };

  window.askNotify = async function () {
    if (!('Notification' in window)) { $('batMsg').textContent = 'المتصفح لا يدعم الإشعارات'; return; }
    const p = await Notification.requestPermission();
    $('batMsg').textContent = p === 'granted' ? 'الإشعارات مفعلة' : 'لم تُمنح إذن الإشعارات، وسيظهر التنبيه كنافذة عادية';
  };

  /* ===== حاسبة البطارية ===== */
  window.calcBattery = function () {
    const cap = +$('bCap').value, pct = +$('bPct').value, use = +$('bUse').value;
    if (!cap || !pct || !use) { $('bRes').textContent = 'أدخل السعة والنسبة والاستهلاك'; return; }
    const hours = cap * (pct / 100) / use;
    const h = Math.floor(hours), m = Math.round((hours - h) * 60);
    $('bRes').textContent = 'المدة التقريبية: ' + h + ' ساعة و' + m + ' دقيقة';
  };

  /* ===== الواجهات والتسجيل ===== */
  if (typeof VIEWS !== 'undefined' && typeof TOOLS !== 'undefined' && !VIEWS.timezone) {
    Object.assign(VIEWS, {
      timezone: {
        html: `<h2>محوّل التوقيت العالمي</h2>
          <input id="tzIn" type="datetime-local" class="inp">
          <div class="row"><select id="tzFrom" class="inp" style="margin:0;flex:1">${zoneOptions('Africa/Algiers')}</select>
          <select id="tzTo" class="inp" style="margin:0;flex:1">${zoneOptions('Europe/Paris')}</select></div>
          <button class="btn" onclick="convertTz()">تحويل</button>
          <div id="tzOut" class="res"></div>
          <h3 style="margin:18px 0 6px;font-size:15px">الوقت الآن في المدن</h3>
          <div id="tzList"></div>`,
        init: () => {
          const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
          $('tzIn').value = now.toISOString().slice(0, 16);
          convertTz();
          $('tzList').innerHTML = ZONES.map(z =>
            `<div class="list" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b"><span>${z[1]}</span><b>${new Intl.DateTimeFormat('ar', { timeZone: z[0], hour: '2-digit', minute: '2-digit' }).format(new Date())}</b></div>`
          ).join('');
        }
      },
      night: {
        html: `<h2>وضع القراءة الليلية</h2>
          <p class="muted">فلتر برتقالي يقلل الضوء الأزرق، ويبقى مفعلاً حتى تطفئه.</p>
          <button class="btn" id="nightBtn" onclick="toggleNight()"></button>`,
        init: () => { $('nightBtn').textContent = night.style.display === 'none' ? 'تشغيل الوضع الليلي' : 'إيقاف الوضع الليلي'; }
      },
      battery: {
        html: `<h2>تنبيه اكتمال الشحن</h2>
          <p id="batStatus" class="res">جارٍ قراءة البطارية...</p>
          <label class="muted">نبّهني عند هذه النسبة أثناء الشحن:</label>
          <input id="bThr" type="number" min="1" max="100" class="inp" value="${getThr()}">
          <button class="btn" onclick="saveThr()">حفظ</button>
          <button class="btn" style="background:#111827;color:#00f2fe;border:1px solid #00f2fe" onclick="askNotify()">🔔 تفعيل الإشعارات</button>
          <div id="batMsg" class="muted" style="margin-top:10px"></div>`,
        init: checkBattery
      },
      batcalc: {
        html: `<h2>حاسبة البطارية</h2>
          <input id="bCap" type="number" class="inp" placeholder="سعة البطارية بـ mAh (مثال 5000)">
          <input id="bPct" type="number" class="inp" placeholder="النسبة الحالية %">
          <input id="bUse" type="number" class="inp" placeholder="متوسط الاستهلاك بـ mA">
          <button class="btn" onclick="calcBattery()">حساب</button>
          <div id="bRes" class="res"></div>
          <p class="muted">تقدير تقريبي مبني على ما تدخله، وليس قياساً فعلياً لبطاريتك.</p>`
      }
    });

    TOOLS.splice(TOOLS.length - 1, 0,
      ['timezone', '🕰️', 'محول التوقيت العالمي', 'تحويل الوقت بين المدن', '#168bff'],
      ['night', '🌙', 'وضع القراءة الليلية', 'فلتر الضوء الأزرق', '#a735ff'],
      ['battery', '🔋', 'تنبيه الشحن', 'إشعار عند الوصول لنسبة', '#ff9d22'],
      ['batcalc', '⚡', 'حاسبة البطارية', 'تقدير مدة التشغيل', '#ff24b8']
    );
    $('grid').innerHTML = TOOLS.map(t =>
      `<div class="card ${t[5] ? 'wide' : ''}" style="--c:${t[4]}" onclick="openTool('${t[0]}')"><span class="ic">${t[1]}</span><div><b>${t[2]}</b><small>${t[3]}</small></div></div>`
    ).join('');
  }

  setInterval(checkBattery, 60000);
  checkBattery();
})();
