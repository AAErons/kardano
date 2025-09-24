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
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { userId } = (req.body || {}) as { userId?: string }
    if (!userId) return res.status(400).json({ error: 'Missing userId' })

    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    const { ObjectId } = await import('mongodb')
    const _id = new ObjectId(String(userId))

    // Cancel all bookings (pending or accepted) for this user
    const bookings = db.collection('bookings')
    await bookings.updateMany({ userId: String(userId), status: { $in: ['pending','pending_unavailable','accepted'] } }, { $set: { status: 'cancelled', cancelReason: 'Dzēsts profīls', cancelledBy: 'user', updatedAt: new Date() } })

    // Optionally free up time slots when needed is handled by existing logic on accept; here we do not toggle availability retroactively to avoid conflicts

    // Delete students
    await db.collection('students').deleteMany({ userId: String(userId) })
    // Delete user
    await db.collection('users').deleteOne({ _id })

    return res.status(200).json({ success: true })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


