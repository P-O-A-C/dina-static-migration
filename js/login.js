// واجهة تسجيل دخول تجريبية فقط.
// سيتم ربطها بـ Supabase بعد مراجعة إعدادات مشروع Dina's Corner.
// لا تضع مفاتيح Supabase السرية أو كلمات المرور داخل ملفات الواجهة.
document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault();
  document.getElementById("loginMessage").textContent =
    "التصميم جاهز للربط. لم يتم تفعيل التحقق من الحسابات في هذه النسخة.";
});