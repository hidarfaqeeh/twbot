FROM node:18-alpine

# تثبيت المتطلبات الأساسية فقط
RUN apk add --no-cache chromium

# إعداد Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# مجلد العمل
WORKDIR /app

# نسخ package.json أولاً
COPY package.json ./
COPY package-lock.json ./

# تثبيت التبعيات
RUN npm install --production

# نسخ كل شيء
COPY . ./

# إنشاء المجلدات
RUN mkdir -p logs whatsapp-session

# المنفذ
EXPOSE 3000

# تشغيل التطبيق
CMD ["npm", "start"]
