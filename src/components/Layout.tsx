import { NavLink, Outlet } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { cajaAbierta } from '../store/operations'

const NAV = [
  { to: '/sala', ico: '🍽️', label: 'Sala' },
  { to: '/productos', ico: '📦', label: 'Productos' },
  { to: '/reservas', ico: '📅', label: 'Reservas' },
  { to: '/caja', ico: '💶', label: 'Caja' },
  { to: '/informes', ico: '📊', label: 'Informes' }
]

export default function Layout() {
  const caja = useLiveQuery(() => cajaAbierta(), [])
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">HOSTELERO<small>TPV</small></div>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
            <span className="ico">{n.ico}</span>
            {n.label}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className={'caja-pill ' + (caja ? 'on' : 'off')}>
          {caja ? 'CAJA\nABIERTA' : 'CAJA\nCERRADA'}
        </div>
      </aside>
      <Outlet />
    </div>
  )
}
