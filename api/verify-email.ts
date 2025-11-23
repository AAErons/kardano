import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const { token } = req.body as { token?: string }

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' })
    }

    // Connect to MongoDB
    const { MongoClient } = await import('mongodb')
    const uri = process.env.MONGODB_URI
    if (!uri) {
      console.error('[verify-email] MONGODB_URI not set')
      return res.status(500).json({ error: 'Database configuration error' })
    }

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db('kardano')
    const users = db.collection('users')

    // Find user with this verification token
    const user = await users.findOne({ verificationToken: token })

    if (!user) {
      await client.close()
      return res.status(400).json({ error: 'Invalid or expired verification token' })
    }

    // Check if already verified
    if (user.verified) {
      await client.close()
      return res.status(200).json({ 
        success: true,
        message: 'Email already verified. You can now log in.',
        alreadyVerified: true
      })
    }

    // Mark user as verified and remove the verification token
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          verified: true,
          updatedAt: new Date()
        },
        $unset: { verificationToken: '' }
      }
    )

    await client.close()

    console.log('[verify-email] user verified', { userId: String(user._id), email: user.email })

    return res.status(200).json({ 
      success: true,
      message: 'Email verified successfully! You can now log in.',
      email: user.email
    })

  } catch (error: any) {
    console.error('[verify-email] error', error)
    return res.status(500).json({ error: error?.message || 'Internal server error' })
  }
}

