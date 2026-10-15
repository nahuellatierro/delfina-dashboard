import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

import { C } from "../../lib/theme";
import { fmt, formatDate, haceCuanto } from "../../lib/format";
import { KPI, Card, ChartTooltip, SinDatos } from "../ui";

// Mismos nombres que el reporte de Telegram (docs/workflows/reportes/armar-mensaje.js)
const CAT = {
  cierre_horario: "Gym cerrado / horario", instalaciones: "Instalaciones", limpieza: "Limpieza",
  atencion_personal: "Atención", convivencia_seguridad: "Convivencia / seguridad", cobros_promos: "Cobros / promos",
  clases_profes: "Clases / profes", delfina: "Info de Delfina", otra: "Otros", objeto_perdido: "Objeto perdido",
};
const CAT_COLORS = [C.blue, C.cyan, C.purple, C.slate, C.yellow, C.orange];

const catLabel = (c) => CAT[c] || c || "Sin categoría";
const canalLabel = (c) => (c === "instagram" ? "Instagram" : "WhatsApp");

function QuejaAbierta({ q }) {
  const urgente = q.urgencia === "inmediata";
  return (
    <li className={`rounded-xl border px-4 py-3.5 ${urgente ? "border-red-500/30 bg-red-500/[0.06]" : "border-white/[0.08] bg-white/[0.02]"}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        {urgente && <span className="rounded-md border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 font-semibold text-red-300">🚨 Urgente</span>}
        <span className="font-mono text-white/55 tabular-nums">#Q{q.id}</span>
        <span className="text-white/70">{q.tipo === "objeto_perdido" ? "🧳 Objeto perdido" : catLabel(q.categoria)}</span>
        <span className="ml-auto text-white/50 tabular-nums" title={formatDate(q.created_at)}>{haceCuanto(q.created_at)}</span>
      </div>
      <p className="mt-2 text-sm text-white/85 text-pretty">{q.resumen || "Sin resumen"}</p>
      {q.cita && <p className="mt-1 text-xs italic text-white/55 text-pretty">“{q.cita}”</p>}
      <p className="mt-2 text-[11px] text-white/50">
        {q.nombre || "Sin nombre"}
        {q.contacto ? ` · ${q.contacto}` : ""}
        {` · ${canalLabel(q.canal)}`}
        {q.repeticiones > 1 ? ` · lo dijo ${q.repeticiones} veces` : ""}
      </p>
    </li>
  );
}

function QuejasTab({ m }) {
  const abiertas = m.abiertas || [];
  const urgentesAbiertas = abiertas.filter(q => q.urgencia === "inmediata").length;
  const porCategoria = (m.por_categoria || []).map(c => ({ name: catLabel(c.categoria), count: c.n }));
  const resueltas = m.resueltas || [];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <KPI label="Abiertas" value={fmt(m.abiertas_total)} sub="sin resolver (todas las fechas)" tone={m.abiertas_total ? "text-yellow-300" : undefined} />
        <KPI label="Urgentes abiertas" value={fmt(urgentesAbiertas)} sub="gym cerrado, riesgo o no pueden entrenar" tone={urgentesAbiertas ? "text-red-400" : undefined} />
        <KPI label="Quejas nuevas" value={fmt(m.quejas)} sub="en el período" />
        <KPI label="Objetos perdidos" value={fmt(m.objetos)} sub="en el período" />
        <KPI label="Resolución" value={m.horas_resolucion == null ? "—" : `${String(m.horas_resolucion).replace(".", ",")} h`} sub="promedio hasta marcarla resuelta" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
        <Card title={`Quejas abiertas (${fmt(m.abiertas_total)})`}>
          <p className="mb-4 -mt-2 text-xs text-white/50 text-pretty">
            Se resuelven desde el grupo GYMBOX QUEJAS de Telegram, con los botones de cada aviso. Acá solo se ven.
          </p>
          {abiertas.length ? (
            <ul className="flex flex-col gap-3">
              {abiertas.map(q => <QuejaAbierta key={q.id} q={q} />)}
            </ul>
          ) : <SinDatos alto="h-[120px]">No hay quejas abiertas ✅</SinDatos>}
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Quejas por tema (período)">
            {porCategoria.length ? (
              <ResponsiveContainer width="100%" height={Math.max(120, porCategoria.length * 34)}>
                <BarChart data={porCategoria} layout="vertical" barSize={16} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Quejas" radius={[0, 6, 6, 0]}>
                    {porCategoria.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} opacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <SinDatos alto="h-[120px]">Sin quejas en el período</SinDatos>}
          </Card>

          <Card title="Últimas cerradas">
            {resueltas.length ? (
              <ul className="flex flex-col divide-y divide-white/[0.06]">
                {resueltas.map(q => (
                  <li key={q.id} className="py-2.5 first:pt-0">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-mono text-white/55 tabular-nums">#Q{q.id}</span>
                      <span className="text-white/70">{q.tipo === "objeto_perdido" ? "🧳 Objeto perdido" : catLabel(q.categoria)}</span>
                      <span className={`ml-auto ${q.feedback === "no_era" ? "text-white/50" : "text-emerald-400"}`}>
                        {q.feedback === "no_era" ? "No era queja" : "✅ Resuelta"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/70 truncate">{q.resumen}</p>
                    <p className="mt-0.5 text-[11px] text-white/45">
                      {q.cerrada_por ? `${q.cerrada_por} · ` : ""}{formatDate(q.cerrada_at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : <SinDatos alto="h-[80px]">Todavía no se cerró ninguna</SinDatos>}
          </Card>

          <Card title="Detector (período)">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-white/55">Urgentes</dt><dd className="font-semibold text-white/85 tabular-nums">{fmt(m.urgentes)}</dd></div>
              <div><dt className="text-xs text-white/55">Confirmadas como queja</dt><dd className="font-semibold text-white/85 tabular-nums">{fmt(m.era_queja)}</dd></div>
              <div><dt className="text-xs text-white/55">Marcadas “no era queja”</dt><dd className="font-semibold text-white/85 tabular-nums">{fmt(m.no_era)}</dd></div>
              <div>
                <dt className="text-xs text-white/55">Por canal</dt>
                <dd className="font-semibold text-white/85 tabular-nums">
                  {(m.por_canal || []).length ? m.por_canal.map(c => `${canalLabel(c.canal)} ${c.n}`).join(" · ") : "—"}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

export default QuejasTab;
