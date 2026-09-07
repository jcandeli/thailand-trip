import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Dev-only middleware. When the app POSTs the trip state to /api/trip,
 * write it to public/trip.json so it can be committed and published.
 */
export default function saveTripPlugin(): Plugin {
  return {
    name: 'save-trip',
    apply: 'serve',
    configureServer(server) {
      const target = resolve(server.config.root, 'public/trip.json')
      server.middlewares.use('/api/trip', (req, res, next) => {
        if (req.method !== 'POST') return next()
        let body = ''
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString()
        })
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body)
            await mkdir(dirname(target), { recursive: true })
            await writeFile(target, JSON.stringify(parsed, null, 2) + '\n', 'utf8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end('{"ok":true}')
          } catch (err) {
            server.config.logger.error(`[save-trip] ${String(err)}`)
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
        })
      })
    },
  }
}
