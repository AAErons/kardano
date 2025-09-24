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
    
    // Helpers
    const coerceWeekdaysToStrings = (weekdays: any): string[] => {
      if (!Array.isArray(weekdays)) return []
      return weekdays.map((d: any) => String(d))
    }

    const expandRuleForDate = (teacher: any, dateStr: string, rule: any) => {
      const rawStart = parseInt(rule.from?.split(':')[0] || '9')
      const rawEnd = parseInt(rule.to?.split(':')[0] || '17')
      const startHour = Math.max(8, Math.min(21, rawStart))
      const endHour = Math.max(startHour + 1, Math.min(22, rawEnd))
      const teacherName = teacher.firstName && teacher.lastName 
        ? `${teacher.firstName} ${teacher.lastName}`.trim()
        : 'Pasniedzējs'
      for (let hour = startHour; hour < endHour; hour++) {
        const timeStr = `${String(hour).padStart(2, '0')}:00`
        timeSlots.push({
          teacherId: teacher.userId,
          teacherName,
          teacherDescription: teacher.description || '',
          date: dateStr,
          time: timeStr,
          duration: 45,
          subject: 'Matemātika',
          available: true,
          lessonType: rule.lessonType || 'individual',
          location: rule.location || 'facility',
          modality: rule.modality || 'in_person',
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
      
      for (const teacher of teachers) {
        if (!teacher.availability || !Array.isArray(teacher.availability)) continue
        
        // Prefer specific-day overrides
        const specific = teacher.availability.filter((a: any) => a?.type === 'specific' && a?.date === dateStr)
        if (specific.length) {
          specific.forEach((rule: any) => expandRuleForDate(teacher, dateStr, rule))
          continue
        }

        // Weekly rules if no specific-day entry
        const weekly = teacher.availability.filter((a: any) => a?.type === 'weekly' && Array.isArray(a?.weekdays))
        for (const rule of weekly) {
          const ruleDays = coerceWeekdaysToStrings(rule.weekdays)
          const isAvailableOnThisDay = ruleDays.includes(dayOfWeek)
          if (!isAvailableOnThisDay) continue

          const startDate = rule.fromDate
          const endDate = rule.until
          if (startDate && dateStr < startDate) continue
          if (endDate && dateStr > endDate) continue

          expandRuleForDate(teacher, dateStr, rule)
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
