# POAC — المستودع الموحد

يحتوي هذا المستودع على واجهات Dina’s Corner وGrand Dry Clean وبوابة POAC الإدارية وأصولها.

## نقاط الدخول
- **Dina’s Corner — صفحة العملاء:** `welcome.html`
- **Dina’s Corner — المنيو والسلة وطلب WhatsApp:** `menu.html`
- **POAC — بوابة الدخول الموحدة:** `index.html`
- **Grand Dry Clean:** `GrandDryClean/index.html`
- **POAC Admin:** `POAC-Admin/index.html`

## حالة Dina’s Corner
صفحتا العملاء العامة في جذر المستودع منفصلتان عن Supabase في هذه النسخة. تقرآن من `data/*.json` وتستخدمان الصور داخل `images/`، ويُرسل الطلب من المنيو إلى WhatsApp. راجع `GITHUB-MIGRATION-REVIEW-AR.md` و`data/README-AR.md` للتفاصيل وفحوصات النقل.

**تنبيه:** مجلد `Dina'sCorner/` يحتوي صفحات إدارة أقدم، وبعضها ما زال يعتمد على Supabase. كما أن بوابة POAC وGrandDryClean ما زالتا تستخدمان Supabase. لا تحذف ملفات الاتصال المشتركة أو مفاتيح الإعداد قبل فصل تلك الأجزاء بشكل مستقل.

## بنية الملفات الأساسية
- `assets/` — CSS وJavaScript والهوية البصرية.
- `data/` — بيانات Dina الثابتة بصيغة JSON وملفات التصدير.
- `images/` — صور Dina المحلية.
- `GrandDryClean/` — صفحات وأصول المغسلة.
- `Dina'sCorner/` — مسارات إدارة Dina القديمة.
- `POAC-Admin/` — بوابة الإدارة.

## النشر على GitHub Pages
انشر المستودع من الفرع والمجلد اللذين تستخدمهما حاليًا. يجب أن يبقى `welcome.html` و`menu.html` و`assets/` و`data/` و`images/` في نفس مستوى المسارات الموضحة أعلاه. افتح رابط `welcome.html` بعد النشر ثم اختبر المنيو وطلب WhatsApp والفروع.

## ملاحظة
GitHub Pages يستضيف ملفات ثابتة؛ لا يحفظ تعديلات JSON من لوحة المتصفح ولا ينشئ نظام مستخدمين أو سجل طلبات. أي وظيفة إدارة أو حفظ تحتاج إلى حل خلفي آمن أو تحديث المستودع عبر Git.


## رفع واستبدال صور Dina’s Corner
راجع `IMAGE-UPLOAD-GUIDE-AR.md` وخريطة `IMAGE-UPLOAD-MAP-AR.csv`. تم توحيد مسارات الصور إلى `images/categories/`, `images/items/`, و`images/home-featured/`. استبدل الصور بنفس اسم الملف وامتداده للحفاظ على الروابط.
