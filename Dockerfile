FROM node:18-alpine

# تثبيت المتطلبات للـ Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# إعداد Puppeteer لاستخدام Chromium المثبت
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# إنشاء مستخدم غير root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# إنشاء مجلد التطبيق
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت التبعيات
RUN npm ci --only=production && npm cache clean --force

# نسخ ملفات التطبيق
COPY --chown=nodejs:nodejs . .

# إنشاء مجلدات مطلوبة
RUN mkdir -p logs whatsapp-session && \
    chown -R nodejs:nodejs logs whatsapp-session

# التبديل للمستخدم غير root
USER nodejs

# فتح المنفذ
EXPOSE 3000

# فحص صحة التطبيق
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check')" || exit 1

# تشغيل الهجرة وبدء التطبيق
CMD ["sh", "-c", "npm run migrate && npm start"]
