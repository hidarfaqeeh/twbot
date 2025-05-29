FROM node:18-alpine

# تثبيت المتطلبات للـ Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# إعداد Puppeteer لاستخدام Chromium المثبت
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# إنشاء مجلد التطبيق
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت التبعيات
RUN npm install --only=production

# نسخ ملفات التطبيق
COPY . .

# إنشاء مجلدات مطلوبة
RUN mkdir -p logs whatsapp-session

# إعطاء صلاحيات للمجلدات
RUN chmod -R 755 logs whatsapp-session

# تشغيل الهجرة وبدء التطبيق
CMD ["sh", "-c", "npm run migrate && npm start"]

# فتح المنفذ
EXPOSE 3000
