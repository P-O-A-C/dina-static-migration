# مراجعة حزمة POAC — GitHub فقط

هذه النسخة تنقل صفحات Dina’s Corner وGrand Dry Clean وبياناتهما ولوحة الإدارة إلى GitHub Pages ومستودع GitHub.

## الصفحات العامة
- Dina’s Corner: `welcome.html` و`menu.html`، وتقرأ ملفات `data/*.json` والصور المحلية.
- Grand Dry Clean: `GrandDryClean/index.html` و`GrandDryClean/order.html`، وتقرأ ملفات `GrandDryClean/data/*.json` والصور المحلية.

## الإدارة
- اللوحة الموحدة: `poac-github-admin/index.html`.
- تستخدم GitHub Contents API مباشرة من المتصفح لحفظ JSON ورفع الصور إلى نفس المستودع.
- تتطلب Fine-grained Token مقيّدًا بمستودع واحد وصلاحية Contents Read and write فقط، مع Metadata Read-only.
- المفتاح لا يدخل ضمن ملفات الحزمة ولا يحفظ في المتصفح.

## تم تعطيله/إزالته
- اتصالات Supabase القديمة من المسارات التشغيلية ولوحات الإدارة السابقة.
- بوابات دخول الموظفين والعملاء وحسابات العملاء المحلية.
- Cloudflare Worker وأي Backend خارجي.
- وحدات الولاء الخاصة بالعروض والمكافآت والحسابات.

## حدود التشغيل
GitHub Pages موقع ثابت؛ لا يحفظ الطلبات المركزية ولا يقدم قاعدة بيانات. صفحات الطلبات الحالية تحافظ على مسار الطلب/التواصل الموجود في الواجهة (مثل WhatsApp) ولا تعتبر نظام تسجيل طلبات مركزيًا.

راجع `GITHUB-ONLY-SETUP-AR.md` لخطوات رفع الملفات ونشر Pages وإعداد المفتاح.
