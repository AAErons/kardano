import { MongoClient, ObjectId } from 'mongodb'

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

    const questions = db.collection('help_questions')

    // GET - Retrieve all questions (admin only)
    if (req.method === 'GET') {
      const items = await questions.find({}).sort({ createdAt: -1 }).toArray()
      return res.status(200).json({ success: true, questions: items })
    }

    // POST - Submit a new question
    if (req.method === 'POST') {
      const { name, email, message } = (req.body || {}) as { name?: string; email?: string; message?: string }

      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Lūdzu aizpildiet visus laukus' })
      }

      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Nederīgs e-pasta formāts' })
      }

      const newQuestion = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        status: 'new', // new, read, resolved
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await questions.insertOne(newQuestion)

      return res.status(200).json({ 
        success: true, 
        message: 'Jautājums nosūtīts veiksmīgi!',
        questionId: result.insertedId 
      })
    }

    // PATCH - Update question status (admin only)
    if (req.method === 'PATCH') {
      const { questionId, status } = (req.body || {}) as { questionId?: string; status?: string }

      if (!questionId || !status) {
        return res.status(400).json({ error: 'Missing questionId or status' })
      }

      if (!['new', 'read', 'resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' })
      }

      const { ObjectId } = await import('mongodb')
      await questions.updateOne(
        { _id: new ObjectId(questionId) },
        { $set: { status, updatedAt: new Date() } }
      )

      return res.status(200).json({ success: true })
    }

    // DELETE - Delete a question (admin only)
    if (req.method === 'DELETE') {
      const { questionId } = (req.body || {}) as { questionId?: string }

      if (!questionId) {
        return res.status(400).json({ error: 'Missing questionId' })
      }

      const { ObjectId } = await import('mongodb')
      await questions.deleteOne({ _id: new ObjectId(questionId) })

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })

  } catch (e: any) {
    console.error('[help-questions] error', e)
    return res.status(500).json({ error: e?.message || 'Internal Error' })
  }
}

