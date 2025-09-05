let _client: any = null

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
    console.log('[cache-invalidation] method=%s', req.method)
    
    const { key } = req.query as { key?: string }
    
    if (!key) {
      return res.status(400).json({ error: 'Missing key parameter' })
    }
    
    console.log('[cache-invalidation] key=%s', key)

    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    console.log('[cache-invalidation] using db', { dbName: db.databaseName })

    // Get cache invalidation timestamp
    const invalidation = await db.collection('cache_invalidation').findOne({ key })
    
    console.log('[cache-invalidation] found invalidation for key=%s', key)

    return res.status(200).json({ 
      success: true,
      lastUpdate: invalidation?.lastUpdate || null
    })
    
  } catch (e: any) {
    console.error('[cache-invalidation] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}
