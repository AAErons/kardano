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
  try {
    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    const col = db.collection('discount_codes')

    if (req.method === 'GET') {
      const code = typeof req.query?.code === 'string' ? String(req.query.code).trim().toUpperCase() : ''
      if (code) {
        const d = await col.findOne({ code })
        if (!d) return res.status(404).json({ error: 'Not found' })
        return res.status(200).json({
          success: true,
          item: {
            id: String(d._id),
            code: d.code,
            description: d.description || ''
          }
        })
      }
      const items = await col.find({}).sort({ createdAt: -1 }).toArray()
      return res.status(200).json({
        success: true,
        items: items.map((d: any) => ({
          id: String(d._id),
          code: d.code,
          description: d.description || ''
        }))
      })
    }

    if (req.method === 'POST') {
      const { code, description } = (req.body || {}) as { code?: string; description?: string }
      const c = String(code || '').trim().toUpperCase()
      if (!c || c.length > 64) return res.status(400).json({ error: 'Invalid code' })
      const exists = await col.findOne({ code: c })
      if (exists) return res.status(400).json({ error: 'Code already exists' })
      const now = new Date()
      const doc: any = {
        code: c,
        description: (description || '').trim(),
        createdAt: now,
        updatedAt: now,
      }
      const result = await col.insertOne(doc)
      return res.status(201).json({ success: true, id: String(result.insertedId) })
    }

    if (req.method === 'PATCH') {
      const { id, code, description } = (req.body || {}) as { id?: string; code?: string; description?: string }
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { ObjectId } = await import('mongodb')
      const _id = new ObjectId(String(id))

      const update: any = { updatedAt: new Date() }
      if (code != null) {
        const c = String(code || '').trim().toUpperCase()
        if (!c || c.length > 64) return res.status(400).json({ error: 'Invalid code' })
        const exists = await col.findOne({ code: c, _id: { $ne: _id } })
        if (exists) return res.status(400).json({ error: 'Code already exists' })
        update.code = c
      }
      if (description != null) update.description = String(description || '').trim()

      await col.updateOne({ _id }, { $set: update })
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const { id } = (req.body || {}) as { id?: string }
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { ObjectId } = await import('mongodb')
      const _id = new ObjectId(String(id))
      await col.deleteOne({ _id })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


