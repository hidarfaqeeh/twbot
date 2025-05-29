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

export default router
