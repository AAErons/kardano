// Using untyped req/res to avoid requiring @vercel/node types locally

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    console.log('[login] method=%s', req.method)
    console.log('[login] envs', {
      hasMongoUri: Boolean(process.env.MONGO_URI),
      hasMongoDbUri: Boolean(process.env.MONGODB_URI),
      hasMongoDbName: Boolean(process.env.MONGODB_DB)
    })
    const { email, username, password } = (req.body || {}) as { email?: string; username?: string; password?: string }
    const idEmail = typeof email === 'string' ? email.trim() : undefined
    const idUsername = typeof username === 'string' ? username.trim() : undefined
    console.log('[login] payload', { hasEmail: Boolean(idEmail), hasUsername: Boolean(idUsername), hasPassword: Boolean(password) })
    if ((!idEmail && !idUsername) || !password) return res.status(400).json({ error: 'Missing identifier or password' })

    const client = await getClient()
    // If MONGODB_DB is provided, prefer it; otherwise use default db from URI
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    console.log('[login] using db', { dbName: db.databaseName })

    let where: any
    if (idEmail && idUsername) where = { $or: [{ email: idEmail }, { username: idUsername }] }
    else if (idEmail) where = { email: idEmail }
    else where = { username: idUsername }

    const user = await db.collection('users').findOne(where)
    console.log('[login] user lookup', { found: Boolean(user) })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    let ok = false
    if (typeof user.passwordHash === 'string') {
      const { default: argon2 } = await import('argon2')
      ok = await argon2.verify(user.passwordHash, password)
    } else if (typeof user.password === 'string') {
      // Backward compatibility: compare plain and migrate to hash
      ok = user.password === password
      if (ok) {
        try {
          const { default: argon2 } = await import('argon2')
          const newHash = await argon2.hash(password, { type: (argon2 as any).argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })
          await db.collection('users').updateOne({ _id: user._id }, { $set: { passwordHash: newHash }, $unset: { password: '' } })
          console.log('[login] migrated password → passwordHash for', String(user._id))
        } catch (migrateErr) {
          console.warn('[login] migration failed', migrateErr)
        }
      }
    }

    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const role = typeof user.role === 'string' ? user.role : 'user'
    const active = Boolean(user.active)
    return res.status(200).json({ message: 'Login successful', userId: String(user._id), role, active })
  } catch (e: any) {
    console.error('[login] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


