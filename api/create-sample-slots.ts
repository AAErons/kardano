import { ObjectId } from 'mongodb'

let _client: any = null

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  
  try {
    console.log('[create-sample-slots] method=%s', req.method)
    
    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    console.log('[create-sample-slots] using db', { dbName: db.databaseName })

    // Get all active teachers
    const teachers = await db.collection('users').find({ 
      role: 'worker',
      active: true
    }).project({ _id: 1, name: 1, firstName: 1, lastName: 1 }).toArray()

    if (teachers.length === 0) {
      return res.status(400).json({ error: 'No active teachers found' })
    }

    console.log('[create-sample-slots] found %d teachers', teachers.length)

    // Create sample time slots for the next 30 days
    const sampleSlots = []
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
      
      // Skip weekends for now
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      // Create 2-3 slots per day for each teacher
      const times = ['10:00', '14:00', '16:00']
      
      for (const teacher of teachers) {
        for (let j = 0; j < Math.min(times.length, 2 + Math.floor(Math.random() * 2)); j++) {
          const time = times[j]
          const teacherName = teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()
          
          sampleSlots.push({
            teacherId: String(teacher._id),
            teacherName: teacherName,
            date: dateStr,
            time: time,
            duration: 60,
            subject: 'Matemātika',
            available: Math.random() > 0.3, // 70% chance of being available
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }
    }

    // Insert sample slots
    if (sampleSlots.length > 0) {
      await db.collection('time_slots').insertMany(sampleSlots)
      console.log('[create-sample-slots] created %d sample slots', sampleSlots.length)
    }

    return res.status(201).json({ 
      success: true,
      message: `Created ${sampleSlots.length} sample time slots`,
      slotsCreated: sampleSlots.length,
      teachersUsed: teachers.length
    })
    
  } catch (e: any) {
    console.error('[create-sample-slots] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}
