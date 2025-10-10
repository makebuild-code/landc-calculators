export function formatDateForAPI(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function mon(d: Date): string {
  return d.toLocaleString('en-GB', { month: 'short' })
}

function dow(d: Date): string {
  return d.toLocaleString('en-GB', { weekday: 'short' })
}

function ord(n: number): string {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return `${n}st`
  if (a === 2 && b !== 12) return `${n}nd`
  if (a === 3 && b !== 13) return `${n}rd`
  return `${n}th`
}

export function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  let hh = h % 12 || 12
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

export function makeDateBtn(day: { date: string }, tpl: HTMLElement): HTMLElement {
  const d = new Date(day.date)
  const btn = tpl.cloneNode(true) as HTMLElement
  const input = btn.querySelector('.mct_pill_input') as HTMLInputElement
  const lab = btn.querySelector('label.hide') as HTMLLabelElement
  const mEl = btn.querySelector('[data-mct-appointment-input-label="month"]') as HTMLElement
  const dayEl = btn.querySelector('[data-mct-appointment-input-label="day"]') as HTMLElement
  mEl.textContent = mon(d)
  dayEl.textContent = `${dow(d)} ${ord(d.getDate())}`
  lab.textContent = `${mon(d)}, ${dow(d)} ${ord(d.getDate())}`
  input.value = formatDateForAPI(d)
  return btn
}