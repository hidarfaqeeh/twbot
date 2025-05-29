# Telegram to WhatsApp Forwarder Bot

بوت متقدم لتوجيه الرسائل تلقائياً من قنوات تليجرام إلى مجموعات واتساب باستخدام PostgreSQL.

## 🌟 المميزات

- 🔄 توجيه تلقائي للرسائل من تليجرام إلى واتساب
- 📊 قاعدة بيانات PostgreSQL لحفظ الإعدادات والسجلات
- 🎛️ واجهة تحكم كاملة عبر أوامر تليجرام
- 📱 استخدام واتساب ويب بدون API رسمي
- 🔐 إرسال رمز QR عبر التلجرام للسيرفرات بدون CLI
- 🚀 جاهز للنشر على Northflank أو أي منصة Docker
- 📝 نظام سجلات متقدم مع تدوير الملفات
- ⚡ معالجة أخطاء شاملة وإعادة محاولة تلقائية
- 🛡️ نظام أمان للمشرفين
- 📈 إحصائيات مفصلة للرسائل

## 📋 المتطلبات

- Node.js 18+
- PostgreSQL 12+
- حساب تليجرام وبوت من @BotFather
- حساب واتساب

## 🚀 التثبيت والإعداد

### 1. إعداد قاعدة البيانات

\`\`\`sql
-- إنشاء قاعدة بيانات جديدة
CREATE DATABASE telegram_whatsapp_bot;
\`\`\`

### 2. إعداد متغيرات البيئة

\`\`\`bash
cp .env.example .env
\`\`\`

قم بتعديل ملف `.env` وإضافة:

\`\`\`env
DATABASE_URL=postgres://username:password@localhost:5432/telegram_whatsapp_bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ADMIN_USER_ID=your_telegram_user_id  # اختياري للأمان
NODE_ENV=production
\`\`\`

### 3. تثبيت التبعيات

\`\`\`bash
npm install
\`\`\`

### 4. تشغيل الهجرة

\`\`\`bash
npm run migrate
\`\`\`

### 5. تشغيل البوت

\`\`\`bash
npm start
\`\`\`

## 📱 الأوامر المتاحة

### 🔐 أوامر التسجيل
- \`/start\` - بدء البوت وعرض الترحيب
- \`/login\` - تسجيل الدخول إلى واتساب عبر رمز QR
- \`/help\` - عرض المساعدة التفصيلية

### 📊 إدارة القنوات والمجموعات
- \`/addchannel <channel_id> <name>\` - إضافة قناة للمراقبة
- \`/addgroup <group_id> <name>\` - إضافة مجموعة واتساب
- \`/addrule <channel_id> <group_id>\` - ربط قناة بمجموعة

### 📋 عرض المعلومات
- \`/listrules\` - عرض قواعد التوجيه النشطة
- \`/listchannels\` - عرض القنوات المراقبة
- \`/listgroups\` - عرض مجموعات واتساب
- \`/status\` - حالة الاتصالات والإحصائيات
- \`/stats\` - إحصائيات مفصلة للرسائل

## 💡 أمثلة على الاستخدام

### إعداد أساسي
\`\`\`
/addchannel @mynewschannel قناة الأخبار
/addgroup 201234567890 مجموعة الأصدقاء
/addrule @mynewschannel 201234567890
\`\`\`

### تسجيل الدخول لواتساب
\`\`\`
/login
# سيتم إرسال رمز QR عبر التلجرام
# امسح الرمز بواتساب على هاتفك
\`\`\`

## 🐳 النشر باستخدام Docker

### 1. بناء الصورة
\`\`\`bash
docker build -t telegram-whatsapp-bot .
\`\`\`

### 2. تشغيل الحاوية
\`\`\`bash
docker run -d \\
  --name telegram-whatsapp-bot \\
  --env-file .env \\
  -v $(pwd)/whatsapp-session:/app/whatsapp-session \\
  -v $(pwd)/logs:/app/logs \\
  telegram-whatsapp-bot
\`\`\`

## ☁️ النشر على Northflank

### 1. إنشاء مشروع جديد
- قم بتسجيل الدخول إلى Northflank
- أنشئ مشروع جديد
- اربط مستودع GitHub

### 2. إعداد متغيرات البيئة
\`\`\`
DATABASE_URL=your_postgresql_connection_string
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_USER_ID=your_telegram_user_id
NODE_ENV=production
\`\`\`

### 3. إعداد الخدمة
- اختر "Combined Service"
- استخدم Dockerfile المرفق
- اضبط المنفذ على 3000
- أضف التخزين المستمر:
  - \`/app/whatsapp-session\` (1GB)
  - \`/app/logs\` (512MB)

### 4. النشر
- اضغط "Deploy"
- انتظر حتى اكتمال النشر

## 🗄️ هيكل قاعدة البيانات

### الجداول الرئيسية
- \`channels\` - القنوات المراقبة
- \`whatsapp_groups\` - مجموعات واتساب
- \`forwarding_rules\` - قواعد التوجيه
- \`message_history\` - سجل الرسائل المرسلة
- \`bot_settings\` - إعدادات البوت

### الفهارس
- فهارس على الحقول النشطة لتحسين الأداء
- فهارس على التواريخ للاستعلامات السريعة

## 🔧 الميزات المتقدمة

### نظام السجلات
- تدوير تلقائي للملفات (5MB لكل ملف)
- سجلات منفصلة للأخطاء والأحداث
- تسجيل مفصل لجميع العمليات

### معالجة الأخطاء
- إعادة محاولة تلقائية للاتصالات
- تسجيل مفصل للأخطاء
- إشعارات للمشرف عند حدوث مشاكل

### الأمان
- تحديد مشرف واحد للتحكم في البوت
- تشفير اتصالات قاعدة البيانات
- حماية جلسة واتساب

## 🛠️ استكشاف الأخطاء

### مشاكل شائعة

#### 1. فشل الاتصال بقاعدة البيانات
\`\`\`bash
# تحقق من صحة رابط قاعدة البيانات
echo $DATABASE_URL
\`\`\`

#### 2. مشاكل واتساب ويب
\`\`\`bash
# حذف جلسة واتساب وإعادة تسجيل الدخول
rm -rf whatsapp-session/
# ثم استخدم /login في البوت
\`\`\`

#### 3. مشاكل الذاكرة
\`\`\`bash
# زيادة ذاكرة Node.js
export NODE_OPTIONS="--max-old-space-size=2048"
\`\`\`

### عرض السجلات
\`\`\`bash
# عرض السجلات المباشرة
tail -f logs/combined.log

# عرض الأخطاء فقط
tail -f logs/error.log
\`\`\`

## 📊 المراقبة والصيانة

### تنظيف البيانات القديمة
يتم تنظيف الرسائل القديمة تلقائياً (أكثر من 30 يوم)

### النسخ الاحتياطي
\`\`\`bash
# نسخ احتياطي لقاعدة البيانات
pg_dump $DATABASE_URL > backup.sql

# نسخ احتياطي لجلسة واتساب
tar -czf whatsapp-session-backup.tar.gz whatsapp-session/
\`\`\`

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة (\`git checkout -b feature/AmazingFeature\`)
3. Commit التغييرات (\`git commit -m 'Add some AmazingFeature'\`)
4. Push للفرع (\`git push origin feature/AmazingFeature\`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 🆘 الدعم

للمساعدة والدعم:

- 📧 البريد الإلكتروني: support@example.com
- 💬 فتح issue في المستودع
- 📖 مراجعة الوثائق

## 🙏 شكر وتقدير

- [Telegraf](https://telegraf.js.org/) - مكتبة Telegram Bot
- [whatsapp-web.js](https://wwebjs.dev/) - مكتبة WhatsApp Web
- [Winston](https://github.com/winstonjs/winston) - نظام السجلات
- [PostgreSQL](https://www.postgresql.org/) - قاعدة البيانات

## 📈 خارطة الطريق

- [ ] دعم إرسال الصور والفيديو
- [ ] واجهة ويب للإدارة
- [ ] دعم قواعد بيانات أخرى
- [ ] نظام إشعارات متقدم
- [ ] دعم متعدد اللغات

---

**ملاحظة**: هذا البوت مخصص للاستخدام الشخصي والتعليمي. تأكد من الامتثال لشروط خدمة تليجرام وواتساب.
