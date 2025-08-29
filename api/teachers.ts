// Minimal teachers endpoint: GET list, POST create, PATCH update active
// POST Body: { firstName: string; lastName: string; description?: string }
// PATCH Body: { id: string; active: boolean }

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

function toUsername(fullName: string): string {
  const cleaned = fullName.trim().toLowerCase().replace(/[^a-zāčēģīķļņōŗšūž\s]/gi, '').replace(/\s+/g, ' ')
  const parts = cleaned.split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]}.${parts[parts.length - 1]}`.replace(/\.+/g, '.')
}

function generatePassword(len = 12): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let out = ''
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

export default async function handler(req: any, res: any) {
  try {
    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    const users = db.collection('users')

    if (req.method === 'GET') {
      const docs = await users.find({ role: 'worker' }).project({ password: 0, passwordHash: 0 }).sort({ createdAt: -1 }).toArray()
      return res.status(200).json({ items: docs.map((d: any) => ({ id: String(d._id), name: d.name || d.username || '', username: d.username || '', description: d.description || '', active: Boolean(d.active) })) })
    }

    if (req.method === 'POST') {
      const { firstName, lastName, description } = (req.body || {}) as { firstName?: string; lastName?: string; description?: string }
      const fn = (firstName || '').trim()
      const ln = (lastName || '').trim()
      if (!fn || !ln) return res.status(400).json({ error: 'Missing firstName or lastName' })
      const name = `${fn} ${ln}`
      const username = toUsername(name)
      const plainPassword = generatePassword(14)
      const { default: argon2 } = await import('argon2')
      const passwordHash = await argon2.hash(plainPassword, { type: (argon2 as any).argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })
      const now = new Date()

      // Ensure unique username by suffixing a number if needed
      let finalUsername = username
      let suffix = 1
      while (await users.findOne({ username: finalUsername })) {
        finalUsername = `${username}${suffix}`
        suffix++
      }

      const doc = {
        name,
        firstName: fn,
        lastName: ln,
        username: finalUsername,
        description: description || '',
        role: 'worker',
        active: false,
        passwordHash,
        createdAt: now,
        updatedAt: now
      }
      const result = await users.insertOne(doc as any)
      return res.status(201).json({ id: String(result.insertedId), username: finalUsername, tempPassword: plainPassword })
    }

    if (req.method === 'PATCH') {
      const { id, active, action } = (req.body || {}) as { id?: string; active?: boolean; action?: 'resetPassword' }
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { ObjectId } = await import('mongodb')
      const _id = new ObjectId(String(id))

      if (action === 'resetPassword') {
        const { default: argon2 } = await import('argon2')
        const tempPassword = generatePassword(14)
        const passwordHash = await argon2.hash(tempPassword, { type: (argon2 as any).argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })
        await users.updateOne({ _id }, { $set: { passwordHash, updatedAt: new Date() } })
        return res.status(200).json({ ok: true, tempPassword })
      }

      if (typeof active === 'boolean') {
        await users.updateOne({ _id }, { $set: { active, updatedAt: new Date() } })
        return res.status(200).json({ ok: true })
      }

      return res.status(400).json({ error: 'Nothing to update' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


