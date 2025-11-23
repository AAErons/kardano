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
    console.log('[send-teacher-invite] method=%s', req.method)
    
    const { email } = (req.body || {}) as { email?: string }
    
    if (!email) {
      return res.status(400).json({ error: 'Missing email' })
    }

    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    console.log('[send-teacher-invite] using db', { dbName: db.databaseName })

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email: email.trim() })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
    
    // Hash password
    const { default: argon2 } = await import('argon2')
    const passwordHash = await argon2.hash(tempPassword, { 
      type: (argon2 as any).argon2id, 
      memoryCost: 19456, 
      timeCost: 2, 
      parallelism: 1 
    })

    const now = new Date()
    
    // Create user document
    const userDoc = {
      firstName: '', // Will be filled later by teacher
      lastName: '', // Will be filled later by teacher
      email: email.trim(),
      passwordHash,
      role: 'worker',
      active: false, // Start as inactive
      createdAt: now,
      updatedAt: now
    }

    // Insert user into MongoDB
    const userResult = await db.collection('users').insertOne(userDoc as any)
    const userId = String(userResult.insertedId)
    console.log('[send-teacher-invite] user created', { userId })

    // Send invitation email
    try {
      const { createTransport } = await import('nodemailer')
      
      const transporter = createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kardano.lv'}/?open=login&prefill=${encodeURIComponent(email)}&invite=${userId}`
      
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Ielūgums pievienoties matemātikas pasniedzēju komandai',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Sveiki!</p>
            <p>Jums ir izveidots pasniedzēja konts platformā Kardano.</p>
            <p>Lūdzu, pieslēdzieties, izmantojot jūsu e‑pastu un zemāk norādīto pagaidu paroli:</p>
            <p><strong>E‑pasts:</strong> ${email}</p>
            <p><strong>Pagaidu parole:</strong> ${tempPassword}</p>
            <p>Noklikšķiniet uz saites zemāk — tā atvērs pieteikšanās formu ar aizpildītu e‑pastu. Pēc pirmās pieteikšanās varēsiet nomainīt paroli un pabeigt profilu:</p>
            <p><a href="${loginUrl}" style="color: #0066cc;">${loginUrl}</a></p>
            <p>Ja nebijāt gaidījis šo ziņu, lūdzu, ignorējiet to.</p>
          </div>
        `,
      })
      
      console.log('[send-teacher-invite] email sent', { email })
    } catch (emailError) {
      console.error('[send-teacher-invite] email error', emailError)
      // Don't fail the request if email fails
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Teacher invited successfully',
      email: email,
      tempPassword: tempPassword,
      loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kardano.lv'}/?open=login&prefill=${encodeURIComponent(email)}&invite=${userId}`,
      userId: userId
    })
    
  } catch (e: any) {
    console.error('[send-teacher-invite] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}
