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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  
  try {
    console.log('[time-slots] method=%s', req.method)
    
    const { teacherId, date, available } = req.query as { 
      teacherId?: string
      date?: string
      available?: string
    }
    
    console.log('[time-slots] query params:', { teacherId, date, available })

    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    console.log('[time-slots] using db', { dbName: db.databaseName })

    // Build query
    const query: any = {}
    if (teacherId) query.teacherId = teacherId
    if (date) query.date = date
    if (available !== undefined) query.available = available === 'true'

    // Get time slots
    const timeSlots = await db.collection('time_slots').find(query).sort({ date: 1, time: 1 }).toArray()
    
    console.log('[time-slots] found %d slots', timeSlots.length)

    // Get teacher information for each slot
    const teacherIds = [...new Set(timeSlots.map((slot: any) => slot.teacherId))] as string[]
    const teachers = await db.collection('users').find({ 
      _id: { $in: teacherIds.map(id => new ObjectId(String(id))) },
      role: 'worker',
      active: true
    }).project({ name: 1, firstName: 1, lastName: 1, description: 1 }).toArray()

    const teacherMap: Record<string, any> = {}
    teachers.forEach((teacher: any) => {
      teacherMap[String(teacher._id)] = {
        id: String(teacher._id),
        name: teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim(),
        description: teacher.description || ''
      }
    })

    // Format response
    const formattedSlots = timeSlots.map((slot: any) => ({
      id: String(slot._id),
      teacherId: slot.teacherId,
      teacherName: teacherMap[slot.teacherId]?.name || 'Unknown Teacher',
      teacherDescription: teacherMap[slot.teacherId]?.description || '',
      date: slot.date,
      time: slot.time,
      duration: slot.duration || 60,
      subject: slot.subject || 'Matemātika',
      available: Boolean(slot.available),
      createdAt: slot.createdAt
    }))

    return res.status(200).json({ 
      success: true,
      timeSlots: formattedSlots,
      teachers: Object.values(teacherMap)
    })
    
  } catch (e: any) {
    console.error('[time-slots] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}
