import { PRIORITY_BARS, PRIORITY_TONE, type PriorityLevel } from '@/shared/domain/workflow';
import { cx } from '@/shared/lib/cx';

const BAR_HEIGHTS = ['4px', '7px', '10px'] as const;

/**
 * The three-bar signal-strength meter beside a priority.
 *
 * "How many bars" and "what colour" are data rather than branches, so adding a
 * priority tier is a one-line change to the lookup tables in `shared/domain`
 * and nothing here has to move.
 */
export function PriorityMeter({ priority, showLabel = true }: { priority: PriorityLevel; showLabel?: boolean }) {
  const litBars = PRIORITY_BARS[priority] ?? 0;
  const tone = PRIORITY_TONE[priority] ?? 'text-neutral-400';

  return (
    <div className={cx('flex items-center gap-1.5 font-medium text-[12px]', tone)}>
      {litBars === 0 ? (
        <div className="w-2 h-2 rounded-full border-2 border-neutral-300" aria-hidden="true" />
      ) : (
        <div className="flex items-end gap-[1px] h-3 w-3 pb-0.5" aria-hidden="true">
          {BAR_HEIGHTS.map((height, index) => (
            <div
              key={height}
              className={cx('w-[2px] rounded-sm', index < litBars ? 'bg-current' : 'bg-neutral-200')}
              style={{ height }}
            />
          ))}
        </div>
      )}
      {showLabel && <span>{priority}</span>}
    </div>
  );
}
