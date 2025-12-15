#!/usr/bin/env node

/**
 * Genererer build-informasjon for versjonering
 * Kjøres automatisk før build
 */

const fs = require('fs')
const path = require('path')

// Les package.json for versjon
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
)

// Generer build timestamp
const buildTime = new Date().toISOString()

// Opprett .env.local hvis den ikke finnes
const envPath = path.join(__dirname, '../.env.local')
let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

// Oppdater eller legg til BUILD_TIME
const buildTimeRegex = /NEXT_PUBLIC_BUILD_TIME=.*/
const versionRegex = /NEXT_PUBLIC_APP_VERSION=.*/

if (buildTimeRegex.test(envContent)) {
  envContent = envContent.replace(buildTimeRegex, `NEXT_PUBLIC_BUILD_TIME=${buildTime}`)
} else {
  envContent += `\nNEXT_PUBLIC_BUILD_TIME=${buildTime}`
}

if (versionRegex.test(envContent)) {
  envContent = envContent.replace(versionRegex, `NEXT_PUBLIC_APP_VERSION=${packageJson.version}`)
} else {
  envContent += `\nNEXT_PUBLIC_APP_VERSION=${packageJson.version}`
}

// Skriv tilbake til .env.local
fs.writeFileSync(envPath, envContent.trim() + '\n')

console.log(`✅ Build info generated:`)
console.log(`   Version: ${packageJson.version}`)
console.log(`   Build time: ${buildTime}`)
