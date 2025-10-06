// Reviews API: request and submit reviews between users and teachers

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

type ReviewStatus = 'requested' | 'submitted' | 'pending' | 'approved' | 'denied' | 'cancelled'

type CreateReviewBody = {
	teacherId: string
	userId: string
	bookingId?: string | null
}

export default async function handler(req: any, res: any) {
	try {
		const client = await getClient()
		const dbName = process.env.MONGODB_DB
		const db = dbName ? client.db(dbName) : client.db()

		const reviews = db.collection('reviews')
		const users = db.collection('users')
		const bookings = db.collection('bookings')

		if (req.method === 'POST') {
			const body = (req.body || {}) as CreateReviewBody
			const teacherId = String(body.teacherId || '')
			const userId = String(body.userId || '')
			const bookingId = body.bookingId ? String(body.bookingId) : null
			if (!teacherId || !userId) return res.status(400).json({ error: 'Missing teacherId or userId' })

			// Allow single active request per teacher-user pair
			const existing = await reviews.findOne({ teacherId, userId, status: { $in: ['requested','submitted'] } })
			if (existing) {
				return res.status(200).json({ ok: true, id: String(existing._id), already: true })
			}

			const now = new Date()
			const doc: any = {
				teacherId,
				userId,
				bookingId: bookingId || undefined,
				status: 'requested' as ReviewStatus,
				requestSentAt: now,
				createdAt: now,
				updatedAt: now,
			}
			const result = await reviews.insertOne(doc)

			return res.status(201).json({ ok: true, id: String(result.insertedId) })
		}

		if (req.method === 'GET') {
			const { role, userId } = req.query as { role?: 'user' | 'worker' | 'admin'; userId?: string }
			if (!role) return res.status(400).json({ error: 'Missing role' })

			const query: any = {}
			if (role === 'user') {
				if (!userId) return res.status(400).json({ error: 'Missing userId' })
				query.userId = String(userId)
			} else if (role === 'worker') {
				if (!userId) return res.status(400).json({ error: 'Missing userId' })
				query.teacherId = String(userId)
			}

			const items = await reviews.find(query).sort({ createdAt: -1 }).toArray()
			// Enhance with names
			const enhanced = await Promise.all(items.map(async (r: any) => {
				const out: any = { ...r }
				try {
					const t = await users.findOne({ _id: new (await import('mongodb')).ObjectId(String(r.teacherId)) })
					if (t) out.teacherName = t.firstName && t.lastName ? `${t.firstName} ${t.lastName}` : (t.email || '')
				} catch {}
				try {
					const u = await users.findOne({ _id: new (await import('mongodb')).ObjectId(String(r.userId)) })
					if (u) out.userName = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.email || '')
				} catch {}
				if (r.bookingId) {
					try {
						const b = await bookings.findOne({ _id: new (await import('mongodb')).ObjectId(String(r.bookingId)) })
						if (b) out.lesson = { date: b.date, time: b.time }
					} catch {}
				}
				return out
			}))
			return res.status(200).json({ items: enhanced })
		}

			if (req.method === 'PATCH') {
			const { id, action, rating, comment } = (req.body || {}) as { id?: string; action?: 'submit' | 'cancel' | 'approve' | 'deny'; rating?: number; comment?: string }
			if (!id || !action) return res.status(400).json({ error: 'Missing id or action' })
			const { ObjectId } = await import('mongodb')
			const _id = new ObjectId(String(id))
			const now = new Date()
			const doc = await reviews.findOne({ _id })
			if (!doc) return res.status(404).json({ error: 'Not found' })

			if (action === 'submit') {
				const r = Number(rating)
				if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: 'Invalid rating' })
				const c = typeof comment === 'string' ? comment.trim() : ''
				await reviews.updateOne({ _id }, { $set: { status: 'pending', rating: r, comment: c, submittedAt: now, updatedAt: now } })
				return res.status(200).json({ ok: true })
			}

			if (action === 'approve') {
				await reviews.updateOne({ _id }, { $set: { status: 'approved', approvedAt: now, updatedAt: now } })
				return res.status(200).json({ ok: true })
			}

			if (action === 'deny') {
				await reviews.updateOne({ _id }, { $set: { status: 'denied', deniedAt: now, updatedAt: now } })
				return res.status(200).json({ ok: true })
			}

			if (action === 'cancel') {
				await reviews.updateOne({ _id }, { $set: { status: 'cancelled', updatedAt: now } })
				return res.status(200).json({ ok: true })
			}

			return res.status(400).json({ error: 'Invalid action' })
		}

		return res.status(405).json({ error: 'Method Not Allowed' })
	} catch (e: any) {
		return res.status(500).json({ error: e?.message || 'Internal Error' })
	}
}



