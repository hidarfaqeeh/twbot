import pkg from "whatsapp-web.js"
const { Client, LocalAuth } = pkg
import logger from "../utils/logger.js"
import { generate } from "qrcode-terminal"

export class WhatsAppService {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: "whatsapp-bot" }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process", // <- this one doesn't works in Windows
          "--disable-gpu",
        ],
      },
    })
    this.isReady = false
    this.qrCode = null
    this.telegram = null
  }

  async initialize(telegramService) {
    this.telegram = telegramService

    this.client.on("qr", (qr) => {
      logger.info("📱 QR Code received, scan it with WhatsApp!")
      this.qrCode = qr
      if (this.telegram) {
        this.telegram.sendQRCode(this.qrCode)
      } else {
        generate(qr, { small: true })
      }
    })

    this.client.on("ready", () => {
      logger.info("✅ WhatsApp is ready!")
      this.isReady = true
      this.qrCode = null
      if (this.telegram) {
        this.telegram.notifyWhatsAppReady()
      }
    })

    this.client.on("disconnected", (reason) => {
      logger.warn(`⚠️ WhatsApp disconnected: ${reason}`)
      this.isReady = false
      if (this.telegram) {
        this.telegram.notifyWhatsAppDisconnected(reason)
      }
    })

    this.client.on("message", async (msg) => {
      // Log all messages received (for debugging purposes)
      logger.debug(`✉️ Received message: ${msg.body} from ${msg.from}`)
    })

    await this.client.initialize()
  }

  getQRCode() {
    return this.qrCode
  }

  async sendMessage(chatId, message) {
    try {
      await this.client.sendMessage(chatId, message)
      return { success: true }
    } catch (error) {
      logger.error(`❌ Error sending message to ${chatId}:`, error)
      return { success: false, error: error.message }
    }
  }

  async destroy() {
    try {
      await this.client.destroy()
      logger.info("WhatsApp client destroyed")
    } catch (error) {
      logger.error("Error destroying WhatsApp client:", error)
    }
  }
}
