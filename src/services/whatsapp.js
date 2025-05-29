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
  }

  async initialize(telegramService) {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._doInitialize(telegramService)
    return this.initializationPromise
  }

  async _doInitialize(telegramService) {
    try {
      this.telegram = telegramService

      logger.info("Creating WhatsApp client...")

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
          ],
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
        },
      })

      this.setupEventHandlers()

      logger.info("Starting WhatsApp client initialization...")
      await this.client.initialize()

      logger.info("WhatsApp client initialization completed")
      return true
    } catch (error) {
      logger.error("Failed to initialize WhatsApp client:", error)
      this.isReady = false
      // Don't throw error, just log it and continue
      return false
    }
  }

  setupEventHandlers() {
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
    })

    this.client.on("disconnected", (reason) => {
      logger.warn(`⚠️ WhatsApp client disconnected: ${reason}`)
      this.isReady = false

      if (this.telegram) {
        this.telegram.notifyWhatsAppDisconnected(reason)
      }
    })

    this.client.on("message", (message) => {
      logger.debug(`💬 Received WhatsApp message from ${message.from}`)
    })
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
