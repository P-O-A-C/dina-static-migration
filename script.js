// ضع رقم واتساب بصيغة دولية بدون + أو مسافات، مثال مصر: 201xxxxxxxxx
const JAD_CRAFT_WHATSAPP = '';
const whatsappLink = document.getElementById('whatsapp-link');
if (JAD_CRAFT_WHATSAPP) {
  whatsappLink.href = `https://wa.me/${JAD_CRAFT_WHATSAPP}?text=${encodeURIComponent('مرحباً جاد كرافت، أريد الاستفسار عن المنتجات والهدايا.')}`;
} else {
  whatsappLink.addEventListener('click', (event) => {
    event.preventDefault();
    alert('يرجى إضافة رقم واتساب جاد كرافت داخل ملف script.js أولاً.');
  });
}
document.getElementById('year').textContent = new Date().getFullYear();
