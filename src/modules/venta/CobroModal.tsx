import { useState } from 'react'
import { cobrarTicket } from '../../store/operations'
import { eur, round2 } from '../../utils/money'

export default function CobroModal({
  total, ticketId, onDone, onCancel
}: { total: number; ticketId: string; onDone: () => void; onCancel: () => void }) {
  const [metodo, setMetodo] = useState<'efectivo' | 'tarjeta'>('efectivo')
  const [entregado, setEntregado] = useState<string>('')
  const ent = parseFloat(entregado || '0') || 0
  const cambio = round2(ent - total)

  function press(k: string) {
    if (k === 'C') return setEntregado('')
    if (k === '⌫') return setEntregado(s => s.slice(0, -1))
    setEntregado(s => (s + k).replace(/^0+(\d)/, '$1'))
  }
  const rapidos = [total, Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, 20, 50]
    .filter((v, i, a) => a.indexOf(v) === i && v >= total)

  async function confirmar() {
    if (metodo === 'efectivo') {
      await cobrarTicket(ticketId, { metodo: 'efectivo', efectivo: total, tarjeta: 0 })
    } else {
      await cobrarTicket(ticketId, { metodo: 'tarjeta', efectivo: 0, tarjeta: total })
    }
    onDone()
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Cobrar {eur(total)}</h2>
        <div className="body">
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={'tab' + (metodo === 'efectivo' ? ' active' : '')} onClick={() => setMetodo('efectivo')}>💵 Efectivo</button>
            <button className={'tab' + (metodo === 'tarjeta' ? ' active' : '')} onClick={() => setMetodo('tarjeta')}>💳 Tarjeta</button>
          </div>

          {metodo === 'efectivo' ? (
            <>
              <div className="pay-amount">{entregado ? eur(ent) : '—'}</div>
              <div className="inline" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--text-soft)' }}>Cambio</span>
                <b style={{ fontSize: 22, color: cambio >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {eur(Math.max(0, cambio))}
                </b>
              </div>
              <div className="inline" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                {rapidos.map(v => (
                  <button key={v} className="btn ghost" onClick={() => setEntregado(String(v))}>{eur(v)}</button>
                ))}
              </div>
              <div className="keypad">
                {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(k => (
                  <button key={k} onClick={() => press(k)}>{k}</button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: 48 }}>💳</div>
              <p style={{ color: 'var(--text-soft)' }}>Inserta o acerca la tarjeta en el datáfono.</p>
              <div className="pay-amount">{eur(total)}</div>
            </div>
          )}
        </div>
        <div className="foot">
          <button className="btn ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn green" onClick={confirmar}
            disabled={metodo === 'efectivo' && ent < total}>
            Confirmar cobro
          </button>
        </div>
      </div>
    </div>
  )
}
