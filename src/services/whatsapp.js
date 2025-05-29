{
  "name": "telegram-whatsapp-bot",
  "version": "1.0.0",
  "description": "بوت لتوجيه الرسائل من تليجرام إلى واتساب",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "migrate": "node src/database/migrate.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "dotenv": "^16.3.1",
    "pg": "^8.11.3",
    "qrcode": "^1.5.3",
    "telegraf": "^4.15.0",
    "whatsapp-web.js": "^1.23.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
