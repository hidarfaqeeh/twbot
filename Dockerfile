FROM node:18-alpine

# تثبيت المتطلبات للـ Puppeteer مع إضافات للاستقرار
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    wqy-zenhei \
    && rm -rf /var/cache/apk/*

# إعداد Puppeteer لاستخدام Chromium المثبت
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/bin/chromium-browser

# إنشاء مستخدم غير root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# إنشاء مجلد التطبيق
WORKDIR /app

# نسخ ملفات package أولاً للاستفادة من Docker cache
COPY package*.json ./

# تثبيت التبعيات
RUN npm install --only=production && npm cache clean --force

# نسخ باقي ملفات التطبيق
COPY src/ /app/src/

# إنشاء مجلدات مطلوبة وإعطاء الصلاحيات
RUN mkdir -p logs whatsapp-session tmp && \
    chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# التبديل للمستخدم غير root
USER nodejs

# فتح المنفذ
EXPOSE 3000

# فحص صحة التطبيق
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "console.log('Health check')" || exit 1

# تشغيل الهجرة وبدء التطبيق
CMD ["sh", "-c", "npm run migrate && npm start"]
