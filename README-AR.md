# POAC — تشغيل Dina’s Corner وGrand Dry Clean على GitHub

الحزمة مصممة للاعتماد على GitHub فقط لاستضافة الصفحات والبيانات والصور وإدارة المحتوى.

- Dina’s Corner: `welcome.html` ثم `menu.html`.
- Grand Dry Clean: `GrandDryClean/index.html` ثم `GrandDryClean/order.html`.
- الإدارة الموحدة: `poac-github-admin/index.html`.
- ملفات JSON والصور داخل نفس المستودع.

لا توجد اتصالات Supabase تشغيلية أو Cloudflare Worker أو خادم خارجي. لوحة الإدارة تستخدم GitHub API مباشرة وتحتاج Fine-grained Token مقيّدًا بمستودع واحد.

**خطوات الرفع والإعداد بالتفصيل:** `GITHUB-ONLY-SETUP-AR.md`.
