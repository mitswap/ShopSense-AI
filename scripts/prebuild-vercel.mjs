import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const backend = (process.env.RENDER_BACKEND_URL ?? '').trim().replace(/\/$/, '')

if (backend) {
  const vercel = {
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    rewrites: [
      { source: '/api/(.*)', destination: `${backend}/api/$1` },
      { source: '/(.*)', destination: '/index.html' },
    ],
  }
  fs.writeFileSync(path.join(root, 'vercel.json'), JSON.stringify(vercel, null, 2) + '\n')
  console.log(`vercel.json → API proxied to ${backend} (no Vercel serverless API)`)
} else {
  console.log('vercel.json → using Vercel serverless api/index.mjs (set RENDER_BACKEND_URL for Render proxy)')
}
