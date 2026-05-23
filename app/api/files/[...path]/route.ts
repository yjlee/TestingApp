import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const filePath = path.join(process.cwd(), 'uploads', ...segments)

  // Prevent path traversal
  const uploadsRoot = path.join(process.cwd(), 'uploads')
  if (!filePath.startsWith(uploadsRoot)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const file = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    }
    return new NextResponse(file, {
      headers: { 'Content-Type': contentType[ext] ?? 'application/octet-stream' },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
