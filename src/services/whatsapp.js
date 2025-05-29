import whatsappWeb from "whatsapp-web.js"
const { Client, LocalAuth } = whatsappWeb
import qrcodeTerminal from "qrcode-terminal"
import logger from "../utils/logger.js"

export class WhatsAppService {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    })
    this.isReady = false
    this.qrCode = null
    this.telegram = null
  }

  async initialize(telegramService) {
    this.telegram = telegramService

    this.client.on("qr", (qr) => {
      logger.info("📱 QR code received, scan it with WhatsApp!")
      this.qrCode = qr
      qrcodeTerminal.generate(qr, { small: true })
      // Send QR code to admin via Telegram
      if (this.telegram) {
        this.telegram.sendQRCode(`data:image/png;base64,${this.qrCode}`)
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

    this.client.on("disconnected", (reason) => {
      logger.warn(`⚠️ WhatsApp client disconnected: ${reason}`)
      this.isReady = false
      if (this.telegram) {
        this.telegram.notifyWhatsAppDisconnected(reason)
      }
    })

    this.client.on("message", (message) => {
      logger.debug(`💬 Received message from ${message.from}: ${message.body}`)
    })

    try {
      logger.info("Starting WhatsApp client...")
      await this.client.initialize()
      logger.info("WhatsApp client initialization started")
    } catch (error) {
      logger.error("Failed to initialize WhatsApp client:", error)
      throw error
    }
  }

  getQRCode() {
    return this.qrCode
  }

  async sendMessage(groupId, message) {
    try {
      if (!this.isReady) {
        throw new Error("WhatsApp client is not ready")
      }

      // Ensure group ID has the correct suffix
      const chatId = groupId.endsWith("@g.us") ? groupId : `${groupId}@g.us`

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
      logger.info("Destroying WhatsApp client...")
      await this.client.destroy()
      logger.info("WhatsApp client destroyed")
    } catch (error) {
      logger.error("Error destroying WhatsApp client:", error)
    }
  }
}
