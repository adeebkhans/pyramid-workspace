'use client';

import { useState } from 'react';

import type { MemberReference } from '@/shared/domain/models';

interface MemberAvatarProps {
  member?: Pick<MemberReference, 'name' | 'avatarUrl' | 'initials'> | null;
  size?: number;
  /** Rendered as the element title for pointer users. */
  title?: string;
}

/**
 * A member's portrait, at any size.
 *
 * Three states, in order of preference:
 *   1. the generated portrait (unique per member — see the API's avatar factory)
 *   2. initials on a neutral disc, if that image fails to load
 *   3. a dashed "add" affordance when there is no member at all
 *
 * The middle case matters: portraits are remote SVGs, so an offline or blocked
 * request must degrade to something readable rather than a broken-image icon.
 */
export function MemberAvatar({ member, size = 18, title }: MemberAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimensions = { width: size, height: size };

  if (!member) {
    return (
      <div
        className="rounded-full border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 shrink-0"
        style={dimensions}
        aria-hidden="true"
      >
        <span style={{ fontSize: size * 0.5 }}>+</span>
      </div>
    );
  }

  const label = title ?? member.name;

  if (member.avatarUrl && !imageFailed) {
    return (
      <img
        src={member.avatarUrl}
        alt={label}
        title={label}
        width={size}
        height={size}
        onError={() => setImageFailed(true)}
        className="rounded-full shrink-0 object-cover bg-neutral-200 dark:bg-neutral-700"
        style={dimensions}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0"
      style={dimensions}
      title={label}
    >
      <span
        className="text-neutral-600 dark:text-neutral-300 font-medium"
        style={{ fontSize: Math.max(size * 0.45, 8) }}
      >
        {member.initials || member.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
