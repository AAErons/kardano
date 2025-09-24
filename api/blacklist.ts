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
    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    const col = db.collection('blacklist_emails')

    if (req.method === 'GET') {
      const items = await col.find({}).sort({ createdAt: -1 }).toArray()
      return res.status(200).json({ items: items.map((x: any) => ({ id: String(x._id), email: x.email, reason: x.reason || '', createdAt: x.createdAt })) })
    }

    if (req.method === 'POST') {
      const { email, reason } = (req.body || {}) as { email?: string; reason?: string }
      const e = String(email || '').trim().toLowerCase()
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return res.status(400).json({ error: 'Invalid email' })
      const now = new Date()
      await col.updateOne({ email: e }, { $set: { email: e, reason: (reason || '').trim(), updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true })
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const { id } = (req.body || {}) as { id?: string }
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { ObjectId } = await import('mongodb')
      await col.deleteOne({ _id: new ObjectId(String(id)) })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


