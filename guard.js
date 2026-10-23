(function () {
  // منع قائمة النسخ والتحديد على كل شيء ما عدا حقول الإدخال
  document.addEventListener('contextmenu', function (e) {
    const t = e.target;
    if (t.closest && t.closest('input, textarea')) return;
    e.preventDefault();
  });

  document.addEventListener('selectstart', function (e) {
    const t = e.target;
    if (t.closest && t.closest('input, textarea')) return;
    e.preventDefault();
  });

  // منع التحديد التلقائي عند الضغط المطول على البطاقات
  const style = document.createElement('style');
  style.textContent = 'body *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
    'input,textarea{-webkit-user-select:text;user-select:text}';
  document.head.appendChild(style);
})();

