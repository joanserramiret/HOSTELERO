import Dexie, { type Table } from 'dexie'
import type { Categoria, Producto, Sala, Mesa, Ticket, Caja, Reserva } from '../types'

export class HosteleroDB extends Dexie {
  categorias!: Table<Categoria, string>
  productos!: Table<Producto, string>
  salas!: Table<Sala, string>
  mesas!: Table<Mesa, string>
  tickets!: Table<Ticket, string>
  cajas!: Table<Caja, string>
  reservas!: Table<Reserva, string>
  config!: Table<{ key: string; value: unknown }, string>

  constructor() {
    super('hostelero')
    this.version(1).stores({
      categorias: 'id, orden',
      productos: 'id, categoriaId, nombre, activo',
      salas: 'id, orden',
      mesas: 'id, salaId, estado',
      tickets: 'id, numero, estado, mesaId, cajaId, createdAt',
      cajas: 'id, estado, abiertaAt',
      reservas: 'id, fecha, estado',
      config: 'key'
    })
  }
}

export const db = new HosteleroDB()

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
