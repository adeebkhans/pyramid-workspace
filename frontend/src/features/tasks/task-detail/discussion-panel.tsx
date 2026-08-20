'use client';

import { MoreHorizontal, Send, SmilePlus } from 'lucide-react';
import { useState } from 'react';

import { useCurrentMember } from '@/providers/identity-provider';
import type { Comment } from '@/shared/domain/models';
import { formatRelative } from '@/shared/lib/date/calendar';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { SpiralIcon } from '@/shared/ui/spiral-icon';

/**
 * The comment thread.
 *
 * The design places a reply field under every comment, so replies are stored
 * against a parent and rendered beneath it. Depth is capped at one level, which
 * is as far as the layout goes.
 */
export function DiscussionPanel({
  comments,
  onPost,
  onEdit,
  onRemove,
}: {
  comments: Comment[];
  onPost: (body: string, parentId?: string) => Promise<void>;
  onEdit: (commentId: string, body: string) => Promise<void>;
  onRemove: (commentId: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const submitRoot = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;

    setIsPosting(true);
    setDraft('');
    await onPost(body);
    setIsPosting(false);
  };

  return (
    <div className="pb-8">
      <div className="flex flex-col gap-0 border border-default rounded-xl overflow-hidden mb-4">
        {comments.map((comment, index) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            isLast={index === comments.length - 1}
            onPost={onPost}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </div>

      <form onSubmit={submitRoot}>
        <div className="relative">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a comment..."
            aria-label="Add a comment"
            className="w-full h-11 pl-4 pr-16 bg-transparent border border-default rounded-lg text-[13px] outline-none focus:border-neutral-400 placeholder:text-tertiary"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <button type="button" className="p-1 text-tertiary hover:text-secondary">
              <SpiralIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              disabled={isPosting || !draft.trim()}
              aria-label="Post comment"
              className="p-1 text-tertiary hover:text-secondary disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5 rotate-45" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function CommentRow({
  comment,
  isLast,
  onPost,
  onEdit,
  onRemove,
}: {
  comment: Comment;
  isLast: boolean;
  onPost: (body: string, parentId?: string) => Promise<void>;
  onEdit: (commentId: string, body: string) => Promise<void>;
  onRemove: (commentId: string) => Promise<void>;
}) {
  const currentMember = useCurrentMember();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [replyBody, setReplyBody] = useState('');

  const beginEdit = (id: string, body: string) => {
    setEditingId(id);
    setEditingBody(body);
  };

  const commitEdit = async (id: string) => {
    const body = editingBody.trim();
    setEditingId(null);
    if (body) await onEdit(id, body);
  };

  const submitReply = async () => {
    const body = replyBody.trim();
    if (!body) return;
    setReplyBody('');
    await onPost(body, comment.id);
  };

  return (
    <div className={isLast ? 'px-4 py-3' : 'px-4 py-3 border-b border-default'}>
      <CommentHeader comment={comment} onEdit={() => beginEdit(comment.id, comment.body)} onRemove={onRemove} />

      {editingId === comment.id ? (
        <InlineEditor
          value={editingBody}
          onChange={setEditingBody}
          onSave={() => void commitEdit(comment.id)}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <p className="text-[13px] text-secondary leading-relaxed pl-7">{comment.body}</p>
      )}

      {comment.replies.map((reply) => (
        <div key={reply.id} className="pl-7 mt-3">
          <CommentHeader comment={reply} onEdit={() => beginEdit(reply.id, reply.body)} onRemove={onRemove} />
          {editingId === reply.id ? (
            <InlineEditor
              value={editingBody}
              onChange={setEditingBody}
              onSave={() => void commitEdit(reply.id)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <p className="text-[13px] text-secondary leading-relaxed pl-7">{reply.body}</p>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2 mt-2 pl-7">
        <MemberAvatar member={currentMember} size={20} />
        <div className="flex-1 relative">
          <input
            type="text"
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submitReply();
            }}
            placeholder="Leave a reply..."
            aria-label="Leave a reply"
            className="w-full h-9 pl-3 pr-14 bg-transparent border border-default rounded-lg text-[12px] outline-none focus:border-neutral-400 placeholder:text-tertiary"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button type="button" className="text-tertiary hover:text-secondary">
              <SpiralIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void submitReply()}
              aria-label="Post reply"
              className="text-tertiary hover:text-secondary"
            >
              <Send className="w-3.5 h-3.5 rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentHeader({
  comment,
  onEdit,
  onRemove,
}: {
  comment: Comment;
  onEdit: () => void;
  onRemove: (commentId: string) => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-2">
        <MemberAvatar member={comment.author} size={22} />
        <span className="font-semibold text-[13px] text-primary">{comment.author?.name ?? 'Unknown'}</span>
        <span className="text-[11px] text-tertiary">{formatRelative(comment.postedAt)}</span>
        {comment.editedAt && <span className="text-[11px] text-tertiary">(edited)</span>}
      </div>

      <div className="flex items-center gap-1 relative group/menu">
        <button type="button" className="p-1 text-tertiary hover:text-secondary">
          <SmilePlus className="w-3.5 h-3.5" />
        </button>
        <button type="button" aria-label="Comment actions" className="p-1 text-tertiary hover:text-secondary">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
        <div className="absolute right-0 top-6 hidden group-hover/menu:flex flex-col bg-surface border border-default rounded-lg shadow-md z-10 min-w-[100px] py-1">
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 text-[12px] text-primary hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => void onRemove(comment.id)}
            className="px-3 py-1.5 text-[12px] text-red-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-2 pl-7 mt-1">
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSave();
          if (event.key === 'Escape') onCancel();
        }}
        className="flex-1 h-8 px-3 border border-default rounded-lg text-[13px] outline-none focus:border-neutral-400"
      />
      <button type="button" onClick={onSave} className="text-[12px] text-primary font-medium">
        Save
      </button>
      <button type="button" onClick={onCancel} className="text-[12px] text-tertiary">
        Cancel
      </button>
    </div>
  );
}
