import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Producto } from '../../types'
import {
  addProducto, cambiarCantidad, quitarLinea, cobrarTicket, anularTicket
} from '../../store/operations'
import { eur, totalLineas, desgloseIVA } from '../../utils/money'
import CobroModal from './CobroModal'

export default function VentaPanel({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const ticket = useLiveQuery(() => db.tickets.get(ticketId), [ticketId])
  const categorias = useLiveQuery(() => db.categorias.orderBy('orden').toArray(), [])
  const productos = useLiveQuery(() => db.productos.where('activo').equals(1 as any).toArray().catch(() => db.productos.toArray()), [])
  const todosProd = useLiveQuery(() => db.productos.toArray(), [])
  const [catSel, setCatSel] = useState<string>('')
  const [cobrar, setCobrar] = useState(false)

  if (!ticket || !categorias || !todosProd) return <div className="main"><div className="content">Cargando…</div></div>

  const catActual = catSel || categorias[0]?.id
  const prods = todosProd.filter(p => p.categoriaId === catActual && p.activo)
  const total = totalLineas(ticket.lineas)
  const iva = desgloseIVA(total)

  async function add(p: Producto) {
    if (p.controlStock && p.stock <= 0) return
    await addProducto(ticketId, p)
  }
  async function onCobrado() {
    setCobrar(false)
    onClose()
  }

  return (
    <div className="main">
      <div className="topbar">
        <button className="btn ghost" onClick={onClose}>← Sala</button>
        <h1>{ticket.mesaNombre || 'Ticket'} <span className="sub">#{ticket.numero}</span></h1>
        <div className="right">
          <button className="btn red" onClick={async () => {
            if (confirm('¿Anular este ticket?')) { await anularTicket(ticketId); onClose() }
          }}>Anular</button>
        </div>
      </div>
      <div className="content">
        <div className="venta">
          {/* Carta */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="cat-bar">
              {categorias.map(c => (
                <button key={c.id} className={'cat-chip' + (c.id === catActual ? ' active' : '')}
                  style={{ background: c.color }} onClick={() => setCatSel(c.id)}>{c.nombre}</button>
              ))}
            </div>
            <div className="prod-grid">
              {prods.map(p => {
                const sin = p.controlStock && p.stock <= 0
                return (
                  <button key={p.id} className={'prod' + (sin ? ' sinstock' : '')} onClick={() => add(p)}>
                    <span className="pn">{p.nombre}</span>
                    <span className="pp">{eur(p.precio)}</span>
                    {p.controlStock && <span className="ps">{sin ? 'Sin stock' : `Stock ${p.stock}`}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ticket */}
          <div className="card ticket">
            <div className="thead">
              <b>Comanda</b> · {ticket.lineas.reduce((s, l) => s + l.cantidad, 0)} uds
            </div>
            <div className="lineas">
              {ticket.lineas.length === 0 && <div className="empty">Toca productos para añadirlos a la comanda</div>}
              {ticket.lineas.map((l, i) => (
                <div className="linea" key={i}>
                  <div className="ln">
                    <b>{l.nombre}</b>
                    <span>{eur(l.precio)}</span>
                  </div>
                  <button className="qtybtn" onClick={() => cambiarCantidad(ticketId, i, -1)}>−</button>
                  <span className="qty">{l.cantidad}</span>
                  <button className="qtybtn" onClick={() => cambiarCantidad(ticketId, i, 1)}>+</button>
                  <span className="imp">{eur(l.precio * l.cantidad)}</span>
                </div>
              ))}
            </div>
            <div className="tfoot">
              <div style={{ fontSize: 12, color: 'var(--text-soft)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Base {eur(iva.base)}</span><span>IVA 10% {eur(iva.cuota)}</span>
              </div>
              <div className="total-row">
                <span>TOTAL</span>
                <span className="big">{eur(total)}</span>
              </div>
              <button className="btn green lg" style={{ width: '100%' }}
                disabled={ticket.lineas.length === 0} onClick={() => setCobrar(true)}>
                💶 Cobrar {eur(total)}
              </button>
            </div>
          </div>
        </div>
      </div>
      {cobrar && <CobroModal total={total} ticketId={ticketId} onDone={onCobrado} onCancel={() => setCobrar(false)} />}
    </div>
  )
}
