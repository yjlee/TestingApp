import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('photo') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Image must be under 5MB.' }, { status: 400 })

  const ext = file.type.split('/')[1]
  const filename = `${session.userId}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'uploads', 'photos')
  await mkdir(uploadDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  const photoUrl = `/uploads/photos/${filename}`
  await db.profile.update({
    where: { userId: session.userId },
    data: { profilePhotoUrl: photoUrl },
  })

  return NextResponse.json({ url: photoUrl })
}
