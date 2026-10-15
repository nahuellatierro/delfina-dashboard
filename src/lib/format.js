const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function formatDate(iso) {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${d.getDate()} ${MESES[d.getMonth()]}, ${h}:${m}`;
}

export function formatDia(isoDate) {
  const [, m, d] = String(isoDate).slice(0, 10).split("-").map(Number);
  return `${d} ${MESES[m - 1]}`;
}

export function formatHora(date) {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

export function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

export function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// "hace 3 h", "hace 2 días"
export function haceCuanto(iso, ahora = new Date()) {
  const min = Math.max(0, Math.round((ahora - new Date(iso)) / 60000));
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}
