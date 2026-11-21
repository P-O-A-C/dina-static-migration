// Temporary visual login only. Authentication is intentionally not simulated.
document.getElementById('loginForm')?.addEventListener('submit', function (event) {
  event.preventDefault();
  const message = document.getElementById('loginMessage');
  if (message) {
    message.textContent = 'تسجيل الدخول الموحد غير مربوط بهذه الصفحة حاليًا.';
  }
});
