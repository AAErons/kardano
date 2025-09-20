// Students endpoint: GET list of students for a user
// This is used for lesson booking to show which students can take lessons

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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  
  try {
    console.log('[students] method=%s', req.method)
    
    const { userId } = req.query as { userId?: string }
    
    console.log('[students] userId=%s', userId)

    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    console.log('[students] using db', { dbName: db.databaseName })

    let students: any[]
    
    if (userId === 'all') {
      // Get all students (for admin view)
      students = await db.collection('students').find({}).sort({ createdAt: -1 }).toArray()
    } else if (userId) {
      // Get students for specific user
      students = await db.collection('students').find({ userId }).sort({ createdAt: 1 }).toArray()
    } else {
      return res.status(400).json({ error: 'Missing userId parameter' })
    }
    
    console.log('[students] found %d students', students.length)

    // Return students with proper formatting
    const formattedStudents = students.map((student: any) => ({
      id: String(student._id),
      userId: student.userId,
      firstName: student.firstName,
      lastName: student.lastName,
      age: student.age,
      grade: student.grade,
      school: student.school,
      email: student.email,
      phone: student.phone,
      isSelf: student.isSelf,
      createdAt: student.createdAt
    }))

    return res.status(200).json({ 
      success: true,
      students: formattedStudents
    })
    
  } catch (e: any) {
    console.error('[students] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}
