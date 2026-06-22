import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { eur, totalLineas } from '../../utils/money'

export default function InformesView() {
  const tickets = useLiveQuery(() => db.tickets.where('estado').equals('cobrado').toArray(), [])
  const productos = useLiveQuery(() => db.productos.toArray(), [])
  if (!tickets || !productos) return <div className="main"><div className="content">Cargando…</div></div>

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const deHoy = tickets.filter(t => (t.closedAt || 0) >= hoy.getTime())
  const ventaHoy = deHoy.reduce((s, t) => s + totalLineas(t.lineas), 0)
  const ticketMedio = deHoy.length ? ventaHoy / deHoy.length : 0

  // ranking productos
  const rank = new Map<string, { nombre: string; uds: number; imp: number }>()
  for (const t of deHoy) for (const l of t.lineas) {
    const r = rank.get(l.productoId) ?? { nombre: l.nombre, uds: 0, imp: 0 }
    r.uds += l.cantidad; r.imp += l.precio * l.cantidad; rank.set(l.productoId, r)
  }
  const top = [...rank.values()].sort((a, b) => b.imp - a.imp).slice(0, 10)

  // ventas por hora
  const porHora = new Array(24).fill(0)
  for (const t of deHoy) porHora[new Date(t.closedAt!).getHours()] += totalLineas(t.lineas)
  const maxHora = Math.max(1, ...porHora)

  return (
    <div className="main">
      <div className="topbar"><h1>Informes</h1><div className="sub">Hoy · {hoy.toLocaleDateString('es-ES')}</div></div>
      <div className="content">
        <div className="stat-grid" style={{ marginBottom: 18 }}>
          <div className="card stat"><div className="l">Ventas hoy</div><div className="v">{eur(ventaHoy)}</div></div>
          <div className="card stat"><div className="l">Tickets</div><div className="v">{deHoy.length}</div></div>
          <div className="card stat"><div className="l">Ticket medio</div><div className="v">{eur(ticketMedio)}</div></div>
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div className="section-title">Ventas por hora</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
            {porHora.map((v, h) => (
              <div key={h} style={{ flex: 1, textAlign: 'center' }}>
                <div title={eur(v)} style={{ background: v ? 'var(--primary)' : 'var(--line)', height: `${(v / maxHora) * 110}px`, borderRadius: 4, minHeight: 2 }} />
                <div style={{ fontSize: 9, color: 'var(--text-soft)' }}>{h}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="section-title" style={{ padding: '16px 18px 0' }}>Productos más vendidos (hoy)</div>
          <table className="tbl">
            <thead><tr><th>#</th><th>Producto</th><th>Uds</th><th>Importe</th></tr></thead>
            <tbody>
              {top.length === 0 && <tr><td colSpan={4} style={{ color: 'var(--text-soft)' }}>Sin ventas todavía hoy.</td></tr>}
              {top.map((r, i) => (
                <tr key={i}><td>{i + 1}</td><td><b>{r.nombre}</b></td><td>{r.uds}</td><td>{eur(r.imp)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
