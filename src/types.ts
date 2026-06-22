export type ID = string

export interface Categoria {
  id: ID
  nombre: string
  color: string
  orden: number
}

export interface Producto {
  id: ID
  nombre: string
  categoriaId: ID
  precio: number
  stock: number
  controlStock: boolean
  activo: boolean
}

export interface Sala {
  id: ID
  nombre: string
  orden: number
}

export type EstadoMesa = 'libre' | 'ocupada' | 'reservada'

export interface Mesa {
  id: ID
  salaId: ID
  nombre: string
  x: number
  y: number
  plazas: number
  estado: EstadoMesa
  ticketId?: ID
}

export type EstadoTicket = 'abierto' | 'cobrado' | 'anulado'
export type MetodoPago = 'efectivo' | 'tarjeta' | 'mixto'

export interface LineaTicket {
  productoId: ID
  nombre: string
  precio: number
  cantidad: number
  nota?: string
}

export interface Ticket {
  id: ID
  numero: number
  mesaId?: ID
  mesaNombre?: string
  estado: EstadoTicket
  lineas: LineaTicket[]
  createdAt: number
  closedAt?: number
  metodoPago?: MetodoPago
  cobradoEfectivo?: number
  cobradoTarjeta?: number
  cajaId?: ID
  comensales?: number
}

export type EstadoCaja = 'abierta' | 'cerrada'

export interface Caja {
  id: ID
  abiertaAt: number
  cerradaAt?: number
  saldoInicial: number
  saldoFinalContado?: number
  estado: EstadoCaja
  usuario?: string
}

export type EstadoReserva = 'pendiente' | 'sentada' | 'cancelada' | 'no_show'

export interface Reserva {
  id: ID
  fecha: string
  hora: string
  nombre: string
  personas: number
  telefono?: string
  mesaId?: ID
  origen?: string
  notas?: string
  estado: EstadoReserva
  createdAt: number
}

export const PRECIO = (n: number) => Math.round(n * 100) / 100
