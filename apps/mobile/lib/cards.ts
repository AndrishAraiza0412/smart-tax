/**
 * Tarjetas de PRUEBA para el prototipo: solo se aceptan números de prueba
 * públicos (no tarjetas reales) y solo se guardan marca y últimos 4 dígitos.
 */
const TEST_NUMBERS = new Set([
  "4242424242424242", "4000056655665556", "5555555555554444", "2223003122003222", "5200828282828210", "378282246310005",
]);

export function luhn(num: string): boolean {
  let sum = 0;
  for (let i = 0; i < num.length; i++) {
    let d = Number(num[num.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return num.length > 0 && sum % 10 === 0;
}

export function brandOf(num: string): string {
  if (/^4/.test(num)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  return "Tarjeta";
}

export type CardInput = { number: string; expiry: string; holder: string };
export type SavedCard = { brand: string; last4: string; holder: string; exp_month: number; exp_year: number };

/** Valida una tarjeta de prueba y devuelve solo lo que se guarda. Lanza con mensaje para la UI. */
export function parseTestCard({ number, expiry, holder }: CardInput, now = new Date()): SavedCard {
  const num = number.replace(/\D/g, "");
  if (!luhn(num)) throw new Error("Número de tarjeta inválido.");
  if (!TEST_NUMBERS.has(num)) throw new Error("Usa una tarjeta de prueba, por ejemplo 4242 4242 4242 4242.");
  const m = /^(\d{2})\/(\d{2})$/.exec(expiry.trim());
  const month = Number(m?.[1]);
  const year = 2000 + Number(m?.[2]);
  if (!m || month < 1 || month > 12) throw new Error("Vencimiento inválido, usa MM/AA.");
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) throw new Error("La tarjeta está vencida.");
  if (!holder.trim()) throw new Error("Escribe el nombre del titular.");
  return { brand: brandOf(num), last4: num.slice(-4), holder: holder.trim().toUpperCase(), exp_month: month, exp_year: year };
}

const MERCHANTS: readonly { descripcion: string; categoria: string; min: number; max: number }[] = [
  { descripcion: "Oxxo", categoria: "Alimentación", min: 40, max: 250 },
  { descripcion: "Walmart Supercenter", categoria: "Alimentación", min: 300, max: 2200 },
  { descripcion: "Uber", categoria: "Transporte", min: 60, max: 380 },
  { descripcion: "Gasolinera Pemex", categoria: "Transporte", min: 400, max: 1200 },
  { descripcion: "Office Depot", categoria: "Oficina", min: 150, max: 3500 },
  { descripcion: "Telmex Internet", categoria: "Servicios", min: 389, max: 699 },
  { descripcion: "CFE Luz", categoria: "Servicios", min: 250, max: 1800 },
  { descripcion: "Farmacia San Pablo", categoria: "Salud", min: 90, max: 1500 },
  { descripcion: "Cinépolis", categoria: "Entretenimiento", min: 120, max: 600 },
  { descripcion: "Udemy", categoria: "Educación", min: 199, max: 899 },
];

/** Compra ficticia aleatoria para simular un cargo a la tarjeta. */
export function randomPurchase(rand = Math.random): { descripcion: string; categoria: string; monto: number } {
  const m = MERCHANTS[Math.floor(rand() * MERCHANTS.length)] ?? MERCHANTS[0]!;
  const monto = Math.round((m.min + rand() * (m.max - m.min)) * 100) / 100;
  return { descripcion: m.descripcion, categoria: m.categoria, monto };
}
