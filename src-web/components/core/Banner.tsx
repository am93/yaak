import classNames from 'classnames';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'notice' | 'warning' | 'danger' | 'info';
}

export function Banner({ children, className, color }: Props) {
  return (
    <div
      className={classNames(
        className,
        `x-theme-banner--${color}`,
        'whitespace-pre-wrap',
        'border border-border bg-surface',
        'px-4 py-3 rounded-lg select-auto',
        'overflow-auto h-auto mb-auto text-text',
      )}
    >
      {children}
    </div>
  );
}
