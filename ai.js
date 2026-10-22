(function () {
  // ضع هنا رابط Cloudflare Worker بعد إنشائه
  const WORKER_URL = 'PUT_YOUR_WORKER_URL_HERE';

  function bubble(text, cls) {
    const box = document.getElementById('cbox');
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
    const input = document.getElementById('cinput');
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
    document.getElementById('cbox').scrollTop = document.getElementById('cbox').scrollHeight;
  };
})();
