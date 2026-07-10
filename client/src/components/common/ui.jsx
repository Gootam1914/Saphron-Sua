import { Loader2 } from 'lucide-react';

// Re-export Modal so screens can import every primitive from one place.
export { default as Modal } from './Modal.jsx';

const cx = (...c) => c.filter(Boolean).join(' ');

export function Button({ variant = 'primary', className, children, loading, ...rest }) {
  const map = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };
  return (
    <button className={cx(map[variant], className)} disabled={rest.disabled || loading} {...rest}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children, as: Tag = 'div', ...rest }) {
  return <Tag className={cx('card p-5', className)} {...rest}>{children}</Tag>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slatey">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  gray: 'bg-slate-100 text-slate-600',
  sky: 'bg-sky-50 text-sky-700',
  grape: 'bg-violet-50 text-violet-700',
};
export function Chip({ tone = 'gray', className, children }) {
  return <span className={cx('chip', TONES[tone] || TONES.gray, className)}>{children}</span>;
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slatey">
      <Loader2 className="animate-spin" size={20} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
      {Icon && <Icon className="mb-3 text-slate-300" size={40} />}
      <p className="text-base font-semibold text-ink">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slatey">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Avatar({ name = '?', src, size = 40 }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const style = { width: size, height: size };
  if (src) return <img src={src} alt={name} className="rounded-full object-cover" style={style} />;
  return (
    <div className="flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700" style={style}>
      <span style={{ fontSize: size * 0.38 }}>{initials}</span>
    </div>
  );
}

export function Input({ label, className, id, ...rest }) {
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <input id={id} className={cx('input', className)} {...rest} />
    </div>
  );
}

export function Textarea({ label, className, id, ...rest }) {
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <textarea id={id} className={cx('input min-h-[96px] resize-y', className)} {...rest} />
    </div>
  );
}

export function Select({ label, className, id, children, ...rest }) {
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <select id={id} className={cx('input appearance-none', className)} {...rest}>{children}</select>
    </div>
  );
}
