# POAC — GitHub Only Package (Dina’s Corner + Grand Dry Clean)

هذه الحزمة معدّة ليكون استضافة الصفحات والبيانات والصور وإدارة المحتوى من خلال GitHub فقط.

## لا يوجد في هذه الحزمة
- Supabase (تمت إزالة ملفات الاتصال القديمة وصفحات الإدارة التي تعتمد عليه).
- Cloudflare Worker أو Cloudflare Pages.
- أي خادم أو Backend أو خدمة Cloud خارج GitHub.
- أنظمة حسابات العملاء أو الموظفين أو المكافآت أو عروض الولاء.

## المكونات
- `welcome.html` و`menu.html`: صفحات Dina’s Corner العامة، مع JSON وصور محلية.
- `GrandDryClean/index.html` و`GrandDryClean/order.html`: صفحات العملاء العامة للمغسلة.
- `poac-github-admin/index.html`: لوحة الإدارة الموحدة، تقرأ وتكتب ملفات JSON والصور مباشرة إلى المستودع عبر GitHub Contents API.
- `data/` و`GrandDryClean/data/`: ملفات بيانات النشاطين.
- `images/` و`GrandDryClean/assets/`: صور المشروعين.

## نشر GitHub Pages
1. فك ضغط الحزمة.
2. افتح المجلد `poac-main` وانسخ **محتوياته** إلى جذر مستودع GitHub (لا ترفع مجلد `poac-main` كطبقة إضافية).
3. تأكد أن الفرع الافتراضي اسمه `main` أو استخدم اسم فرعك داخل لوحة الإدارة.
4. من إعدادات المستودع افتح Pages، واختر النشر من الفرع والجذر `/ (root)`.
5. بعد النشر افتح رابط GitHub Pages، ثم `/poac-github-admin/`.

## إعداد دخول الإدارة (لا توجد حسابات موظفين)
1. من GitHub أنشئ Fine-grained Personal Access Token.
2. حدّد هذا المستودع فقط ضمن Repository access.
3. امنح `Contents: Read and write` و`Metadata: Read-only` فقط. لا تمنح صلاحيات Administration أو Actions أو Workflows.
4. داخل لوحة الإدارة اكتب Owner وRepository وBranch، والصق المفتاح عند الاتصال.
5. المفتاح يبقى في ذاكرة صفحة الإدارة خلال الجلسة، ولا يُحفظ في `localStorage` أو `sessionStorage` ولا يوجد داخل ملفات JavaScript أو هذا ZIP. عند قفل اللوحة أو إغلاق الصفحة يُمسح من الذاكرة.
6. لا ترسل المفتاح في محادثة أو بريد أو ملف. استخدم جهازًا موثوقًا وHTTPS، ولا تفتح لوحة الإدارة على جهاز عام.

## ما تستطيع اللوحة إدارته
### Dina’s Corner
- `data/menu-items.json`
- `data/menu-categories.json`
- `data/home-featured-products.json`
- `data/locations.json`

### Grand Dry Clean
- `GrandDryClean/data/service-items.json`
- `GrandDryClean/data/service-categories.json`
- `GrandDryClean/data/ironing-prices.json`
- `GrandDryClean/data/branches.json`
- `GrandDryClean/data/settings.json`
- `GrandDryClean/data/home-slides.json`

يمكن إضافة وتعديل وحذف السجلات، ورفع الصور إلى مجلدات المستودع. كل حفظ ينشئ Commit من خلال GitHub API. بعد ذلك يحتاج GitHub Pages إلى إكمال النشر حتى تظهر التغييرات في صفحات العملاء.

## حدود مهمة بوضوح
- GitHub Pages استضافة ثابتة؛ لا ينشئ قاعدة بيانات ولا يحتفظ بطلبات العملاء أو جلسات تشغيل مركزية.
- لوحة الإدارة لا تسجل دخولًا باسم مستخدم وكلمة مرور؛ صلاحيتها تعتمد على Fine-grained Token الذي ينشئه مالك المستودع ويحدّه لمستودع واحد. لا توجد حسابات عملاء أو موظفين.
- من يملك صلاحية الكتابة إلى المستودع يمكنه تغيير صفحات وبيانات الموقع. حماية هذا المفتاح ضرورية.
- المستودع العام يجعل صفحات الموقع وملفات JSON والصور العامة قابلة للقراءة للجميع. لا تضع بيانات شخصية أو سرية فيه.
- إرسال طلبات الطلبات من صفحات العملاء يجب أن يستخدم وجهة تواصل معلنة (مثل WhatsApp) أو نظام تشغيل خارجي مستقل؛ GitHub Pages وحده لا يخزن الطلبات مركزيًا.
- روابط WhatsApp والخرائط الموجودة ضمن تجربة العملاء روابط خارجية وظيفية وليست استضافة أو Backend.

## الملفات الناقصة المعروفة
- صور سلايدر Grand Dry Clean من 04 إلى 10 لم تكن ضمن الملفات المستلمة. توجد 3 صور محلية متاحة فقط، ويمكن إضافة بقية الصور من لوحة الإدارة.
- ملفات CSV التي تم استيرادها لم تتضمن جدول `menu_items` منفصلًا في الدفعة الأخيرة؛ ملف `data/menu-items.json` في الحزمة بقي من نسخة المشروع السابقة (71 سجلًا). راجع القائمة قبل أي تعديل جماعي.

## الاختبار السريع بعد النشر
1. افتح `welcome.html` وتأكد من ظهور منتجات Dina والفروع.
2. افتح `menu.html` وتأكد من الأقسام والمنتجات والسلة ورسالة WhatsApp.
3. افتح `GrandDryClean/index.html` وتأكد من الفروع والسلايدر.
4. افتح `GrandDryClean/order.html` وتأكد من الأقسام والخدمات والأسعار.
5. افتح لوحة الإدارة، اتصل بالمستودع، عدّل قيمة اختبارية ثم احفظها، وتأكد من ظهور Commit في GitHub وبعد النشر في صفحة العملاء.
