// Bookings API: create bookings, list for users/teachers, accept/decline

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

type CreateBookingBody = {
  userId: string
  teacherId: string
  slotId?: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  studentId?: string | null
}

export default async function handler(req: any, res: any) {
  try {
    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()

    const bookings = db.collection('bookings')
    const timeSlots = db.collection('time_slots')
    const users = db.collection('users')
    const notifications = db.collection('notifications')

    if (req.method === 'POST') {
      const body = (req.body || {}) as CreateBookingBody
      const userId = String(body.userId || '')
      const teacherId = String(body.teacherId || '')
      const date = String(body.date || '')
      const time = String(body.time || '')
      const studentId = body.studentId ? String(body.studentId) : null
      if (!userId || !teacherId || !date || !time) {
        return res.status(400).json({ error: 'Missing userId, teacherId, date or time' })
      }

      const now = new Date()

      // Optional: ensure slot exists and is available
      const slot = await timeSlots.findOne({ teacherId, date, time })
      if (!slot) {
        return res.status(404).json({ error: 'Time slot not found' })
      }
      if (slot.available === false) {
        return res.status(409).json({ error: 'Time slot is no longer available' })
      }

      // Create booking with pending status
      const bookingDoc = {
        userId,
        teacherId,
        date,
        time,
        studentId: studentId || null,
        status: 'pending', // pending | accepted | declined | declined_conflict | cancelled
        createdAt: now,
        updatedAt: now,
      }
      const result = await bookings.insertOne(bookingDoc as any)

      // Notify teacher
      try {
        const user = await users.findOne({ _id: new (await import('mongodb')).ObjectId(userId) }).catch(() => null as any)
        const actorName = (user && (user.name || user.username || user.email)) || null
        await notifications.insertOne({
          type: 'booking_request',
          title: 'Jauns rezervācijas pieprasījums',
          message: `${actorName || 'Lietotājs'} pieprasīja stundu ${date} ${time}.`,
          recipientRole: 'worker',
          recipientUserId: teacherId,
          actorUserId: userId,
          actorName,
          unread: true,
          related: { bookingId: String(result.insertedId), date, time },
          createdAt: new Date(),
        })
      } catch {}

      return res.status(201).json({ ok: true, id: String(result.insertedId) })
    }

    if (req.method === 'GET') {
      const { role, userId, status } = req.query as { role?: string; userId?: string; status?: string }
      if (!role || !userId) return res.status(400).json({ error: 'Missing role or userId' })

      const query: any = {}
      if (role === 'user') query.userId = String(userId)
      else if (role === 'worker') query.teacherId = String(userId)
      else return res.status(400).json({ error: 'Invalid role' })

      if (status) query.status = status

      const items = await bookings.find(query).sort({ date: 1, time: 1 }).toArray()
      
      // Enhance with user and student details
      const enhancedItems = await Promise.all(items.map(async (item: any) => {
        const enhanced: any = { ...item }
        
        // Get user details
        try {
          const user = await users.findOne({ _id: new (await import('mongodb')).ObjectId(item.userId) })
          if (user) {
            // Use firstName and lastName if available, otherwise fallback to email
            if (user.firstName && user.lastName) {
              enhanced.userName = `${user.firstName} ${user.lastName}`
            } else {
              enhanced.userName = user.email
            }
            enhanced.userEmail = user.email
            enhanced.userPhone = user.phone
            enhanced.userRole = user.role // Add role to distinguish account types
          }
        } catch {}
        
        // Get student details if studentId exists (parent account)
        if (item.studentId) {
          try {
            const students = db.collection('students')
            const student = await students.findOne({ _id: new (await import('mongodb')).ObjectId(item.studentId) })
            if (student) {
              enhanced.studentName = `${student.firstName} ${student.lastName}`
            }
          } catch {}
        }
        
        // Get teacher details for user view
        try {
          const teacher = await users.findOne({ _id: new (await import('mongodb')).ObjectId(item.teacherId) })
          if (teacher) {
            if (teacher.firstName && teacher.lastName) {
              enhanced.teacherName = `${teacher.firstName} ${teacher.lastName}`
            } else {
              enhanced.teacherName = teacher.email
            }
          }
        } catch {}
        
        return enhanced
      }))
      
      return res.status(200).json({ items: enhancedItems })
    }

    if (req.method === 'PATCH') {
      const { bookingId, action, teacherId } = (req.body || {}) as { bookingId?: string; action?: 'accept' | 'decline'; teacherId?: string }
      if (!bookingId || !action) return res.status(400).json({ error: 'Missing bookingId or action' })
      const { ObjectId } = await import('mongodb')
      const _id = new ObjectId(String(bookingId))

      const booking = await bookings.findOne({ _id })
      if (!booking) return res.status(404).json({ error: 'Booking not found' })
      const teacherIdEffective = String(teacherId || booking.teacherId)

      if (action === 'decline') {
        await bookings.updateOne({ _id }, { $set: { status: 'declined', updatedAt: new Date() } })
        return res.status(200).json({ ok: true })
      }

      if (action === 'accept') {
        // Accept this booking, lock the slot and decline others for same teacher/date/time
        const { date, time } = booking
        await bookings.updateOne({ _id }, { $set: { status: 'accepted', updatedAt: new Date() } })
        await timeSlots.updateMany({ teacherId: teacherIdEffective, date, time }, { $set: { available: false, updatedAt: new Date() } })
        await bookings.updateMany({ _id: { $ne: _id }, teacherId: teacherIdEffective, date, time, status: { $in: ['pending'] } }, { $set: { status: 'declined_conflict', updatedAt: new Date() } })
        return res.status(200).json({ ok: true })
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


