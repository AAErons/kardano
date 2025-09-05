// User info endpoint: GET user details including student count
// This is used to show user profile information

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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  
  try {
    console.log('[user-info] method=%s', req.method)
    
    const { userId } = req.query as { userId?: string }
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' })
    }
    
    console.log('[user-info] userId=%s', userId)

    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    console.log('[user-info] using db', { dbName: db.databaseName })

    // Get user info
    const user = await db.collection('users').findOne({ _id: new (await import('mongodb')).ObjectId(userId) })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Get student count
    const studentCount = await db.collection('students').countDocuments({ userId })
    
    console.log('[user-info] found user with %d students', studentCount)

    // Return user info with student count
    const userInfo = {
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      accountType: user.accountType,
      phone: user.phone,
      studentCount: studentCount,
      createdAt: user.createdAt
    }

    return res.status(200).json({ 
      success: true,
      user: userInfo
    })
    
  } catch (e: any) {
    console.error('[user-info] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}
