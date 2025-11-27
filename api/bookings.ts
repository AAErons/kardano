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
  batchId?: string | null
  preferredModality?: 'in_person' | 'zoom' | null
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
      const batchId = body.batchId ? String(body.batchId) : null
      const preferredModality = body.preferredModality
      if (!userId || !teacherId || !date || !time) {
        return res.status(400).json({ error: 'Missing userId, teacherId, date or time' })
      }
      // If the user account is a parent/children account, enforce studentId
      try {
        const userDoc = await users.findOne({ _id: new (await import('mongodb')).ObjectId(userId) })
        const accountType = (userDoc && (userDoc as any).accountType) || null
        if (accountType === 'children' && !studentId) {
          return res.status(400).json({ error: 'StudentId is required for parent accounts' })
        }
      } catch {}

      const now = new Date()

      // Optional: ensure slot exists and is available
      const slot = await timeSlots.findOne({ teacherId, date, time })
      if (!slot) {
        return res.status(404).json({ error: 'Time slot not found' })
      }
      if (slot.available === false) {
        return res.status(409).json({ error: 'Time slot is no longer available' })
      }

      // Determine final modality: if slot has 'both', use user's preference; otherwise use slot's modality
      let finalModality = slot.modality || 'in_person'
      if (finalModality === 'both' && preferredModality) {
        finalModality = preferredModality
      } else if (finalModality === 'both') {
        // Default to in_person if slot is 'both' but no preference provided
        finalModality = 'in_person'
      }

      // Create booking with pending status; include slot attributes for later logic
      const bookingDoc = {
        userId,
        teacherId,
        date,
        time,
        studentId: studentId || null,
        lessonType: slot.lessonType || 'individual',
        groupSize: typeof slot.groupSize === 'number' ? slot.groupSize : undefined,
        location: slot.location || 'facility',
        modality: finalModality,
        status: 'pending', // pending | accepted | declined | declined_conflict | cancelled
        createdAt: now,
        updatedAt: now,
        batchId: batchId || undefined,
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
      if (!role) return res.status(400).json({ error: 'Missing role' })

      const query: any = {}
      if (role === 'user') {
        if (!userId) return res.status(400).json({ error: 'Missing userId' })
        query.userId = String(userId)
      } else if (role === 'worker') {
        if (!userId) return res.status(400).json({ error: 'Missing userId' })
        query.teacherId = String(userId)
      } else if (role === 'admin') {
        // Admin can view all bookings; optional status filter applies
      } else {
        return res.status(400).json({ error: 'Invalid role' })
      }

      if (status) query.status = status

      const items = await bookings.find(query).sort({ date: 1, time: 1 }).toArray()
      
      // Check for expired bookings (pending bookings that have passed their time)
      const now = Date.now()
      const expiredBookings: any[] = []
      
      for (const item of items) {
        if ((item.status === 'pending' || item.status === 'pending_unavailable') && item.date && item.time) {
          try {
            const bookingDateTime = new Date(`${item.date}T${item.time}:00`)
            if (!isNaN(bookingDateTime.getTime()) && bookingDateTime.getTime() < now) {
              expiredBookings.push(item)
            }
          } catch {}
        }
      }
      
      // Update expired bookings and notify admin
      if (expiredBookings.length > 0) {
        const { ObjectId } = await import('mongodb')
        for (const expiredItem of expiredBookings) {
          try {
            // Update status to expired
            await bookings.updateOne(
              { _id: expiredItem._id },
              { 
                $set: { 
                  status: 'expired',
                  updatedAt: new Date()
                } 
              }
            )
            
            // Update the item in our array for the response
            expiredItem.status = 'expired'
            
            // Get user and teacher details for notification
            const user = await users.findOne({ _id: new ObjectId(expiredItem.userId) }).catch(() => null as any)
            const teacher = await users.findOne({ _id: new ObjectId(expiredItem.teacherId) }).catch(() => null as any)
            
            const userName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email) : 'Lietotājs'
            const teacherName = teacher ? (teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.email) : 'Pasniedzējs'
            
            // Format date and time for notification
            const formattedDate = new Date(expiredItem.date).toLocaleDateString('lv-LV')
            const formattedTime = expiredItem.time
            
            // Find all admin users
            const admins = await users.find({ role: 'admin' }).toArray()
            
            // Create notification for each admin
            for (const admin of admins) {
              await notifications.insertOne({
                type: 'booking_expired',
                title: 'Rezervācija noilgusi',
                message: `Pasniedzējs ${teacherName} nav atbildējis uz rezervācijas pieprasījumu no ${userName}. Rezervācijas laiks: ${formattedDate} ${formattedTime}.`,
                recipientRole: 'admin',
                recipientUserId: String(admin._id),
                actorUserId: expiredItem.teacherId,
                actorName: teacherName,
                unread: true,
                related: { bookingId: String(expiredItem._id), date: expiredItem.date, time: expiredItem.time },
                createdAt: new Date(),
              })
            }
          } catch (err) {
            console.error('Error processing expired booking:', err)
          }
        }
      }
      
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
            enhanced.userDiscountCode = user.discountCode || null // Add discount code for exports
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
      const { bookingId, action, teacherId, newDate, newTime, date: groupDate, time: groupTime, amount, newSize, zoomLink, address, attended, paid, extendPreferred, batchId } = (req.body || {}) as { bookingId?: string; action?: 'accept' | 'decline' | 'reschedule_accept' | 'cancel' | 'increase_group_size' | 'report' | 'accept_batch' | 'mark_paid'; teacherId?: string; newDate?: string; newTime?: string; date?: string; time?: string; amount?: number; newSize?: number; zoomLink?: string; address?: string; attended?: boolean; paid?: boolean; extendPreferred?: boolean; batchId?: string }
      if (!action) return res.status(400).json({ error: 'Missing action' })
      if (action !== 'accept_batch' && !bookingId) return res.status(400).json({ error: 'Missing bookingId' })
      const { ObjectId } = await import('mongodb')
      
      // For accept_batch, we don't need bookingId or booking lookup
      let _id: any = null
      let booking: any = null
      let teacherIdEffective: string = ''
      
      if (action !== 'accept_batch') {
        _id = new ObjectId(String(bookingId))
        booking = await bookings.findOne({ _id })
        if (!booking) return res.status(404).json({ error: 'Booking not found' })
        teacherIdEffective = String(teacherId || booking.teacherId)
      } else {
        teacherIdEffective = String(teacherId || '')
      }

      if (action === 'decline') {
        const { reason } = (req.body || {}) as { reason?: string }
        const declineReason = typeof reason === 'string' ? reason.trim() : undefined
        await bookings.updateOne({ _id }, { $set: { status: 'declined', updatedAt: new Date(), ...(declineReason ? { declineReason } : {}) } })
        return res.status(200).json({ ok: true })
      }

      if (action === 'accept') {
        // Accept booking. For group slots, keep accepting until capacity reached.
        const { date, time } = booking
        const slot = await timeSlots.findOne({ teacherId: teacherIdEffective, date, time })
        const lessonType = (slot && slot.lessonType) || booking.lessonType || 'individual'
        const groupSize = Number((slot && slot.groupSize) || booking.groupSize || 1)

        // Validate meeting info and enrich booking
        let meetingFields: any = {}
        if (lessonType && lessonType === 'group') {
          // ok
        }
        if ((slot && slot.modality) || booking.modality) {
          const modality = (slot && slot.modality) || booking.modality
          const location = (slot && slot.location) || booking.location
          if (modality === 'zoom') {
            if (!zoomLink || typeof zoomLink !== 'string' || !zoomLink.trim()) {
              return res.status(400).json({ error: 'Missing zoomLink' })
            }
            meetingFields.zoomLink = zoomLink.trim()
          } else {
            if (location === 'teacher') {
              if (!address || typeof address !== 'string' || !address.trim()) {
                return res.status(400).json({ error: 'Missing address' })
              }
              meetingFields.address = address.trim()
              meetingFields.addressSource = 'teacher'
            } else {
              // facility: fetch admin address
              try {
                const adminData = await db.collection('admin_data').findOne({ _id: 'school' })
                if (adminData && typeof adminData.address === 'string' && adminData.address.trim()) {
                  meetingFields.address = adminData.address.trim()
                  meetingFields.addressSource = 'admin'
                }
              } catch {}
            }
          }
        }

        // Accept this booking with meeting fields
        await bookings.updateOne({ _id }, { $set: { status: 'accepted', updatedAt: new Date(), ...meetingFields } })

        if (lessonType === 'group' && groupSize > 1) {
          const acceptedCount = await bookings.countDocuments({ teacherId: teacherIdEffective, date, time, status: 'accepted' })
          if (acceptedCount >= groupSize) {
            // Capacity reached: lock slot and mark others unavailable
            await timeSlots.updateMany({ teacherId: teacherIdEffective, date, time }, { $set: { available: false, updatedAt: new Date() } })
            await bookings.updateMany({ _id: { $ne: _id }, teacherId: teacherIdEffective, date, time, status: { $in: ['pending'] } }, { $set: { status: 'pending_unavailable', updatedAt: new Date() } })
            try {
              let teacherName: string | null = null
              try {
                const t = await users.findOne({ _id: new (await import('mongodb')).ObjectId(String(teacherIdEffective)) })
                if (t) teacherName = (t.firstName && t.lastName) ? `${t.firstName} ${t.lastName}` : (t.email || null)
              } catch {}
              await notifications.insertOne({
                type: 'group_full',
                title: 'Grupu nodarbība pilna',
                message: `Grupu nodarbība ${date} ${time} ir pilna (kapacitāte: ${groupSize}).${teacherName ? `\nPasniedzējs: ${teacherName}` : ''}`,
                recipientRole: 'admin',
                unread: true,
                related: { date, time, teacherId: teacherIdEffective },
                createdAt: new Date(),
              })
            } catch {}
            // Also notify the teacher
            try {
              await notifications.insertOne({
                type: 'group_full',
                title: 'Grupu nodarbība pilna',
                message: `Grupu nodarbība ${date} ${time} ir pilna (kapacitāte: ${groupSize}).`,
                recipientRole: 'worker',
                recipientUserId: teacherIdEffective,
                unread: true,
                related: { date, time, teacherId: teacherIdEffective },
                createdAt: new Date(),
              })
            } catch {}
          } else {
            // Still capacity: keep slot available and leave others pending
            await timeSlots.updateMany({ teacherId: teacherIdEffective, date, time }, { $set: { available: true, updatedAt: new Date() } })
          }
        } else {
          // Individual or no group capacity: lock immediately
          await timeSlots.updateMany({ teacherId: teacherIdEffective, date, time }, { $set: { available: false, updatedAt: new Date() } })
          await bookings.updateMany({ _id: { $ne: _id }, teacherId: teacherIdEffective, date, time, status: { $in: ['pending'] } }, { $set: { status: 'pending_unavailable', updatedAt: new Date() } })
        }
        return res.status(200).json({ ok: true })
      }

      if (action === 'reschedule_accept') {
        // Teacher proposes a new time and accepts the booking
        const date = String(newDate || '')
        const time = String(newTime || '')
        if (!date || !time) return res.status(400).json({ error: 'Missing newDate or newTime' })

        // Ensure new slot exists and is available
        const slot = await timeSlots.findOne({ teacherId: teacherIdEffective, date, time })
        if (!slot) return res.status(404).json({ error: 'Time slot not found' })
        if (slot.available === false) return res.status(409).json({ error: 'Time slot is no longer available' })

        const lessonType = slot.lessonType || booking.lessonType || 'individual'
        const groupSize = Number(slot.groupSize || booking.groupSize || 1)
        const modality = slot.modality || booking.modality || 'in_person'
        const location = slot.location || booking.location || 'facility'

        // Validate and build meeting fields
        let meetingFields2: any = {}
        if (modality === 'zoom') {
          if (!zoomLink || typeof zoomLink !== 'string' || !zoomLink.trim()) {
            return res.status(400).json({ error: 'Missing zoomLink' })
          }
          meetingFields2.zoomLink = zoomLink.trim()
        } else {
          if (location === 'teacher') {
            if (!address || typeof address !== 'string' || !address.trim()) {
              return res.status(400).json({ error: 'Missing address' })
            }
            meetingFields2.address = address.trim()
            meetingFields2.addressSource = 'teacher'
          } else {
            try {
              const adminData = await db.collection('admin_data').findOne({ _id: 'school' })
              if (adminData && typeof adminData.address === 'string' && adminData.address.trim()) {
                meetingFields2.address = adminData.address.trim()
                meetingFields2.addressSource = 'admin'
              }
            } catch {}
          }
        }

        // Update booking to new date/time, copy slot attributes, and accept
        await bookings.updateOne({ _id }, { $set: { date, time, status: 'accepted', lessonType, groupSize: groupSize > 0 ? groupSize : undefined, modality, location, updatedAt: new Date(), ...meetingFields2 } })

        if (lessonType === 'group' && groupSize > 1) {
          const acceptedCount = await bookings.countDocuments({ teacherId: teacherIdEffective, date, time, status: 'accepted' })
          if (acceptedCount >= groupSize) {
            await timeSlots.updateMany({ teacherId: teacherIdEffective, date, time }, { $set: { available: false, updatedAt: new Date() } })
            await bookings.updateMany({ _id: { $ne: _id }, teacherId: teacherIdEffective, date, time, status: { $in: ['pending'] } }, { $set: { status: 'pending_unavailable', updatedAt: new Date() } })
            try {
              let teacherName: string | null = null
              try {
                const t = await users.findOne({ _id: new (await import('mongodb')).ObjectId(String(teacherIdEffective)) })
                if (t) teacherName = (t.firstName && t.lastName) ? `${t.firstName} ${t.lastName}` : (t.email || null)
              } catch {}
              await notifications.insertOne({
                type: 'group_full',
                title: 'Grupu nodarbība pilna',
                message: `Grupu nodarbība ${date} ${time} ir pilna (kapacitāte: ${groupSize}).${teacherName ? `\nPasniedzējs: ${teacherName}` : ''}`,
                recipientRole: 'admin',
                unread: true,
                related: { date, time, teacherId: teacherIdEffective },
                createdAt: new Date(),
              })
            } catch {}
            try {
              await notifications.insertOne({
                type: 'group_full',
                title: 'Grupu nodarbība pilna',
                message: `Grupu nodarbība ${date} ${time} ir pilna (kapacitāte: ${groupSize}).`,
                recipientRole: 'worker',
                recipientUserId: teacherIdEffective,
                unread: true,
                related: { date, time, teacherId: teacherIdEffective },
                createdAt: new Date(),
              })
            } catch {}
          } else {
            await timeSlots.updateMany({ teacherId: teacherIdEffective, date, time }, { $set: { available: true, updatedAt: new Date() } })
          }
        } else {
          await timeSlots.updateMany({ teacherId: teacherIdEffective, date, time }, { $set: { available: false, updatedAt: new Date() } })
          await bookings.updateMany({ _id: { $ne: _id }, teacherId: teacherIdEffective, date, time, status: { $in: ['pending'] } }, { $set: { status: 'pending_unavailable', updatedAt: new Date() } })
        }
        return res.status(200).json({ ok: true })
      }

      if (action === 'cancel') {
        // Cancel booking (pending or accepted). Free slot availability if needed.
        const { date, time } = booking
        const teacher = String(booking.teacherId)
        const slot = await timeSlots.findOne({ teacherId: teacher, date, time })
        const lessonType = (slot && slot.lessonType) || booking.lessonType || 'individual'
        const groupSize = Number((slot && slot.groupSize) || booking.groupSize || 1)

        const { reason } = (req.body || {}) as { reason?: string }
        const cancelReason = typeof reason === 'string' ? reason.trim() : undefined
        const cancelledBy = req.body && req.body.teacherId ? 'teacher' : 'user'
          const cancelTs = new Date()
          await bookings.updateOne({ _id }, { $set: { status: 'cancelled', updatedAt: cancelTs, cancelledBy, ...(cancelReason ? { cancelReason } : {}) } })

        // Re-evaluate availability only if previously accepted affected capacity, or generally ensure availability when capacity not full
        const acceptedCount = await bookings.countDocuments({ teacherId: teacher, date, time, status: 'accepted' })
        const available = lessonType === 'group' ? (acceptedCount < Math.max(1, groupSize)) : (acceptedCount === 0)
        if (available) {
          await timeSlots.updateMany({ teacherId: teacher, date, time }, { $set: { available: true, updatedAt: new Date() } })
          // Reopen queue
          await bookings.updateMany({ teacherId: teacher, date, time, status: 'pending_unavailable' }, { $set: { status: 'pending', updatedAt: new Date() } })
        }

        // Notify counterparty about cancellation (keep existing behavior for user-initiated)
        try {
          if (cancelledBy === 'user') {
            const actor = await users.findOne({ _id: new (await import('mongodb')).ObjectId(String(booking.userId)) }).catch(() => null as any)
            const actorName = (actor && (actor.name || actor.username || actor.email)) || null
            await notifications.insertOne({
              type: 'booking_cancelled',
              title: 'Rezervācija atcelta',
              message: `${actorName || 'Lietotājs'} atcēla rezervāciju ${date} ${time}.${cancelReason ? `\nPamatojums: ${cancelReason}` : ''}`,
              recipientRole: 'worker',
              recipientUserId: teacher,
              actorUserId: String(booking.userId),
              actorName,
              unread: true,
              related: { bookingId: String(booking._id), date, time },
              createdAt: new Date(),
            })
          }
        } catch {}

        // Notify teacher as well when teacher cancels an accepted booking
        try {
          if (booking.status === 'accepted' && cancelledBy === 'teacher') {
            await notifications.insertOne({
              type: 'booking_cancelled',
              title: 'Apstiprināta rezervācija atcelta',
              message: `Pasniedzējs atcēla apstiprinātu rezervāciju ${date} ${time}.${cancelReason ? `\nPamatojums: ${cancelReason}` : ''}`,
              recipientRole: 'worker',
              recipientUserId: teacher,
              actorUserId: String(booking.teacherId),
              unread: true,
              related: { bookingId: String(booking._id), date, time },
              createdAt: new Date(),
            })
          }
        } catch {}

          // Notify admin for late (same-day) cancellations of accepted bookings
          try {
            const wasAccepted = booking.status === 'accepted'
            if (wasAccepted) {
              const dayStart = new Date(date)
              dayStart.setHours(0,0,0,0)
              if (cancelTs.getTime() >= dayStart.getTime()) {
                await notifications.insertOne({
                  type: 'late_cancellation',
                  title: 'Vēla atcelšana',
                  message: `${cancelledBy === 'teacher' ? 'Pasniedzējs' : 'Lietotājs'} atcēla apstiprinātu rezervāciju ${date} ${time}.`,
                  recipientRole: 'admin',
                  actorUserId: String(cancelledBy === 'teacher' ? booking.teacherId : booking.userId),
                  unread: true,
                  related: { bookingId: String(booking._id), date, time },
                  createdAt: new Date(),
                })
              }
            }
          } catch {}

        return res.status(200).json({ ok: true, available })
      }
      
      if (action === 'report') {
        const setDoc: any = { updatedAt: new Date() }
        if (typeof attended === 'boolean') setDoc.attended = attended
        if (typeof paid === 'boolean') setDoc.paid = paid
        if (typeof extendPreferred === 'boolean') setDoc.extendPreferred = extendPreferred
        await bookings.updateOne({ _id }, { $set: setDoc })
        return res.status(200).json({ ok: true })
      }

      if (action === 'mark_paid') {
        await bookings.updateOne({ _id }, { $set: { paid: Boolean(paid), updatedAt: new Date() } })
        return res.status(200).json({ ok: true })
      }

      if (action === 'increase_group_size') {
        // Increase capacity for a specific group time slot
        const date = String(groupDate || booking.date)
        const time = String(groupTime || booking.time)
        const teacher = String(teacherId || booking.teacherId)
        const slot = await timeSlots.findOne({ teacherId: teacher, date, time })
        if (!slot) return res.status(404).json({ error: 'Time slot not found' })
        const currentSize = Number(slot.groupSize || booking.groupSize || 1)
        const delta = typeof amount === 'number' && amount > 0 ? amount : 1
        const target = typeof newSize === 'number' && newSize > currentSize ? newSize : currentSize + delta

        // Update time slot capacity
        await timeSlots.updateMany({ teacherId: teacher, date, time }, { $set: { groupSize: target, updatedAt: new Date() } })

        // Recompute availability
        const acceptedCount = await bookings.countDocuments({ teacherId: teacher, date, time, status: 'accepted' })
        const available = acceptedCount < target
        await timeSlots.updateMany({ teacherId: teacher, date, time }, { $set: { available, updatedAt: new Date() } })

        // Reopen pending_unavailable back to pending so teacher can continue processing
        if (available) {
          await bookings.updateMany({ teacherId: teacher, date, time, status: 'pending_unavailable' }, { $set: { status: 'pending', updatedAt: new Date() } })
        }

        return res.status(200).json({ ok: true, groupSize: target, available })
      }

      if (action === 'accept_batch') {
        // Accept all pending bookings in a batch for this teacher.
        if (!batchId) return res.status(400).json({ error: 'Missing batchId' })
        const teacherIdEffective2 = String(teacherId || '')
        if (!teacherIdEffective2) return res.status(400).json({ error: 'Missing teacherId' })
        const list = await bookings.find({ teacherId: teacherIdEffective2, batchId, status: { $in: ['pending','pending_unavailable'] } }).toArray()
        if (!list || list.length === 0) return res.status(404).json({ error: 'No pending bookings in this batch' })
        // Validate required meeting info across modalities/locations
        const slotMap: Record<string, any> = {}
        for (const b of list) {
          const key = `${b.date}|${b.time}`
          if (!slotMap[key]) slotMap[key] = await timeSlots.findOne({ teacherId: teacherIdEffective2, date: b.date, time: b.time })
        }
        const needsZoom = list.some((b: any) => (slotMap[`${b.date}|${b.time}`]?.modality || b.modality) === 'zoom')
        const locations = list.map((b: any) => slotMap[`${b.date}|${b.time}`]?.location || b.location)
        const needsTeacherAddress = locations.some((l: any) => l === 'teacher')
        if (needsZoom && (!zoomLink || !String(zoomLink).trim())) return res.status(400).json({ error: 'Missing zoomLink' })
        if (!needsZoom && needsTeacherAddress && (!address || !String(address).trim())) return res.status(400).json({ error: 'Missing address' })
        // Accept each booking with appropriate meeting fields (recompute per booking)
        for (const b of list) {
          const _idEach = new (await import('mongodb')).ObjectId(String(b._id))
          const slot = slotMap[`${b.date}|${b.time}`]
          const lessonType = (slot && slot.lessonType) || b.lessonType || 'individual'
          const groupSize2 = Number((slot && slot.groupSize) || b.groupSize || 1)
          const modality2 = (slot && slot.modality) || b.modality || 'in_person'
          const location2 = (slot && slot.location) || b.location || 'facility'
          const meetingFieldsAny: any = {}
          if (modality2 === 'zoom') {
            meetingFieldsAny.zoomLink = String(zoomLink).trim()
          } else {
            if (location2 === 'teacher') {
              meetingFieldsAny.address = String(address).trim()
              meetingFieldsAny.addressSource = 'teacher'
            } else {
              try {
                const adminData = await db.collection('admin_data').findOne({ _id: 'school' })
                if (adminData && typeof adminData.address === 'string' && adminData.address.trim()) {
                  meetingFieldsAny.address = adminData.address.trim()
                  meetingFieldsAny.addressSource = 'admin'
                }
              } catch {}
            }
          }
          await bookings.updateOne({ _id: _idEach }, { $set: { status: 'accepted', updatedAt: new Date(), ...meetingFieldsAny } })
          if (lessonType === 'group' && groupSize2 > 1) {
            const acceptedCount = await bookings.countDocuments({ teacherId: teacherIdEffective2, date: b.date, time: b.time, status: 'accepted' })
            if (acceptedCount >= groupSize2) {
            await timeSlots.updateMany({ teacherId: teacherIdEffective2, date: b.date, time: b.time }, { $set: { available: false, updatedAt: new Date() } })
              await bookings.updateMany({ _id: { $ne: _idEach }, teacherId: teacherIdEffective2, date: b.date, time: b.time, status: { $in: ['pending'] } }, { $set: { status: 'pending_unavailable', updatedAt: new Date() } })
              try {
                let teacherName: string | null = null
                try {
                  const t = await users.findOne({ _id: new (await import('mongodb')).ObjectId(String(teacherIdEffective2)) })
                  if (t) teacherName = (t.firstName && t.lastName) ? `${t.firstName} ${t.lastName}` : (t.email || null)
                } catch {}
                await notifications.insertOne({
                  type: 'group_full',
                  title: 'Grupu nodarbība pilna',
                  message: `Grupu nodarbība ${b.date} ${b.time} ir pilna (kapacitāte: ${groupSize2}).${teacherName ? `\nPasniedzējs: ${teacherName}` : ''}`,
                  recipientRole: 'admin',
                  unread: true,
                  related: { date: b.date, time: b.time, teacherId: teacherIdEffective2 },
                  createdAt: new Date(),
                })
              } catch {}
              try {
                await notifications.insertOne({
                  type: 'group_full',
                  title: 'Grupu nodarbība pilna',
                  message: `Grupu nodarbība ${b.date} ${b.time} ir pilna (kapacitāte: ${groupSize2}).`,
                  recipientRole: 'worker',
                  recipientUserId: teacherIdEffective2,
                  unread: true,
                  related: { date: b.date, time: b.time, teacherId: teacherIdEffective2 },
                  createdAt: new Date(),
                })
              } catch {}
            } else {
              await timeSlots.updateMany({ teacherId: teacherIdEffective2, date: b.date, time: b.time }, { $set: { available: true, updatedAt: new Date() } })
            }
          } else {
            await timeSlots.updateMany({ teacherId: teacherIdEffective2, date: b.date, time: b.time }, { $set: { available: false, updatedAt: new Date() } })
            await bookings.updateMany({ _id: { $ne: _idEach }, teacherId: teacherIdEffective2, date: b.date, time: b.time, status: { $in: ['pending'] } }, { $set: { status: 'pending_unavailable', updatedAt: new Date() } })
          }
        }
        return res.status(200).json({ ok: true, count: list.length })
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


