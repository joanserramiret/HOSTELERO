import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { cajaAbierta, abrirCaja, cerrarCaja } from '../../store/operations'
import { eur, totalLineas } from '../../utils/money'

export default function CajaView() {
  const caja = useLiveQuery(() => cajaAbierta(), [])
  const tickets = useLiveQuery(() => db.tickets.where('estado').equals('cobrado').toArray(), [])
  const [saldoIni, setSaldoIni] = useState('100')
  const [contado, setContado] = useState('')

  const delTurno = (tickets ?? []).filter(t => caja && t.cajaId === caja.id)
  const efectivo = delTurno.reduce((s, t) => s + (t.cobradoEfectivo || 0), 0)
  const tarjeta = delTurno.reduce((s, t) => s + (t.cobradoTarjeta || 0), 0)
  const totalVentas = efectivo + tarjeta
  const enCaja = (caja?.saldoInicial || 0) + efectivo

  return (
    <div className="main">
      <div className="topbar"><h1>Caja</h1></div>
      <div className="content">
        {!caja ? (
          <div className="card" style={{ maxWidth: 420, padding: 24 }}>
            <div className="section-title">Abrir caja</div>
            <div className="field"><label>Saldo inicial en cajón (€)</label>
              <input type="number" value={saldoIni} onChange={e => setSaldoIni(e.target.value)} /></div>
            <button className="btn green lg" onClick={() => abrirCaja(parseFloat(saldoIni) || 0)}>Abrir caja</button>
          </div>
        ) : (
          <>
            <div className="stat-grid" style={{ marginBottom: 18 }}>
              <div className="card stat"><div className="l">Ventas turno</div><div className="v">{eur(totalVentas)}</div></div>
              <div className="card stat"><div className="l">💵 Efectivo</div><div className="v">{eur(efectivo)}</div></div>
              <div className="card stat"><div className="l">💳 Tarjeta</div><div className="v">{eur(tarjeta)}</div></div>
              <div className="card stat"><div className="l">Tickets</div><div className="v">{delTurno.length}</div></div>
              <div className="card stat"><div className="l">Esperado en cajón</div><div className="v">{eur(enCaja)}</div></div>
            </div>
            <div className="card" style={{ maxWidth: 460, padding: 24 }}>
              <div className="section-title">Cierre / arqueo de caja</div>
              <p style={{ color: 'var(--text-soft)', fontSize: 13 }}>
                Saldo inicial {eur(caja.saldoInicial)} + efectivo {eur(efectivo)} = <b>{eur(enCaja)}</b> esperado.
              </p>
              <div className="field"><label>Efectivo contado (€)</label>
                <input type="number" value={contado} onChange={e => setContado(e.target.value)} /></div>
              {contado && (
                <p>Descuadre: <b style={{ color: parseFloat(contado) - enCaja === 0 ? 'var(--green)' : 'var(--red)' }}>
                  {eur(parseFloat(contado) - enCaja)}</b></p>
              )}
              <button className="btn red lg" onClick={async () => {
                if (confirm('¿Cerrar caja del turno?')) await cerrarCaja(parseFloat(contado) || enCaja)
              }}>Cerrar caja</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
