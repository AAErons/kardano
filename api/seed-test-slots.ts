import type { VercelRequest, VercelResponse } from '@vercel/node'

let _client: any | null = null

async function getClient(): Promise<any> {
  if (_client) return _client
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI
  if (!uri) throw new Error('Missing MONGO_URI')
  const { MongoClient } = await import('mongodb')
  _client = new MongoClient(uri, {})
  await _client.connect()
  return _client
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()

    // Get a teacher to assign these slots to
    const teacher = await db.collection('users').findOne({ role: 'worker' })
    if (!teacher) {
      return res.status(404).json({ error: 'No teacher found in database' })
    }

    const teacherId = String(teacher._id)
    const teacherName = teacher.firstName && teacher.lastName 
      ? `${teacher.firstName} ${teacher.lastName}`.trim()
      : 'Test Teacher'

    // Date: November 29, 2024 (or 2025 depending on current year)
    const now = new Date()
    const year = now.getFullYear()
    
    // Create date at noon to avoid timezone issues
    const targetDate = new Date(year, 10, 29, 12, 0, 0) // Month 10 = November (0-indexed)
    
    // If Nov 29 has passed this year, use next year
    if (targetDate < now) {
      targetDate.setFullYear(year + 1)
    }
    
    // Format manually to avoid timezone conversion
    const targetYear = targetDate.getFullYear()
    const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0')
    const targetDay = String(targetDate.getDate()).padStart(2, '0')
    const dateStr = `${targetYear}-${targetMonth}-${targetDay}` // YYYY-MM-DD

    // Remove existing test slots for this date
    await db.collection('time_slots').deleteMany({ 
      teacherId, 
      date: dateStr 
    })

    // Create 70 time slots
    const timeSlots: any[] = []
    const lessonTypes = ['individual', 'group']
    const modalities = ['in_person', 'zoom', 'both']
    const locations = ['facility', 'online']
    
    for (let i = 0; i < 70; i++) {
      const hour = 8 + Math.floor(i / 4) // Start at 8:00, increment every 4 slots
      const minute = (i % 4) * 15 // 00, 15, 30, 45
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      
      const lessonType = lessonTypes[i % lessonTypes.length]
      const modality = modalities[i % modalities.length]
      
      timeSlots.push({
        teacherId,
        teacherName,
        teacherDescription: teacher.description || 'Test teacher for calendar display',
        date: dateStr,
        time: timeStr,
        duration: 45,
        subject: 'Matemātika',
        available: i >= 23, // First 23 are booked (available: false), rest are available
        lessonType,
        location: modality === 'zoom' ? 'online' : 'facility',
        modality,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Insert the test slots
    await db.collection('time_slots').insertMany(timeSlots)

    console.log('[seed-test-slots] Created 70 test slots for %s (23 booked, 47 available)', dateStr)

    return res.status(200).json({ 
      success: true,
      message: `Created 70 test time slots for ${dateStr}`,
      date: dateStr,
      totalSlots: 70,
      bookedSlots: 23,
      availableSlots: 47
    })

  } catch (error: any) {
    console.error('[seed-test-slots] error', error)
    return res.status(500).json({ error: error?.message || 'Internal server error' })
  }
}

