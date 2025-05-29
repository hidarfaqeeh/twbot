import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js"
import qrcode from "qrcode-terminal"
import logger from "../utils/logger.js"

export class WhatsAppService {
  constructor() {
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
        ],
      },
    })

    this.isReady = false
    this.setupEventHandlers()
  }

  setupEventHandlers() {
    this.client.on("qr", (qr) => {
      logger.info("WhatsApp QR Code received")
      qrcode.generate(qr, { small: true })
      console.log("📱 Scan the QR code above with your WhatsApp to login")
    })

    this.client.on("ready", () => {
      logger.info("WhatsApp client is ready!")
      this.isReady = true
    })

    this.client.on("authenticated", () => {
      logger.info("WhatsApp client authenticated")
    })

    this.client.on("auth_failure", (msg) => {
      logger.error("WhatsApp authentication failed:", msg)
    })

    this.client.on("disconnected", (reason) => {
      logger.warn("WhatsApp client disconnected:", reason)
      this.isReady = false
    })
  }

  async initialize() {
    try {
      logger.info("Initializing WhatsApp client...")
      await this.client.initialize()
    } catch (error) {
      logger.error("Failed to initialize WhatsApp client:", error)
      throw error
    }
  }

  async sendMessage(groupId, message) {
    try {
      if (!this.isReady) {
        throw new Error("WhatsApp client is not ready")
      }

      const chatId = `${groupId}@g.us`
      await this.client.sendMessage(chatId, message)
      logger.info(`Message sent to WhatsApp group: ${groupId}`)
      return true
    } catch (error) {
      logger.error(`Failed to send message to WhatsApp group ${groupId}:`, error)
      throw error
    }
  }

  async getChats() {
    try {
      if (!this.isReady) {
        throw new Error("WhatsApp client is not ready")
      }

      const chats = await this.client.getChats()
      const groups = chats.filter((chat) => chat.isGroup)

      return groups.map((group) => ({
        id: group.id._serialized.replace("@g.us", ""),
        name: group.name,
      }))
    } catch (error) {
      logger.error("Failed to get WhatsApp chats:", error)
      throw error
    }
  }

  async sendMedia(groupId, mediaPath, caption = "") {
    try {
      if (!this.isReady) {
        throw new Error("WhatsApp client is not ready")
      }

      const chatId = `${groupId}@g.us`
      const media = MessageMedia.fromFilePath(mediaPath)
      await this.client.sendMessage(chatId, media, { caption })
      logger.info(`Media sent to WhatsApp group: ${groupId}`)
      return true
    } catch (error) {
      logger.error(`Failed to send media to WhatsApp group ${groupId}:`, error)
      throw error
    }
  }
}
