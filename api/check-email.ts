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
  try {
    const email = String((req.query?.email || req.body?.email || '')).trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'Missing email' })
    const emailRegex = /\S+@\S+\.\S+/
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' })

    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()

    const isBlacklisted = await db.collection('blacklist_emails').findOne({ email })
    if (isBlacklisted) {
      return res.status(200).json({ available: false, reason: 'blacklisted' })
    }

    const exists = await db.collection('users').findOne({ email })
    if (exists) {
      return res.status(200).json({ available: false, reason: 'exists' })
    }

    return res.status(200).json({ available: true })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


