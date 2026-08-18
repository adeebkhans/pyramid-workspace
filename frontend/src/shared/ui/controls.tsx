'use client';

import { Search } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';

import { cx } from '@/shared/lib/cx';

/**
 * The small set of button and field shapes the toolbars are assembled from.
 *
 * Every page header in the app is built out of these, so the 32px control
 * height, the border treatment and the hover tint are defined in exactly one
 * place and stay consistent as screens are added.
 */

export function IconButton({
  children,
  onClick,
  label,
  isActive = false,
  hideBelow,
  onlyBelow,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  isActive?: boolean;
  /** Tailwind breakpoint below which the control is hidden, e.g. `sm`. */
  hideBelow?: 'sm';
  /** Show the control only below the given breakpoint. */
  onlyBelow?: 'sm';
  className?: string;
}) {
  const visibility = hideBelow === 'sm' ? 'hidden sm:flex' : onlyBelow === 'sm' ? 'sm:hidden flex' : 'flex';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cx(
        visibility,
        'w-8 h-8 items-center justify-center border border-default rounded-md text-secondary transition-colors outline-none',
        isActive ? 'bg-neutral-200/40' : 'bg-transparent hover:bg-neutral-200/40',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  onClick,
  isActive = false,
  hideBelow,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  hideBelow?: 'sm';
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        hideBelow === 'sm' ? 'hidden sm:flex' : 'flex',
        'h-8 px-3 items-center gap-2 border border-default rounded-md text-primary text-sm font-medium transition-colors outline-none',
        isActive ? 'bg-neutral-200/40' : 'bg-transparent hover:bg-neutral-200/40',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  shape = 'rounded',
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  shape?: 'rounded' | 'pill';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'btn-primary h-8 px-4 flex items-center gap-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50',
        shape === 'pill' ? 'rounded-full' : 'rounded-lg',
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Collapsing search control: a magnifier that becomes a field.
 *
 * The ⌘F badge is live: `useSearchField` binds the shortcut that expands and
 * focuses this input.
 */
export function SearchControl({
  term,
  onTermChange,
  isExpanded,
  onExpand,
  onCollapse,
  inputRef,
}: {
  term: string;
  onTermChange: (value: string) => void;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  if (!isExpanded) {
    return (
      <IconButton label="Search" onClick={onExpand}>
        <Search className="w-4 h-4" />
      </IconButton>
    );
  }

  return (
    <div className="relative">
      <Search className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        ref={inputRef}
        type="text"
        value={term}
        onChange={(event) => onTermChange(event.target.value)}
        onBlur={onCollapse}
        placeholder="Search"
        aria-label="Search"
        className="w-64 h-[32px] pl-9 pr-8 border border-default bg-surface text-primary rounded-full text-sm outline-none focus:border-neutral-400"
      />
      <span className="text-[10px] text-tertiary font-medium absolute right-3 top-1/2 -translate-y-1/2 border border-default rounded px-1">
        ⌘F
      </span>
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  label,
  autoFocus = false,
  required = false,
  readOnly = false,
  className,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  required?: boolean;
  readOnly?: boolean;
  className?: string;
}) {
  const field = (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      required={required}
      readOnly={readOnly}
      aria-label={label}
      className={cx(
        'w-full border border-default rounded-md px-3 py-2 text-sm bg-surface text-primary focus:outline-none focus:border-neutral-400 placeholder:text-tertiary',
        className,
      )}
    />
  );

  if (!label) return field;

  return (
    <div>
      <label className="block text-sm font-medium text-primary mb-1">{label}</label>
      {field}
    </div>
  );
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  label: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-primary mb-1">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full border border-default rounded-md px-3 py-2 text-sm bg-surface text-primary focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
