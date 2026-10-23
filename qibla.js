(function () {
  const $ = id => document.getElementById(id);
  const K_LAT = 21.4225, K_LNG = 39.8262; // الكعبة المشرفة

  let qiblaDeg = null;  // زاوية القبلة من الشمال
  let heading = null;   // اتجاه الهاتف الحالي
  let listening = false;

  // حساب زاوية القبلة من الشمال حسب الإحداثيات
  function bearing(lat, lng) {
    const r = d => d * Math.PI / 180;
    const p1 = r(lat), l1 = r(lng), p2 = r(K_LAT), l2 = r(K_LNG);
    const y = Math.sin(l2 - l1);
    const x = Math.cos(p1) * Math.tan(p2) - Math.sin(p1) * Math.cos(l2 - l1);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  function draw() {
    const arrow = $('qArrow');
    if (!arrow || qiblaDeg === null) return;
    if (heading === null) {
      arrow.style.transform = 'rotate(' + qiblaDeg + 'deg)';
      $('qStatus').textContent = 'البوصلة غير مفعّلة، اتجه نحو الشمال ثم ابحث عن الاتجاه المعروض';
      return;
    }
    const rot = (qiblaDeg - heading + 360) % 360;
    arrow.style.transform = 'rotate(' + rot + 'deg)';
    const diff = Math.min(rot, 360 - rot);
    $('qStatus').textContent = diff < 5 ? 'أنت متجه نحو القبلة ✅' : 'القبلة على بعد ' + Math.round(diff) + '°';
  }

  function onOrient(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading; // iPhone
    else if (typeof e.alpha === 'number') h = (360 - e.alpha) % 360;           // Android
    if (h !== null) { heading = h; draw(); }
  }

  function startCompass() {
    if (listening) return;
    listening = true;
    window.addEventListener('deviceorientationabsolute', onOrient, true);
    window.addEventListener('deviceorientation', onOrient, true);
  }

  // زر تفعيل البوصلة (iPhone يحتاج ضغطة من المستخدم لطلب الإذن)
  window.enableCompass = async function () {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const s = await DeviceOrientationEvent.requestPermission();
        if (s !== 'granted') { $('qMsg').textContent = 'لم تُمنح إذن البوصلة'; return; }
      }
      startCompass();
      $('qMsg').textContent = 'حرّك الهاتف قليلاً لمعايرة البوصلة';
    } catch (e) {
      $('qMsg').textContent = 'هذا المتصفح لا يدعم البوصلة';
    }
  };

  window.loadQibla = function () {
    if (!$('qArrow')) return;
    $('qMsg').textContent = 'جارٍ تحديد موقعك...';
    if (!navigator.geolocation) { $('qMsg').textContent = 'المتصفح لا يدعم تحديد الموقع'; return; }
    navigator.geolocation.getCurrentPosition(
      p => {
        qiblaDeg = bearing(p.coords.latitude, p.coords.longitude);
        $('qDeg').textContent = 'زاوية القبلة: ' + Math.round(qiblaDeg) + '° من الشمال';
        $('qMsg').textContent = '';
        draw();
      },
      () => { $('qMsg').textContent = 'تعذر تحديد موقعك. فعّل الموقع وأعد المحاولة.'; },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // إضافة البطاقة بعد بطاقة مواعيد الصلاة
  if (typeof VIEWS !== 'undefined' && typeof TOOLS !== 'undefined' && !VIEWS.qibla) {
    VIEWS.qibla = {
      html: `<h2>اتجاه القبلة</h2>
        <div style="display:flex;justify-content:center;margin:10px 0">
          <svg id="qArrow" width="220" height="220" viewBox="0 0 220 220" style="transition:transform .15s">
            <circle cx="110" cy="110" r="100" fill="none" stroke="#00f2fe" stroke-width="2"/>
            <polygon points="110,40 128,130 110,118 92,130" fill="#00f2fe"/>
            <text x="110" y="28" text-anchor="middle" font-size="26">🕋</text>
          </svg>
        </div>
        <p id="qDeg" class="res" style="text-align:center"></p>
        <p id="qStatus" class="muted" style="text-align:center"></p>
        <p id="qMsg" class="muted" style="text-align:center"></p>
        <button class="btn" onclick="enableCompass()">🧭 تفعيل البوصلة</button>`,
      init: loadQibla
    };
    const idx = TOOLS.findIndex(t => t[0] === 'prayer');
    TOOLS.splice(idx + 1, 0, ['qibla', '🕋', 'اتجاه القبلة', 'اتجاه الكعبة من موقعك', '#00f2fe']);
    $('grid').innerHTML = TOOLS.map(t =>
      `<div class="card ${t[5] ? 'wide' : ''}" style="--c:${t[4]}" onclick="openTool('${t[0]}')"><span class="ic">${t[1]}</span><div><b>${t[2]}</b><small>${t[3]}</small></div></div>`
    ).join('');
  }
})();
