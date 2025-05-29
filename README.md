# Telegram to WhatsApp Forwarder Bot

بوت متقدم لتوجيه الرسائل تلقائياً من قنوات تليجرام إلى مجموعات واتساب باستخدام PostgreSQL.

## المميزات

- 🔄 توجيه تلقائي للرسائل من تليجرام إلى واتساب
- 📊 قاعدة بيانات PostgreSQL لحفظ الإعدادات والسجلات
- 🎛️ واجهة تحكم عبر أوامر تليجرام
- 📱 استخدام واتساب ويب بدون API
- 🚀 جاهز للنشر على Northflank
- 📝 نظام سجلات متقدم
- ⚡ معالجة أخطاء شاملة

## التثبيت والإعداد

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
- `DATABASE_URL`: رابط قاعدة البيانات
- `TELEGRAM_BOT_TOKEN`: توكن البوت من @BotFather

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

## الأوامر المتاحة

### أوامر الإعداد
- `/start` - بدء البوت
- `/help` - عرض المساعدة
- `/status` - حالة البوت

### إدارة القنوات والمجموعات
- `/addchannel <channel_id> <name>` - إضافة قناة للمراقبة
- `/addgroup <group_id> <name>` - إضافة مجموعة واتساب
- `/addrule <channel_id> <group_id>` - ربط قناة بمجموعة

### عرض المعلومات
- `/listrules` - عرض قواعد التوجيه
- `/listchannels` - عرض القنوات
- `/listgroups` - عرض المجموعات

## النشر على Northflank

### 1. إنشاء مشروع جديد
- قم بتسجيل الدخول إلى Northflank
- أنشئ مشروع جديد
- اربط مستودع GitHub

### 2. إعداد متغيرات البيئة
\`\`\`
DATABASE_URL=your_postgresql_connection_string
TELEGRAM_BOT_TOKEN=your_bot_token
NODE_ENV=production
\`\`\`

### 3. إعداد الخدمة
- اختر "Combined Service"
- استخدم Dockerfile المرفق
- اضبط المنفذ على 3000

### 4. النشر
- اضغط "Deploy"
- انتظر حتى اكتمال النشر

## الاستخدام

### 1. إعداد البوت
1. أرسل `/start` للبوت في تليجرام
2. امسح QR Code لتسجيل الدخول لواتساب
3. أضف القنوات باستخدام `/addchannel`
4. أضف مجموعات واتساب باستخدام `/addgroup`
5. اربط القنوات بالمجموعات باستخدام `/addrule`

### 2. مثال على الإعداد
\`\`\`
/addchannel @mynewschannel قناة الأخبار
/addgroup 1234567890123 مجموعة الأصدقاء
/addrule @mynewschannel 1234567890123
\`\`\`

## هيكل قاعدة البيانات

### الجداول
- `channels` - القنوات المراقبة
- `whatsapp_groups` - مجموعات واتساب
- `forwarding_rules` - قواعد التوجيه
- `message_history` - سجل الرسائل
- `bot_settings` - إعدادات البوت

## المتطلبات

- Node.js 18+
- PostgreSQL 12+
- حساب تليجرام وبوت
- حساب واتساب

## الدعم

للمساعدة والدعم، يرجى فتح issue في المستودع.
\`\`\`

دعنا ننشئ ملف إعداد Northflank:
