const _openTool = window.openTool;
window.openTool = function(name){
  _openTool(name);
  if(name==='qr') setupQr();
};
const _goHome = window.goHome;
window.goHome = function(){ stopQrScan(); _goHome(); };

function setupQr(){
  const c = document.getElementById('content');
  const f = c.querySelector('input[type=file]');
  if(f){ const p=f.previousElementSibling; if(p&&p.tagName==='P') p.remove(); f.remove(); }
  c.insertAdjacentHTML('beforeend',
    '<button class="btn" onclick="startQrScan()">📷 فتح الكاميرا للمسح</button>'+
    '<video id="qvideo" playsinline muted style="display:none;width:100%;border-radius:12px;margin-top:10px"></video>'+
    '<p id="qscan-res" style="color:#00f2fe;margin-top:10px;word-break:break-all"></p>');
}

let qrStream=null, qrLoop=null;
async function startQrScan(){
  const res=document.getElementById('qscan-res');
  if(!('BarcodeDetector' in window)){ res.innerText='المتصفح لا يدعم مسح QR، استخدم كروم.'; return; }
  try{
    qrStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    const v=document.getElementById('qvideo');
    v.srcObject=qrStream; v.style.display='block'; await v.play();
    res.innerText='وجّه الكاميرا نحو الكود...';
    const det=new BarcodeDetector({formats:['qr_code']});
    qrLoop=setInterval(async()=>{
      try{
        const codes=await det.detect(v);
        if(codes.length){ res.innerText='النتيجة: '+codes[0].rawValue; stopQrScan(); }
      }catch(e){}
    },300);
  }catch(e){ res.innerText='تعذر فتح الكاميرا، تأكد من السماح بالإذن.'; }
}
function stopQrScan(){
  clearInterval(qrLoop);
  if(qrStream){ qrStream.getTracks().forEach(t=>t.stop()); qrStream=null; }
  const v=document.getElementById('qvideo');
  if(v){ v.style.display='none'; v.srcObject=null; }
}

const esc = s => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm = s => s.toLowerCase().replace(/[\u064B-\u0652]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');

function aiReply(t){
  const q = norm(t);
  const has = (...w) => w.some(x => q.includes(norm(x)));
  if(/^[\d+\-*\/.()\s×÷]+$/.test(t)){
    try{ return 'النتيجة: '+Function('"use strict";return ('+t.replace(/×/g,'*').replace(/÷/g,'/')+')')()+' 🧮'; }catch(e){}
  }
  if(has('السلام','مرحبا','اهلا','هلا')) return 'وعليكم السلام ورحمة الله! كيف أساعدك؟';
  if(has('شكرا')) return 'العفو! أنا هنا متى احتجت 😊';
  if(has('كيف حالك','كيفك','شلونك')) return 'بخير والحمد لله، شكراً لسؤالك! وأنت؟';
  if(has('من انت','اسمك')) return 'أنا Sturix AI، مساعد بسيط داخل تطبيق Sturix.';
  if(has('الساعه','الوقت')) return 'الوقت الآن: '+new Date().toLocaleTimeString('ar');
  if(has('التاريخ','اليوم')) return 'اليوم: '+new Date().toLocaleDateString('ar',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  if(has('qr','باركود')) return 'افتح «منشئ QR Code» من الرئيسية، وفيه زر الكاميرا لمسح الأكواد.';
  if(has('مصباح','فلاش')) return 'أداة «المصباح اليدوي» تشغّل فلاش الكاميرا، وتأكد من السماح بإذن الكاميرا.';
  if(has('كلمه مرور','كلمات المرور','باسورد')) return 'أداة «كلمات المرور» تولّد كلمة قوية من 12 رمزاً، اضغط توليد.';
  if(has('pdf','صور')) return 'أداة «صور إلى PDF» لتجهيز الصور في مستند.';
  if(has('الادوات','ماذا تستطيع','ساعدني','مساعده')) return 'أقدر أحسب لك (اكتب 5*8 مثلاً)، وأخبرك بالوقت والتاريخ، وأشرح أدوات التطبيق.';
  return 'لم أفهم سؤالك تماماً 🤔 جرّب: عملية حسابية، أو اسأل عن الوقت، أو عن إحدى أدوات التطبيق.';
}

window.smsg = function(){
  const i=document.getElementById('cinput'), b=document.getElementById('cbox');
  if(!i||!i.value.trim()) return;
  const t=i.value.trim();
  b.innerHTML += '<div style="background:#1a2a42;padding:8px 12px;border-radius:8px;color:#fff;align-self:flex-end">'+esc(t)+'</div>';
  i.value=''; b.scrollTop=b.scrollHeight;
  setTimeout(()=>{
    b.innerHTML += '<div style="background:#111d2e;padding:8px 12px;border-radius:8px;color:#00f2fe;align-self:flex-start">'+esc(aiReply(t))+'</div>';
    b.scrollTop=b.scrollHeight;
  },500);
};
