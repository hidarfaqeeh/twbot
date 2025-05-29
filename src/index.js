import dotenv from "dotenv"
import { testConnection } from "./database/config.js"
import { DatabaseService } from "./services/database.js"
import { WhatsAppService } from "./services/whatsapp.js"
import { TelegramService } from "./services/telegram.js"
import logger from "./utils/logger.js"
import fs from "fs"
import express from "express"
import healthRouter from "./routes/health.js"

dotenv.config()

class TelegramWhatsAppBot {
  constructor() {
    this.db = new DatabaseService()
    this.whatsapp = new WhatsAppService()
    this.telegram = null
    this.isShuttingDown = false
  }

  async initialize() {
    try {
      logger.info("🚀 Starting Telegram-WhatsApp Forwarder Bot...")

      // إنشاء المجلدات المطلوبة
      this.createRequiredDirectories()

      // اختبار الاتصال بقاعدة البيانات
      logger.info("📊 Testing database connection...")
      const dbConnected = await testConnection()
      if (!dbConnected) {
        throw new Error("Database connection failed")
      }

      // التحقق من متغيرات البيئة
      this.validateEnvironmentVariables()

      // تهيئة خدمة تليجرام
      logger.info("🔵 Initializing Telegram service...")
      this.telegram = new TelegramService(process.env.TELEGRAM_BOT_TOKEN, this.db, this.whatsapp)

      // تهيئة خدمة واتساب
      logger.info("📱 Initializing WhatsApp service...")
      await this.whatsapp.initialize(this.telegram)

      // بدء خدمة تليجرام
      await this.telegram.start()

      // إعداد health server
      this.setupHealthServer()

      logger.info("✅ Bot initialized successfully!")
      logger.info("📋 Use /help command in Telegram to see available commands")

      // إعداد معالجات الإغلاق
      this.setupGracefulShutdown()

      // إبقاء العملية قيد التشغيل
      this.keepAlive()
    } catch (error) {
      logger.error("❌ Failed to initialize bot:", error)
      process.exit(1)
    }
  }

  createRequiredDirectories() {
    const directories = ["logs", "whatsapp-session"]

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        logger.info(`📁 Created directory: ${dir}`)
      }
    })
  }

  validateEnvironmentVariables() {
    const requiredVars = ["TELEGRAM_BOT_TOKEN", "DATABASE_URL"]

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`${varName} environment variable is required`)
      }
    }
  }

  keepAlive() {
    // إرسال heartbeat كل 30 ثانية
    setInterval(() => {
      if (!this.isShuttingDown) {
        logger.debug("💓 Bot is alive")
      }
    }, 30000)
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return

      this.isShuttingDown = true
      logger.info(`Received ${signal}. Shutting down gracefully...`)

      try {
        if (this.telegram) {
          await this.telegram.stop()
        }

        if (this.whatsapp) {
          await this.whatsapp.destroy()
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
    process.on("SIGUSR2", () => shutdown("SIGUSR2")) // nodemon restart
  }

  setupHealthServer() {
    const app = express()
    const port = process.env.PORT || 3000

    app.use(express.json())
    app.use("/", healthRouter)

    app.listen(port, () => {
      logger.info(`Health server running on port ${port}`)
    })
  }
}

// تشغيل البوت
const bot = new TelegramWhatsAppBot()
bot.initialize().catch((error) => {
  logger.error("Fatal error:", error)
  process.exit(1)
})
