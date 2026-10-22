(function(){
  const norm = s => s.toLowerCase().replace(/[\u064B-\u0652]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');

  // ردود محلية احتياطية، تعمل عند فشل الخدمة الخارجية
  function localReply(t){
    const q = norm(t);
    const has = (...w) => w.some(x => q.includes(norm(x)));
    if(/^[\d+\-*\/.()\s×÷]+$/.test(t)){
      try{ return 'النتيجة: ' + Function('"use strict";return ('+t.replace(/×/g,'*').replace(/÷/g,'/')+')')() + ' 🧮'; }catch(e){}
    }
    if(has('الساعه','الوقت')) return 'الوقت الآن: ' + new Date().toLocaleTimeString('ar');
    if(has('التاريخ','اليوم')) return 'اليوم: ' + new Date().toLocaleDateString('ar',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    return 'تعذّر الاتصال بخدمة الذكاء الاصطناعي حالياً. جرّب مرة أخرى لاحقاً، أو اسألني عن الوقت أو عملية حسابية.';
  }

  async function askAI(t, signal){
    const prompt = 'أنت Sturix AI، مساعد ذكي ودود. أجب بالعربية بإيجاز ووضوح.\n\nالسؤال: ' + t;
    const r = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt), { signal });
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return (await r.text()).trim();
  }

  function addMsg(box, txt, me){
    const d = document.createElement('div');
    d.style.cssText = 'padding:8px 12px;border-radius:8px;max-width:85%;margin:4px 0;color:' + (me ? '#fff;background:#1a2a42;align-self:flex-end' : '#00f2fe;background:#111d2e;align-self:flex-start');
    d.textContent = txt;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
    return d;
  }

  window.smsg = async function(){
    const i = document.getElementById('cinput'), b = document.getElementById('cbox');
    if(!i || !i.value.trim()) return;
    const t = i.value.trim();
    i.value = '';
    addMsg(b, t, true);
    const w = addMsg(b, 'يكتب...', false);

    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 25000);
    try{
      w.textContent = (await askAI(t, ctl.signal)) || localReply(t);
    }catch(e){
      w.textContent = localReply(t);
    }finally{
      clearTimeout(to);
      b.scrollTop = b.scrollHeight;
    }
  };
})();
