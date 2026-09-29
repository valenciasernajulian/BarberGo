import { STATUS_LABELS } from '../lib/format'

const STATUS_COLORS = {
  pending: 'bg-[#EFE5DA] text-[#8C7B6E]',
  confirmed: 'bg-[#6E84A0]/15 text-[#6E84A0]',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-[#C66F5B]/10 text-[#C66F5B]',
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-[#EFE5DA] rounded-[10px] border border-[#D5C9BC] ${className}`}>
      {children}
    </div>
  )
}

export function Btn({
  children, onClick, variant = 'primary', className = '', type = 'button', disabled = false,
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-[8px] font-medium text-sm transition-all px-4 py-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-[#6E84A0] text-white hover:bg-[#5d7290]',
    accent: 'bg-[#C66F5B] text-white hover:bg-[#b05e4c]',
    ghost: 'bg-transparent text-[#6E84A0] hover:bg-[#6E84A0]/10',
    outline: 'bg-transparent border border-[#D5C9BC] text-[#2D2B28] hover:bg-[#EFE5DA]',
    dark: 'bg-[#2D2B28] text-white hover:bg-[#1e1c1a]',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Input({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#8C7B6E] uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="rounded-[8px] border border-[#D5C9BC] bg-white px-3.5 py-2.5 text-sm text-[#2D2B28] placeholder-[#D5C9BC] outline-none focus:border-[#6E84A0] focus:ring-2 focus:ring-[#6E84A0]/20 transition-all"
      />
    </div>
  )
}

export function Alert({ children, tone = 'error' }) {
  const toneClass = tone === 'ok'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-[#C66F5B]/10 text-[#C66F5B] border-[#C66F5B]/20'
  return <p className={`rounded-[8px] border px-3 py-2 text-sm ${toneClass}`}>{children}</p>
}

export function StarRating({ rating }) {
  const value = Math.round(Number(rating) || 0)
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 12 12" className="w-3 h-3" fill={i <= value ? '#C66F5B' : '#D5C9BC'}>
          <path d="M6 1l1.4 2.8L10.5 4 8.25 6.2l.5 3.1L6 7.75l-2.75 1.55.5-3.1L1.5 4l3.1-.2z" />
        </svg>
      ))}
    </span>
  )
}

export function StatusChip({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs font-semibold text-[#8C7B6E] uppercase tracking-wide">{label}</span>
      <span className="text-sm text-[#2D2B28] font-medium text-right">{value}</span>
    </div>
  )
}

export function ScissorsIcon({ color = '#2D2B28' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  )
}

export function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

export function CalIcon({ className = '' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function SearchIcon({ className = '' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function CheckIcon({ className = '' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function Brand({ light = false }) {
  return (
    <div className="flex items-center gap-2">
      <ScissorsIcon color={light ? 'white' : '#2D2B28'} />
      <span className={`font-serif font-bold text-lg ${light ? 'text-white' : 'text-[#2D2B28]'}`}>BarberGo</span>
    </div>
  )
}
