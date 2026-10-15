import { C, glass, glassHover } from "../lib/theme";

export function KPI({ label, value, sub, accent = false, tone }) {
  const color = tone || (accent ? "text-emerald-400" : "text-white/90");
  return (
    <div className={`${glassHover} p-5 flex flex-col gap-1`}>
      {accent && <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />}
      <span className="text-[11px] uppercase tracking-[1.5px] text-white/40 font-mono relative z-10">{label}</span>
      <span className={`text-3xl font-bold leading-none relative z-10 tabular-nums ${color}`}>{value}</span>
      {sub && <span className="text-xs text-white/50 relative z-10 text-pretty">{sub}</span>}
    </div>
  );
}

export function Card({ title, children, className = "" }) {
  return (
    <div className={`${glass} p-6 ${className}`}>
      <h3 className="text-[13px] uppercase tracking-[1.5px] text-white/40 mb-5 font-mono">{title}</h3>
      {children}
    </div>
  );
}

export function ChartTooltip({ active, payload, label }) {
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

export function FilterPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
        active
          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.1)]"
          : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:bg-white/[0.06] hover:text-white/60"
      }`}
    >
      {label}
    </button>
  );
}

export function FilterGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[1.5px] text-white/55 font-mono">{label}</span>
      <div className="flex gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

export function Badge({ status }) {
  const config = {
    "Calificado": { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    "En proceso": { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
    "Sin respuesta": { bg: "bg-slate-400/10", border: "border-slate-400/20", text: "text-slate-300" },
    "No califica": { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
  };
  const c = config[status] || config["En proceso"];
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium border ${c.bg} ${c.border} ${c.text}`}>
      {status}
    </span>
  );
}

// Aviso chico (fuentes de datos, cargando, sin datos)
export function Nota({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-white/[0.08] bg-white/[0.03] text-white/60",
    alerta: "border-yellow-500/20 bg-yellow-500/10 text-yellow-200",
    error: "border-red-500/20 bg-red-500/10 text-red-300",
  };
  return (
    <div role="status" className={`mb-6 rounded-xl border px-4 py-3 text-sm text-pretty ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function SinDatos({ children = "Sin datos", alto = "h-[200px]" }) {
  return <div className={`${alto} flex items-center justify-center text-white/45 text-sm font-mono text-center px-4`}>{children}</div>;
}
