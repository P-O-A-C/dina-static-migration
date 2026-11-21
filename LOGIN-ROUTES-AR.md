# مسارات الدخول الموحدة في POAC

## تسجيل الدخول للإدارة
- صفحة الدخول الوحيدة للإدارة هي `/poac/` (ملف `index.html`).
- حساب `gm@poac.com` بصلاحية `admin` ينتقل إلى إدارة POAC.
- حساب `dina'scorner@poac.com` بصلاحية `gm` ومعرّف المشروع `dina-corner` ينتقل إلى لوحة Dina's Corner.
- حساب `granddryclean@poac.com` بصلاحية `gm` ومعرّف المشروع `grand-dry-clean` ينتقل إلى لوحة GRAND DRY CLEAN.
- تم إلغاء نموذج تسجيل الدخول المستقل لدينا. المسار القديم `Dina'sCorner/login.html` أصبح تحويلًا متوافقًا إلى صفحة POAC الموحدة فقط.

## تسجيل الخروج
- تسجيل الخروج من لوحة Dina's Corner يعيد المستخدم إلى صفحة تسجيل دخول POAC الموحدة.
- رابط إدارة Dina's Corner في لوحة مشروعات POAC يفتح صفحة الدخول الموحدة.

## صفحات العملاء
- صفحة عملاء Dina's Corner: `welcome.html`.
- صفحة عملاء GRAND DRY CLEAN: `GrandDryClean/index.html`، وصفحة إرسال الطلب: `GrandDryClean/order.html`.

## ملاحظة أمنية
- التوجيه يعتمد على الدور وعلامة المشروع الموثقة في Supabase `app_metadata.poac_project`.
- يجب أن تظل سياسات RLS هي الحماية الفعلية للبيانات والعمليات؛ توجيه الصفحات وحده ليس بديلًا عن صلاحيات قاعدة البيانات.
