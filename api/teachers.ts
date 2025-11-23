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

      // Enrich with teacher profile (photo, description) from 'teachers' collection
      const teachersCol = db.collection('teachers')
      const userIds = docs.map((d: any) => String(d._id))
      const profiles = await teachersCol.find({ userId: { $in: userIds } }).project({ userId: 1, photo: 1, description: 1 }).toArray()
      const userIdToProfile: Record<string, any> = {}
      for (const p of profiles) userIdToProfile[String(p.userId)] = p

      return res.status(200).json({ items: docs.map((d: any) => {
        const profile = userIdToProfile[String(d._id)] || null
        const name = d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email || ''
        return {
          id: String(d._id),
          name,
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          username: d.username || '',
          description: (profile && typeof profile.description === 'string' ? profile.description : '') || d.description || '',
          active: Boolean(d.active),
          email: d.email || '',
          phone: d.phone || '',
          photo: (profile && typeof profile.photo === 'string' && profile.photo) ? profile.photo : null,
        }
      }) })
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
      const { id, active, action, firstName, lastName, email, phone } = (req.body || {}) as { id?: string; active?: boolean; action?: 'resetPassword'; firstName?: string; lastName?: string; email?: string; phone?: string }
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

      if (typeof active === 'boolean' || typeof firstName === 'string' || typeof lastName === 'string' || typeof email === 'string' || typeof phone === 'string') {
        const setDoc: Record<string, any> = { updatedAt: new Date() }
        if (typeof active === 'boolean') setDoc.active = active
        if (typeof firstName === 'string') setDoc.firstName = firstName.trim()
        if (typeof lastName === 'string') setDoc.lastName = lastName.trim()
        if (typeof email === 'string') setDoc.email = email.trim()
        if (typeof phone === 'string') setDoc.phone = phone.trim()
        if (setDoc.firstName || setDoc.lastName) {
          const joined = `${setDoc.firstName || ''} ${setDoc.lastName || ''}`.trim()
          if (joined) setDoc.name = joined
        }
        await users.updateOne({ _id }, { $set: setDoc })
        return res.status(200).json({ ok: true })
      }

      return res.status(400).json({ error: 'Nothing to update' })
    }

    if (req.method === 'DELETE') {
      const { id } = (req.body || {}) as { id?: string }
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { ObjectId } = await import('mongodb')
      const _id = new ObjectId(String(id))

      // Delete teacher from users collection
      await users.deleteOne({ _id })
      
      // Also delete their teacher profile if exists
      const teachersCol = db.collection('teachers')
      await teachersCol.deleteOne({ userId: String(id) })
      
      // Delete their time slots
      const timeSlotsCol = db.collection('time_slots')
      await timeSlotsCol.deleteMany({ teacherId: String(id) })

      return res.status(200).json({ ok: true, message: 'Teacher deleted successfully' })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


