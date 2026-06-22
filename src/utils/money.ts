export const eur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0)

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function totalLineas(lineas: { precio: number; cantidad: number }[]) {
  return round2(lineas.reduce((s, l) => s + l.precio * l.cantidad, 0))
}

// IVA incluido (hostelería España: 10% comida/bebida no alcohólica, simplificado al 10%)
export function desgloseIVA(total: number, tipo = 0.1) {
  const base = round2(total / (1 + tipo))
  const cuota = round2(total - base)
  return { base, cuota, tipo }
}
