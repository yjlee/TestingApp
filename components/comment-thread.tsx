'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { postComment, editComment, deleteComment } from '@/lib/comments/actions'
import { MessageSquare, CornerDownRight, Pencil, Trash2, Loader2 } from 'lucide-react'

export type NestedComment = {
  id: string
  content: string
  isDeleted: boolean
  authorId: string
  parentCommentId: string | null
  createdAt: string
  updatedAt: string
  author: { profile: { fullName: string } | null } | null
  replies: NestedComment[]
}

type Props = {
  thesisId: string
  assignmentId: string
  reviewerUserId: string
  currentUserId: string
  isOwner: boolean
  canPost: boolean   // reviewer only, during active stage
  canReply: boolean  // either party, during active stage
  reviewRound: number
  comments: NestedComment[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

export default function CommentThread({
  thesisId, assignmentId, reviewerUserId,
  currentUserId, isOwner, canPost, canReply, reviewRound, comments,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function refresh() {
    startTransition(() => router.refresh())
  }

  function getDisplayName(authorId: string, author: { profile: { fullName: string } | null } | null): string {
    if (isOwner && authorId === reviewerUserId) return 'Reviewer'
    return author?.profile?.fullName ?? 'Unknown'
  }

  async function handlePost(formData: FormData) {
    setPending(true)
    setGlobalError(null)
    const result = await postComment(formData)
    setPending(false)
    if (result.error) { setGlobalError(result.error); return }
    setReplyingTo(null)
    refresh()
  }

  async function handleEdit(formData: FormData) {
    setPending(true)
    setGlobalError(null)
    const result = await editComment(formData)
    setPending(false)
    if (result.error) { setGlobalError(result.error); return }
    setEditingId(null)
    refresh()
  }

  async function handleDelete(formData: FormData) {
    setPending(true)
    setGlobalError(null)
    const result = await deleteComment(formData)
    setPending(false)
    if (result.error) { setGlobalError(result.error); return }
    refresh()
  }

  // Inner component — uses closure over parent state & handlers
  function CommentNode({ comment, depth = 0 }: { comment: NestedComment; depth?: number }) {
    const isOwn = comment.authorId === currentUserId
    const isEditing = editingId === comment.id
    const isReplying = replyingTo === comment.id
    const showEdited = !comment.isDeleted && comment.updatedAt !== comment.createdAt

    return (
      <div className={depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-100' : ''}>
        <div className="py-3">
          {/* Author + timestamp */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-sm font-semibold text-gray-800">
              {getDisplayName(comment.authorId, comment.author)}
            </span>
            <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
            {showEdited && <span className="text-xs text-gray-400">(edited)</span>}
          </div>

          {/* Body */}
          {comment.isDeleted ? (
            <p className="text-sm text-gray-400 italic">[deleted]</p>
          ) : isEditing ? (
            <form action={handleEdit}>
              <input type="hidden" name="commentId" value={comment.id} />
              <textarea
                name="content"
                defaultValue={comment.content}
                rows={3}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button type="submit" disabled={pending} className="text-xs font-medium text-blue-700 hover:text-blue-900 disabled:opacity-50">
                  {pending ? <Loader2 size={12} className="inline animate-spin" /> : 'Save'}
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{comment.content}</p>
          )}

          {/* Action row */}
          {!comment.isDeleted && !isEditing && (
            <div className="flex items-center gap-4 mt-2">
              {canReply && (
                <button
                  onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <CornerDownRight size={11} /> Reply
                </button>
              )}
              {isOwn && (
                <>
                  <button
                    onClick={() => setEditingId(comment.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <form action={handleDelete} className="inline">
                    <input type="hidden" name="commentId" value={comment.id} />
                    <button type="submit" disabled={pending} className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1">
                      <Trash2 size={11} /> Delete
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Inline reply form */}
          {isReplying && (
            <form action={handlePost} className="mt-3 ml-2">
              <input type="hidden" name="thesisId" value={thesisId} />
              <input type="hidden" name="assignmentId" value={assignmentId} />
              <input type="hidden" name="parentCommentId" value={comment.id} />
              <textarea
                name="content"
                placeholder="Write a reply…"
                rows={2}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="text-xs font-medium bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 flex items-center gap-1"
                >
                  {pending && <Loader2 size={11} className="animate-spin" />}
                  Post reply
                </button>
                <button type="button" onClick={() => setReplyingTo(null)} className="text-xs text-gray-400 hover:text-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {comment.replies.length > 0 && (
          <div>
            {comment.replies.map((reply) => (
              <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 flex items-center gap-1.5">
        <MessageSquare size={13} /> Round {reviewRound} Comments
      </h2>

      {/* New top-level comment form — reviewer only */}
      {canPost && (
        <form action={handlePost} className="mb-6">
          <input type="hidden" name="thesisId" value={thesisId} />
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <textarea
            name="content"
            placeholder="Leave a comment on this thesis…"
            rows={3}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {pending && <Loader2 size={13} className="animate-spin" />}
            Post comment
          </button>
        </form>
      )}

      {globalError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">
          {globalError}
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          {canPost ? 'No comments yet. Be the first to leave feedback.' : 'No comments yet.'}
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((c) => (
            <CommentNode key={c.id} comment={c} />
          ))}
        </div>
      )}
    </div>
  )
}
