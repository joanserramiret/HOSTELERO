import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, uid } from '../../db/db'
import type { Producto } from '../../types'
import { eur } from '../../utils/money'

export default function ProductosView() {
  const categorias = useLiveQuery(() => db.categorias.orderBy('orden').toArray(), [])
  const productos = useLiveQuery(() => db.productos.toArray(), [])
  const [edit, setEdit] = useState<Producto | null>(null)
  const [nuevo, setNuevo] = useState(false)

  if (!categorias || !productos) return <div className="main"><div className="content">Cargando…</div></div>
  const catName = (id: string) => categorias.find(c => c.id === id)?.nombre ?? '—'
  const bajoStock = productos.filter(p => p.controlStock && p.stock <= 5)

  return (
    <div className="main">
      <div className="topbar">
        <h1>Productos y stock</h1>
        <div className="right">
          <button className="btn primary" onClick={() => setNuevo(true)}>+ Nuevo producto</button>
        </div>
      </div>
      <div className="content">
        {bajoStock.length > 0 && (
          <div className="card" style={{ padding: 14, marginBottom: 16, borderLeft: '4px solid var(--amber)' }}>
            <b>⚠️ Stock bajo:</b> {bajoStock.map(p => `${p.nombre} (${p.stock})`).join(' · ')}
          </div>
        )}
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id}>
                  <td><b>{p.nombre}</b></td>
                  <td>{catName(p.categoriaId)}</td>
                  <td>{eur(p.precio)}</td>
                  <td>{p.controlStock ? <span style={{ color: p.stock <= 5 ? 'var(--red)' : 'inherit', fontWeight: 700 }}>{p.stock}</span> : '∞'}</td>
                  <td><span className="badge" style={{ background: p.activo ? '#dcfce7' : '#fee2e2', color: p.activo ? 'var(--green-d)' : 'var(--red)' }}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="row-actions">
                    <button className="btn ghost" onClick={() => setEdit(p)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {(edit || nuevo) && (
        <ProductoModal
          producto={edit}
          categorias={categorias}
          onClose={() => { setEdit(null); setNuevo(false) }}
        />
      )}
    </div>
  )
}

function ProductoModal({ producto, categorias, onClose }: any) {
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [precio, setPrecio] = useState(String(producto?.precio ?? ''))
  const [stock, setStock] = useState(String(producto?.stock ?? '0'))
  const [categoriaId, setCategoriaId] = useState(producto?.categoriaId ?? categorias[0]?.id)
  const [controlStock, setControlStock] = useState(producto?.controlStock ?? true)
  const [activo, setActivo] = useState(producto?.activo ?? true)

  async function guardar() {
    const data: Producto = {
      id: producto?.id ?? uid(), nombre, categoriaId,
      precio: parseFloat(precio) || 0, stock: parseFloat(stock) || 0,
      controlStock, activo
    }
    await db.productos.put(data)
    onClose()
  }
  async function borrar() {
    if (producto && confirm('¿Eliminar producto?')) { await db.productos.delete(producto.id); onClose() }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="body">
          <div className="field"><label>Nombre</label><input value={nombre} onChange={e => setNombre(e.target.value)} /></div>
          <div className="inline">
            <div className="field" style={{ flex: 1 }}><label>Precio (€)</label><input type="number" step="0.10" value={precio} onChange={e => setPrecio(e.target.value)} /></div>
            <div className="field" style={{ flex: 1 }}><label>Stock</label><input type="number" value={stock} onChange={e => setStock(e.target.value)} /></div>
          </div>
          <div className="field"><label>Categoría</label>
            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
              {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="inline">
            <label className="inline"><input type="checkbox" checked={controlStock} onChange={e => setControlStock(e.target.checked)} /> Controlar stock</label>
            <label className="inline"><input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} /> Activo</label>
          </div>
        </div>
        <div className="foot">
          {producto && <button className="btn red" onClick={borrar} style={{ marginRight: 'auto' }}>Eliminar</button>}
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={guardar}>Guardar</button>
        </div>
      </div>
    </div>
  )
}
