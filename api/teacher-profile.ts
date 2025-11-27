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

async function generateTimeSlotsFromAvailability(db: any, userId: string, availability: any[]) {
  if (!availability || availability.length === 0) return

  const teacher = await db.collection('teachers').findOne({ userId })
  if (!teacher) return

  const teacherName = teacher.firstName && teacher.lastName 
    ? `${teacher.firstName} ${teacher.lastName}`.trim()
    : 'Pasniedzējs'

  const timeSlots: any[] = []
  const today = new Date()

  const coerceWeekdaysToStrings = (weekdays: any): string[] => {
    if (!Array.isArray(weekdays)) return []
    return weekdays.map((d: any) => String(d))
  }

  // Expand a rule into discrete hourly slots for a given date
  const expandRuleForDate = (rule: any, dateStr: string) => {
    const startHour = parseInt(rule.from?.split(':')[0] || '9')
    const endHour = parseInt(rule.to?.split(':')[0] || '17')
    for (let hour = startHour; hour < endHour; hour++) {
      const timeStr = `${String(hour).padStart(2, '0')}:00`
      const lessonType = rule.lessonType || 'individual'
      let modality = rule.modality || 'in_person'
      // Group lessons cannot have 'both' modality - default to 'in_person' if incorrectly set
      if (lessonType === 'group' && modality === 'both') {
        modality = 'in_person'
      }
      
      timeSlots.push({
        teacherId: userId,
        teacherName: teacherName,
        teacherDescription: teacher.description || '',
        date: dateStr,
        time: timeStr,
        duration: 45,
        subject: 'Matemātika',
        available: true,
        lessonType: lessonType,
        location: rule.location || 'facility',
        modality: modality,
        groupSize: typeof rule.groupSize === 'number' ? rule.groupSize : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
  }

  // Generate slots for the next 90 days
  for (let i = 0; i < 90; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
    const dayOfWeek = String(date.getDay() === 0 ? 7 : date.getDay()) // 1..7, Monday=1

    // Prefer specific-day overrides
    const specificRules = availability.filter((a: any) => a?.type === 'specific' && a?.date === dateStr)
    if (specificRules.length) {
      specificRules.forEach((rule: any) => expandRuleForDate(rule, dateStr))
      continue
    }

    // Fall back to weekly rules within optional date range
    const weeklyRules = availability.filter((a: any) => a?.type === 'weekly' && Array.isArray(a?.weekdays))
    for (const rule of weeklyRules) {
      const ruleDays = coerceWeekdaysToStrings(rule.weekdays)
      const isAvailableOnThisDay = ruleDays.includes(dayOfWeek)
      if (!isAvailableOnThisDay) continue

      const startDate = rule.fromDate
      const endDate = rule.until
      if (startDate && dateStr < startDate) continue
      if (endDate && dateStr > endDate) continue

      expandRuleForDate(rule, dateStr)
    }
  }

  // Remove existing time slots for this teacher
  await db.collection('time_slots').deleteMany({ teacherId: userId })

  // Insert new time slots
  if (timeSlots.length > 0) {
    await db.collection('time_slots').insertMany(timeSlots)
    console.log('[teacher-profile] Generated %d time slots for teacher %s', timeSlots.length, userId)
  }
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
        updatedAt: new Date(),
      }
      const shouldUpdateAvailability = Array.isArray(availability)
      if (shouldUpdateAvailability) {
        updateDoc.availability = availability
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

      // Generate time slots from availability ONLY if availability was updated
      if (shouldUpdateAvailability) {
        try {
          console.log('[teacher-profile] Generating time slots for teacher', userId)
          console.log('[teacher-profile] Availability data:', JSON.stringify(availability, null, 2))
          await generateTimeSlotsFromAvailability(db, userId, availability || [])
        } catch (e) {
          console.warn('[teacher-profile] failed to generate time slots', e)
        }
      }

      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


