import { db, uid } from './db'
import type { Categoria, Producto, Sala, Mesa } from '../types'

export async function ensureSeed() {
  const ya = await db.config.get('seeded')
  if (ya) return

  const cats: Categoria[] = [
    { id: 'c-bebidas', nombre: 'Bebidas', color: '#2563eb', orden: 1 },
    { id: 'c-cafes', nombre: 'Cafés', color: '#92400e', orden: 2 },
    { id: 'c-tapas', nombre: 'Tapas', color: '#dc2626', orden: 3 },
    { id: 'c-raciones', nombre: 'Raciones', color: '#ea580c', orden: 4 },
    { id: 'c-postres', nombre: 'Postres', color: '#db2777', orden: 5 }
  ]

  const prod = (nombre: string, categoriaId: string, precio: number, stock = 100): Producto => ({
    id: uid(), nombre, categoriaId, precio, stock, controlStock: true, activo: true
  })

  const productos: Producto[] = [
    prod('Caña', 'c-bebidas', 1.8, 500),
    prod('Doble', 'c-bebidas', 2.6, 500),
    prod('Copa Vino', 'c-bebidas', 2.2, 300),
    prod('Refresco', 'c-bebidas', 2.0, 400),
    prod('Agua 50cl', 'c-bebidas', 1.5, 400),
    prod('Café Solo', 'c-cafes', 1.3, 999),
    prod('Café con Leche', 'c-cafes', 1.5, 999),
    prod('Cortado', 'c-cafes', 1.4, 999),
    prod('Carajillo', 'c-cafes', 2.0, 999),
    prod('Patatas Bravas', 'c-tapas', 4.5, 80),
    prod('Croquetas (6)', 'c-tapas', 6.0, 60),
    prod('Tortilla', 'c-tapas', 3.5, 40),
    prod('Ensaladilla', 'c-tapas', 4.0, 50),
    prod('Jamón Ibérico', 'c-raciones', 14.0, 30),
    prod('Pulpo a la Gallega', 'c-raciones', 16.0, 25),
    prod('Tabla de Quesos', 'c-raciones', 12.0, 30),
    prod('Calamares', 'c-raciones', 11.0, 35),
    prod('Tarta de Queso', 'c-postres', 4.5, 20),
    prod('Flan Casero', 'c-postres', 3.5, 20),
    prod('Café Bombón', 'c-postres', 2.0, 999)
  ]

  const salas: Sala[] = [
    { id: 's-interior', nombre: 'Interior', orden: 1 },
    { id: 's-terraza', nombre: 'Terraza', orden: 2 },
    { id: 's-barra', nombre: 'Barra', orden: 3 }
  ]

  const mesas: Mesa[] = []
  // Interior 3x3
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      mesas.push({ id: uid(), salaId: 's-interior', nombre: `M${r * 3 + c + 1}`, x: c, y: r, plazas: 4, estado: 'libre' })
  // Terraza
  for (let i = 0; i < 6; i++)
    mesas.push({ id: uid(), salaId: 's-terraza', nombre: `T${i + 1}`, x: i % 3, y: Math.floor(i / 3), plazas: 2, estado: 'libre' })
  // Barra
  for (let i = 0; i < 4; i++)
    mesas.push({ id: uid(), salaId: 's-barra', nombre: `B${i + 1}`, x: i, y: 0, plazas: 1, estado: 'libre' })

  await db.transaction('rw', db.categorias, db.productos, db.salas, db.mesas, db.config, async () => {
    await db.categorias.bulkPut(cats)
    await db.productos.bulkPut(productos)
    await db.salas.bulkPut(salas)
    await db.mesas.bulkPut(mesas)
    await db.config.put({ key: 'seeded', value: true })
    await db.config.put({ key: 'numeroTicket', value: 1 })
  })
}
