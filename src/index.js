class Bot {
  constructor() {
    this.telegram = null
    this.whatsapp = null
    this.db = null // Assume a database connection is needed
  }

  async initialize() {
    // تهيئة خدمة تليجرام أولاً
    logger.info("🔵 Initializing Telegram service...")
    this.telegram = new TelegramService(process.env.TELEGRAM_BOT_TOKEN, this.db, this.whatsapp)

    // بدء خدمة تليجرام
    logger.info("🔵 Starting Telegram bot...")
    await this.telegram.start()

    // إعداد health server
    this.setupHealthServer()

    logger.info("✅ Telegram bot started successfully!")

    // تهيئة خدمة واتساب في الخلفية (غير متزامن)
    logger.info("📱 Initializing WhatsApp service in background...")
    this.initializeWhatsAppInBackground()

    logger.info("✅ Bot initialized successfully!")
    logger.info("📋 Use /help command in Telegram to see available commands")
  }

  async initializeWhatsAppInBackground() {
    try {
      const success = await this.whatsapp.initialize(this.telegram)
      if (success) {
        logger.info("✅ WhatsApp service initialized successfully")
      } else {
        logger.warn("⚠️ WhatsApp service failed to initialize, but bot will continue running")
      }
    } catch (error) {
      logger.error("❌ WhatsApp initialization error:", error)
      logger.info("🔄 Bot will continue running without WhatsApp functionality")
    }
  }

  setupHealthServer() {
    // Placeholder for health server setup
    logger.info("⚙️ Setting up health server...")
  }
}

// Example usage (replace with your actual implementation)
const logger = {
  info: (message) => console.log(message),
  warn: (message) => console.warn(message),
  error: (message, error) => console.error(message, error),
}

class TelegramService {
  constructor(token, db, whatsapp) {
    this.token = token
    this.db = db
    this.whatsapp = whatsapp
  }

  async start() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 100)
    })
  }
}

class WhatsAppService {
  async initialize(telegram) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 100)
    })
  }
}

// Mock process.env
process.env = {
  TELEGRAM_BOT_TOKEN: "your_telegram_bot_token",
}

const bot = new Bot()
bot.whatsapp = new WhatsAppService() // Initialize WhatsApp service
bot.initialize()
