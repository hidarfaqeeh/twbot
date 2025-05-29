import { Client, LocalAuth } from "whatsapp-web.js"
import qrcode from "qrcode"
import logger from "../utils/logger.js"

export class WhatsAppService {
  constructor() {
    this.client = null
    this.isReady = false
    this.qrCode = null
    this.telegramService = null
    this.retryCount = 0
    this.maxRetries = 3
  }

  async initialize(telegramService) {
    try {
      this.telegramService = telegramService

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: "./whatsapp-session",
        }),
        puppeteer: {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
          ],
          headless: true,
        },
      })

      this.setupEventHandlers()

      logger.info("Initializing WhatsApp client...")
      await this.client.initialize()
    } catch (error) {
      logger.error("Failed to initialize WhatsApp client:", error)

      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        logger.info(`Retrying WhatsApp initialization (${this.retryCount}/${this.maxRetries})...`)
        setTimeout(() => this.initialize(telegramService), 5000)
      } else {
        throw error
      }
    }
  }

  setupEventHandlers() {
    this.client.on("qr", async (qr) => {
      try {
        logger.info("📱 New QR code received")

        // تحويل QR إلى صورة
        this.qrCode = await qrcode.toDataURL(qr)

        // إرسال QR عبر التلجرام إذا كان متاحاً
        if (this.telegramService) {
          await this.telegramService.sendQRCode(this.qrCode)
        }
      } catch (error) {
        logger.error("Error processing QR code:", error)
      }
    })

    this.client.on("ready", () => {
      this.isReady = true
      this.retryCount = 0
      logger.info("✅ WhatsApp client is ready!")

      if (this.telegramService) {
        this.telegramService.notifyWhatsAppReady()
      }
    })

    this.client.on("authenticated", () => {
      logger.info("🔐 WhatsApp client authenticated")
    })

    this.client.on("auth_failure", (msg) => {
      logger.error("❌ WhatsApp authentication failed:", msg)
    })

    this.client.on("disconnected", (reason) => {
      this.isReady = false
      logger.warn("⚠️ WhatsApp client disconnected:", reason)

      if (this.telegramService) {
        this.telegramService.notifyWhatsAppDisconnected(reason)
      }
    })

    this.client.on("message", (message) => {
      logger.debug(`📨 WhatsApp message received: ${message.body?.substring(0, 50)}...`)
    })
  }

  async sendMessage(chatId, message) {
    try {
      if (!this.isReady) {
        throw new Error("WhatsApp client is not ready")
      }

      // تنسيق معرف المحادثة
      const formattedChatId = this.formatChatId(chatId)

      await this.client.sendMessage(formattedChatId, message)
      logger.info(`✅ Message sent to ${chatId}`)

      return { success: true }
    } catch (error) {
      logger.error(`❌ Failed to send message to ${chatId}:`, error)
      return { success: false, error: error.message }
    }
  }

  formatChatId(chatId) {
    // إزالة أي رموز غير مرغوب فيها
    const cleanId = chatId.replace(/[^\d]/g, "")

    // إضافة رمز الدولة إذا لم يكن موجوداً
    if (cleanId.length === 10 && !cleanId.startsWith("2")) {
      return `2${cleanId}@c.us`
    }

    // للمجموعات
    if (cleanId.includes("-")) {
      return `${cleanId}@g.us`
    }

    // للأرقام العادية
    return `${cleanId}@c.us`
  }

  async getChats() {
    try {
      if (!this.isReady) {
        throw new Error("WhatsApp client is not ready")
      }

      const chats = await this.client.getChats()
      return chats
        .filter((chat) => chat.isGroup)
        .map((chat) => ({
          id: chat.id._serialized,
          name: chat.name,
        }))
    } catch (error) {
      logger.error("Error getting chats:", error)
      return []
    }
  }

  async destroy() {
    try {
      if (this.client) {
        await this.client.destroy()
        logger.info("WhatsApp client destroyed")
      }
    } catch (error) {
      logger.error("Error destroying WhatsApp client:", error)
    }
  }

  getQRCode() {
    return this.qrCode
  }
}
