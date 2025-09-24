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
  try {
    console.log('[students] method=%s', req.method)
    
    const { userId } = req.query as { userId?: string }
    
    console.log('[students] userId=%s', userId)

    const client = await getClient()
    const dbName = process.env.MONGODB_DB
    const db = dbName ? client.db(dbName) : client.db()
    console.log('[students] using db', { dbName: db.databaseName })

    const studentsCol = db.collection('students')
    
    if (req.method === 'GET') {
      let students: any[]
      if (userId === 'all') {
        students = await studentsCol.find({}).sort({ createdAt: -1 }).toArray()
      } else if (userId) {
        students = await studentsCol.find({ userId }).sort({ createdAt: 1 }).toArray()
      } else {
        return res.status(400).json({ error: 'Missing userId parameter' })
      }

      console.log('[students] found %d students', students.length)
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
      return res.status(200).json({ success: true, students: formattedStudents })
    }

    if (req.method === 'POST') {
      const body = (req.body || {}) as { userId?: string; firstName?: string; lastName?: string; age?: number; grade?: string; email?: string; phone?: string; school?: string }
      const uid = String(body.userId || '')
      const firstName = String(body.firstName || '').trim()
      const lastName = String(body.lastName || '').trim()
      if (!uid || !firstName || !lastName) return res.status(400).json({ error: 'Missing userId, firstName or lastName' })
      const now = new Date()
      const doc: any = {
        userId: uid,
        firstName,
        lastName,
        age: typeof body.age === 'number' ? body.age : null,
        grade: body.grade ? String(body.grade).trim() : null,
        email: body.email ? String(body.email).trim() : undefined,
        phone: body.phone ? String(body.phone).trim() : undefined,
        school: body.school ? String(body.school).trim() : null,
        isSelf: false,
        createdAt: now,
        updatedAt: now
      }
      const r = await studentsCol.insertOne(doc)
      return res.status(201).json({ success: true, id: String(r.insertedId) })
    }

    if (req.method === 'PATCH') {
      const body = (req.body || {}) as { id?: string; firstName?: string; lastName?: string; age?: number | null; grade?: string | null; email?: string | null; phone?: string | null; school?: string | null }
      const id = String(body.id || '')
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { ObjectId } = await import('mongodb')
      const _id = new ObjectId(id)
      const set: any = { updatedAt: new Date() }
      if (body.firstName != null) set.firstName = String(body.firstName).trim()
      if (body.lastName != null) set.lastName = String(body.lastName).trim()
      if (body.age !== undefined) set.age = body.age === null ? null : Number(body.age)
      if (body.grade !== undefined) set.grade = body.grade === null ? null : String(body.grade).trim()
      if (body.email !== undefined) set.email = body.email === null ? undefined : String(body.email).trim()
      if (body.phone !== undefined) set.phone = body.phone === null ? undefined : String(body.phone).trim()
      if (body.school !== undefined) set.school = body.school === null ? null : String(body.school).trim()
      await studentsCol.updateOne({ _id }, { $set: set })
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const body = (req.body || {}) as { id?: string }
      const id = String(body.id || '')
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { ObjectId } = await import('mongodb')
      const _id = new ObjectId(id)
      await studentsCol.deleteOne({ _id })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
    
  } catch (e: any) {
    console.error('[students] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}
