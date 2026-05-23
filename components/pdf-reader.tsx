'use client'

import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

function PageSkeleton() {
  return (
    <div
      className="w-full bg-gray-100 animate-pulse rounded"
      style={{ aspectRatio: '1 / 1.414' }}
    />
  )
}

export default function PdfReader({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    setContainerWidth(node.clientWidth)
    const ro = new ResizeObserver(() => setContainerWidth(node.clientWidth))
    ro.observe(node)
  }, [])

  if (loadError) {
    return (
      <div className="text-center py-10 text-sm text-gray-400">
        Could not load PDF preview.{' '}
        <a href={fileUrl} className="text-blue-600 underline">
          Open file directly
        </a>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => setLoadError(true)}
        loading={
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <PageSkeleton key={i} />)}
          </div>
        }
      >
        <div className="space-y-3">
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              width={containerWidth || undefined}
              loading={<PageSkeleton />}
              renderAnnotationLayer
              renderTextLayer
              className="shadow-sm rounded overflow-hidden"
            />
          ))}
        </div>
      </Document>
    </div>
  )
}
