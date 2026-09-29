export function formatDate(value) {
  if (!value) return ''
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDayChip(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`
}

export function formatShortDate(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function todayBogota() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

export function upcomingDates(openDays, count = 7) {
  const days = new Set(openDays)
  const today = todayBogota()
  const [year, month, day] = today.split('-').map(Number)
  const cursor = new Date(year, month - 1, day)
  const dates = []
  for (let i = 0; i < 21 && dates.length < count; i += 1) {
    if (days.has(cursor.getDay())) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      dates.push(`${y}-${m}-${d}`)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function memberSince(value) {
  if (!value) return ''
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}
