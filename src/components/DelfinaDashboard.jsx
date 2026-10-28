import { useState, useEffect, useMemo, useCallback } from "react";

import { supabase } from "../lib/supabase";
import { FALLBACK } from "../lib/demo";
import { btnSecundario, glass } from "../lib/theme";
import { fmt, formatHora } from "../lib/format";
import { PERIODOS, rangoDe, enRango } from "../lib/periodos";
import { FilterPill, FilterGroup, Nota } from "./ui";
import LeadsTab from "./tabs/LeadsTab";
import QuejasTab from "./tabs/QuejasTab";
import DelfinaTab from "./tabs/DelfinaTab";
import DifusionTab from "./tabs/DifusionTab";

const SUPABASE_READY = true;  // Cambiar a false para volver al modo demo

// Supabase devuelve como máximo 1.000 filas por consulta: se pide de a páginas.
const PAGE_SIZE = 1000;
const LEAD_COLUMNS = "user_id,user_name,total_mensajes,ultimo_mensaje,fecha_interaccion,origen_lead,actividad_interes,tema_derivacion,estado_calificacion,canal,clase_prueba";

const TABS = [
  { key: "leads", label: "Leads" },
  { key: "quejas", label: "Quejas" },
  { key: "delfina", label: "Delfina" },
  { key: "difusion", label: "Difusión" },
];

// La difusión a ex socios cierra el 01/11/2026: hasta entonces los resultados son parciales
const DIFUSION_CIERRE = new Date(2026, 10, 2);

/* Normaliza el estado que viene de Supabase a la versión que usa el dashboard */
function cleanEstado(raw) {
  if (!raw) return "En proceso";
  if (raw.includes("Calificado") || raw.includes("Inscrito")) return "Calificado";
  if (raw.includes("Sin respuesta")) return "Sin respuesta";
  if (raw.includes("No califica")) return "No califica";
  return "En proceso";
}

async function fetchAllLeads() {
  let all = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("v_gymbox_leads")
      .select(LEAD_COLUMNS)
      .order("fecha_interaccion", { ascending: false })
      .order("user_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    all = all.concat(data || []);
    if (!data || data.length < PAGE_SIZE) return all;
  }
}

function tabInicial() {
  const h = window.location.hash.replace("#", "");
  return TABS.some(t => t.key === h) ? h : "leads";
}

// Aviso cuando el período empieza antes de que exista la fuente de datos
function avisoFuente(periodo, desdeFuente, texto) {
  if (!desdeFuente) return null;
  const { desde } = rangoDe(periodo);
  const inicio = new Date(desdeFuente);
  if (desde && desde >= inicio) return null;
  const dia = inicio.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  return `${texto} desde el ${dia}: antes de esa fecha no hay datos.`;
}

function DelfinaDashboard({ email, onSignOut }) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sinAcceso, setSinAcceso] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [periodo, setPeriodo] = useState("todos");
  const [tab, setTab] = useState(tabInicial);

  // Métricas de Quejas y Delfina (función dashboard_metricas), guardadas por período
  const [metricas, setMetricas] = useState({});
  const [metricasError, setMetricasError] = useState(null);

  // Difusión a ex socios (función dashboard_difusion), también guardada por período
  const [difusion, setDifusion] = useState({});
  const [difusionError, setDifusionError] = useState(null);

  // Si una recarga falla, se conservan los datos anteriores y se avisa.
  // Nunca se muestran datos de demo como si fueran reales.
  // Solo cambia estado después de esperar la respuesta (puede correr desde un efecto).
  const fetchData = async () => {
    if (!SUPABASE_READY) {
      setTimeout(() => { setRawData(FALLBACK); setLoading(false); }, 800);
      return;
    }

    try {
      const { data: acceso, error: accesoError } = await supabase.rpc("es_acceso_dashboard");
      if (!accesoError && acceso === false) {
        setSinAcceso(true);
        setRawData([]);
        return;
      }
      setSinAcceso(false);

      const data = await fetchAllLeads();
      setRawData(data.map(row => ({
        ...row,
        estado_calificacion: cleanEstado(row.estado_calificacion),
      })));
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Supabase error:", err);
      setError(err.message || "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cargarMetricas = useCallback(async (key) => {
    if (!SUPABASE_READY) {
      setTimeout(() => setMetricas(prev => ({ ...prev, [key]: null })), 300);
      return;
    }
    const { desde, hasta } = rangoDe(key);
    const { data, error: rpcError } = await supabase.rpc("dashboard_metricas", {
      p_desde: desde ? desde.toISOString() : null,
      p_hasta: hasta ? hasta.toISOString() : null,
    });
    if (rpcError) {
      console.error("Supabase error (métricas):", rpcError);
      setMetricasError(rpcError.message || "No se pudieron cargar las métricas");
      return;
    }
    setMetricasError(null);
    setMetricas(prev => ({ ...prev, [key]: data }));
  }, []);

  const cargarDifusion = useCallback(async (key) => {
    if (!SUPABASE_READY) {
      setTimeout(() => setDifusion(prev => ({ ...prev, [key]: null })), 300);
      return;
    }
    const { desde, hasta } = rangoDe(key);
    const { data, error: rpcError } = await supabase.rpc("dashboard_difusion", {
      p_desde: desde ? desde.toISOString() : null,
      p_hasta: hasta ? hasta.toISOString() : null,
    });
    if (rpcError) {
      console.error("Supabase error (difusión):", rpcError);
      setDifusionError(rpcError.message || "No se pudo cargar la difusión");
      return;
    }
    setDifusionError(null);
    setDifusion(prev => ({ ...prev, [key]: data }));
  }, []);

  const refresh = () => {
    setRefreshing(true);
    setMetricas({});
    setDifusion({});
    fetchData();
  };

  useEffect(() => {
    // fetchData solo cambia estado después de un await o en un setTimeout.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    if (SUPABASE_READY) {
      const id = setInterval(() => { setMetricas({}); setDifusion({}); fetchData(); }, 5 * 60 * 1000);
      return () => clearInterval(id);
    }
  }, []);

  // Quejas y Delfina: se piden al entrar a la pestaña o cambiar de período (una vez por período)
  useEffect(() => {
    if ((tab === "quejas" || tab === "delfina") && !sinAcceso && !(periodo in metricas)) {
      // cargarMetricas solo cambia estado después de un await o en un setTimeout.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarMetricas(periodo);
    }
  }, [tab, periodo, metricas, sinAcceso, cargarMetricas]);

  // Difusión: igual, una vez por período al entrar a la pestaña
  useEffect(() => {
    if (tab === "difusion" && !sinAcceso && !(periodo in difusion)) {
      // cargarDifusion solo cambia estado después de un await o en un setTimeout.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarDifusion(periodo);
    }
  }, [tab, periodo, difusion, sinAcceso, cargarDifusion]);

  const cambiarTab = (key) => {
    setTab(key);
    window.history.replaceState(null, "", `#${key}`);
  };

  const leadsPeriodo = useMemo(() => {
    const rango = rangoDe(periodo);
    return rawData.filter(r => enRango(r.fecha_interaccion, rango));
  }, [rawData, periodo]);

  const mensajesPeriodo = useMemo(
    () => leadsPeriodo.reduce((sum, r) => sum + r.total_mensajes, 0),
    [leadsPeriodo]
  );

  const m = metricas[periodo];
  const d = difusion[periodo];

  // ── Loading / Error ────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-5">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/5" />
        <div className="absolute inset-0 rounded-full border-2 border-t-emerald-400 animate-spin" />
      </div>
      <span role="status" className="text-sm text-white/55 font-mono tracking-wide">Conectando con Delfina...</span>
    </div>
  );

  if (sinAcceso) return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-4 text-center">
      <span className="text-sm text-pretty text-white/70">{email} no tiene acceso al dashboard de Delfina.</span>
      <button type="button" onClick={onSignOut} className="px-5 py-2 rounded-xl bg-white/[0.05] backdrop-blur border border-white/10 text-white/70 font-mono text-[13px] hover:border-emerald-500/30 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-colors cursor-pointer">Salir</button>
    </div>
  );

  if (error && rawData.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-4 text-center">
      <span role="alert" className="text-sm text-pretty text-red-400/80">No se pudieron cargar los datos: {error}</span>
      <button type="button" onClick={() => { setLoading(true); fetchData(); }} className="px-5 py-2 rounded-xl bg-white/[0.05] backdrop-blur border border-white/10 text-white/70 font-mono text-[13px] hover:border-emerald-500/30 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-colors cursor-pointer">Reintentar</button>
    </div>
  );

  // Contenido de Quejas / Delfina según el estado de la carga
  const metricasPendientes = (render) => {
    if (m) return render(m);
    if (metricasError) return (
      <Nota tone="error">
        No se pudieron cargar los datos ({metricasError}).{" "}
        <button type="button" onClick={() => { setMetricasError(null); cargarMetricas(periodo); }} className="underline underline-offset-2 cursor-pointer">Reintentar</button>
      </Nota>
    );
    if (m === null) return <Nota>Sin datos en modo demo.</Nota>;
    return <Nota>Cargando…</Nota>;
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-600/15 blur-[120px] animate-[drift_20s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[100px] animate-[drift_25s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full bg-purple-600/[0.06] blur-[80px] animate-[drift_30s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "128px" }} />
      </div>

      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-10 max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping motion-reduce:hidden" />
              </div>
              <span className="text-xs text-emerald-400/70 font-mono uppercase tracking-[2.5px]">
                {SUPABASE_READY ? "Live" : "Demo"} · GymBox AI
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance text-white/95">Delfina Dashboard</h1>
            <p className="text-sm text-white/50 mt-1.5 font-light tabular-nums">
              {fmt(leadsPeriodo.length)} leads · {fmt(mensajesPeriodo)} mensajes
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button type="button" onClick={refresh} disabled={refreshing} className={`${btnSecundario} disabled:cursor-wait disabled:opacity-60`}>
                {refreshing ? "Actualizando…" : "Actualizar"}
              </button>
              <button type="button" onClick={onSignOut} className={btnSecundario}>
                Salir
              </button>
            </div>
            {lastUpdated && (
              <span role="status" className="text-[11px] text-white/50 font-mono tabular-nums">
                Actualizado {formatHora(lastUpdated)}
              </span>
            )}
          </div>
        </header>

        {error && (
          <Nota tone="error">No se pudo actualizar ({error}). Se muestran los datos de la última carga.</Nota>
        )}

        {/* Pestañas y período (compartido) */}
        <div className={`${glass} p-4 mb-6 flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-8`}>
          <nav aria-label="Secciones del dashboard">
            <FilterGroup label="Sección">
              {TABS.map(t => (
                <FilterPill key={t.key} label={t.label} active={tab === t.key} onClick={() => cambiarTab(t.key)} />
              ))}
            </FilterGroup>
          </nav>
          <FilterGroup label="Período">
            {PERIODOS.map(p => (
              <FilterPill key={p.key} label={p.label} active={periodo === p.key} onClick={() => setPeriodo(p.key)} />
            ))}
          </FilterGroup>
        </div>

        {tab === "leads" && <LeadsTab leads={leadsPeriodo} />}

        {tab === "quejas" && metricasPendientes(mm => (
          <>
            {avisoFuente(periodo, mm.fuentes?.quejas_desde, "El detector de quejas registra") && (
              <Nota>{avisoFuente(periodo, mm.fuentes.quejas_desde, "El detector de quejas registra")}</Nota>
            )}
            <QuejasTab m={mm.quejas || {}} />
          </>
        ))}

        {tab === "delfina" && metricasPendientes(mm => (
          <>
            {avisoFuente(periodo, mm.fuentes?.envios_desde, "Las respuestas de Delfina se registran") && (
              <Nota>
                {avisoFuente(periodo, mm.fuentes.envios_desde, "Las respuestas de Delfina se registran")}
                {" "}Las clases de prueba, desde el 6 Oct.
              </Nota>
            )}
            <DelfinaTab m={mm.delfina || {}} clasesPrueba={mm.clases_prueba?.total} />
          </>
        ))}

        {tab === "difusion" && (
          d ? (
            <>
              {new Date() < DIFUSION_CIERRE && (
                <Nota tone="alerta">
                  Resultados parciales: el precio especial vence el sábado 31 y las respuestas siguen entrando. Cierre el 01/11.
                </Nota>
              )}
              {periodo !== "todos" && (
                <Nota>Enviados y entregados son de toda la difusión; el resto se filtra por la fecha del último mensaje.</Nota>
              )}
              <DifusionTab m={d} />
            </>
          ) : difusionError ? (
            <Nota tone="error">
              No se pudieron cargar los datos ({difusionError}).{" "}
              <button type="button" onClick={() => { setDifusionError(null); cargarDifusion(periodo); }} className="underline underline-offset-2 cursor-pointer">Reintentar</button>
            </Nota>
          ) : d === null ? <Nota>Sin datos en modo demo.</Nota> : <Nota>Cargando…</Nota>
        )}

        <p className="text-center text-[11px] text-white/45 font-mono">Powerglide AI · Delfina v4 · {SUPABASE_READY ? "Supabase Live" : "Demo Mode"}</p>
      </div>
    </div>
  );
}

export default DelfinaDashboard;
