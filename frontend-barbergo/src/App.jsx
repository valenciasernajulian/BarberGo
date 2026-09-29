import { useEffect, useState } from 'react'
import { api, clearToken, getToken } from './lib/api'
import { Brand } from './components/ui'
import PWABadge from './PWABadge.jsx'
import { ForgotScreen, LoginScreen, RegisterScreen } from './screens/auth'
import {
  AppointmentDetailScreen,
  AppointmentsScreen,
  BarbershopScreen,
  BookScreen,
  ClientLayout,
  HomeScreen,
  ProfileScreen,
} from './screens/client'
import {
  AdminAppointments,
  AdminBarbers,
  AdminDashboard,
  AdminLayout,
  AdminServices,
  AdminSettings,
} from './screens/admin'

const CLIENT = ['home', 'barbershop', 'book', 'appointments', 'appointment-detail', 'profile']
const ADMIN = ['admin-dashboard', 'admin-appointments', 'admin-services', 'admin-barbers', 'admin-settings']

function readScreen() {
  return window.location.hash.replace('#', '') || 'login'
}

export default function App() {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)
  const [screen, setScreen] = useState(readScreen)
  const [shop, setShop] = useState(null)
  const [booking, setBooking] = useState(null)
  const [appointmentId, setAppointmentId] = useState(null)

  useEffect(() => {
    const onHash = () => setScreen(readScreen())
    window.addEventListener('hashchange', onHash)
    if (!getToken()) {
      setBooting(false)
      return () => window.removeEventListener('hashchange', onHash)
    }
    api('/auth/me')
      .then((me) => {
        setUser(me)
        const current = readScreen()
        if (current === 'login' || current === 'register' || current === 'forgot' || !current) {
          window.location.hash = me.rol === 'administrador' ? 'admin-dashboard' : 'home'
        }
      })
      .catch(() => clearToken())
      .finally(() => setBooting(false))
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function nav(next) {
    window.location.hash = next
  }

  function logout() {
    clearToken()
    setUser(null)
    setShop(null)
    setBooking(null)
    nav('login')
  }

  function enter(nextUser) {
    setUser(nextUser)
    nav(nextUser.rol === 'administrador' ? 'admin-dashboard' : 'home')
  }

  if (booting) {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center">
        <Brand />
      </div>
    )
  }

  if (!user) {
    if (screen === 'register') return <RegisterScreen onSuccess={(nextUser) => {
      setUser(nextUser)
      nav(nextUser.rol === 'administrador' ? 'admin-settings' : 'home')
    }} />
    if (screen === 'forgot') return <ForgotScreen />
    return <LoginScreen onSuccess={enter} />
  }

  if (user.rol === 'administrador') {
    const current = ADMIN.includes(screen) ? screen : 'admin-dashboard'
    return (
      <AdminLayout screen={current} onNav={nav} onLogout={logout}>
        {current === 'admin-dashboard' && <AdminDashboard onNav={nav} />}
        {current === 'admin-appointments' && <AdminAppointments />}
        {current === 'admin-services' && <AdminServices />}
        {current === 'admin-barbers' && <AdminBarbers />}
        {current === 'admin-settings' && <AdminSettings />}
        <PWABadge />
      </AdminLayout>
    )
  }

  const current = CLIENT.includes(screen) ? screen : 'home'

  return (
    <ClientLayout screen={current === 'appointment-detail' ? 'appointments' : current === 'barbershop' || current === 'book' ? 'home' : current} onNav={nav} onLogout={logout}>
      {current === 'home' && (
        <HomeScreen
          user={user}
          onOpenShop={(item) => {
            setShop(item)
            nav('barbershop')
          }}
        />
      )}
      {current === 'barbershop' && shop && (
        <BarbershopScreen
          shopId={shop.id}
          onNav={nav}
          onBook={(fullShop, service, barber) => {
            setShop(fullShop)
            setBooking({ service, barber })
            nav('book')
          }}
        />
      )}
      {current === 'barbershop' && !shop && <HomeScreen user={user} onOpenShop={(item) => { setShop(item); nav('barbershop') }} />}
      {current === 'book' && shop && booking?.service && (
        <BookScreen shop={shop} service={booking.service} barber={booking.barber} onNav={nav} onDone={() => nav('appointments')} />
      )}
      {current === 'book' && (!shop || !booking?.service) && (
        <div className="p-8 max-w-lg mx-auto">
          <p className="text-sm text-[#8C7B6E] mb-4">Elige una barbería y un servicio para agendar.</p>
          <button type="button" onClick={() => nav('home')} className="text-sm text-[#6E84A0]">Volver al inicio</button>
        </div>
      )}
      {current === 'appointments' && (
        <AppointmentsScreen onNav={nav} onSelect={(item) => { setAppointmentId(item.id); nav('appointment-detail') }} />
      )}
      {current === 'appointment-detail' && appointmentId && (
        <AppointmentDetailScreen appointmentId={appointmentId} onNav={nav} />
      )}
      {current === 'profile' && <ProfileScreen user={user} onNav={nav} onLogout={logout} onUser={setUser} />}
      <PWABadge />
    </ClientLayout>
  )
}
