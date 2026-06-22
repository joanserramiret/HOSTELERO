import { db, uid } from '../db/db'
import type { Mesa, Producto, Ticket, LineaTicket, MetodoPago, Caja, Reserva } from '../types'
import { round2, totalLineas } from '../utils/money'

async function siguienteNumeroTicket(): Promise<number> {
  const row = await db.config.get('numeroTicket')
  const n = (row?.value as number) ?? 1
  await db.config.put({ key: 'numeroTicket', value: n + 1 })
  return n
}

export async function cajaAbierta(): Promise<Caja | undefined> {
  return db.cajas.where('estado').equals('abierta').first()
}

export async function abrirCaja(saldoInicial: number, usuario = 'Cajero'): Promise<Caja> {
  const existente = await cajaAbierta()
  if (existente) return existente
  const caja: Caja = { id: uid(), abiertaAt: Date.now(), saldoInicial, estado: 'abierta', usuario }
  await db.cajas.put(caja)
  return caja
}

export async function cerrarCaja(saldoFinalContado: number): Promise<void> {
  const caja = await cajaAbierta()
  if (!caja) return
  await db.cajas.update(caja.id, { estado: 'cerrada', cerradaAt: Date.now(), saldoFinalContado })
}

export async function abrirTicketEnMesa(mesa: Mesa): Promise<Ticket> {
  if (mesa.ticketId) {
    const t = await db.tickets.get(mesa.ticketId)
    if (t && t.estado === 'abierto') return t
  }
  const numero = await siguienteNumeroTicket()
  const caja = await cajaAbierta()
  const ticket: Ticket = {
    id: uid(), numero, mesaId: mesa.id, mesaNombre: mesa.nombre,
    estado: 'abierto', lineas: [], createdAt: Date.now(), cajaId: caja?.id
  }
  await db.transaction('rw', db.tickets, db.mesas, async () => {
    await db.tickets.put(ticket)
    await db.mesas.update(mesa.id, { estado: 'ocupada', ticketId: ticket.id })
  })
  return ticket
}

export async function nuevoTicketBarra(): Promise<Ticket> {
  const numero = await siguienteNumeroTicket()
  const caja = await cajaAbierta()
  const ticket: Ticket = {
    id: uid(), numero, estado: 'abierto', lineas: [],
    createdAt: Date.now(), cajaId: caja?.id, mesaNombre: 'Barra'
  }
  await db.tickets.put(ticket)
  return ticket
}

export async function addProducto(ticketId: string, p: Producto, cantidad = 1): Promise<void> {
  await db.transaction('rw', db.tickets, async () => {
    const t = await db.tickets.get(ticketId)
    if (!t || t.estado !== 'abierto') return
    const linea = t.lineas.find(l => l.productoId === p.id && !l.nota)
    if (linea) linea.cantidad += cantidad
    else t.lineas.push({ productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad })
    await db.tickets.put(t)
  })
}

export async function cambiarCantidad(ticketId: string, idx: number, delta: number): Promise<void> {
  await db.transaction('rw', db.tickets, async () => {
    const t = await db.tickets.get(ticketId)
    if (!t) return
    const l = t.lineas[idx]
    if (!l) return
    l.cantidad += delta
    if (l.cantidad <= 0) t.lineas.splice(idx, 1)
    await db.tickets.put(t)
  })
}

export async function quitarLinea(ticketId: string, idx: number): Promise<void> {
  await db.transaction('rw', db.tickets, async () => {
    const t = await db.tickets.get(ticketId)
    if (!t) return
    t.lineas.splice(idx, 1)
    await db.tickets.put(t)
  })
}

export interface CobroInput {
  metodo: MetodoPago
  efectivo?: number
  tarjeta?: number
}

export async function cobrarTicket(ticketId: string, cobro: CobroInput): Promise<void> {
  await db.transaction('rw', db.tickets, db.mesas, db.productos, async () => {
    const t = await db.tickets.get(ticketId)
    if (!t || t.estado !== 'abierto') return
    const total = totalLineas(t.lineas)
    // descontar stock
    for (const l of t.lineas) {
      const p = await db.productos.get(l.productoId)
      if (p && p.controlStock) {
        await db.productos.update(p.id, { stock: round2(p.stock - l.cantidad) })
      }
    }
    await db.tickets.update(t.id, {
      estado: 'cobrado',
      closedAt: Date.now(),
      metodoPago: cobro.metodo,
      cobradoEfectivo: cobro.efectivo ?? (cobro.metodo === 'efectivo' ? total : 0),
      cobradoTarjeta: cobro.tarjeta ?? (cobro.metodo === 'tarjeta' ? total : 0)
    })
    if (t.mesaId) {
      await db.mesas.update(t.mesaId, { estado: 'libre', ticketId: undefined })
    }
  })
}

export async function anularTicket(ticketId: string): Promise<void> {
  await db.transaction('rw', db.tickets, db.mesas, async () => {
    const t = await db.tickets.get(ticketId)
    if (!t) return
    await db.tickets.update(t.id, { estado: 'anulado', closedAt: Date.now() })
    if (t.mesaId) await db.mesas.update(t.mesaId, { estado: 'libre', ticketId: undefined })
  })
}

// mover/unir mesas
export async function moverTicket(ticketId: string, destino: Mesa): Promise<void> {
  await db.transaction('rw', db.tickets, db.mesas, async () => {
    const t = await db.tickets.get(ticketId)
    if (!t) return
    if (t.mesaId) await db.mesas.update(t.mesaId, { estado: 'libre', ticketId: undefined })
    await db.tickets.update(t.id, { mesaId: destino.id, mesaNombre: destino.nombre })
    await db.mesas.update(destino.id, { estado: 'ocupada', ticketId: t.id })
  })
}

// Reservas
export async function crearReserva(r: Omit<Reserva, 'id' | 'createdAt' | 'estado'> & { estado?: Reserva['estado'] }): Promise<void> {
  await db.reservas.put({ ...r, id: uid(), createdAt: Date.now(), estado: r.estado ?? 'pendiente' })
}

export async function cambiarEstadoReserva(id: string, estado: Reserva['estado']): Promise<void> {
  await db.reservas.update(id, { estado })
}
