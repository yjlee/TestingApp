import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()

  const title = ((formData.get('title') as string | null) ?? '').trim()
  const abstract = ((formData.get('abstract') as string | null) ?? '').trim()
  const fieldOfStudyId = (formData.get('fieldOfStudyId') as string | null) || null
  const yearOfSubmission = parseInt(formData.get('yearOfSubmission') as string)
  const institution = ((formData.get('institution') as string | null) ?? '').trim()
  const keywordsRaw = ((formData.get('keywords') as string | null) ?? '').trim()
  const supervisorName = ((formData.get('supervisorName') as string | null) ?? '').trim() || null
  const language = ((formData.get('language') as string | null) ?? '').trim() || 'English'
  const file = formData.get('pdf') as File | null

  if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  if (!abstract) return NextResponse.json({ error: 'Abstract is required.' }, { status: 400 })
  if (!institution) return NextResponse.json({ error: 'Institution is required.' }, { status: 400 })
  if (!yearOfSubmission || isNaN(yearOfSubmission))
    return NextResponse.json({ error: 'Year of submission is required.' }, { status: 400 })
  if (!file || file.size === 0)
    return NextResponse.json({ error: 'Please select a PDF file.' }, { status: 400 })
  if (file.type !== 'application/pdf')
    return NextResponse.json({ error: 'Only PDF files are allowed.' }, { status: 400 })
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: 'PDF must be under 50MB.' }, { status: 400 })

  const keywords = keywordsRaw
    ? keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean)
    : []

  const filename = `${session.userId}-${Date.now()}.pdf`
  const uploadDir = path.join(process.cwd(), 'uploads', 'theses')
  await mkdir(uploadDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  const filePath = `/uploads/theses/${filename}`

  const thesis = await db.thesis.create({
    data: {
      userId: session.userId,
      title,
      abstract,
      fieldOfStudyId,
      yearOfSubmission,
      institution,
      keywords,
      supervisorName,
      language,
      filePath,
      fileSizeBytes: BigInt(file.size),
    },
  })

  return NextResponse.json({ id: thesis.id })
}
