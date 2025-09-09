// Support loading cloudinary in NodeNext/ESM envs
import { createRequire } from 'node:module'
import { ObjectId } from 'mongodb'
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
      const { userId } = req.query
      if (!userId) return res.status(400).json({ error: 'Missing userId' })
      const profile = await col.findOne({ userId })
      return res.status(200).json({ profile: profile || null })
    }

    if (req.method === 'PUT') {
      const { userId, photo, description, availability, firstName, lastName } = req.body
      if (!userId) return res.status(400).json({ error: 'Missing userId' })

      const updateDoc: any = {
        description: description || '',
        availability: availability || [],
        updatedAt: new Date(),
      }

      if (typeof firstName === 'string') updateDoc.firstName = firstName.trim()
      if (typeof lastName === 'string') updateDoc.lastName = lastName.trim()

      if (photo) {
        if (photo.startsWith('data:image/')) {
          // It's a data URL, upload to Cloudinary
          try {
            const cloudinary = await loadCloudinaryV2()
            cloudinary.config({
              cloudinary_url: process.env.CLOUDINARY_URL,
            })
            const uploadResult = await cloudinary.uploader.upload(photo, {
              folder: `teachers/${userId}`,
              public_id: `avatar`,
              overwrite: true,
            })
            updateDoc.photo = uploadResult.secure_url
            updateDoc.photoPublicId = uploadResult.public_id
          } catch (uploadError: any) {
            console.error('[teacher-profile] cloudinary upload error', uploadError.message)
            return res.status(400).json({ error: `Image upload failed: ${uploadError.message}` })
          }
        } else if (typeof photo === 'string' && photo.startsWith('http')) {
          // It's already a URL, save directly
          updateDoc.photo = photo
        }
      }

      const existing = await col.findOne({ userId })
      await col.updateOne(
        { userId },
        { $set: updateDoc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      )

      // Optionally mirror name fields to users collection
      try {
        if (typeof firstName === 'string' || typeof lastName === 'string') {
          const users = db.collection('users')
          const toSet: any = {}
          if (typeof firstName === 'string') toSet.firstName = (firstName || '').trim()
          if (typeof lastName === 'string') toSet.lastName = (lastName || '').trim()
          const fn = toSet.firstName || existing?.firstName || ''
          const ln = toSet.lastName || existing?.lastName || ''
          const full = `${fn} ${ln}`.trim()
          if (full) toSet.name = full
          if (Object.keys(toSet).length) {
            await users.updateOne({ _id: new ObjectId(String(userId)) }, { $set: toSet })
          }
        }
      } catch (e) {
        console.warn('[teacher-profile] failed to mirror names to users', (e as any)?.message)
      }

      // Create notification if this is the first-time profile save
      try {
        if (!existing) {
          const notifications = db.collection('notifications')
          let teacherName: string | null = null
          try {
            const userDoc = await db.collection('users').findOne({ _id: new ObjectId(String(userId)) })
            teacherName = (userDoc && (userDoc.name || userDoc.username)) || null
          } catch {}
          await notifications.insertOne({
            type: 'teacher_profile_submitted',
            title: `Jauns pasniedzēja profils: ${teacherName || 'Nezināms'}`,
            message: `${teacherName || 'Pasniedzējs'} ir aizpildījis profila informāciju un iesniedzis to pārskatīšanai.`,
            recipientRole: 'admin',
            actorUserId: userId,
            actorName: teacherName || null,
            unread: true,
            createdAt: new Date(),
          })
        }
      } catch (e) {
        console.warn('[teacher-profile] failed to create notification', e)
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


