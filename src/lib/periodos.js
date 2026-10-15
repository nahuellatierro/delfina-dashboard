// Períodos compartidos por las tres pestañas. Se calculan en la hora del navegador (Argentina).
// "Ayer" y "Semana pasada" (lunes a domingo) coinciden con los reportes diario y semanal de Telegram.
export const PERIODOS = [
  { key: "hoy", label: "Hoy" },
  { key: "ayer", label: "Ayer" },
  { key: "7d", label: "7 días" },
  { key: "semana_pasada", label: "Semana pasada" },
  { key: "mes", label: "Este mes" },
  { key: "todos", label: "Todos" },
];

// Devuelve { desde, hasta } (Date o null). hasta es exclusivo.
export function rangoDe(key, ahora = new Date()) {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const dia = 86400000;
  switch (key) {
    case "hoy": return { desde: hoy, hasta: null };
    case "ayer": return { desde: new Date(hoy.getTime() - dia), hasta: hoy };
    case "7d": return { desde: new Date(ahora.getTime() - 7 * dia), hasta: null };
    case "semana_pasada": {
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7)); // lunes de esta semana
      const lunesAnterior = new Date(lunes);
      lunesAnterior.setDate(lunes.getDate() - 7);
      return { desde: lunesAnterior, hasta: lunes };
    }
    case "mes": return { desde: new Date(ahora.getFullYear(), ahora.getMonth(), 1), hasta: null };
    default: return { desde: null, hasta: null };
  }
}

export function enRango(iso, { desde, hasta }) {
  const t = new Date(iso);
  return (!desde || t >= desde) && (!hasta || t < hasta);
}
