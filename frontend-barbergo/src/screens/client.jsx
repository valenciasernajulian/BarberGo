import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatDate, formatDayChip, formatPrice, formatShortDate, memberSince, upcomingDates } from '../lib/format'
import {
  Alert, Brand, Btn, CalIcon, Card, CheckIcon, HomeIcon, Input, SearchIcon, StarRating, StatusChip, SummaryRow, UserIcon,
} from '../components/ui'

const TABS = [
  { screen: 'home', label: 'Inicio', icon: <HomeIcon /> },
  { screen: 'appointments', label: 'Citas', icon: <CalIcon /> },
  { screen: 'profile', label: 'Perfil', icon: <UserIcon /> },
]

export function ClientLayout({ screen, onNav, onLogout, children }) {
  return (
    <div className="min-h-screen bg-[#FBF7F2] md:flex">
      <aside className="hidden md:flex md:flex-col md:w-56 lg:w-60 shrink-0 bg-[#2D2B28] text-white md:sticky md:top-0 md:h-screen">
        <div className="p-5 border-b border-white/10">
          <Brand light />
          <span className="text-xs text-white/50 uppercase tracking-wide">Cliente</span>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
          {TABS.map((tab) => (
            <button
              key={tab.screen}
              type="button"
              onClick={() => onNav(tab.screen)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-all text-left ${screen === tab.screen ? 'bg-[#6E84A0] text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
        <button type="button" onClick={onLogout} className="p-4 text-xs text-white/40 hover:text-white text-left border-t border-white/10">
          Cerrar sesión
        </button>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden bg-[#FBF7F2] border-b border-[#D5C9BC] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <Brand />
          <button type="button" onClick={onLogout} className="text-xs text-[#8C7B6E] hover:text-[#C66F5B]">Salir</button>
        </header>
        <main className="flex-1 pb-20 md:pb-8">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#FBF7F2] border-t border-[#D5C9BC] flex md:hidden z-20">
        {TABS.map((tab) => (
          <button
            key={tab.screen}
            type="button"
            onClick={() => onNav(tab.screen)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${screen === tab.screen ? 'text-[#6E84A0]' : 'text-[#8C7B6E]'}`}
          >
            <span className={screen === tab.screen ? 'text-[#6E84A0]' : 'text-[#D5C9BC]'}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export function HomeScreen({ user, onOpenShop }) {
  const [shops, setShops] = useState([])
  const [appointments, setAppointments] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([api('/barberias'), api('/citas/mias')])
      .then(([list, citas]) => {
        if (!active) return
        setShops(list)
        setAppointments(citas)
      })
      .catch((err) => active && setError(err.message))
    return () => { active = false }
  }, [])

  const filtered = shops.filter((shop) => {
    const q = search.toLowerCase()
    return shop.name.toLowerCase().includes(q) || shop.address.toLowerCase().includes(q)
  })
  const next = appointments
    .filter((item) => item.status === 'pending' || item.status === 'confirmed')
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0]

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 mt-2">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#2D2B28] mb-1">Hola, {user.nombre}</h1>
        <p className="text-[#8C7B6E] text-sm">¿A qué barbería vamos hoy?</p>
      </div>
      <div className="relative mb-6 max-w-2xl">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D5C9BC]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar barbería por nombre o dirección..."
          className="w-full rounded-[8px] border border-[#D5C9BC] bg-white pl-10 pr-4 py-3 text-sm text-[#2D2B28] placeholder-[#D5C9BC] outline-none focus:border-[#6E84A0] focus:ring-2 focus:ring-[#6E84A0]/20"
        />
      </div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {next && (
        <Card className="p-4 mb-6 flex gap-4 items-start max-w-2xl">
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#8C7B6E] uppercase tracking-wide mb-1">Próxima cita</p>
            <p className="font-serif font-semibold text-[#2D2B28]">{next.barbershop}</p>
            <p className="text-sm text-[#8C7B6E]">{formatShortDate(next.date)} · {next.time} · {next.barber}</p>
          </div>
          <StatusChip status={next.status} />
        </Card>
      )}
      <h2 className="font-serif font-semibold text-[#2D2B28] mb-3">Barberías disponibles</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((shop) => (
          <button key={shop.id} type="button" onClick={() => onOpenShop(shop)} className="text-left">
            <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
              <img src={shop.photo} alt={shop.name} className="w-full h-44 object-cover bg-[#D5C9BC]" />
              <div className="p-4">
                <p className="font-serif font-semibold text-[#2D2B28] mb-1">{shop.name}</p>
                <p className="text-xs text-[#8C7B6E] mb-2">{shop.address}</p>
                <div className="flex items-center gap-2">
                  <StarRating rating={shop.rating || 0} />
                  <span className="text-xs text-[#8C7B6E]">
                    {shop.reviews ? `${shop.rating} (${shop.reviews} reseñas)` : 'Sin reseñas'}
                  </span>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>
      {!error && filtered.length === 0 && <p className="text-sm text-[#8C7B6E] mt-4">No hay barberías con esa búsqueda.</p>}
    </div>
  )
}

export function BarbershopScreen({ shopId, onNav, onBook }) {
  const [shop, setShop] = useState(null)
  const [tab, setTab] = useState('services')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api(`/barberias/${shopId}`)
      .then((data) => active && setShop(data))
      .catch((err) => active && setError(err.message))
    return () => { active = false }
  }, [shopId])

  if (error) return <div className="p-4 max-w-2xl mx-auto"><Alert>{error}</Alert></div>
  if (!shop) return <p className="p-8 text-sm text-[#8C7B6E]">Cargando barbería...</p>

  return (
    <div>
      <div className="relative">
        <img src={shop.photo} alt={shop.name} className="w-full h-52 md:h-72 object-cover bg-[#D5C9BC]" />
        <button type="button" onClick={() => onNav('home')} className="absolute top-4 left-4 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow-sm">←</button>
      </div>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-3 mt-2">
          <div>
            <h1 className="font-serif text-xl md:text-3xl font-bold text-[#2D2B28]">{shop.name}</h1>
            <p className="text-sm text-[#8C7B6E]">{shop.address}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <StarRating rating={shop.rating || 0} />
              {shop.rating != null && <span className="font-semibold text-sm text-[#2D2B28]">{shop.rating}</span>}
            </div>
            <span className="text-xs text-[#8C7B6E]">{shop.reviews ? `${shop.reviews} reseñas` : 'Sin reseñas'}</span>
          </div>
        </div>
        <p className="text-sm text-[#8C7B6E] mb-5 leading-relaxed max-w-3xl">{shop.description}</p>
        <div className="flex border border-[#D5C9BC] rounded-[8px] overflow-hidden mb-5 max-w-xl">
          {[
            ['services', 'Servicios'],
            ['barbers', 'Barberos'],
            ['info', 'Información'],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setTab(value)} className={`flex-1 py-2 text-xs font-semibold ${tab === value ? 'bg-[#6E84A0] text-white' : 'bg-white text-[#8C7B6E] hover:bg-[#EFE5DA]'}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {shop.services.map((service) => (
              <Card key={service.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm text-[#2D2B28]">{service.name}</p>
                  <p className="text-xs text-[#8C7B6E]">{service.duration} min</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#C66F5B] text-sm">{formatPrice(service.price)}</span>
                  <Btn className="text-xs px-3 py-1.5" onClick={() => onBook(shop, service, shop.barbers[0])}>Agendar</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab === 'barbers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {shop.barbers.map((barber) => (
              <Card key={barber.id} className="p-4 flex items-center gap-4">
                <Avatar person={barber} />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#2D2B28]">{barber.name}</p>
                  <p className="text-xs text-[#8C7B6E]">{barber.specialty}</p>
                </div>
                <Btn variant="outline" className="text-xs px-3 py-1.5" onClick={() => onBook(shop, shop.services[0], barber)}>Agendar</Btn>
              </Card>
            ))}
          </div>
        )}
        {tab === 'info' && (
          <Card className="p-4 flex flex-col gap-3 max-w-xl">
            <InfoRow icon="📍" label="Dirección" value={shop.address} />
            <InfoRow icon="⏰" label="Horario" value={shop.schedule} />
            <InfoRow icon="📞" label="Teléfono" value={shop.phone || 'Sin teléfono'} />
            <InfoRow icon="📧" label="Correo" value={shop.email || 'Sin correo'} />
          </Card>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-lg leading-none mt-0.5">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-[#8C7B6E] uppercase tracking-wide">{label}</p>
        <p className="text-sm text-[#2D2B28]">{value}</p>
      </div>
    </div>
  )
}

function Avatar({ person, size = 'w-14 h-14' }) {
  if (person.photo) {
    return <img src={person.photo} alt={person.name} className={`${size} rounded-full object-cover bg-[#D5C9BC]`} />
  }
  return (
    <div className={`${size} rounded-full bg-[#6E84A0] text-white flex items-center justify-center font-serif font-bold`}>
      {(person.name || '?').slice(0, 1)}
    </div>
  )
}

export function BookScreen({ shop, service, barber, onNav, onDone }) {
  const [step, setStep] = useState(1)
  const [selectedBarber, setSelectedBarber] = useState(barber?.id)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [slots, setSlots] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const currentBarber = shop.barbers.find((item) => item.id === selectedBarber) || shop.barbers[0]
  const dates = upcomingDates((currentBarber?.days || []).map((day) => day.day))

  useEffect(() => {
    if (!selectedDate || !currentBarber) return
    let active = true
    setSlots([])
    setSelectedTime('')
    api(`/disponibilidad?id_barbero=${currentBarber.id}&id_servicio=${service.id}&fecha=${selectedDate}`)
      .then((data) => active && setSlots(data.horarios))
      .catch((err) => active && setError(err.message))
    return () => { active = false }
  }, [selectedDate, currentBarber, service.id])

  async function confirm() {
    setError('')
    setLoading(true)
    try {
      await api('/citas', {
        method: 'POST',
        body: {
          id_barberia: shop.id,
          id_barbero: currentBarber.id,
          id_servicio: service.id,
          fecha: selectedDate,
          hora_inicio: selectedTime,
        },
      })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <button type="button" onClick={() => (step > 1 ? setStep(step - 1) : onNav('barbershop'))} className="flex items-center gap-1.5 text-[#8C7B6E] text-sm mb-6 hover:text-[#2D2B28]">
        ← {step > 1 ? 'Atrás' : 'Volver'}
      </button>
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${item <= step ? 'bg-[#6E84A0] text-white' : 'bg-[#EFE5DA] text-[#8C7B6E]'}`}>
              {item < step ? '✓' : item}
            </div>
            {item < 3 && <div className={`h-px flex-1 ${item < step ? 'bg-[#6E84A0]' : 'bg-[#D5C9BC]'}`} />}
          </div>
        ))}
      </div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {step === 1 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2D2B28] mb-1">Elige tu barbero</h2>
          <p className="text-[#8C7B6E] text-sm mb-5">Servicio: <strong>{service.name}</strong> · {formatPrice(service.price)}</p>
          <div className="flex flex-col gap-3 mb-6">
            {shop.barbers.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedBarber(item.id)}
                className={`text-left rounded-[10px] border p-4 flex items-center gap-4 ${selectedBarber === item.id ? 'border-[#6E84A0] bg-[#6E84A0]/5' : 'border-[#D5C9BC] bg-[#EFE5DA]'}`}
              >
                <Avatar person={item} size="w-12 h-12" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#2D2B28]">{item.name}</p>
                  <p className="text-xs text-[#8C7B6E]">{item.specialty}</p>
                </div>
                {selectedBarber === item.id && <CheckIcon className="text-[#6E84A0]" />}
              </button>
            ))}
          </div>
          <Btn className="w-full justify-center py-3" onClick={() => setStep(2)} disabled={!currentBarber}>Continuar</Btn>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2D2B28] mb-1">Fecha y hora</h2>
          <p className="text-[#8C7B6E] text-sm mb-5">Selecciona cuándo quieres tu cita.</p>
          {dates.length === 0 && <Alert>Este barbero no tiene horario publicado.</Alert>}
          <p className="text-xs font-semibold text-[#8C7B6E] uppercase tracking-wide mb-2">Fecha</p>
          <div className="flex gap-2 flex-wrap mb-5">
            {dates.map((date) => (
              <button key={date} type="button" onClick={() => setSelectedDate(date)} className={`rounded-[8px] border px-3 py-2 text-xs font-medium ${selectedDate === date ? 'bg-[#6E84A0] text-white border-[#6E84A0]' : 'border-[#D5C9BC] text-[#2D2B28] hover:bg-[#EFE5DA]'}`}>
                {formatDayChip(date)}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-[#8C7B6E] uppercase tracking-wide mb-2">Hora disponible</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
            {slots.map((slot) => (
              <button
                key={slot.hora}
                type="button"
                disabled={!slot.disponible}
                onClick={() => setSelectedTime(slot.hora)}
                className={`rounded-[8px] border py-2 text-xs font-medium ${!slot.disponible ? 'bg-[#EFE5DA] text-[#D5C9BC] border-[#D5C9BC] line-through cursor-not-allowed' : selectedTime === slot.hora ? 'bg-[#6E84A0] text-white border-[#6E84A0]' : 'border-[#D5C9BC] text-[#2D2B28] hover:bg-[#EFE5DA]'}`}
              >
                {slot.hora}
              </button>
            ))}
          </div>
          <Btn className="w-full justify-center py-3" onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime}>Continuar</Btn>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2D2B28] mb-1">Confirma tu cita</h2>
          <p className="text-[#8C7B6E] text-sm mb-5">Revisa los detalles antes de agendar.</p>
          <Card className="p-5 flex flex-col gap-4 mb-6">
            <SummaryRow label="Barbería" value={shop.name} />
            <SummaryRow label="Servicio" value={`${service.name} · ${service.duration} min`} />
            <SummaryRow label="Barbero" value={currentBarber?.name || ''} />
            <SummaryRow label="Fecha" value={formatDate(selectedDate)} />
            <SummaryRow label="Hora" value={selectedTime} />
            <div className="border-t border-[#D5C9BC] pt-3 flex justify-between">
              <span className="font-semibold text-sm text-[#2D2B28]">Total</span>
              <span className="font-bold text-[#C66F5B] text-lg">{formatPrice(service.price)}</span>
            </div>
          </Card>
          <Btn variant="accent" className="w-full justify-center py-3" onClick={confirm} disabled={loading}>
            {loading ? 'Agendando...' : 'Confirmar cita'}
          </Btn>
        </div>
      )}
    </div>
  )
}

export function AppointmentsScreen({ onNav, onSelect }) {
  const [tab, setTab] = useState('upcoming')
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api('/citas/mias').then(setAppointments).catch((err) => setError(err.message))
  }, [])

  const upcoming = appointments.filter((item) => item.status === 'pending' || item.status === 'confirmed')
  const history = appointments.filter((item) => item.status === 'completed' || item.status === 'cancelled')
  const list = tab === 'upcoming' ? upcoming : history

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="font-serif text-2xl font-bold text-[#2D2B28] mb-5 mt-2">Mis citas</h1>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <div className="flex border border-[#D5C9BC] rounded-[8px] overflow-hidden mb-5">
        <button type="button" onClick={() => setTab('upcoming')} className={`flex-1 py-2 text-xs font-semibold ${tab === 'upcoming' ? 'bg-[#6E84A0] text-white' : 'bg-white text-[#8C7B6E]'}`}>Próximas ({upcoming.length})</button>
        <button type="button" onClick={() => setTab('history')} className={`flex-1 py-2 text-xs font-semibold ${tab === 'history' ? 'bg-[#6E84A0] text-white' : 'bg-white text-[#8C7B6E]'}`}>Historial ({history.length})</button>
      </div>
      {list.length === 0 ? (
        <div className="text-center py-16 text-[#8C7B6E]">
          <p className="font-serif font-semibold text-[#2D2B28] mb-1">Sin citas</p>
          <p className="text-sm">No tienes citas en esta sección.</p>
          {tab === 'upcoming' && <Btn variant="accent" className="mt-4" onClick={() => onNav('home')}>Agendar una cita</Btn>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((item) => (
            <button key={item.id} type="button" className="text-left" onClick={() => onSelect(item)}>
              <Card className="p-4 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-serif font-semibold text-[#2D2B28] text-sm">{item.barbershop}</p>
                  <StatusChip status={item.status} />
                </div>
                <p className="text-xs text-[#8C7B6E] mb-1">{item.service} · {item.barber}</p>
                <p className="text-xs text-[#8C7B6E]">{formatDate(item.date)} · {item.time}</p>
                <p className="text-sm font-semibold text-[#C66F5B] mt-2">{formatPrice(item.price)}</p>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AppointmentDetailScreen({ appointmentId, onNav }) {
  const [appointment, setAppointment] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api(`/citas/${appointmentId}`).then(setAppointment).catch((err) => setError(err.message))
  }, [appointmentId])

  async function cancel() {
    setLoading(true)
    setError('')
    try {
      const updated = await api(`/citas/${appointmentId}/cancelar`, { method: 'PATCH' })
      setAppointment(updated)
      setMessage('Cita cancelada. El horario quedó libre.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (error && !appointment) return <div className="p-4"><Alert>{error}</Alert></div>
  if (!appointment) return <p className="p-8 text-sm text-[#8C7B6E]">Cargando cita...</p>

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <button type="button" onClick={() => onNav('appointments')} className="text-[#8C7B6E] text-sm mb-6 hover:text-[#2D2B28]">← Mis citas</button>
      <h1 className="font-serif text-xl font-bold text-[#2D2B28] mb-5">Detalle de cita</h1>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <Card className="p-5 flex flex-col gap-4 mb-5">
        <div className="flex items-center justify-between">
          <span className="font-serif font-semibold text-[#2D2B28]">{appointment.barbershop}</span>
          <StatusChip status={appointment.status} />
        </div>
        <SummaryRow label="Servicio" value={appointment.service} />
        <SummaryRow label="Barbero" value={appointment.barber} />
        <SummaryRow label="Fecha" value={formatDate(appointment.date)} />
        <SummaryRow label="Hora" value={appointment.time} />
        <div className="border-t border-[#D5C9BC] pt-3 flex justify-between">
          <span className="font-semibold text-sm text-[#2D2B28]">Total</span>
          <span className="font-bold text-[#C66F5B] text-lg">{formatPrice(appointment.price)}</span>
        </div>
      </Card>
      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
        <Btn variant="outline" className="w-full justify-center py-3 border-[#C66F5B] text-[#C66F5B]" onClick={cancel} disabled={loading}>
          {loading ? 'Cancelando...' : 'Cancelar cita'}
        </Btn>
      )}
      {message && <p className="mt-4 rounded-[10px] bg-[#C66F5B]/10 border border-[#C66F5B]/20 p-4 text-center text-sm font-semibold text-[#C66F5B]">{message}</p>}
    </div>
  )
}

export function ProfileScreen({ user, onNav, onLogout, onUser }) {
  const [mode, setMode] = useState('')
  const [nombre, setNombre] = useState(user.nombre)
  const [apellido, setApellido] = useState(user.apellido)
  const [telefono, setTelefono] = useState(user.telefono || '')
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  async function saveProfile(event) {
    event.preventDefault()
    setError('')
    setOk('')
    try {
      const updated = await api('/auth/me', { method: 'PUT', body: { nombre, apellido, telefono } })
      onUser(updated)
      setOk('Perfil actualizado')
      setMode('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    setError('')
    setOk('')
    try {
      const data = await api('/auth/password', { method: 'PUT', body: { actual, nueva } })
      setOk(data.message)
      setActual('')
      setNueva('')
      setMode('')
    } catch (err) {
      setError(err.message)
    }
  }

  const initial = (user.nombre || 'B').slice(0, 1)

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <h1 className="font-serif text-2xl font-bold text-[#2D2B28] mb-6 mt-2">Mi perfil</h1>
      <Card className="p-5 flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-[#6E84A0] flex items-center justify-center text-white text-2xl font-bold font-serif">{initial}</div>
        <div>
          <p className="font-serif font-bold text-[#2D2B28] text-lg">{user.nombre} {user.apellido}</p>
          <p className="text-sm text-[#8C7B6E]">{user.email}</p>
          <p className="text-xs text-[#8C7B6E]">Cliente desde {memberSince(user.fecha_registro)}</p>
        </div>
      </Card>
      {error && <div className="mb-3"><Alert>{error}</Alert></div>}
      {ok && <div className="mb-3"><Alert tone="ok">{ok}</Alert></div>}
      {mode === 'profile' && (
        <Card className="p-5 mb-4">
          <form className="flex flex-col gap-3" onSubmit={saveProfile}>
            <Input label="Nombre" value={nombre} onChange={setNombre} />
            <Input label="Apellido" value={apellido} onChange={setApellido} />
            <Input label="Teléfono" value={telefono} onChange={setTelefono} />
            <div className="flex gap-2"><Btn type="submit">Guardar</Btn><Btn variant="ghost" onClick={() => setMode('')}>Cancelar</Btn></div>
          </form>
        </Card>
      )}
      {mode === 'password' && (
        <Card className="p-5 mb-4">
          <form className="flex flex-col gap-3" onSubmit={savePassword}>
            <Input label="Contraseña actual" type="password" value={actual} onChange={setActual} />
            <Input label="Nueva contraseña" type="password" value={nueva} onChange={setNueva} />
            <div className="flex gap-2"><Btn type="submit">Guardar</Btn><Btn variant="ghost" onClick={() => setMode('')}>Cancelar</Btn></div>
          </form>
        </Card>
      )}
      <div className="flex flex-col gap-2">
        <Row icon="✏️" label="Editar perfil" onClick={() => setMode('profile')} />
        <Row icon="🔒" label="Cambiar contraseña" onClick={() => setMode('password')} />
        <Row icon="📋" label="Historial de citas" onClick={() => onNav('appointments')} />
        <button type="button" onClick={onLogout} className="flex items-center gap-3 rounded-[10px] border border-[#C66F5B]/30 bg-[#C66F5B]/5 px-4 py-3.5 text-sm font-medium text-[#C66F5B] mt-2">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function Row({ icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-[10px] border border-[#D5C9BC] bg-[#EFE5DA] px-4 py-3.5 text-sm font-medium text-[#2D2B28] text-left">
      <span>{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-[#D5C9BC]">›</span>
    </button>
  )
}
