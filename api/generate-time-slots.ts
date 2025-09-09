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
    console.log('[generate-time-slots] Generating time slots from teacher availability')
    
    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    
    // Get all teachers with availability
    const teachers = await db.collection('teachers').find({}).toArray()
    console.log('[generate-time-slots] Found %d teachers with profiles', teachers.length)
    
    const timeSlots: any[] = []
    const today = new Date()
    
    // Generate slots for the next 90 days
    for (let i = 0; i < 90; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
      const dayOfWeek = String(date.getDay() === 0 ? 7 : date.getDay()) // Convert Sunday=0 to Sunday=7
      
      for (const teacher of teachers) {
        if (!teacher.availability || !Array.isArray(teacher.availability)) continue
        
        // Check if teacher is available on this day
        for (const availability of teacher.availability) {
          if (availability.type === 'weekly' && availability.weekdays) {
            // Check if this day of week is in the availability
            const isAvailableOnThisDay = availability.weekdays.includes(dayOfWeek)
            
            if (isAvailableOnThisDay) {
              // Check date range
              const startDate = availability.fromDate
              const endDate = availability.until
              
              if (startDate && dateStr < startDate) continue
              if (endDate && dateStr > endDate) continue
              
              // Generate hourly slots between start and end time
              const startHour = parseInt(availability.from?.split(':')[0] || '9')
              const endHour = parseInt(availability.to?.split(':')[0] || '17')
              
              for (let hour = startHour; hour < endHour; hour++) {
                const timeStr = `${String(hour).padStart(2, '0')}:00`
                const teacherName = teacher.firstName && teacher.lastName 
                  ? `${teacher.firstName} ${teacher.lastName}`.trim()
                  : 'Pasniedzējs'
                
                timeSlots.push({
                  teacherId: teacher.userId,
                  teacherName: teacherName,
                  teacherDescription: teacher.description || '',
                  date: dateStr,
                  time: timeStr,
                  duration: 45, // Fixed 45 minutes
                  subject: 'Matemātika',
                  available: true,
                  createdAt: new Date(),
                  updatedAt: new Date()
                })
              }
            }
          }
        }
      }
    }
    
    console.log('[generate-time-slots] Generated %d time slots', timeSlots.length)
    
    // Clear existing time slots
    await db.collection('time_slots').deleteMany({})
    
    // Insert new time slots
    if (timeSlots.length > 0) {
      await db.collection('time_slots').insertMany(timeSlots)
      console.log('[generate-time-slots] Inserted %d time slots', timeSlots.length)
    }
    
    return res.status(200).json({ 
      success: true,
      message: `Generated ${timeSlots.length} time slots`,
      slotsGenerated: timeSlots.length,
      teachersProcessed: teachers.length
    })
    
  } catch (e: any) {
    console.error('[generate-time-slots] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}
