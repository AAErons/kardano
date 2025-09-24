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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()

    const usersCol = db.collection('users')
    const studentsCol = db.collection('students')
    const users = await usersCol.find({ role: 'user' }).project({ password: 0, passwordHash: 0 }).sort({ createdAt: -1 }).toArray()

    // Compute student counts
    const userIds = users.map((u: any) => String(u._id))
    const countsAgg = await studentsCol.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]).toArray()
    const countMap: Record<string, number> = {}
    countsAgg.forEach((c: any) => { countMap[String(c._id)] = c.count })

    const items = users.map((u: any) => ({
      id: String(u._id),
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phone: u.phone || '',
      accountType: u.accountType || 'self',
      studentCount: countMap[String(u._id)] || 0,
      createdAt: u.createdAt
    }))
    return res.status(200).json({ items })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


