import { useState, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

import { C, glass, btnSecundario } from "../../lib/theme";
import { formatDate, fmt, normalizar } from "../../lib/format";
import { KPI, Card, ChartTooltip, FilterPill, FilterGroup, Badge, SinDatos } from "../ui";

const ESTADOS =["Calificado", "En proceso", "Sin respuesta", "No califica"];
const FEED_PAGE = 25;
const ACT_COLORS = [C.accent, C.blue, C.orange, C.purple, C.cyan];
const DERIV_COLORS = [C.blue, C.cyan, C.purple, C.slate, C.yellow];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function countBy(arr, key) {
  const map = {};
  arr.forEach(item => {
    const val = item[key];
    if (val) map[val] = (map[val] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function canalLabel(raw) {
  return raw === "instagram" ? "Instagram" : "WhatsApp";
}

function origenLabel(raw) {
  return raw === "Pauta publicitaria" ? "📣 Pauta" : "🌿 Orgánico";
}

function origenColor(raw) {
  return raw === "Pauta publicitaria" ? "text-orange-400/70" : "text-emerald-400/70";
}

// leads: ya filtrados por el período (por última interacción)
function LeadsTab({ leads }) {
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [origenFilter, setOrigenFilter] = useState("todos");
  const [canalFilter, setCanalFilter] = useState("todos");
  const [feedLimit, setFeedLimit] = useState(FEED_PAGE);
  const [search, setSearch] = useState("");
  const feedRef = useRef(null);

  // Al cambiar un filtro, el feed vuelve a mostrar la primera página.
  const withFeedReset = (setter) => (value) => { setter(value); setFeedLimit(FEED_PAGE); };

  // "Para recontactar": filtra los que no escriben hace más de 7 días y lleva al feed.
  const verRecontactar = () => {
    setEstadoFilter("Sin respuesta");
    setSearch("");
    setFeedLimit(FEED_PAGE);
    feedRef.current?.scrollIntoView({ block: "start" });
  };

  // ── Datos filtrados ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = leads;
    if (estadoFilter !== "todos") result = result.filter(r => r.estado_calificacion === estadoFilter);
    if (origenFilter !== "todos") {
      const map = { pauta: "Pauta publicitaria", organico: "Orgánico" };
      result = result.filter(r => r.origen_lead === map[origenFilter]);
    }
    if (canalFilter !== "todos") result = result.filter(r => (r.canal || "whatsapp") === canalFilter);
    return [...result].sort((a, b) => new Date(b.fecha_interaccion) - new Date(a.fecha_interaccion));
  }, [leads, estadoFilter, origenFilter, canalFilter]);

  // ── Feed: búsqueda por nombre (no cambia KPIs ni gráficos) ─────
  const feedLeads = useMemo(() => {
    const q = normalizar(search.trim());
    if (!q) return filtered;
    return filtered.filter(r => normalizar(r.user_name || "").includes(q));
  }, [filtered, search]);

  // ── KPIs ───────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = filtered.length;
    const totalMsgs = filtered.reduce((sum, r) => sum + r.total_mensajes, 0);
    const promedio = total > 0 ? (totalMsgs / total).toFixed(1) : 0;
    const pauta = filtered.filter(r => r.origen_lead === "Pauta publicitaria").length;
    const pautaPct = total > 0 ? Math.round((pauta / total) * 100) : 0;
    const calificados = filtered.filter(r => r.estado_calificacion === "Calificado").length;
    const sinRespuesta = filtered.filter(r => r.estado_calificacion === "Sin respuesta").length;
    const clasesPrueba = filtered.filter(r => r.clase_prueba).length;
    return { totalMsgs, total, promedio, pautaPct, pauta, calificados, sinRespuesta, clasesPrueba };
  }, [filtered]);

  // ── Charts ─────────────────────────────────────────────────────
  const actividadesChart = useMemo(() => countBy(filtered, "actividad_interes"), [filtered]);
  const derivacionesChart = useMemo(() => countBy(filtered, "tema_derivacion"), [filtered]);

  const origenChart = useMemo(() => {
    const pauta = filtered.filter(r => r.origen_lead === "Pauta publicitaria").length;
    return [
      { name: "Orgánico", value: filtered.length - pauta, fill: C.accent },
      { name: "Pauta", value: pauta, fill: C.orange },
    ];
  }, [filtered]);

  const porDiaChart = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const d = new Date(r.fecha_interaccion);
      const key = `${d.getDate()} ${MESES[d.getMonth()]}`;
      if (!map[key]) map[key] = { dia: key, leads: 0, ts: d.getTime() };
      map[key].leads += 1;
    });
    return Object.values(map).sort((a, b) => a.ts - b.ts);
  }, [filtered]);

  const estadosChart = useMemo(() => {
    const map = {};
    filtered.forEach(r => { map[r.estado_calificacion] = (map[r.estado_calificacion] || 0) + 1; });
    const colors = { "Calificado": C.accent, "En proceso": C.yellow, "Sin respuesta": C.slate, "No califica": C.red };
    return ESTADOS.filter(name => map[name]).map(name => ({ name, count: map[name], fill: colors[name] }));
  }, [filtered]);

  const orgPct = filtered.length > 0 ? Math.round(((filtered.length - kpis.pauta) / filtered.length) * 100) : 0;

  return (
    <>
      {/* Filtros de la pestaña */}
      <div className={`${glass} p-4 mb-6`}>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <FilterGroup label="Estado">
            {["todos", ...ESTADOS].map(key => (
              <FilterPill key={key} label={key === "todos" ? "Todos" : key} active={estadoFilter === key} onClick={() => withFeedReset(setEstadoFilter)(key)} />
            ))}
          </FilterGroup>
          <FilterGroup label="Canal">
            {[{ key: "todos", label: "Todos" }, { key: "whatsapp", label: "WhatsApp" }, { key: "instagram", label: "Instagram" }].map(f => (
              <FilterPill key={f.key} label={f.label} active={canalFilter === f.key} onClick={() => withFeedReset(setCanalFilter)(f.key)} />
            ))}
          </FilterGroup>
          <FilterGroup label="Origen (estimado)">
            {[{ key: "todos", label: "Todos" }, { key: "pauta", label: "Pauta" }, { key: "organico", label: "Orgánico" }].map(f => (
              <FilterPill key={f.key} label={f.label} active={origenFilter === f.key} onClick={() => withFeedReset(setOrigenFilter)(f.key)} />
            ))}
          </FilterGroup>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="Mensajes" value={fmt(kpis.totalMsgs)} sub="acumulados" accent />
        <KPI label="Leads únicos" value={fmt(kpis.total)} sub={porDiaChart.length > 0 ? `en ${porDiaChart.length} días` : ""} />
        <KPI label="Promedio" value={kpis.promedio} sub="msgs/lead" />
        <KPI label="Pauta (estimado)" value={`${kpis.pautaPct}%`} sub={`${fmt(kpis.pauta)} leads`} />
        <KPI label="Calificados" value={fmt(kpis.calificados)} sub="cerraron bien con Delfina" accent />
        <KPI label="Clase de prueba" value={fmt(kpis.clasesPrueba)} sub="confirmada con Delfina (desde 6 Oct)" accent />
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Leads por día">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={porDiaChart} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
              <XAxis dataKey="dia" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="leads" fill={C.accent} radius={[6, 6, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Estado de leads">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={estadosChart} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="count" strokeWidth={0}>
                  {estadosChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3">
              {estadosChart.map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: s.fill }} />
                  <span className="text-[13px] text-white/70 min-w-[100px]">{s.name}</span>
                  <span className="text-sm font-bold font-mono text-white/50 tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Top 5 actividades consultadas">
          {actividadesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={actividadesChart} layout="vertical" barSize={18} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Consultas" radius={[0, 6, 6, 0]}>
                  {actividadesChart.map((_, i) => <Cell key={i} fill={ACT_COLORS[i % ACT_COLORS.length]} opacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <SinDatos />}
        </Card>
        <Card title="Top derivaciones a recepción (estimado)">
          {derivacionesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={derivacionesChart} layout="vertical" barSize={18} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Derivaciones" radius={[0, 6, 6, 0]}>
                  {derivacionesChart.map((_, i) => <Cell key={i} fill={DERIV_COLORS[i % DERIV_COLORS.length]} opacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <SinDatos>Sin derivaciones</SinDatos>}
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Origen de leads (estimado)">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={origenChart} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" strokeWidth={0}>
                  {origenChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: C.accent }} />
                  <span className="text-[13px] text-white/70">Orgánico</span>
                </div>
                <span className="text-2xl font-bold font-mono text-emerald-400">{orgPct}%</span>
                <span className="text-xs text-white/50 ml-2 tabular-nums">{fmt(filtered.length - kpis.pauta)} leads</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: C.orange }} />
                  <span className="text-[13px] text-white/70">Pauta</span>
                </div>
                <span className="text-2xl font-bold font-mono text-orange-400">{kpis.pautaPct}%</span>
                <span className="text-xs text-white/50 ml-2 tabular-nums">{fmt(kpis.pauta)} leads</span>
              </div>
            </div>
          </div>
        </Card>

        <div className={`${glass} p-6`}>
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/[0.08] rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-[13px] uppercase tracking-[1.5px] text-emerald-400/60 mb-5 font-mono relative z-10">Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
            <div>
              <span className="text-xs text-white/55 block mb-1">Actividad estrella</span>
              <span className="text-base font-semibold text-white/85">{actividadesChart[0]?.name || "—"}</span>
              <span className="text-[11px] text-white/45 block mt-0.5">{actividadesChart[0] ? `${actividadesChart[0].count} consultas` : ""}</span>
            </div>
            <div>
              <span className="text-xs text-white/55 block mb-1">Tasa de calificación</span>
              <span className="text-base font-semibold text-emerald-400">{filtered.length > 0 ? `${Math.round((kpis.calificados / filtered.length) * 100)}%` : "—"}</span>
              <span className="text-[11px] text-white/40 block mt-0.5 tabular-nums">{fmt(kpis.calificados)} de {fmt(filtered.length)} leads</span>
            </div>
            <div>
              <span className="text-xs text-white/55 block mb-1">Derivación top (estimado)</span>
              <span className="text-base font-semibold text-white/85">{derivacionesChart[0]?.name || "—"}</span>
              <span className="text-[11px] text-white/45 block mt-0.5">{derivacionesChart[0] ? `${derivacionesChart[0].count} derivaciones` : ""}</span>
            </div>
          </div>
          <div className="relative z-10 mt-6 pt-5 border-t border-white/[0.06] flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs text-white/55 block mb-1">Para recontactar</span>
              <span className="text-2xl font-bold text-slate-300 tabular-nums">{fmt(kpis.sinRespuesta)}</span>
              <span className="text-[11px] text-white/45 block mt-0.5 text-pretty">No cerraron y hace más de 7 días que no escriben</span>
            </div>
            {kpis.sinRespuesta > 0 && (
              <button type="button" onClick={verRecontactar} className={btnSecundario}>
                Ver la lista
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feed de Leads */}
      <div ref={feedRef} className={`${glass} p-6 mb-6 scroll-mt-4`}>
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-[13px] uppercase tracking-[1.5px] text-white/40 font-mono tabular-nums">
            Feed de Leads ({fmt(feedLeads.length)})
          </h3>
          <div className="sm:w-64">
            <label htmlFor="buscar-lead" className="sr-only">Buscar lead por nombre</label>
            <input
              id="buscar-lead"
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setFeedLimit(FEED_PAGE); }}
              placeholder="Buscar por nombre…"
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-white/90 placeholder:text-white/40 focus:border-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-[1fr_0.8fr_0.7fr_0.5fr_0.8fr_1.2fr] gap-3 px-4 pb-3 border-b border-white/[0.06]">
          {["Lead", "Actividad", "Origen", "Msgs", "Estado", "Último contacto"].map(h => (
            <span key={h} className="text-[10px] uppercase tracking-[1.5px] text-white/50 font-mono">{h}</span>
          ))}
        </div>

        <div>
          {feedLeads.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-sm font-mono">
              {search.trim() ? `Ningún lead coincide con "${search.trim()}" en estos filtros` : "No hay leads para los filtros seleccionados"}
            </div>
          ) : (
            feedLeads
              .slice(0, feedLimit)
              .map((lead, i) => (
                <div key={lead.user_id + i} className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr_0.7fr_0.5fr_0.8fr_1.2fr] gap-2 lg:gap-3 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm text-white/80 font-medium">{lead.user_name}</span>
                    <span className="text-[11px] text-white/60">
                      {canalLabel(lead.canal)}
                      {lead.clase_prueba && <span className="ml-2 text-emerald-400">· Clase de prueba</span>}
                    </span>
                    <span className="text-[11px] text-white/40 font-mono lg:hidden">{formatDate(lead.fecha_interaccion)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-white/50">{lead.actividad_interes || "—"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm ${origenColor(lead.origen_lead)}`}>{origenLabel(lead.origen_lead)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-mono text-white/40 tabular-nums">{lead.total_mensajes}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge status={lead.estado_calificacion} />
                  </div>
                  <div className="hidden lg:flex flex-col justify-center">
                    <span className="text-xs text-white/55 font-mono">{formatDate(lead.fecha_interaccion)}</span>
                    <span className="text-[11px] text-white/45 truncate max-w-[200px]">{lead.ultimo_mensaje}</span>
                  </div>
                </div>
              ))
          )}
        </div>
        {feedLeads.length > feedLimit && (
          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setFeedLimit(n => n + FEED_PAGE)}
              className="px-4 py-2 rounded-xl text-xs font-medium tabular-nums border bg-white/[0.03] border-white/[0.08] text-white/60 hover:bg-white/[0.06] hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-colors cursor-pointer"
            >
              Ver {Math.min(FEED_PAGE, feedLeads.length - feedLimit)} más ({fmt(feedLeads.length - feedLimit)} restantes)
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default LeadsTab;
