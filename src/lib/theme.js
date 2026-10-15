// ── Colores Recharts ─────────────────────────────────────────────
export const C = {
  accent: "#34d399", blue: "#60a5fa", orange: "#fb923c",
  purple: "#c084fc", red: "#f87171", yellow: "#fbbf24",
  cyan: "#22d3ee", slate: "#94a3b8", textDim: "rgba(255,255,255,0.45)",
  gridLine: "rgba(255,255,255,0.06)",
};

// ── Glass tokens ─────────────────────────────────────────────────
export const glass = "relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]";
export const glassHover = `${glass} transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.12] hover:shadow-[0_8px_40px_rgba(52,211,153,0.08),inset_0_1px_0_rgba(255,255,255,0.1)]`;

// Botón secundario (Actualizar, Salir, Ver la lista…)
export const btnSecundario = "px-3.5 py-1.5 rounded-xl text-xs font-medium border bg-white/[0.03] border-white/[0.08] text-white/70 hover:bg-white/[0.06] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-colors cursor-pointer";
