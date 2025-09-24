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
    const col = db.collection('admin_data')

    if (req.method === 'GET') {
      // single document store; key by type
      const doc = await col.findOne({ _id: 'school' })
      return res.status(200).json({ success: true, data: doc || { _id: 'school', address: '' } })
    }

    if (req.method === 'PUT') {
      const { address } = req.body || {}
      if (typeof address !== 'string') return res.status(400).json({ error: 'Invalid address' })
      await col.updateOne({ _id: 'school' }, { $set: { address: address.trim(), updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}


