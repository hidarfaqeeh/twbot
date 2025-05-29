import express from "express"

const router = express.Router()

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "telegram-whatsapp-bot",
    version: "1.0.0",
  })
})

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Telegram WhatsApp Bot is running",
    status: "OK",
    timestamp: new Date().toISOString(),
  })
})

export default router
