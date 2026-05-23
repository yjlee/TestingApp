import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.userId) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params

  const thesis = await db.thesis.findUnique({
    where: { id, isDeleted: false },
    select: { filePath: true, title: true },
  })
  if (!thesis) return new NextResponse('Not Found', { status: 404 })

  // Convert URL path to disk path and guard against traversal
  const segments = thesis.filePath.split('/').filter(Boolean)
  const diskPath = path.join(process.cwd(), ...segments)
  const uploadsRoot = path.join(process.cwd(), 'uploads')
  if (!diskPath.startsWith(uploadsRoot)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const file = await readFile(diskPath)

    // Increment download count (fire-and-forget)
    db.thesis.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    }).catch(() => {})

    const safeTitle = thesis.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
