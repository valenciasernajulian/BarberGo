import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import { Alert, Btn, Card, Input, ScissorsIcon, STATUS_LABELS, StatusChip } from '../components/ui'

const TABS = [
  { screen: 'admin-dashboard', label: 'Panel', icon: '📊' },
  { screen: 'admin-appointments', label: 'Citas', icon: '📅' },
  { screen: 'admin-services', label: 'Servicios', icon: '✂️' },
  { screen: 'admin-barbers', label: 'Barberos', icon: '👤' },
  { screen: 'admin-settings', label: 'Config', icon: '⚙️' },
]

const WEEK = [
  { dia: 1, label: 'Lunes' },
  { dia: 2, label: 'Martes' },
  { dia: 3, label: 'Miércoles' },
  { dia: 4, label: 'Jueves' },
  { dia: 5, label: 'Viernes' },
  { dia: 6, label: 'Sábado' },
  { dia: 0, label: 'Domingo' },
]

export function AdminLayout({ screen, onNav, onLogout, children }) {
  return (
    <div className="min-h-screen bg-[#FBF7F2] flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-56 lg:w-60 bg-[#2D2B28] text-white shrink-0 md:sticky md:top-0 md:h-screen">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <ScissorsIcon color="white" />
            <span className="font-serif font-bold">BarberGo</span>
          </div>
          <span className="text-xs text-white/50 uppercase tracking-wide">Administrador</span>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
          {TABS.map((tab) => (
            <button key={tab.screen} type="button" onClick={() => onNav(tab.screen)} className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-left ${screen === tab.screen ? 'bg-[#6E84A0] text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>
        <button type="button" onClick={onLogout} className="p-4 text-xs text-white/40 hover:text-white text-left border-t border-white/10">Cerrar sesión</button>
      </aside>
      <div className="md:hidden bg-[#2D2B28] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScissorsIcon color="white" />
          <span className="font-serif font-bold">BarberGo</span>
        </div>
        <button type="button" onClick={onLogout} className="text-xs text-white/50">Salir</button>
      </div>
      <main className="flex-1 min-w-0 pb-20 md:pb-6">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#2D2B28] flex md:hidden z-20">
        {TABS.map((tab) => (
          <button key={tab.screen} type="button" onClick={() => onNav(tab.screen)} className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${screen === tab.screen ? 'text-[#6E84A0]' : 'text-white/40'}`}>
            <span className="text-base">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export function AdminDashboard({ onNav }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/resumen').then(setData).catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="p-4"><Alert>{error}</Alert></div>
  if (!data) return <p className="p-8 text-sm text-[#8C7B6E]">Cargando panel...</p>
  if (!data.barberia) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <h1 className="font-serif text-2xl font-bold text-[#2D2B28] mb-2">Panel de control</h1>
        <p className="text-sm text-[#8C7B6E] mb-4">Todavía no tienes una barbería registrada.</p>
        <Btn onClick={() => onNav('admin-settings')}>Configurar barbería</Btn>
      </div>
    )
  }

  const stats = [
    { label: 'Citas hoy', value: data.stats.citasHoy, sub: `${data.stats.completadasHoy} completadas` },
    { label: 'Pendientes', value: data.stats.pendientes, sub: 'Requieren acción' },
    { label: 'Barberos activos', value: data.stats.barberos, sub: 'En la barbería' },
    { label: 'Ingresos hoy', value: formatPrice(data.stats.ingresos), sub: 'Citas completadas' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#2D2B28]">Panel de control</h1>
        <p className="text-[#8C7B6E] text-sm">{data.barberia.nombre} · hoy, {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((item) => (
          <div key={item.label} className="rounded-[10px] border border-[#D5C9BC] bg-[#EFE5DA] p-4">
            <p className="text-xs font-semibold text-[#8C7B6E] uppercase tracking-wide mb-1">{item.label}</p>
            <p className="font-serif text-2xl font-bold text-[#2D2B28]">{item.value}</p>
            <p className="text-xs text-[#8C7B6E] mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif font-semibold text-[#2D2B28]">Citas de hoy</h2>
        <button type="button" onClick={() => onNav('admin-appointments')} className="text-xs text-[#6E84A0] hover:underline">Ver todas</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {data.hoy.length === 0 && <p className="text-sm text-[#8C7B6E]">No hay citas para hoy.</p>}
        {data.hoy.map((item) => (
          <Card key={item.id} className="p-4 flex items-center gap-3">
            <p className="font-semibold text-sm text-[#2D2B28] min-w-[44px]">{item.time}</p>
            <div className="h-8 w-px bg-[#D5C9BC]" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[#2D2B28] truncate">{item.service}</p>
              <p className="text-xs text-[#8C7B6E]">{item.barber} · {item.cliente}</p>
            </div>
            <StatusChip status={item.status} />
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  function load(next = filter) {
    const query = next === 'all' ? '' : `?estado=${next}`
    api(`/admin/citas${query}`).then(setAppointments).catch((err) => setError(err.message))
  }

  useEffect(() => { load('all') }, [])

  async function updateStatus(id, estado) {
    setError('')
    try {
      await api(`/admin/citas/${id}`, { method: 'PATCH', body: { estado } })
      load(filter)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="font-serif text-2xl font-bold text-[#2D2B28] mb-5">Gestión de citas</h1>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <div className="flex gap-2 flex-wrap mb-5">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((item) => (
          <button key={item} type="button" onClick={() => { setFilter(item); load(item) }} className={`rounded-full px-3 py-1 text-xs font-medium border ${filter === item ? 'bg-[#6E84A0] text-white border-[#6E84A0]' : 'bg-white border-[#D5C9BC] text-[#8C7B6E]'}`}>
            {item === 'all' ? 'Todas' : STATUS_LABELS[item]}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {appointments.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-serif font-semibold text-sm text-[#2D2B28]">{item.service}</p>
                <p className="text-xs text-[#8C7B6E]">{item.cliente} · {item.barber}</p>
                <p className="text-xs text-[#8C7B6E]">{formatDate(item.date)} {item.time}</p>
                <p className="text-xs font-semibold text-[#C66F5B] mt-0.5">{formatPrice(item.price)}</p>
              </div>
              <StatusChip status={item.status} />
            </div>
            {item.status === 'pending' && (
              <div className="flex gap-2">
                <Btn className="text-xs px-3 py-1.5" onClick={() => updateStatus(item.id, 'confirmed')}>Confirmar</Btn>
                <Btn variant="outline" className="text-xs px-3 py-1.5 text-[#C66F5B] border-[#C66F5B]/30" onClick={() => updateStatus(item.id, 'cancelled')}>Cancelar</Btn>
              </div>
            )}
            {item.status === 'confirmed' && (
              <Btn variant="accent" className="text-xs px-3 py-1.5" onClick={() => updateStatus(item.id, 'completed')}>Marcar completada</Btn>
            )}
          </Card>
        ))}
        {appointments.length === 0 && <p className="text-sm text-[#8C7B6E]">No hay citas en este filtro.</p>}
      </div>
    </div>
  )
}

export function AdminServices() {
  const [services, setServices] = useState([])
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')

  function load() {
    api('/admin/servicios').then(setServices).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  async function save(event) {
    event.preventDefault()
    setError('')
    try {
      const body = { nombre: form.name, precio: Number(form.price), duracion: Number(form.duration) }
      if (form.id) await api(`/admin/servicios/${form.id}`, { method: 'PUT', body })
      else await api('/admin/servicios', { method: 'POST', body })
      setForm(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(id) {
    setError('')
    try {
      await api(`/admin/servicios/${id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-2xl font-bold text-[#2D2B28]">Servicios</h1>
        <Btn variant="accent" className="text-xs" onClick={() => setForm({ name: '', price: '', duration: '' })}>+ Nuevo</Btn>
      </div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {form && (
        <Card className="p-5 mb-5">
          <h3 className="font-semibold text-sm text-[#2D2B28] mb-4">{form.id ? 'Editar servicio' : 'Nuevo servicio'}</h3>
          <form className="flex flex-col gap-3" onSubmit={save}>
            <Input label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Corte clásico" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Precio (COP)" value={form.price} onChange={(value) => setForm({ ...form, price: value })} placeholder="25000" />
              <Input label="Duración (min)" value={form.duration} onChange={(value) => setForm({ ...form, duration: value })} placeholder="30" />
            </div>
            <div className="flex gap-2"><Btn type="submit" className="text-xs">Guardar</Btn><Btn variant="ghost" className="text-xs" onClick={() => setForm(null)}>Cancelar</Btn></div>
          </form>
        </Card>
      )}
      <div className="flex flex-col gap-3">
        {services.map((service) => (
          <Card key={service.id} className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm text-[#2D2B28]">{service.name}</p>
              <p className="text-xs text-[#8C7B6E]">{service.duration} min · <span className="text-[#C66F5B] font-semibold">{formatPrice(service.price)}</span></p>
            </div>
            <div className="flex gap-2">
              <Btn variant="outline" className="text-xs px-2.5 py-1.5" onClick={() => setForm({ id: service.id, name: service.name, price: String(service.price), duration: String(service.duration) })}>Editar</Btn>
              <Btn variant="outline" className="text-xs px-2.5 py-1.5 border-[#C66F5B]/30 text-[#C66F5B]" onClick={() => remove(service.id)}>Eliminar</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AdminBarbers() {
  const [barbers, setBarbers] = useState([])
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')

  function load() {
    api('/admin/barberos').then(setBarbers).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  async function save(event) {
    event.preventDefault()
    setError('')
    try {
      const body = { nombre: form.nombre, apellido: form.apellido, especialidad: form.specialty }
      if (form.id) await api(`/admin/barberos/${form.id}`, { method: 'PUT', body })
      else await api('/admin/barberos', { method: 'POST', body })
      setForm(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(id) {
    try {
      await api(`/admin/barberos/${id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-2xl font-bold text-[#2D2B28]">Barberos</h1>
        <Btn variant="accent" className="text-xs" onClick={() => setForm({ nombre: '', apellido: '', specialty: '' })}>+ Registrar</Btn>
      </div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {form && (
        <Card className="p-5 mb-5">
          <form className="flex flex-col gap-3" onSubmit={save}>
            <Input label="Nombre" value={form.nombre} onChange={(value) => setForm({ ...form, nombre: value })} />
            <Input label="Apellido" value={form.apellido} onChange={(value) => setForm({ ...form, apellido: value })} />
            <Input label="Especialidad" value={form.specialty} onChange={(value) => setForm({ ...form, specialty: value })} placeholder="Degradados" />
            <div className="flex gap-2"><Btn type="submit" className="text-xs">Guardar</Btn><Btn variant="ghost" className="text-xs" onClick={() => setForm(null)}>Cancelar</Btn></div>
          </form>
        </Card>
      )}
      <div className="flex flex-col gap-3">
        {barbers.map((barber) => (
          <Card key={barber.id} className="p-4 flex items-center gap-4">
            {barber.photo
              ? <img src={barber.photo} alt="" className="w-14 h-14 rounded-full object-cover bg-[#D5C9BC]" />
              : <div className="w-14 h-14 rounded-full bg-[#6E84A0] text-white flex items-center justify-center font-serif font-bold">{barber.nombre.slice(0, 1)}</div>}
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#2D2B28]">{barber.name}</p>
              <p className="text-xs text-[#8C7B6E]">{barber.specialty}</p>
            </div>
            <div className="flex gap-2">
              <Btn variant="outline" className="text-xs px-2.5 py-1.5" onClick={() => setForm({ id: barber.id, nombre: barber.nombre, apellido: barber.apellido, specialty: barber.specialty })}>Editar</Btn>
              <Btn variant="outline" className="text-xs px-2.5 py-1.5 border-[#C66F5B]/30 text-[#C66F5B]" onClick={() => remove(barber.id)}>Eliminar</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AdminSettings() {
  const [form, setForm] = useState({ nombre: '', direccion: '', telefono: '', correo: '', descripcion: '' })
  const [hours, setHours] = useState(() => WEEK.map((day) => ({ ...day, abierto: day.dia !== 0, inicio: '08:00', fin: '20:00' })))
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    api('/admin/barberia').then((shop) => {
      if (!shop) return
      setForm({
        nombre: shop.name,
        direccion: shop.address,
        telefono: shop.phone,
        correo: shop.email,
        descripcion: shop.description,
      })
      setHours(WEEK.map((day) => {
        const found = shop.hours.find((item) => item.day === day.dia)
        return found
          ? { ...day, abierto: true, inicio: found.start, fin: found.end }
          : { ...day, abierto: false, inicio: '08:00', fin: '20:00' }
      }))
    }).catch((err) => setError(err.message))
  }, [])

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function saveShop(event) {
    event.preventDefault()
    setError('')
    setOk('')
    try {
      await api('/admin/barberia', { method: 'PUT', body: form })
      setOk('Datos de la barbería guardados')
    } catch (err) {
      setError(err.message)
    }
  }

  async function saveHours() {
    setError('')
    setOk('')
    try {
      await api('/admin/horarios', {
        method: 'PUT',
        body: {
          dias: hours.map((day) => ({ dia: day.dia, abierto: day.abierto, inicio: day.inicio, fin: day.fin })),
        },
      })
      setOk('Horarios actualizados para todos los barberos')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <h1 className="font-serif text-2xl font-bold text-[#2D2B28] mb-5">Configuración</h1>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {ok && <div className="mb-4"><Alert tone="ok">{ok}</Alert></div>}
      <Card className="p-5 mb-5">
        <h2 className="font-serif font-semibold text-[#2D2B28] mb-4">Información de la barbería</h2>
        <form className="flex flex-col gap-4" onSubmit={saveShop}>
          <Input label="Nombre del negocio" value={form.nombre} onChange={(value) => setField('nombre', value)} />
          <Input label="Dirección" value={form.direccion} onChange={(value) => setField('direccion', value)} />
          <Input label="Teléfono" value={form.telefono} onChange={(value) => setField('telefono', value)} />
          <Input label="Correo electrónico" type="email" value={form.correo} onChange={(value) => setField('correo', value)} />
          <Input label="Descripción" value={form.descripcion} onChange={(value) => setField('descripcion', value)} />
          <Btn type="submit">Guardar cambios</Btn>
        </form>
      </Card>
      <Card className="p-5">
        <h2 className="font-serif font-semibold text-[#2D2B28] mb-4">Horarios de atención</h2>
        <div className="flex flex-col gap-3">
          {hours.map((day, index) => (
            <div key={day.label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm text-[#2D2B28] flex items-center gap-2 w-36">
                <input
                  type="checkbox"
                  checked={day.abierto}
                  onChange={(e) => setHours((current) => current.map((item, i) => i === index ? { ...item, abierto: e.target.checked } : item))}
                />
                {day.label}
              </label>
              {day.abierto ? (
                <div className="flex items-center gap-2 text-sm text-[#8C7B6E]">
                  <input type="time" value={day.inicio} onChange={(e) => setHours((current) => current.map((item, i) => i === index ? { ...item, inicio: e.target.value } : item))} className="rounded border border-[#D5C9BC] px-2 py-1 text-xs bg-white" />
                  <span>–</span>
                  <input type="time" value={day.fin} onChange={(e) => setHours((current) => current.map((item, i) => i === index ? { ...item, fin: e.target.value } : item))} className="rounded border border-[#D5C9BC] px-2 py-1 text-xs bg-white" />
                </div>
              ) : <span className="text-xs text-[#C66F5B] font-medium">Cerrado</span>}
            </div>
          ))}
        </div>
        <Btn className="mt-5" onClick={saveHours}>Guardar horarios</Btn>
      </Card>
    </div>
  )
}
