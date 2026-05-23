import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await getSession()

  // Skip increment if the viewer is the thesis owner
  if (session?.userId) {
    const thesis = await db.thesis.findUnique({
      where: { id, isDeleted: false },
      select: { userId: true },
    })
    if (!thesis) return NextResponse.json({ ok: false }, { status: 404 })
    if (thesis.userId === session.userId) return NextResponse.json({ ok: true, skipped: true })
  }

  await db.thesis.update({
    where: { id, isDeleted: false },
    data: { visitCount: { increment: 1 } },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
