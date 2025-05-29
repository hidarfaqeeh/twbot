import { Client } from "whatsapp-web.js"
import qrcode from "qrcode-terminal"
import logger from "../utils/logger.js"

export class WhatsAppService {
  constructor() {
    this.client = new Client({
      puppeteer: {
        args: ["--no-sandbox"],
      },
    })

    this.client.on("qr", (qr) => {
      qrcode.generate(qr, { small: true })
    })

    this.client.on("ready", () => {
      logger.info("WhatsApp client is ready!")
    })

    this.client.on("message", (msg) => {
      logger.info("Message received", msg.body)
    })

    this.client.on("disconnected", (reason) => {
      logger.warn("WhatsApp client disconnected:", reason)
    })

    this.isReady = false
    this.client.on("ready", () => {
      this.isReady = true
    })
  }

  async initialize() {
    try {
      logger.info("Initializing WhatsApp client...")

      // إضافة timeout للتهيئة
      const initPromise = this.client.initialize()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("WhatsApp initialization timeout")), 60000),
      )

      await Promise.race([initPromise, timeoutPromise])
      logger.info("WhatsApp client initialization completed")
    } catch (error) {
      logger.error("Failed to initialize WhatsApp client:", error)
      throw error
    }
  }

  async sendMessage(number, message) {
    try {
      const chatId = number.startsWith("2") ? `${number}@c.us` : `${number}@s.whatsapp.net`
      await this.client.sendMessage(chatId, message)
      logger.info(`Message sent to ${number}`)
    } catch (error) {
      logger.error(`Failed to send message to ${number}:`, error)
      throw error
    }
  }

  getClient() {
    return this.client
  }
}
