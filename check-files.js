import fs from "fs"

const requiredFiles = [
  "package.json",
  "src/index.js",
  "src/database/config.js",
  "src/database/migrate.js",
  "src/services/database.js",
  "src/services/telegram.js",
  "src/services/whatsapp.js",
  "src/utils/logger.js",
  "src/routes/health.js",
]

console.log("🔍 Checking required files...")

let allFilesExist = true

requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - MISSING!`)
    allFilesExist = false
  }
})

if (allFilesExist) {
  console.log("\n🎉 All required files are present!")
} else {
  console.log("\n❌ Some files are missing. Please check the project structure.")
  process.exit(1)
}
