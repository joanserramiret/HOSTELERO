import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Mesa, Ticket } from '../../types'
import { abrirTicketEnMesa, nuevoTicketBarra } from '../../store/operations'
import { eur, totalLineas } from '../../utils/money'
import VentaPanel from '../venta/VentaView'

export default function SalaView() {
  const salas = useLiveQuery(() => db.salas.orderBy('orden').toArray(), [])
  const mesas = useLiveQuery(() => db.mesas.toArray(), [])
  const ticketsAbiertos = useLiveQuery(() => db.tickets.where('estado').equals('abierto').toArray(), [])
  const [salaId, setSalaId] = useState<string>('')
  const [ticketActivo, setTicketActivo] = useState<Ticket | null>(null)

  if (!salas || !mesas) return <div className="main"><div className="content">Cargando…</div></div>

  const salaSel = salaId || salas[0]?.id
  const mesasSala = mesas.filter(m => m.salaId === salaSel)
  const tmap = new Map((ticketsAbiertos ?? []).map(t => [t.id, t]))

  async function abrirMesa(m: Mesa) {
    const t = await abrirTicketEnMesa(m)
    setTicketActivo(t)
  }
  async function barraRapida() {
    const t = await nuevoTicketBarra()
    setTicketActivo(t)
  }

  if (ticketActivo) {
    return <VentaPanel ticketId={ticketActivo.id} onClose={() => setTicketActivo(null)} />
  }

  return (
    <div className="main">
      <div className="topbar">
        <h1>Sala</h1>
        <div className="tabs">
          {salas.map(s => (
            <button key={s.id} className={'tab' + (s.id === salaSel ? ' active' : '')}
              onClick={() => setSalaId(s.id)}>{s.nombre}</button>
          ))}
        </div>
        <div className="right">
          <button className="btn primary" onClick={barraRapida}>+ Venta rápida</button>
        </div>
      </div>
      <div className="content">
        <div className="mesas-grid">
          {mesasSala.map(m => {
            const t = m.ticketId ? tmap.get(m.ticketId) : undefined
            const tot = t ? totalLineas(t.lineas) : 0
            const mins = t ? Math.floor((Date.now() - t.createdAt) / 60000) : 0
            return (
              <button key={m.id} className={'mesa ' + m.estado} onClick={() => abrirMesa(m)}>
                <span className="dot" />
                <span className="nombre">{m.nombre}</span>
                {m.estado === 'libre'
                  ? <span className="plazas">{m.plazas} pax</span>
                  : <span className="tot">{eur(tot)}</span>}
                {t && <span className="time">⏱ {mins} min</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
