import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Reserva } from '../../types'
import { crearReserva, cambiarEstadoReserva } from '../../store/operations'

const HOY = new Date().toISOString().slice(0, 10)
const ESTADOS: Record<string, { label: string; bg: string; fg: string }> = {
  pendiente: { label: 'Pendiente', bg: '#fef9c3', fg: '#854d0e' },
  sentada: { label: 'Sentada', bg: '#dcfce7', fg: '#15803d' },
  cancelada: { label: 'Cancelada', bg: '#fee2e2', fg: '#b91c1c' },
  no_show: { label: 'No-show', bg: '#e2e8f0', fg: '#475569' }
}

export default function ReservasView() {
  const reservas = useLiveQuery(() => db.reservas.toArray(), [])
  const [fecha, setFecha] = useState(HOY)
  const [nueva, setNueva] = useState(false)

  if (!reservas) return <div className="main"><div className="content">Cargando…</div></div>
  const delDia = reservas.filter(r => r.fecha === fecha).sort((a, b) => a.hora.localeCompare(b.hora))
  const pax = delDia.filter(r => r.estado !== 'cancelada').reduce((s, r) => s + r.personas, 0)

  return (
    <div className="main">
      <div className="topbar">
        <h1>Reservas</h1>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)' }} />
        <div className="right">
          <span className="sub">{delDia.length} reservas · {pax} comensales</span>
          <button className="btn primary" onClick={() => setNueva(true)}>+ Nueva reserva</button>
        </div>
      </div>
      <div className="content">
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Hora</th><th>Cliente</th><th>Pax</th><th>Teléfono</th><th>Origen</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {delDia.length === 0 && <tr><td colSpan={7} style={{ color: 'var(--text-soft)' }}>No hay reservas este día.</td></tr>}
              {delDia.map(r => {
                const e = ESTADOS[r.estado]
                return (
                  <tr key={r.id}>
                    <td><b>{r.hora}</b></td>
                    <td>{r.nombre}{r.notas && <div style={{ fontSize: 11, color: 'var(--text-soft)' }}>{r.notas}</div>}</td>
                    <td>{r.personas}</td>
                    <td>{r.telefono || '—'}</td>
                    <td>{r.origen || 'Local'}</td>
                    <td><span className="badge" style={{ background: e.bg, color: e.fg }}>{e.label}</span></td>
                    <td className="row-actions">
                      {r.estado === 'pendiente' && <button className="btn green" onClick={() => cambiarEstadoReserva(r.id, 'sentada')}>Sentar</button>}
                      {r.estado === 'pendiente' && <button className="btn ghost" onClick={() => cambiarEstadoReserva(r.id, 'cancelada')}>Cancelar</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'var(--text-soft)', fontSize: 13, marginTop: 14 }}>
          🔌 Integraciones de reservas (TheFork, Google Reserve, web propia) se conectan vía el módulo de integraciones — ver README.
        </p>
      </div>
      {nueva && <ReservaModal fecha={fecha} onClose={() => setNueva(false)} />}
    </div>
  )
}

function ReservaModal({ fecha, onClose }: { fecha: string; onClose: () => void }) {
  const [nombre, setNombre] = useState('')
  const [hora, setHora] = useState('21:00')
  const [personas, setPersonas] = useState('2')
  const [telefono, setTelefono] = useState('')
  const [origen, setOrigen] = useState('Local')
  const [notas, setNotas] = useState('')

  async function guardar() {
    if (!nombre) return
    await crearReserva({ fecha, hora, nombre, personas: parseInt(personas) || 1, telefono, origen, notas })
    onClose()
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nueva reserva</h2>
        <div className="body">
          <div className="field"><label>Cliente</label><input value={nombre} onChange={e => setNombre(e.target.value)} /></div>
          <div className="inline">
            <div className="field" style={{ flex: 1 }}><label>Hora</label><input type="time" value={hora} onChange={e => setHora(e.target.value)} /></div>
            <div className="field" style={{ flex: 1 }}><label>Comensales</label><input type="number" value={personas} onChange={e => setPersonas(e.target.value)} /></div>
          </div>
          <div className="field"><label>Teléfono</label><input value={telefono} onChange={e => setTelefono(e.target.value)} /></div>
          <div className="field"><label>Origen</label>
            <select value={origen} onChange={e => setOrigen(e.target.value)}>
              <option>Local</option><option>Teléfono</option><option>TheFork</option><option>Google</option><option>Web propia</option>
            </select>
          </div>
          <div className="field"><label>Notas</label><input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Alergias, trona, cumpleaños…" /></div>
        </div>
        <div className="foot">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={guardar}>Guardar reserva</button>
        </div>
      </div>
    </div>
  )
}
