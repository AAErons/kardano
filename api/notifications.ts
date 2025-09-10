import { ObjectId } from 'mongodb'

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
	const client = await getClient()
	const dbName = process.env.MONGODB_DB
	const db = dbName ? client.db(dbName) : client.db()
	const collection = db.collection('notifications')

	if (req.method === 'GET') {
		const role = (req.query.recipientRole as string) || 'admin'
		const userId = req.query.recipientUserId as string
		
		const query: any = { recipientRole: role }
		if (userId) {
			query.recipientUserId = userId
		}
		
		const docs = await collection.find(query).sort({ createdAt: -1 }).toArray()
		return res.status(200).json({
			items: docs.map((d: any) => ({
				id: String(d._id),
				type: d.type || 'generic',
				title: d.title || '',
				message: d.message || '',
				unread: d.unread !== false,
				createdAt: d.createdAt || null,
				actorUserId: d.actorUserId || null,
				related: d.related || null,
			})),
		})
	}

	if (req.method === 'POST') {
		const { type, title, message, recipientRole = 'admin', actorUserId } = req.body || {}
		if (!type || !title) return res.status(400).json({ error: 'Missing type or title' })
		const doc = {
			type,
			title,
			message: message || '',
			recipientRole,
			actorUserId: actorUserId || null,
			unread: true,
			createdAt: new Date(),
		}
		const r = await collection.insertOne(doc)
		return res.status(201).json({ id: String(r.insertedId) })
	}

	if (req.method === 'PATCH') {
		const { id, unread } = req.body || {}
		if (!id) return res.status(400).json({ error: 'Missing id' })
		const _id = new ObjectId(String(id))
		const set: any = {}
		if (typeof unread === 'boolean') set.unread = unread
		if (Object.keys(set).length === 0) set.unread = false
		await collection.updateOne({ _id }, { $set: set })
		return res.status(200).json({ ok: true })
	}

	if (req.method === 'DELETE') {
		const body = req.body || {}
		let ids: string[] = []
		if (Array.isArray(body.ids)) ids = body.ids
		else if (typeof body.id === 'string') ids = [body.id]
		else if (typeof req.query.id === 'string') ids = [req.query.id]
		if (!ids.length) return res.status(400).json({ error: 'Missing id(s)' })
		const objectIds = ids.map((s) => new ObjectId(String(s)))
		const r = await collection.deleteMany({ _id: { $in: objectIds } })
		return res.status(200).json({ deletedCount: r.deletedCount || 0 })
	}

	return res.status(405).json({ error: 'Method Not Allowed' })
}


