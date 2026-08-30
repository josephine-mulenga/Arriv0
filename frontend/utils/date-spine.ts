// Derives every OPT-related date shown across the app from the student's
// program start/end dates. Never hand-write a summary string for these —
// mismatched dates across screens (Home, Timeline, Deadline detail) read as
// a bug. See design_handoff_arrivo_v2/README.md, "Data & the date spine".

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const a = toDate(from);
  const b = toDate(to);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

// USCIS rule: OPT applications may be filed up to 90 days before the
// program end date on the I-20.
export function optWindowOpens(programEndDate: string | Date): Date {
  return addDays(toDate(programEndDate), -90);
}

// USCIS rule: OPT applications must be filed within 60 days after the
// program end date on the I-20.
export function optWindowCloses(programEndDate: string | Date): Date {
  return addDays(toDate(programEndDate), 60);
}

// DSOs typically ask for the SEVIS recommendation to be requested a week
// before the window opens, to leave time for processing.
export function dsoRecommendationDue(optWindowOpensDate: string | Date): Date {
  return addDays(toDate(optWindowOpensDate), -7);
}

export function programElapsedPercent(
  programStartDate: string | Date,
  programEndDate: string | Date,
  today: string | Date = new Date()
): number {
  const total = daysBetween(programStartDate, programEndDate);
  if (total <= 0) return 0;
  const elapsed = daysBetween(programStartDate, today);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function formatDate(value: string | Date): string {
  return toDate(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface OptSpine {
  optWindowOpens: Date;
  optWindowCloses: Date;
  dsoRecommendationDue: Date;
  daysToWindow: number;
  programElapsedPercent: number;
}

export function computeOptSpine(
  programStartDate: string | Date,
  programEndDate: string | Date,
  today: string | Date = new Date()
): OptSpine {
  const opens = optWindowOpens(programEndDate);
  const closes = optWindowCloses(programEndDate);
  const dsoDue = dsoRecommendationDue(opens);
  return {
    optWindowOpens: opens,
    optWindowCloses: closes,
    dsoRecommendationDue: dsoDue,
    daysToWindow: daysBetween(today, opens),
    programElapsedPercent: programElapsedPercent(programStartDate, programEndDate, today),
  };
}
