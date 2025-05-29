import dotenv from "dotenv"
import { testConnection } from "./database/config.js"
import { DatabaseService } from "./services/database.js"
import { WhatsAppService } from "./services/whatsapp.js"
import { TelegramService } from "./services/telegram.js"
import logger from "./utils/logger.js"
import fs from "fs"

dotenv.config()

class TelegramWhatsAppBot {
  constructor() {
    this.db = new DatabaseService()
    this.whatsapp = new WhatsAppService()
    this.telegram = null
  }

  async initialize() {
    try {
      logger.info("🚀 Starting Telegram-WhatsApp Forwarder Bot...")

      // إنشاء مجلد السجلات
      if (!fs.existsSync("logs")) {
        fs.mkdirSync("logs")
      }

      // اختبار الاتصال بقاعدة البيانات
      logger.info("📊 Testing database connection...")
      const dbConnected = await testConnection()
      if (!dbConnected) {
        throw new Error("Database connection failed")
      }

      // التحقق من متغيرات البيئة
      if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error("TELEGRAM_BOT_TOKEN environment variable is required")
      }

      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is required")
      }

      // تهيئة خدمة واتساب
      logger.info("📱 Initializing WhatsApp service...")
      await this.whatsapp.initialize()

      // انتظار حتى يصبح واتساب جاهزاً
      await this.waitForWhatsApp()

      // تهيئة خدمة تليجرام
      logger.info("🔵 Initializing Telegram service...")
      this.telegram = new TelegramService(process.env.TELEGRAM_BOT_TOKEN, this.db, this.whatsapp)

      await this.telegram.start()

      logger.info("✅ Bot initialized successfully!")
      logger.info("📋 Use /help command in Telegram to see available commands")

      // إعداد معالجات الإغلاق
      this.setupGracefulShutdown()
    } catch (error) {
      logger.error("❌ Failed to initialize bot:", error)
      process.exit(1)
    }
  }

  async waitForWhatsApp() {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.whatsapp.isReady) {
          resolve()
        } else {
          setTimeout(checkReady, 1000)
        }
      }
      checkReady()
    })
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`)

      try {
        if (this.telegram) {
          await this.telegram.stop()
        }

        logger.info("Bot shutdown completed")
        process.exit(0)
      } catch (error) {
        logger.error("Error during shutdown:", error)
        process.exit(1)
      }
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"))
    process.on("SIGINT", () => shutdown("SIGINT"))
  }
}

// تشغيل البوت
const bot = new TelegramWhatsAppBot()
bot.initialize().catch((error) => {
  logger.error("Fatal error:", error)
  process.exit(1)
})
