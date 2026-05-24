const STAGES: { n: number; label: string; description: string }[] = [
  { n: 1, label: 'Uploaded', description: 'Thesis uploaded' },
  { n: 2, label: 'Paid', description: 'Payment confirmed' },
  { n: 3, label: 'Queue', description: 'In the review queue — waiting for a reviewer to be assigned' },
  { n: 4, label: '1st Review', description: 'Under first review — a reviewer is reading your thesis' },
  { n: 5, label: 'Done ×1', description: 'First review complete — preparing for second review' },
  { n: 6, label: '2nd Queue', description: 'Awaiting second reviewer assignment' },
  { n: 7, label: '2nd Review', description: 'Under second review' },
  { n: 8, label: 'Done ×2', description: 'Both reviews complete — awaiting journal approval' },
  { n: 9, label: 'Approved', description: 'Accepted into the journal queue' },
]

export default function StageTracker({ currentStage }: { currentStage: number }) {
  const current = STAGES.find((s) => s.n === currentStage) ?? STAGES[0]

  return (
    <div>
      {/* Current status message */}
      <div className="mb-5 rounded-xl bg-blue-50 border border-blue-100 px-5 py-4">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">
          Stage {currentStage} of 9
        </p>
        <p className="text-sm font-medium text-blue-900">{current.description}</p>
      </div>

      {/* Step indicator */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center min-w-max gap-0">
          {STAGES.map((stage, idx) => {
            const done = stage.n < currentStage
            const active = stage.n === currentStage
            const future = stage.n > currentStage

            return (
              <div key={stage.n} className="flex items-center">
                {/* Step circle + label */}
                <div className="flex flex-col items-center w-14">
                  <div
                    className={[
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                      done ? 'bg-blue-600 border-blue-600 text-white' : '',
                      active ? 'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-200 ring-offset-1' : '',
                      future ? 'bg-white border-gray-300 text-gray-400' : '',
                    ].join(' ')}
                  >
                    {done ? '✓' : stage.n}
                  </div>
                  <span className={`mt-1 text-center leading-tight text-[10px] font-medium ${active ? 'text-blue-700' : future ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stage.label}
                  </span>
                </div>
                {/* Connector line */}
                {idx < STAGES.length - 1 && (
                  <div className={`h-0.5 w-4 flex-shrink-0 ${stage.n < currentStage ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
