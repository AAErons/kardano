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

function generateString(length = 32): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
	let out = ''
	for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
	return out
}

export default async function handler(req: any, res: any) {
	try {
		if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
		const { email } = (req.body || {}) as { email?: string }
		const idEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
		if (!idEmail) return res.status(400).json({ error: 'Missing email' })

		const client = await getClient()
		const dbName = process.env.MONGODB_DB
		const db = dbName ? client.db(dbName) : client.db()
		const users = db.collection('users')

		// Check if already exists
		const existing = await users.findOne({ email: idEmail })
		if (existing) {
			return res.status(409).json({ error: 'User with this email already exists' })
		}

		// Create minimal teacher user
		const now = new Date()
		const inviteToken = generateString(48)
		const tempPassword = generateString(14)
		const { default: argon2 } = await import('argon2')
		const passwordHash = await argon2.hash(tempPassword, { type: (argon2 as any).argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })

		const doc = {
			role: 'worker',
			email: idEmail,
			username: idEmail.split('@')[0],
			active: false,
			profileComplete: false,
			inviteToken,
			passwordHash,
			createdAt: now,
			updatedAt: now
		}
		const result = await users.insertOne(doc as any)

		// Prepare login URL
		const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000'
		const loginUrl = `${baseUrl}/?open=login&prefill=${encodeURIComponent(idEmail)}&invite=${inviteToken}`

		// Send email
		try {
			const nodemailer = await import('nodemailer')
			const host = process.env.SMTP_HOST
			const port = Number(process.env.SMTP_PORT || 587)
			const user = process.env.SMTP_USER
			const pass = process.env.SMTP_PASS
			if (!host || !user || !pass) {
				console.warn('[send-teacher-invite] Missing SMTP config, skipping email send')
			} else {
				const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
				await transporter.sendMail({
					from: process.env.MAIL_FROM || user,
					to: idEmail,
					subject: 'Kardano: uzaicinājums pievienoties kā pasniedzējam',
					html: `
						<p>Sveiki!</p>
						<p>Jums ir izveidots pasniedzēja konts platformā <b>Kardano</b>.</p>
						<p>Lūdzu, pieslēdzieties, izmantojot <b>jūsu e‑pastu</b> un zemāk norādīto <b>pagaidu paroli</b>:</p>
						<p>E‑pasts: <b>${idEmail}</b><br/>Pagaidu parole: <b>${tempPassword}</b></p>
						<p>Noklikšķiniet uz saites zemāk — tā atvērs pieteikšanās formu ar aizpildītu e‑pastu. Pēc pirmās pieteikšanās varēsiet nomainīt paroli un pabeigt profilu:</p>
						<p><a href="${loginUrl}">${loginUrl}</a></p>
						<p>Ja nebijāt gaidījis šo ziņu, lūdzu, ignorējiet to.</p>
					`,
				})
			}
		} catch (e) {
			console.warn('[send-teacher-invite] Email send failed:', (e as any)?.message)
		}

		return res.status(201).json({ ok: true, id: String(result.insertedId), email: idEmail, inviteToken, tempPassword, loginUrl })
	} catch (e: any) {
		return res.status(500).json({ error: e?.message || 'Internal Error' })
	}
}


