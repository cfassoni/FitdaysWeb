import React, { useMemo } from 'react';

interface Props {
  /** Current value as 'YYYY-MM-DD' string, or empty string when unset. */
  value: string;
  onChange: (value: string) => void;
  /** Minimum selectable date as 'YYYY-MM-DD'. */
  min?: string;
  /** BCP-47 language tag, e.g. 'pt', 'es', 'en'. Controls field order and month names. */
  lang: string;
  className?: string;
}

/**
 * A locale-aware date picker rendered as three <select> dropdowns.
 * Unlike <input type="date">, it respects the app's selected language
 * for month names and field order (day/month/year vs month/day/year).
 */
export default function LocalizedDatePicker({ value, onChange, lang, className }: Props) {
  const parsed = value ? value.split('-').map(Number) : null;
  const selYear  = parsed ? parsed[0] : 0;
  const selMonth = parsed ? parsed[1] : 0;
  const selDay   = parsed ? parsed[2] : 0;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  // Localized month names
  const monthNames = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      num: i + 1,
      label: new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2000, i, 1))
    })),
    [lang]
  );

  // Days available for selected month/year
  const daysInMonth = selYear && selMonth
    ? new Date(selYear, selMonth, 0).getDate()
    : 31;

  // Detect locale field order (day/month/year vs month/day/year etc.)
  const fieldOrder = useMemo(() => {
    const parts = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'numeric', year: 'numeric' })
      .formatToParts(new Date(2000, 0, 15));
    const order = parts
      .filter(p => ['day', 'month', 'year'].includes(p.type))
      .map(p => p.type as 'day' | 'month' | 'year');
    // Fallback to day/month/year if detection fails
    return order.length === 3 ? order : ['day', 'month', 'year'] as const;
  }, [lang]);

  const emit = (y: number, m: number, d: number) => {
    if (!y || !m || !d) return;
    const maxD = new Date(y, m, 0).getDate();
    const safeD = Math.min(d, maxD);
    onChange(`${y}-${String(m).padStart(2, '0')}-${String(safeD).padStart(2, '0')}`);
  };

  const baseCls =
    'bg-muted/30 border border-border rounded-lg text-sm text-foreground ' +
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ' +
    'transition-all cursor-pointer px-2 py-2 capitalize';

  const fields: Record<string, React.ReactElement> = {
    day: (
      <select
        key="day"
        value={selDay || ''}
        onChange={e => emit(selYear || currentYear, selMonth || 1, Number(e.target.value))}
        className={`${baseCls} w-16`}
      >
        <option value="" disabled>--</option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
          <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
        ))}
      </select>
    ),
    month: (
      <select
        key="month"
        value={selMonth || ''}
        onChange={e => emit(selYear || currentYear, Number(e.target.value), selDay || 1)}
        className={`${baseCls} flex-1 min-w-0`}
      >
        <option value="" disabled>---</option>
        {monthNames.map(m => (
          <option key={m.num} value={m.num}>{m.label}</option>
        ))}
      </select>
    ),
    year: (
      <select
        key="year"
        value={selYear || ''}
        onChange={e => emit(Number(e.target.value), selMonth || 1, selDay || 1)}
        className={`${baseCls} w-[5.5rem]`}
      >
        <option value="" disabled>----</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    ),
  };

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      {fieldOrder.map(f => fields[f])}
    </div>
  );
}
