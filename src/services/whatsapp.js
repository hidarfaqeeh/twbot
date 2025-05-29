import whatsappWeb from "whatsapp-web.js"
const { Client, LocalAuth } = whatsappWeb
import qrcode from "qrcode"
import logger from "../utils/logger.js"

export class WhatsAppService {
  constructor() {
    this.client = null
    this.isReady = false
    this.qrCode = null
    this.telegram = null
    this.initializationPromise = null
    this.isInitializing = false
  }

  async initialize(telegramService) {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._doInitialize(telegramService)
    return this.initializationPromise
  }

  async _doInitialize(telegramService) {
    if (this.isInitializing) {
      logger.warn("WhatsApp initialization already in progress")
      return false
    }

    this.isInitializing = true

    try {
      this.telegram = telegramService
      logger.info("Creating WhatsApp client...")

      // إضافة timeout للتهيئة
      const initTimeout = setTimeout(() => {
        logger.warn("⚠️ WhatsApp initialization timeout after 60 seconds")
        if (this.client) {
          this.client.destroy().catch(() => {})
        }
        this.isInitializing = false
      }, 60000)

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: "./whatsapp-session",
        }),
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-extensions",
            "--disable-plugins",
            "--disable-default-apps",
            "--disable-hang-monitor",
            "--disable-prompt-on-repost",
            "--disable-sync",
            "--disable-translate",
            "--disable-ipc-flooding-protection",
            "--memory-pressure-off",
            "--max_old_space_size=4096",
          ],
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
          timeout: 30000,
        },
      })

      this.setupEventHandlers()

      logger.info("Starting WhatsApp client initialization...")

      try {
        await this.client.initialize()
        clearTimeout(initTimeout)
        this.isInitializing = false
        logger.info("WhatsApp client initialization completed")
        return true
      } catch (initError) {
        clearTimeout(initTimeout)
        this.isInitializing = false
        throw initError
      }
    } catch (error) {
      logger.error("Failed to initialize WhatsApp client:", error)
      this.isReady = false
      this.isInitializing = false

      // تنظيف الموارد
      if (this.client) {
        try {
          await this.client.destroy()
        } catch (destroyError) {
          logger.error("Error destroying failed client:", destroyError)
        }
        this.client = null
      }

      // إعادة تعيين promise للسماح بإعادة المحاولة
      this.initializationPromise = null

      return false
    }
  }

  setupEventHandlers() {
    if (!this.client) {
      logger.warn("WhatsApp client not initialized, skipping event handler setup")
      return
    }

    this.client.on("qr", async (qr) => {
      try {
        logger.info("📱 QR code received")
        this.qrCode = await qrcode.toDataURL(qr)

        // Send QR code to admin via Telegram
        if (this.telegram) {
          await this.telegram.sendQRCode(this.qrCode)
        }
      } catch (error) {
        logger.error("Error processing QR code:", error)
      }
    })

    this.client.on("ready", () => {
      logger.info("✅ WhatsApp client is ready!")
      this.isReady = true
      this.qrCode = null

      if (this.telegram) {
        this.telegram.notifyWhatsAppReady()
      }
    })

    this.client.on("authenticated", () => {
      logger.info("🔐 WhatsApp client authenticated")
    })

    this.client.on("auth_failure", (msg) => {
      logger.error("❌ WhatsApp authentication failed:", msg)
      this.isReady = false
    })

    this.client.on("disconnected", (reason) => {
      logger.warn(`⚠️ WhatsApp client disconnected: ${reason}`)
      this.isReady = false

      if (this.telegram) {
        this.telegram.notifyWhatsAppDisconnected(reason)
      }

      // إعادة المحاولة بعد 5 ثوان
      setTimeout(() => {
        logger.info("🔄 Attempting to reconnect WhatsApp...")
        this.reconnect()
      }, 5000)
    })

    this.client.on("message", (message) => {
      logger.debug(`💬 Received WhatsApp message from ${message.from}`)
    })
  }

  async reconnect() {
    try {
      this.initializationPromise = null
      this.isInitializing = false
      await this.initialize(this.telegram)
    } catch (error) {
      logger.error("Error during WhatsApp reconnection:", error)
    }
  }

  getQRCode() {
    return this.qrCode
  }

  async sendMessage(groupId, message) {
    try {
      if (!this.isReady || !this.client) {
        throw new Error("WhatsApp client is not ready")
      }

      // Format group ID correctly
      let chatId = groupId
      if (!chatId.includes("@")) {
        chatId = `${groupId}@g.us`
      }

      await this.client.sendMessage(chatId, message)
      logger.info(`✅ Message sent to ${groupId}`)
      return { success: true }
    } catch (error) {
      logger.error(`❌ Failed to send message to ${groupId}:`, error)
      return { success: false, error: error.message }
    }
  }

  async destroy() {
    try {
      if (this.client) {
        logger.info("Destroying WhatsApp client...")
        await this.client.destroy()
        logger.info("WhatsApp client destroyed")
      }
    } catch (error) {
      logger.error("Error destroying WhatsApp client:", error)
    }
  }
}
