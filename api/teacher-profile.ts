// Support loading cloudinary in NodeNext/ESM envs
import { createRequire } from 'node:module'
const _require = createRequire(import.meta.url)
async function loadCloudinaryV2(): Promise<any> {
  try {
    // Prefer dynamic import when available
    // @ts-ignore
    const mod = (await import('cloudinary')).v2 as any
    return mod
  } catch {
    try {
      // Fallback to require for CJS resolution
      const mod = _require('cloudinary').v2 as any
      return mod
    } catch (e) {
      throw e
    }
  }
}
// Store teacher profile and availability rules
// GET: ?userId=... returns profile
// PUT: body { userId, photo?: string(base64 data url), description?: string, availability: Rule[] }
// Rule: { type: 'weekly'|'weekdayRange'|'specific', weekdays?: number[], from?: string, to?: string, until?: string|null, date?: string }

let _client: any | null = null

async function getClient(): Promise<any> {
  if (_client) return _client
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI
  if (!uri) throw new Error('Missing MONGO_URI (or MONGODB_URI)')
  const { MongoClient } = await import('mongodb')
  _client = new MongoClient(uri, {})
  await _client.connect()
  return _client
}

export default async function handler(req: any, res: any) {
  try {
    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    const col = db.collection('teachers')

    if (req.method === 'GET') {
      const { userId } = (req.query || {}) as any
      if (!userId) return res.status(400).json({ error: 'Missing userId' })
      const doc = await col.findOne({ userId: String(userId) })
      return res.status(200).json({ profile: doc || null })
    }

    if (req.method === 'PUT') {
      const { userId, photo, description, availability } = (req.body || {}) as { userId?: string; photo?: string; description?: string; availability?: any[] }
      if (!userId) return res.status(400).json({ error: 'Missing userId' })
      // Basic validation for availability structure
      const rules = Array.isArray(availability) ? availability : []
      const setDoc: any = { description: description || '', availability: rules, updatedAt: new Date() }
      // Only attempt upload on valid data URI
      if (photo && typeof photo === 'string') {
        if (photo.startsWith('data:image')) {
          try {
            const cloud = await loadCloudinaryV2()
            const folder = `teachers/${userId}`
            const result = await cloud.uploader.upload(photo, { folder, overwrite: true, invalidate: true, resource_type: 'image' })
            setDoc.photo = result.secure_url
            setDoc.photoPublicId = result.public_id
          } catch (e: any) {
            console.error('[teacher-profile] cloudinary upload error', e?.message || e)
            return res.status(400).json({ error: 'Image upload failed' })
          }
        } else {
          // If provided a non-data URL string, persist as-is
          setDoc.photo = photo
        }
      }
      await col.updateOne({ userId: String(userId) }, { $set: setDoc, $setOnInsert: { userId: String(userId), createdAt: new Date() } }, { upsert: true })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


