// Registration endpoint with separate students collection
// This creates a better structure for lesson booking

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
    console.log('[register] method=%s', req.method)
    console.log('[register] envs', {
      hasMongoUri: Boolean(process.env.MONGO_URI),
      hasMongoDbUri: Boolean(process.env.MONGODB_URI),
      hasMongoDbName: Boolean(process.env.MONGODB_DB)
    })
    
    const { 
      accountType, 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      children 
    } = (req.body || {}) as { 
      accountType?: 'self' | 'children'
      firstName?: string
      lastName?: string
      email?: string
      password?: string
      phone?: string
      children?: Array<{
        firstName: string
        lastName: string
        age: number
        grade: string
        email?: string
        phone?: string
      }>
    }
    
    console.log('[register] payload', { 
      hasAccountType: Boolean(accountType),
      hasFirstName: Boolean(firstName), 
      hasLastName: Boolean(lastName),
      hasEmail: Boolean(email), 
      hasPassword: Boolean(password),
      hasChildren: Boolean(children?.length)
    })
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    if (!accountType || !['self', 'children'].includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' })
    }
    
    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    
    // Validate children data if account type is 'children'
    if (accountType === 'children') {
      if (!children || children.length === 0) {
        return res.status(400).json({ error: 'At least one child is required' })
      }
      
      for (const child of children) {
        if (!child.firstName || !child.lastName || !child.grade || child.age < 1) {
          return res.status(400).json({ error: 'Invalid child information' })
        }
      }
    }

    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    console.log('[register] using db', { dbName: db.databaseName })

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email: email.trim() })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password using same method as login.ts and teachers.ts
    const { default: argon2 } = await import('argon2')
    const passwordHash = await argon2.hash(password, { 
      type: (argon2 as any).argon2id, 
      memoryCost: 19456, 
      timeCost: 2, 
      parallelism: 1 
    })

    const now = new Date()
    
    // Create user document (parent/account holder)
    const userDoc = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      passwordHash,
      accountType,
      role: 'user',
      active: true,
      phone: phone?.trim() || undefined,
      createdAt: now,
      updatedAt: now
    }

    // Insert user into MongoDB
    const userResult = await db.collection('users').insertOne(userDoc as any)
    const userId = String(userResult.insertedId)
    console.log('[register] user created', { userId })

    // Create student records
    const studentIds: string[] = []
    
    if (accountType === 'self') {
      // For self accounts, create one student record for the user themselves
      const studentDoc = {
        userId: userId, // Link to the user account
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: null, // Age not required for self accounts
        grade: null, // Grade not required for self accounts
        school: null,
        isSelf: true, // Flag to indicate this is the user themselves
        createdAt: now,
        updatedAt: now
      }
      
      const studentResult = await db.collection('students').insertOne(studentDoc as any)
      studentIds.push(String(studentResult.insertedId))
      console.log('[register] self student created', { studentId: String(studentResult.insertedId) })
      
    } else if (accountType === 'children' && children) {
      // For parent accounts, create student records for each child
      for (const child of children) {
        const studentDoc = {
          userId: userId, // Link to the parent account
          firstName: child.firstName.trim(),
          lastName: child.lastName.trim(),
          age: child.age,
          grade: child.grade.trim(),
          email: child.email?.trim() || undefined,
          phone: child.phone?.trim() || undefined,
          school: null, // No longer using school field
          isSelf: false, // Flag to indicate this is a child
          createdAt: now,
          updatedAt: now
        }
        
        const studentResult = await db.collection('students').insertOne(studentDoc as any)
        studentIds.push(String(studentResult.insertedId))
        console.log('[register] child student created', { studentId: String(studentResult.insertedId), name: `${child.firstName} ${child.lastName}` })
      }
    }

    // Create notification for admin about new user registration
    try {
      const notificationDoc = {
        type: 'user_registration',
        title: `Jauns lietotājs reģistrējies: ${firstName.trim()} ${lastName.trim()}`,
        message: `Reģistrējies jauns lietotājs:\n\nVārds: ${firstName.trim()} ${lastName.trim()}\nE-pasts: ${email.trim()}\nKonta tips: ${accountType === 'self' ? 'Konts priekš sevis' : 'Konts priekš bērniem'}\nBērnu skaits: ${accountType === 'children' ? children?.length || 0 : 1}`,
        recipientRole: 'admin',
        actorUserId: userId,
        unread: true,
        createdAt: now
      }
      
      await db.collection('notifications').insertOne(notificationDoc as any)
      console.log('[register] notification created for admin')
    } catch (notificationError) {
      console.warn('[register] failed to create notification:', notificationError)
      // Don't fail registration if notification fails
    }

    // Trigger admin cache refresh by updating a special cache invalidation document
    try {
      await db.collection('cache_invalidation').updateOne(
        { key: 'admin_students' },
        { $set: { lastUpdate: now } },
        { upsert: true }
      )
      console.log('[register] cache invalidation triggered')
    } catch (cacheError) {
      console.warn('[register] failed to trigger cache invalidation:', cacheError)
    }

    return res.status(201).json({ 
      success: true,
      message: 'Registration successful',
      userId: userId,
      studentIds: studentIds
    })
    
  } catch (e: any) {
    console.error('[register] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}
