import { MongoClient, ObjectId } from 'mongodb'

let _client: any | null = null

async function getClient(): Promise<any> {
  if (_client) return _client
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI
  if (!uri) throw new Error('Missing MONGO_URI (or MONGODB_URI)')
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) throw new Error('Invalid MONGO_URI format')
  const { MongoClient } = await import('mongodb')
  _client = new MongoClient(uri, {})
  await _client.connect()
  return _client
}

export default async function handler(req: any, res: any) {
  // Security check - only allow Vercel Cron to call this
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()

    const bookings = db.collection('bookings')
    const users = db.collection('users')
    const notifications = db.collection('notifications')

    // Get the current time
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // We're checking for bookings from the previous hour
    // If it's 15:01, we check for 15:00 bookings
    // Since we run at minute 1, bookings at 15:00 would have just passed
    const checkHour = currentHour
    const checkTime = `${String(checkHour).padStart(2, '0')}:00`
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    console.log(`[Cron] Checking for expired bookings at ${dateStr} ${checkTime}`)

    // Find all pending bookings for this specific time slot
    const expiredBookings = await bookings.find({
      date: dateStr,
      time: checkTime,
      status: { $in: ['pending', 'pending_unavailable'] }
    }).toArray()

    console.log(`[Cron] Found ${expiredBookings.length} expired bookings`)

    let processedCount = 0
    let errorCount = 0

    // Process each expired booking
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
        
        // Get user and teacher details for notification
        const user = await users.findOne({ _id: new ObjectId(expiredItem.userId) }).catch(() => null as any)
        const teacher = await users.findOne({ _id: new ObjectId(expiredItem.teacherId) }).catch(() => null as any)
        
        const userName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email) : 'Lietotājs'
        const teacherName = teacher ? (teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.email) : 'Pasniedzējs'
        
        // Format date and time for notification
        const formattedDate = new Date(expiredItem.date).toLocaleDateString('lv-LV')
        const formattedTime = expiredItem.time
        
        // Format booking creation date and time
        const bookingCreatedAt = expiredItem.createdAt ? new Date(expiredItem.createdAt) : null
        const bookingCreatedDate = bookingCreatedAt ? bookingCreatedAt.toLocaleDateString('lv-LV') : 'nezināms datums'
        const bookingCreatedTime = bookingCreatedAt ? bookingCreatedAt.toLocaleTimeString('lv-LV', { hour: '2-digit', minute: '2-digit' }) : 'nezināms laiks'
        
        // Find all admin users
        const admins = await users.find({ role: 'admin' }).toArray()
        
        // Create notification for each admin
        for (const admin of admins) {
          await notifications.insertOne({
            type: 'booking_expired',
            title: 'Rezervācija noilgusi',
            message: `Pasniedzējs ${teacherName} nav atbildējis uz rezervācijas pieprasījumu no ${userName}. Rezervācijas laiks: ${formattedDate} ${formattedTime}. Pieprasījums iesniegts: ${bookingCreatedDate} ${bookingCreatedTime}.`,
            recipientRole: 'admin',
            recipientUserId: String(admin._id),
            actorUserId: expiredItem.teacherId,
            actorName: teacherName,
            unread: true,
            related: { bookingId: String(expiredItem._id), date: expiredItem.date, time: expiredItem.time },
            createdAt: new Date(),
          })
        }
        
        // Create notification for the teacher
        if (teacher) {
          await notifications.insertOne({
            type: 'booking_expired',
            title: 'Rezervācija noilgusi',
            message: `Jūs neatbildējāt uz rezervācijas pieprasījumu no ${userName} laikā. Rezervācijas laiks: ${formattedDate} ${formattedTime}. Pieprasījums iesniegts: ${bookingCreatedDate} ${bookingCreatedTime}.`,
            recipientRole: 'worker',
            recipientUserId: String(teacher._id),
            actorUserId: expiredItem.userId,
            actorName: userName,
            unread: true,
            related: { bookingId: String(expiredItem._id), date: expiredItem.date, time: expiredItem.time },
            createdAt: new Date(),
          })
        }
        
        processedCount++
        console.log(`[Cron] Processed expired booking ${expiredItem._id} for ${userName} with ${teacherName}`)
      } catch (err) {
        errorCount++
        console.error(`[Cron] Error processing expired booking ${expiredItem._id}:`, err)
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Cron job completed',
      checked: {
        date: dateStr,
        time: checkTime
      },
      found: expiredBookings.length,
      processed: processedCount,
      errors: errorCount
    })

  } catch (e: any) {
    console.error('[Cron] Error:', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}

