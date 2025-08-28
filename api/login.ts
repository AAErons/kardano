import type { VercelRequest, VercelResponse } from '@vercel/node'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    console.log('[login] method=%s', req.method)
    console.log('[login] envs', {
      hasMongoUri: Boolean(process.env.MONGO_URI),
      hasMongoDbUri: Boolean(process.env.MONGODB_URI),
      hasMongoDbName: Boolean(process.env.MONGODB_DB)
    })
    const { email, password } = (req.body || {}) as { email?: string; password?: string }
    console.log('[login] payload', { hasEmail: Boolean(email), hasPassword: Boolean(password) })
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' })

    const client = await getClient()
    // If MONGODB_DB is provided, prefer it; otherwise use default db from URI
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    console.log('[login] using db', { dbName: db.databaseName })
    const user = await db.collection('users').findOne({ email })
    console.log('[login] user lookup', { found: Boolean(user) })
    if (!user || typeof user.password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Minimal password check (no hashing per request requirements)
    const ok = user.password === password
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const role = typeof user.role === 'string' ? user.role : 'user'
    return res.status(200).json({ message: 'Login successful', userId: String(user._id), role })
  } catch (e: any) {
    console.error('[login] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


