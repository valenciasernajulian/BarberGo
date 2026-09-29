import { useState } from 'react'
import { api, setToken } from '../lib/api'
import { Alert, Brand, Btn, Card, CheckIcon, Input } from '../components/ui'

export function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } })
      setToken(data.token)
      onSuccess(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7F2] flex">
      <div className="hidden md:flex md:w-[380px] lg:w-[420px] flex-col justify-between bg-[#EFE5DA] p-8 lg:p-10">
        <div>
          <div className="mb-12"><Brand /></div>
          <h1 className="font-serif text-3xl font-bold text-[#2D2B28] leading-tight mb-4">
            Tu barbería de confianza,<br />a un clic de distancia.
          </h1>
          <p className="text-[#8C7B6E] text-sm leading-relaxed">
            Agenda citas con los mejores barberos de tu ciudad. Sin esperas, sin llamadas. Solo tú y tu estilo.
          </p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=280&fit=crop&auto=format"
          alt="Interior de una barbería"
          className="rounded-[10px] w-full object-cover h-44 shadow-sm"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8"><Brand /></div>
          <h2 className="font-serif text-2xl font-bold text-[#2D2B28] mb-1">Bienvenido de vuelta</h2>
          <p className="text-[#8C7B6E] text-sm mb-8">Inicia sesión para gestionar tus citas.</p>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            {error && <Alert>{error}</Alert>}
            <Input label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" autoComplete="email" />
            <Input label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Tu contraseña" autoComplete="current-password" />
            <Btn type="submit" className="w-full justify-center py-3" disabled={loading}>
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </Btn>
          </form>
          <div className="mt-4 flex flex-col gap-2 text-sm text-center">
            <button type="button" onClick={() => { window.location.hash = 'forgot' }} className="text-[#6E84A0] hover:underline">
              ¿Olvidaste tu contraseña?
            </button>
            <p className="text-[#8C7B6E]">
              ¿No tienes cuenta?{' '}
              <button type="button" onClick={() => { window.location.hash = 'register' }} className="text-[#C66F5B] font-semibold hover:underline">
                Regístrate
              </button>
            </p>
          </div>
          <p className="text-xs text-[#8C7B6E] text-center mt-8 leading-relaxed">
            Cliente: cliente@barberia.co · Cliente1234<br />
            Admin: admin@barberia.co · Admin1234
          </p>
        </div>
      </div>
    </div>
  )
}

export function RegisterScreen({ onSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('cliente')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    const parts = name.trim().split(/\s+/)
    if (parts.length < 2) {
      setError('Escribe nombre y apellido')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: {
          nombre: parts[0],
          apellido: parts.slice(1).join(' '),
          email,
          password,
          rol: role,
        },
      })
      setToken(data.token)
      onSuccess(data.user.rol === 'administrador' ? { ...data.user, _settings: true } : data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8"><Brand /></div>
        <h2 className="font-serif text-2xl font-bold text-[#2D2B28] mb-1">Crea tu cuenta</h2>
        <p className="text-[#8C7B6E] text-sm mb-6">Únete a BarberGo.</p>
        <div className="flex rounded-[8px] border border-[#D5C9BC] overflow-hidden mb-6">
          {[
            ['cliente', 'Soy cliente'],
            ['administrador', 'Soy administrador'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${role === value ? 'bg-[#6E84A0] text-white' : 'bg-white text-[#8C7B6E] hover:bg-[#EFE5DA]'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          {error && <Alert>{error}</Alert>}
          <Input label="Nombre completo" value={name} onChange={setName} placeholder="Juan García" autoComplete="name" />
          <Input label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" autoComplete="email" />
          <Input label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
          <Input label="Confirmar contraseña" type="password" value={confirm} onChange={setConfirm} placeholder="Repite tu contraseña" autoComplete="new-password" />
          <Btn type="submit" variant="accent" className="w-full justify-center py-3 mt-2" disabled={loading}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </Btn>
        </form>
        <p className="text-sm text-[#8C7B6E] text-center mt-4">
          ¿Ya tienes cuenta?{' '}
          <button type="button" onClick={() => { window.location.hash = 'login' }} className="text-[#6E84A0] font-semibold hover:underline">Inicia sesión</button>
        </p>
      </div>
    </div>
  )
}

export function ForgotScreen() {
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [demoCode, setDemoCode] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)

  async function send(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/forgot', { method: 'POST', body: { email } })
      setSent(true)
      setDemoCode(data.codigo || '')
      if (!data.codigo) setError('Si el correo no existe, no hay código para mostrar.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function reset(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/reset', { method: 'POST', body: { email, codigo, password } })
      setOk(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <button type="button" onClick={() => { window.location.hash = 'login' }} className="flex items-center gap-1.5 text-[#8C7B6E] text-sm mb-8 hover:text-[#2D2B28]">
          ← Volver al inicio de sesión
        </button>
        <h2 className="font-serif text-2xl font-bold text-[#2D2B28] mb-1">Recuperar contraseña</h2>
        <p className="text-[#8C7B6E] text-sm mb-8">Ingresa tu correo para generar un código y elegir una contraseña nueva.</p>
        {error && <div className="mb-4"><Alert>{error}</Alert></div>}
        {ok && (
          <Card className="p-6 text-center mb-4">
            <p className="font-serif font-semibold text-[#2D2B28] mb-1">Listo</p>
            <p className="text-sm text-[#8C7B6E] mb-4">{ok}</p>
            <Btn className="w-full justify-center" onClick={() => { window.location.hash = 'login' }}>Ir a iniciar sesión</Btn>
          </Card>
        )}
        {!ok && sent && (
          <>
            <Card className="p-6 text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <CheckIcon className="text-emerald-600" />
              </div>
              <p className="font-serif font-semibold text-[#2D2B28] mb-1">Código listo</p>
              <p className="text-sm text-[#8C7B6E]">Esta versión no envía correos. Usa el código para restablecer la contraseña.</p>
              {demoCode && <p className="mt-3 font-serif text-2xl font-bold text-[#2D2B28] tracking-widest">{demoCode}</p>}
            </Card>
            <form className="flex flex-col gap-4" onSubmit={reset}>
              <Input label="Código" value={codigo} onChange={setCodigo} placeholder="6 dígitos" />
              <Input label="Nueva contraseña" type="password" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
              <Btn type="submit" className="w-full justify-center py-3" disabled={loading}>Guardar contraseña</Btn>
            </form>
          </>
        )}
        {!ok && !sent && (
          <form className="flex flex-col gap-4" onSubmit={send}>
            <Input label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" autoComplete="email" />
            <Btn type="submit" className="w-full justify-center py-3" disabled={loading}>Generar código</Btn>
          </form>
        )}
      </div>
    </div>
  )
}
