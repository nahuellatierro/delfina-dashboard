import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════════
   SUPABASE — Pegá tus credenciales acá
   ═══════════════════════════════════════════════════════════════════
   1. Project Settings > Data API > Project URL
   2. Project Settings > Data API > anon public key
*/
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://npvwxgwdtfoulkwfbitp.supabase.co',   // ← REEMPLAZAR con tu Project URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdnd4Z3dkdGZvdWxrd2ZiaXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTQ0NDIsImV4cCI6MjA5NDUzMDQ0Mn0.n3Akmn2B6B8Alm65Z4LVjRHgVRjlmxxaBpGXHddBiU0'                    // ← REEMPLAZAR con tu anon public key
);

const SUPABASE_READY = true;  // Cambiar a false para volver al modo demo

// ── Colores Recharts ─────────────────────────────────────────────
const C = {
  accent: "#34d399", blue: "#60a5fa", orange: "#fb923c",
  purple: "#c084fc", red: "#f87171", yellow: "#fbbf24",
  cyan: "#22d3ee", textDim: "rgba(255,255,255,0.45)",
  gridLine: "rgba(255,255,255,0.06)",
};
const ACT_COLORS = [C.accent, C.blue, C.orange, C.purple, C.cyan];
const DERIV_COLORS = [C.red, C.orange, C.yellow, C.blue, C.purple];

// ── Fallback (modo demo) ─────────────────────────────────────────
const FALLBACK = [
  { user_id: "1290108116", user_name: "Valeriano Aranda", total_mensajes: 8, ultimo_mensaje: "Buenísimo, pasate por Alcorta 2545 y en recepción te dejan todo listo.", fecha_interaccion: "2026-05-26T01:42:24.328Z", origen_lead: "Pauta publicitaria", actividad_interes: "Boxeo", tema_derivacion: "Inscripción", estado_calificacion: "Calificado" },
  { user_id: "1290108117", user_name: "Camila Rodríguez", total_mensajes: 5, ultimo_mensaje: "Las clases de spinning son lunes, miércoles y viernes a las 18.", fecha_interaccion: "2026-05-26T00:15:00.000Z", origen_lead: "Orgánico", actividad_interes: "Spinning", tema_derivacion: null, estado_calificacion: "En proceso" },
  { user_id: "1290108118", user_name: "Martín López", total_mensajes: 12, ultimo_mensaje: "El pase full sale $36.900 por mes. Algo más que quieras saber?", fecha_interaccion: "2026-05-25T22:30:00.000Z", origen_lead: "Pauta publicitaria", actividad_interes: "Musculación", tema_derivacion: "Inscripción", estado_calificacion: "Calificado" },
  { user_id: "1290108119", user_name: "Sol Fernández", total_mensajes: 3, ultimo_mensaje: "Podés venir a probar una clase gratis sin compromiso.", fecha_interaccion: "2026-05-25T20:10:00.000Z", origen_lead: "Orgánico", actividad_interes: "Crossfit", tema_derivacion: null, estado_calificacion: "En proceso" },
  { user_id: "1290108120", user_name: "Nahuel Giménez", total_mensajes: 2, ultimo_mensaje: "Soy Delfina de GymBox, con eso no puedo ayudarte.", fecha_interaccion: "2026-05-25T19:45:00.000Z", origen_lead: "Orgánico", actividad_interes: null, tema_derivacion: null, estado_calificacion: "No califica" },
  { user_id: "1290108121", user_name: "Lucía Morales", total_mensajes: 6, ultimo_mensaje: "Para boxeo y kickboxing se necesitan guantes y vendas.", fecha_interaccion: "2026-05-25T18:00:00.000Z", origen_lead: "Pauta publicitaria", actividad_interes: "Boxeo", tema_derivacion: "Pagos", estado_calificacion: "Calificado" },
  { user_id: "1290108122", user_name: "Tomás Ruiz", total_mensajes: 4, ultimo_mensaje: "Tenemos más de 15 actividades de lunes a sábado.", fecha_interaccion: "2026-05-25T16:30:00.000Z", origen_lead: "Orgánico", actividad_interes: "Kickboxing", tema_derivacion: null, estado_calificacion: "En proceso" },
  { user_id: "1290108123", user_name: "Agustina Paz", total_mensajes: 9, ultimo_mensaje: "Si querés arrancar, pasate por Alcorta 2545.", fecha_interaccion: "2026-05-24T21:20:00.000Z", origen_lead: "Pauta publicitaria", actividad_interes: "Boxeo", tema_derivacion: "Inscripción", estado_calificacion: "Calificado" },
  { user_id: "1290108124", user_name: "Federico Blanco", total_mensajes: 1, ultimo_mensaje: "Hola! Soy Delfina de GymBox. Me decís tu nombre?", fecha_interaccion: "2026-05-24T15:00:00.000Z", origen_lead: "Orgánico", actividad_interes: null, tema_derivacion: null, estado_calificacion: "No califica" },
  { user_id: "1290108125", user_name: "Valentina Sosa", total_mensajes: 7, ultimo_mensaje: "La promo 2x1 sigue activa hasta fin de mayo.", fecha_interaccion: "2026-05-24T13:45:00.000Z", origen_lead: "Pauta publicitaria", actividad_interes: "Musculación", tema_derivacion: "Pagos", estado_calificacion: "Calificado" },
  { user_id: "1290108126", user_name: "Diego Castro", total_mensajes: 3, ultimo_mensaje: "Re normal, podés pasar a conocer sin compromiso.", fecha_interaccion: "2026-05-24T10:20:00.000Z", origen_lead: "Orgánico", actividad_interes: "Crossfit", tema_derivacion: null, estado_calificacion: "En proceso" },
  { user_id: "1290108127", user_name: "Milagros Torres", total_mensajes: 6, ultimo_mensaje: "Eso mejor lo ves en recepción. Estamos en Alcorta 2545.", fecha_interaccion: "2026-05-23T22:15:00.000Z", origen_lead: "Pauta publicitaria", actividad_interes: "Boxeo", tema_derivacion: "Inscripción", estado_calificacion: "Calificado" },
  { user_id: "1290108128", user_name: "Ramiro Vega", total_mensajes: 4, ultimo_mensaje: "El pase musculación sale $29.900 por mes.", fecha_interaccion: "2026-05-23T19:00:00.000Z", origen_lead: "Orgánico", actividad_interes: "Musculación", tema_derivacion: null, estado_calificacion: "En proceso" },
  { user_id: "1290108129", user_name: "Julieta Romero", total_mensajes: 2, ultimo_mensaje: "Tranqui, podés pasar a conocer.", fecha_interaccion: "2026-05-23T14:30:00.000Z", origen_lead: "Orgánico", actividad_interes: "Spinning", tema_derivacion: null, estado_calificacion: "No califica" },
  { user_id: "1290108130", user_name: "Gonzalo Pereyra", total_mensajes: 10, ultimo_mensaje: "Buenísimo Gonzalo! Te esperamos en Alcorta 2545.", fecha_interaccion: "2026-05-23T11:00:00.000Z", origen_lead: "Pauta publicitaria", actividad_interes: "Kickboxing", tema_derivacion: "Inscripción", estado_calificacion: "Calificado" },
  { user_id: "1290108131", user_name: "Abril Méndez", total_mensajes: 5, ultimo_mensaje: "Para eso ayuda elegir algo que puedas sostener.", fecha_interaccion: "2026-05-22T20:00:00.000Z", origen_lead: "Orgánico", actividad_interes: "Spinning", tema_derivacion: null, estado_calificacion: "En proceso" },
  { user_id: "1290108132", user_name: "Lautaro Ríos", total_mensajes: 3, ultimo_mensaje: "En recepción te orientan según lo que buscás.", fecha_interaccion: "2026-05-22T17:30:00.000Z", origen_lead: "Orgánico", actividad_interes: "Crossfit", tema_derivacion: "Pagos", estado_calificacion: "En proceso" },
  { user_id: "1290108133", user_name: "Candela Aguirre", total_mensajes: 11, ultimo_mensaje: "Si querés, podés venir a probar una clase gratis.", fecha_interaccion: "2026-05-22T14:15:00.000Z", origen_lead: "Pauta publicitaria", actividad_interes: "Boxeo", tema_derivacion: "Inscripción", estado_calificacion: "Calificado" },
  { user_id: "1290108134", user_name: "Sebastián Ortiz", total_mensajes: 1, ultimo_mensaje: "Hola! Soy Delfina de GymBox.", fecha_interaccion: "2026-05-21T10:00:00.000Z", origen_lead: "Orgánico", actividad_interes: null, tema_derivacion: null, estado_calificacion: "No califica" },
  { user_id: "1290108135", user_name: "Florencia Luna", total_mensajes: 7, ultimo_mensaje: "Las clases de crossfit son martes y jueves a las 19.", fecha_interaccion: "2026-05-20T18:45:00.000Z", origen_lead: "Pauta publicitaria", actividad_interes: "Crossfit", tema_derivacion: "Inscripción", estado_calificacion: "Calificado" },
];

// ── Utils ────────────────────────────────────────────────────────

function formatDate(iso) {
  const d = new Date(iso);
  const day = d.getDate();
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${months[d.getMonth()]}, ${h}:${m}`;
}

function getDateRange(key) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "hoy": return startOfDay;
    case "7d": return new Date(now.getTime() - 7 * 86400000);
    case "mes": return new Date(now.getFullYear(), now.getMonth(), 1);
    default: return null;
  }
}

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

/* Normaliza el estado que viene de Supabase (puede tener emojis)
   a la versión limpia que usa el dashboard */
function cleanEstado(raw) {
  if (!raw) return "En proceso";
  if (raw.includes("Calificado")) return "Calificado";
  if (raw.includes("No califica")) return "No califica";
  return "En proceso";
}

function origenLabel(raw) {
  return raw === "Pauta publicitaria" ? "📣 Pauta" : "🌿 Orgánico";
}

function origenColor(raw) {
  return raw === "Pauta publicitaria" ? "text-orange-400/70" : "text-emerald-400/70";
}

// ── Glass tokens ─────────────────────────────────────────────────
const glass = "relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]";
const glassHover = `${glass} transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.12] hover:shadow-[0_8px_40px_rgba(52,211,153,0.08),inset_0_1px_0_rgba(255,255,255,0.1)]`;

// ── Components ───────────────────────────────────────────────────

function KPI({ label, value, sub, accent = false }) {
  return (
    <div className={`${glassHover} p-5 flex flex-col gap-1`}>
      {accent && <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />}
      <span className="text-[11px] uppercase tracking-[1.5px] text-white/40 font-mono relative z-10">{label}</span>
      <span className={`text-3xl font-bold leading-none relative z-10 ${accent ? "text-emerald-400" : "text-white/90"}`}>{value}</span>
      {sub && <span className="text-xs text-white/25 relative z-10">{sub}</span>}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className={`${glass} p-6`}>
      <h3 className="text-[13px] uppercase tracking-[1.5px] text-white/40 mb-5 font-mono">{title}</h3>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 shadow-xl">
      <div className="font-semibold text-white/70 mb-0.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.accent }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border ${
        active
          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.1)]"
          : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:bg-white/[0.06] hover:text-white/60"
      }`}
    >
      {label}
    </button>
  );
}

function Badge({ status }) {
  const config = {
    "Calificado": { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    "En proceso": { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
    "No califica": { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
  };
  const c = config[status] || config["En proceso"];
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium border ${c.bg} ${c.border} ${c.text}`}>
      {status}
    </span>
  );
}

// ── Dashboard ────────────────────────────────────────────────────

function DelfinaDashboard() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateRange, setDateRange] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [origenFilter, setOrigenFilter] = useState("todos");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    if (!SUPABASE_READY) {
      setTimeout(() => { setRawData(FALLBACK); setLoading(false); }, 800);
      return;
    }

    try {
      const { data, error: sbError } = await supabase
        .from('v_gymbox_leads')
        .select('*')
        .order('fecha_interaccion', { ascending: false });

      if (sbError) throw sbError;

      // Normalizar estados (quitar emojis si vienen de Supabase)
      const cleaned = (data || []).map(row => ({
        ...row,
        estado_calificacion: cleanEstado(row.estado_calificacion),
      }));

      setRawData(cleaned);
    } catch (err) {
      console.error("Supabase error:", err);
      setError(err.message);
      setRawData(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (SUPABASE_READY) {
      const id = setInterval(fetchData, 5 * 60 * 1000);
      return () => clearInterval(id);
    }
  }, []);

  // ── Datos filtrados ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...rawData];

    const minDate = getDateRange(dateRange);
    if (minDate) {
      result = result.filter(r => new Date(r.fecha_interaccion) >= minDate);
    }

    if (estadoFilter !== "todos") {
      const map = { calificado: "Calificado", proceso: "En proceso", nocalifica: "No califica" };
      result = result.filter(r => r.estado_calificacion === map[estadoFilter]);
    }

    if (origenFilter !== "todos") {
      const map = { pauta: "Pauta publicitaria", organico: "Orgánico" };
      result = result.filter(r => r.origen_lead === map[origenFilter]);
    }

    return result;
  }, [rawData, dateRange, estadoFilter, origenFilter]);

  // ── KPIs ───────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = filtered.length;
    const totalMsgs = filtered.reduce((sum, r) => sum + r.total_mensajes, 0);
    const promedio = total > 0 ? (totalMsgs / total).toFixed(1) : 0;
    const pauta = filtered.filter(r => r.origen_lead === "Pauta publicitaria").length;
    const pautaPct = total > 0 ? Math.round((pauta / total) * 100) : 0;
    const agendados = filtered.filter(r => r.estado_calificacion === "Calificado").length;
    return { totalMsgs, total, promedio, pautaPct, pauta, agendados };
  }, [filtered]);

  // ── Charts ─────────────────────────────────────────────────────
  const actividadesChart = useMemo(() => countBy(filtered, "actividad_interes"), [filtered]);
  const derivacionesChart = useMemo(() => countBy(filtered, "tema_derivacion"), [filtered]);

  const origenChart = useMemo(() => {
    const pauta = filtered.filter(r => r.origen_lead === "Pauta publicitaria").length;
    const org = filtered.length - pauta;
    return [
      { name: "Orgánico", value: org, fill: C.accent },
      { name: "Pauta", value: pauta, fill: C.orange },
    ];
  }, [filtered]);

  const porDiaChart = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const d = new Date(r.fecha_interaccion);
      const key = `${d.getDate()} ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][d.getMonth()]}`;
      if (!map[key]) map[key] = { dia: key, leads: 0, ts: d.getTime() };
      map[key].leads += 1;
    });
    return Object.values(map).sort((a, b) => a.ts - b.ts);
  }, [filtered]);

  const estadosChart = useMemo(() => {
    const map = {};
    filtered.forEach(r => { map[r.estado_calificacion] = (map[r.estado_calificacion] || 0) + 1; });
    const colors = { "Calificado": C.accent, "En proceso": C.yellow, "No califica": C.red };
    return Object.entries(map).map(([name, count]) => ({ name, count, fill: colors[name] || C.blue }));
  }, [filtered]);

  // ── Loading / Error ────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-5">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/5" />
        <div className="absolute inset-0 rounded-full border-2 border-t-emerald-400 animate-spin" />
      </div>
      <span className="text-sm text-white/30 font-mono tracking-wide">Conectando con Delfina...</span>
    </div>
  );

  if (error && rawData.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <span className="text-sm text-red-400/80">Error: {error}</span>
      <button onClick={fetchData} className="px-5 py-2 rounded-xl bg-white/[0.05] backdrop-blur border border-white/10 text-white/70 font-mono text-[13px] hover:border-emerald-500/30 hover:text-emerald-400 transition-all cursor-pointer">Reintentar</button>
    </div>
  );

  const orgPct = filtered.length > 0 ? Math.round(((filtered.length - kpis.pauta) / filtered.length) * 100) : 0;

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-600/15 blur-[120px] animate-[drift_20s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[100px] animate-[drift_25s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full bg-purple-600/[0.06] blur-[80px] animate-[drift_30s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "128px" }} />
      </div>

      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-10 max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-xs text-emerald-400/70 font-mono uppercase tracking-[2.5px]">
              {SUPABASE_READY ? "Live" : "Demo"} · GymBox AI
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white/95">Delfina Dashboard</h1>
          <p className="text-sm text-white/25 mt-1.5 font-light">
            {filtered.length} leads · {kpis.totalMsgs} mensajes totales
          </p>
        </header>

        {/* Filtros */}
        <div className={`${glass} p-4 mb-6`}>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[1.5px] text-white/30 font-mono">Período</span>
              <div className="flex gap-1.5 flex-wrap">
                {[{ key: "hoy", label: "Hoy" }, { key: "7d", label: "7 días" }, { key: "mes", label: "Este mes" }, { key: "todos", label: "Todos" }].map(f => (
                  <FilterPill key={f.key} label={f.label} active={dateRange === f.key} onClick={() => setDateRange(f.key)} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[1.5px] text-white/30 font-mono">Estado</span>
              <div className="flex gap-1.5 flex-wrap">
                {[{ key: "todos", label: "Todos" }, { key: "calificado", label: "Calificado" }, { key: "proceso", label: "En proceso" }, { key: "nocalifica", label: "No califica" }].map(f => (
                  <FilterPill key={f.key} label={f.label} active={estadoFilter === f.key} onClick={() => setEstadoFilter(f.key)} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[1.5px] text-white/30 font-mono">Origen</span>
              <div className="flex gap-1.5 flex-wrap">
                {[{ key: "todos", label: "Todos" }, { key: "pauta", label: "Pauta" }, { key: "organico", label: "Orgánico" }].map(f => (
                  <FilterPill key={f.key} label={f.label} active={origenFilter === f.key} onClick={() => setOrigenFilter(f.key)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <KPI label="Mensajes" value={kpis.totalMsgs.toLocaleString()} sub="acumulados" accent />
          <KPI label="Leads Únicos" value={kpis.total} sub={porDiaChart.length > 0 ? `en ${porDiaChart.length} días` : ""} />
          <KPI label="Promedio" value={kpis.promedio} sub="msgs/lead" />
          <KPI label="Pauta" value={`${kpis.pautaPct}%`} sub={`${kpis.pauta} leads`} />
          <KPI label="Agendados" value={kpis.agendados} sub="calificados" accent />
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
                    <span className="text-sm font-bold font-mono text-white/50">{s.count}</span>
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
            ) : (
              <div className="h-[200px] flex items-center justify-center text-white/20 text-sm font-mono">Sin datos</div>
            )}
          </Card>
          <Card title="Top derivaciones a recepción">
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
            ) : (
              <div className="h-[200px] flex items-center justify-center text-white/20 text-sm font-mono">Sin derivaciones</div>
            )}
          </Card>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card title="Origen de leads">
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
                  <span className="text-xs text-white/25 ml-2">{filtered.length - kpis.pauta} leads</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: C.orange }} />
                    <span className="text-[13px] text-white/70">Pauta</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-orange-400">{kpis.pautaPct}%</span>
                  <span className="text-xs text-white/25 ml-2">{kpis.pauta} leads</span>
                </div>
              </div>
            </div>
          </Card>

          <div className={`${glass} p-6`}>
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/[0.08] rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-[13px] uppercase tracking-[1.5px] text-emerald-400/60 mb-5 font-mono relative z-10">Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
              <div>
                <span className="text-xs text-white/30 block mb-1">Actividad estrella</span>
                <span className="text-base font-semibold text-white/85">{actividadesChart[0]?.name || "—"}</span>
                <span className="text-[11px] text-white/20 block mt-0.5">{actividadesChart[0] ? `${actividadesChart[0].count} consultas` : ""}</span>
              </div>
              <div>
                <span className="text-xs text-white/30 block mb-1">Tasa de calificación</span>
                <span className="text-base font-semibold text-emerald-400">{filtered.length > 0 ? `${Math.round((kpis.agendados / filtered.length) * 100)}%` : "—"}</span>
                <span className="text-[11px] text-white/20 block mt-0.5">{kpis.agendados} de {filtered.length} leads</span>
              </div>
              <div>
                <span className="text-xs text-white/30 block mb-1">Derivación top</span>
                <span className="text-base font-semibold text-red-400/80">{derivacionesChart[0]?.name || "—"}</span>
                <span className="text-[11px] text-white/20 block mt-0.5">{derivacionesChart[0] ? `${derivacionesChart[0].count} derivaciones` : ""}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feed de Leads */}
        <div className={`${glass} p-6 mb-6`}>
          <h3 className="text-[13px] uppercase tracking-[1.5px] text-white/40 mb-5 font-mono">
            Feed de Leads ({filtered.length})
          </h3>

          <div className="hidden lg:grid grid-cols-[1fr_0.8fr_0.7fr_0.5fr_0.8fr_1.2fr] gap-3 px-4 pb-3 border-b border-white/[0.06]">
            {["Lead", "Actividad", "Origen", "Msgs", "Estado", "Último contacto"].map(h => (
              <span key={h} className="text-[10px] uppercase tracking-[1.5px] text-white/25 font-mono">{h}</span>
            ))}
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-white/20 text-sm font-mono">No hay leads para los filtros seleccionados</div>
            ) : (
              filtered
                .sort((a, b) => new Date(b.fecha_interaccion) - new Date(a.fecha_interaccion))
                .map((lead, i) => (
                  <div key={lead.user_id + i} className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr_0.7fr_0.5fr_0.8fr_1.2fr] gap-2 lg:gap-3 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm text-white/80 font-medium">{lead.user_name}</span>
                      <span className="text-[11px] text-white/20 font-mono lg:hidden">{formatDate(lead.fecha_interaccion)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-white/50">{lead.actividad_interes || "—"}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm ${origenColor(lead.origen_lead)}`}>
                        {origenLabel(lead.origen_lead)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-mono text-white/40">{lead.total_mensajes}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge status={lead.estado_calificacion} />
                    </div>
                    <div className="hidden lg:flex flex-col justify-center">
                      <span className="text-xs text-white/30 font-mono">{formatDate(lead.fecha_interaccion)}</span>
                      <span className="text-[11px] text-white/15 truncate max-w-[200px]">{lead.ultimo_mensaje}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-white/15 font-mono">Powerglide AI · Delfina v4 · {SUPABASE_READY ? "Supabase Live" : "Demo Mode"}</p>
      </div>
    </div>
  );
}

export default DelfinaDashboard;
