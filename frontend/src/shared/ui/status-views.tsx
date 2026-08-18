import { cx } from '@/shared/lib/cx';

/** Centred placeholder shown while a screen's first payload is in flight. */
export function LoadingPane({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-sm text-secondary" role="status">
      {message}
    </div>
  );
}

/**
 * Failure state.
 *
 * A screen that swallows a fetch error and renders an empty list is
 * indistinguishable from one with no data, so failures get their own visible
 * state and a way back.
 */
export function ErrorPane({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center" role="alert">
      <p className="text-sm text-secondary max-w-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary px-4 py-1.5 rounded-full text-[13px] font-medium hover:opacity-90"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyPane({ title, hint, className }: { title: string; hint?: string; className?: string }) {
  return (
    <div className={cx('flex flex-col items-center justify-center gap-1 py-10 text-center', className)}>
      <p className="text-[13px] font-medium text-secondary">{title}</p>
      {hint && <p className="text-[12px] text-tertiary">{hint}</p>}
    </div>
  );
}
