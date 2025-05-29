import { Client } from "whatsapp-web.js"
import qrcode from "qrcode"
import logger from "../utils/logger.js"

class WhatsappService {
  constructor() {
    this.client = new Client({
      puppeteer: {
        args: ["--no-sandbox"],
      },
    })

    this.qrCode = null
    this.qrCallback = null

    this.client.on("qr", async (qr) => {
      logger.info("New QR code received")

      try {
        // تحويل رمز QR إلى صورة
        this.qrCode = await qrcode.toDataURL(qr)

        // استدعاء الدالة المسجلة إذا وجدت
        if (this.qrCallback) {
          this.qrCallback(this.qrCode)
        }
      } catch (error) {
        logger.error("Error generating QR code:", error)
      }
    })

    this.client.on("ready", () => {
      logger.info("Whatsapp client is ready!")
    })

    this.client.on("message", (msg) => {
      logger.info("Message received", msg.body)
    })

    this.client.initialize()
  }

  // طريقة للحصول على رمز QR الحالي
  getQRCode() {
    return this.qrCode
  }

  // تسجيل دالة استدعاء لاستلام رمز QR الجديد
  onQRCode(callback) {
    this.qrCallback = callback
  }

  async sendMessage(number, message) {
    try {
      // Ensure the number is in the correct format (with country code, without + or leading 0s)
      const chatId = number.startsWith("2") ? `${number}@c.us` : `2${number}@c.us`

      await this.client.sendMessage(chatId, message)
      logger.info(`Message sent to ${number}`)
      return { success: true }
    } catch (error) {
      logger.error(`Error sending message to ${number}:`, error)
      return { success: false, error: error.message }
    }
  }
}

export default WhatsappService
