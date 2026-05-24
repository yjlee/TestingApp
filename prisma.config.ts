import path from 'node:path'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const raw = trimmed.slice(eq + 1).trim()
      const val = raw.replace(/^["'](.*)["']$/, '$1')
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    // file not found — skip
  }
}

const cwd = process.cwd()
loadEnvFile(path.join(cwd, '.env'))
loadEnvFile(path.join(cwd, '.env.local'))

export default defineConfig({
  schema: path.join(import.meta.dirname, 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
