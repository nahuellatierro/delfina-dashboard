import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

import { C } from "../../lib/theme";
import { fmt, formatDia } from "../../lib/format";
import { KPI, Card, ChartTooltip, Nota, SinDatos } from "../ui";

const CANAL = { whatsapp: "WhatsApp", instagram: "Instagram", total: "Total" };
const seg = (v) => (v == null ? "—" : `${String(v).replace(".", ",")} s`);

function DelfinaTab({ m, clasesPrueba }) {
  const canales = m.por_canal || [];
  const total = canales.find(c => c.canal === "total") || {};
  const porDia = (m.por_dia || []).map(d => ({ ...d, dia: formatDia(d.dia) }));
  const pico = m.hora_pico;

  return (
    <>
      {m.trabados > 0 && (
        <Nota tone="alerta">
          ⚠️ {fmt(m.trabados)} mensaje(s) de los últimos 7 días siguen sin procesar después de 10 minutos. Revisar n8n.
        </Nota>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="Mensajes" value={fmt(m.recibidos)} sub="recibidos" accent />
        <KPI label="Leads" value={fmt(m.leads)} sub={`${fmt(m.nuevos)} nuevos`} />
        <KPI label="Respuestas" value={fmt(total.enviadas)} sub="enviadas por Delfina" />
        <KPI label="Fallidas" value={fmt(total.fallidas)} sub="no llegaron al lead" tone={total.fallidas ? "text-red-400" : undefined} />
        <KPI label="Demora" value={seg(total.demora_mediana_s)} sub={total.demora_p90_s != null ? `9 de cada 10 en menos de ${seg(total.demora_p90_s)}` : "hasta que sale la respuesta"} />
        <KPI label="Clases de prueba" value={fmt(clasesPrueba)} sub="confirmadas en el período" accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Mensajes y respuestas por día">
          {porDia.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={porDia} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                <XAxis dataKey="dia" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }} />
                <Bar dataKey="recibidos" name="Mensajes" fill={C.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="respuestas" name="Respuestas" fill={C.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <SinDatos alto="h-[230px]">Sin mensajes en el período</SinDatos>}
        </Card>

        <Card title="Por canal">
          {canales.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[1.5px] text-white/50 font-mono">
                    <th scope="col" className="pb-2 font-normal">Canal</th>
                    <th scope="col" className="pb-2 font-normal text-right">Respuestas</th>
                    <th scope="col" className="pb-2 font-normal text-right">Fallidas</th>
                    <th scope="col" className="pb-2 font-normal text-right">Emergencia</th>
                    <th scope="col" className="pb-2 font-normal text-right">Burbujas</th>
                    <th scope="col" className="pb-2 font-normal text-right">Demora</th>
                    <th scope="col" className="pb-2 font-normal text-right">Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {canales.map(c => (
                    <tr key={c.canal} className={`border-t border-white/[0.06] ${c.canal === "total" ? "font-semibold text-white/90" : "text-white/75"}`}>
                      <th scope="row" className="py-2 text-left font-medium">{CANAL[c.canal] || c.canal}</th>
                      <td className="py-2 text-right">{fmt(c.enviadas)}</td>
                      <td className={`py-2 text-right ${c.fallidas ? "text-red-400" : ""}`}>{fmt(c.fallidas)}</td>
                      <td className="py-2 text-right">{fmt(c.fallbacks)}</td>
                      <td className="py-2 text-right">{c.enviadas ? (c.burbujas / c.enviadas).toFixed(1).replace(".", ",") : "—"}</td>
                      <td className="py-2 text-right">{seg(c.demora_mediana_s)}</td>
                      <td className="py-2 text-right">{fmt(c.leads)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-white/45 text-pretty">
                Emergencia: el agente falló y salió el mensaje fijo de disculpa. Burbujas: promedio de mensajes por respuesta.
                Demora: mediana desde que llega el mensaje hasta que sale la respuesta.
              </p>
            </div>
          ) : <SinDatos alto="h-[180px]">Sin respuestas registradas en el período</SinDatos>}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Card title="Hora pico">
          <span className="text-2xl font-bold text-white/90 tabular-nums">{pico ? `${pico.hora} a ${pico.hora + 1} h` : "—"}</span>
          <span className="block mt-1 text-xs text-white/50 tabular-nums">{pico ? `${fmt(pico.n)} mensajes en esa franja` : "Sin mensajes"}</span>
        </Card>
        <Card title="Audios">
          <span className="text-2xl font-bold text-white/90 tabular-nums">{fmt(m.audios)}</span>
          <span className="block mt-1 text-xs text-white/50">transcriptos por Delfina</span>
        </Card>
        <Card title="Mensajes trabados">
          <span className={`text-2xl font-bold tabular-nums ${m.trabados ? "text-yellow-300" : "text-white/90"}`}>{fmt(m.trabados)}</span>
          <span className="block mt-1 text-xs text-white/50">sin procesar hace más de 10 min (últimos 7 días)</span>
        </Card>
      </div>
    </>
  );
}

export default DelfinaTab;
