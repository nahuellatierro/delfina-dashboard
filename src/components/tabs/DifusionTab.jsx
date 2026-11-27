import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

import { C, btnSecundario, glass } from "../../lib/theme";
import { fmt, formatDate, haceCuanto, normalizar } from "../../lib/format";
import { KPI, Card, ChartTooltip, FilterPill, FilterGroup, SinDatos } from "../ui";

const FEED_PAGE = 30;

const INTENCION = {
  quiere_volver: { label: "Quiere volver", cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  volvera_mas_adelante: { label: "Volverá más adelante", cls: "bg-blue-400/10 border-blue-400/20 text-blue-400" },
  dio_motivo: { label: "Dio un motivo", cls: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
  no_vuelve: { label: "No vuelve", cls: "bg-red-500/10 border-red-500/20 text-red-400" },
  pidio_baja: { label: "Pidió la baja", cls: "bg-red-500/10 border-red-500/20 text-red-400" },
  ya_renovo: { label: "Ya renovó", cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  solo_agradece: { label: "Solo agradece", cls: "bg-slate-400/10 border-slate-400/20 text-slate-300" },
  sin_dato: { label: "Sin dato", cls: "bg-slate-400/10 border-slate-400/20 text-slate-300" },
};

const MOTIVO = {
  trabajo_tiempo: "Trabajo / estudio / tiempo", lesion_salud: "Lesión / salud", duelo_personal: "Duelo / personal",
  falta_motivacion: "Falta de motivación", precio: "Precio", mudanza: "Mudanza", horarios: "Horarios",
  distancia_ubicacion: "Distancia / ubicación", entrena_en_otro_lado: "Entrena en otro lado",
  queja_servicio: "Queja del servicio", otro: "Otro", sin_motivo: "No dijo por qué",
};

const SEGUIMIENTO = {
  pendiente: { label: "Pendiente", cls: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
  contactado: { label: "Contactado", cls: "bg-blue-400/10 border-blue-400/20 text-blue-400" },
  volvio: { label: "Volvió", cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
};

const FILTROS_INTENCION = ["quiere_volver", "volvera_mas_adelante", "dio_motivo", "no_vuelve", "pidio_baja", "solo_agradece"];

const intencionLabel = (k) => INTENCION[k]?.label || k || "—";
const motivoLabel = (k) => MOTIVO[k] || k || "—";

function Etiqueta({ cls, children }) {
  return <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium border ${cls}`}>{children}</span>;
}

function Celular({ numero }) {
  if (!numero) return <span className="text-[11px] text-white/45">Sin celular</span>;
  const digitos = String(numero).replace(/\D/g, "");
  return (
    <a
      href={`https://wa.me/${digitos}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[11px] text-emerald-400 tabular-nums hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded"
    >
      {numero}
    </a>
  );
}

// Una celda de CSV: comillas dobles escapadas y sin fórmulas (=, +, -, @) para que Excel no las ejecute.
function celdaCsv(valor) {
  let s = String(valor ?? "").replace(/\r?\n/g, " ");
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

// Celular para el CSV: "54 9 11 6643-6388". Sin "+" adelante, así Excel lo deja como texto y no lo toma por fórmula.
function celularCsv(numero) {
  const d = String(numero || "").replace(/\D/g, "");
  if (/^549\d{10}$/.test(d)) return `${d.slice(0, 2)} ${d.slice(2, 3)} ${d.slice(3, 5)} ${d.slice(5, 9)}-${d.slice(9)}`;
  return d;
}

// completo=false: lista de "quieren volver". completo=true: agrega intención, motivo y queja (para lo filtrado).
function descargarCsv(filas, archivo, completo = false) {
  const cols = ["Nombre", "Celular", "Segmento"]
    .concat(completo ? ["Intención", "Motivo", "Queja"] : [])
    .concat(["Qué dijo", "Cita", "Último mensaje"]);
  const lineas = [cols.map(celdaCsv).join(",")].concat(
    filas.map(f => [f.nombre, celularCsv(f.celular), f.segmento]
      .concat(completo ? [intencionLabel(f.intencion), motivoLabel(f.motivo), f.tema_queja] : [])
      .concat([f.resumen, f.cita, formatDate(f.ultimo_mensaje_at)])
      .map(celdaCsv).join(","))
  );
  // BOM para que Excel respete las tildes
  const blob = new Blob(["﻿" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = archivo;
  a.click();
  URL.revokeObjectURL(url);
}

function Barras({ datos, color, vacio }) {
  if (!datos.length) return <SinDatos alto="h-[120px]">{vacio}</SinDatos>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, datos.length * 34)}>
      <BarChart data={datos} layout="vertical" barSize={16} margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} horizontal={false} />
        <XAxis type="number" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} axisLine={false} tickLine={false} width={150} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="count" name="Personas" radius={[0, 6, 6, 0]}>
          {datos.map((d, i) => <Cell key={i} fill={d.color || color} opacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const porcentaje = (n, total) => (total > 0 ? `${Math.round((n / total) * 100)} %` : "—");

const ORDEN_SEGMENTOS = ["A", "B", "C", "tibio"];
const DIAS_EN_CURSO = 14;

const fechaCorta = (iso) => (iso ? new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : "");
const nombreDifusion = (x) => `Difusión ${x.numero}${x.enviada_at ? ` · ${fechaCorta(x.enviada_at)}` : ""}`;
const enCurso = (iso) => iso && Date.now() - new Date(iso).getTime() < DIAS_EN_CURSO * 24 * 60 * 60 * 1000;

// Comparación de todas las difusiones (totales de cada una, sin el filtro de período)
function Comparacion({ difusiones, actual }) {
  if (difusiones.length < 2) return null;
  const cols = ["Difusión", "Enviados", "Entregados", "Leídos", "Respondieron", "Quieren volver"];
  return (
    <Card title="Comparación entre difusiones" className="mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <caption className="sr-only">Comparación de resultados entre difusiones</caption>
          <thead>
            <tr className="border-b border-white/[0.06]">
              {cols.map(h => (
                <th key={h} scope="col" className="pb-3 pr-4 text-left text-[10px] uppercase tracking-[1.5px] text-white/50 font-mono font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {difusiones.map(x => (
              <tr key={x.campana} className={`border-b border-white/[0.04] ${x.campana === actual ? "bg-emerald-500/[0.04]" : ""}`}>
                <th scope="row" className="py-3 pr-4 text-left font-medium text-white/80">
                  {nombreDifusion(x)}
                  {enCurso(x.enviada_at) && <span className="ml-2 text-[11px] font-normal text-yellow-300/80">en curso</span>}
                </th>
                <td className="py-3 pr-4 text-white/70">{fmt(x.enviados)}</td>
                <td className="py-3 pr-4 text-white/70">{fmt(x.entregados)} <span className="text-white/45">({porcentaje(x.entregados, x.enviados)})</span></td>
                <td className="py-3 pr-4 text-white/70">{fmt(x.leidos)} <span className="text-white/45">({porcentaje(x.leidos, x.entregados)})</span></td>
                <td className="py-3 pr-4 text-white/70">{fmt(x.respondieron)} <span className="text-white/45">({porcentaje(x.respondieron, x.entregados)})</span></td>
                <td className="py-3 pr-4 text-emerald-400">{fmt(x.quieren_volver)} <span className="text-white/45">({porcentaje(x.quieren_volver, x.respondieron)})</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-white/50 text-pretty">
        Entregados sobre enviados; leídos y respondieron sobre entregados; quieren volver sobre los que respondieron.
        Una difusión “en curso” todavía recibe respuestas.
      </p>
    </Card>
  );
}

function DifusionTab({ m, onCampana }) {
  const filas = useMemo(() => m.filas || [], [m.filas]);
  const difusiones = useMemo(() => m.difusiones || [], [m.difusiones]);
  const numero = m.numero ?? "";
  const [intencion, setIntencion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [search, setSearch] = useState("");
  const [limite, setLimite] = useState(FEED_PAGE);

  const quierenVolver = useMemo(() => filas.filter(f => f.intencion === "quiere_volver"), [filas]);

  const motivos = useMemo(
    () => Object.entries(m.por_motivo || {})
      .map(([k, n]) => ({ key: k, name: motivoLabel(k), count: n, color: k === "sin_motivo" ? C.slate : undefined }))
      .sort((a, b) => (a.key === "sin_motivo") - (b.key === "sin_motivo") || b.count - a.count),
    [m.por_motivo]
  );
  const quejas = useMemo(
    () => Object.entries(m.por_tema_queja || {}).map(([k, n]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), count: n })).sort((a, b) => b.count - a.count),
    [m.por_tema_queja]
  );

  const visibles = useMemo(() => {
    const q = normalizar(search.trim());
    return filas.filter(f =>
      (!intencion || f.intencion === intencion) &&
      (!motivo || f.motivo === motivo) &&
      (!q || normalizar(`${f.nombre || ""} ${f.celular || ""}`).includes(q))
    );
  }, [filas, intencion, motivo, search]);

  const motivosFiltro = motivos.map(x => x.key);
  const seg = m.por_segmento || {};
  const entregados = Number(m.entregados) || 0;
  const respondieron = Number(m.respondieron) || 0;

  // Enviados por segmento de la difusión elegida (A, B, C, tibio: los que tenga)
  const enviadosSeg = useMemo(() => {
    const t = {};
    for (const c of m.campanas || []) t[c.segmento] = (t[c.segmento] || 0) + Number(c.enviados || 0);
    return ORDEN_SEGMENTOS.filter(s => t[s]).map(s => ({ s, enviados: t[s] }));
  }, [m.campanas]);
  const subEnviados = enviadosSeg.map(x => `${x.s} ${fmt(x.enviados)}`).join(" · ");

  const cambiarDifusion = (campana) => {
    setIntencion(""); setMotivo(""); setSearch(""); setLimite(FEED_PAGE);
    onCampana?.(campana);
  };

  return (
    <>
      {difusiones.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <FilterGroup label="Difusión">
            {difusiones.map(x => (
              <FilterPill key={x.campana} label={nombreDifusion(x)} active={x.campana === m.campana} onClick={() => cambiarDifusion(x.campana)} />
            ))}
          </FilterGroup>
          {m.enviada_at && (
            <p className="text-xs text-white/55 text-pretty">
              Enviada el {new Date(m.enviada_at).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              {enCurso(m.enviada_at) ? " · todavía entran respuestas" : ""}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="Enviados" value={fmt(m.enviados)} sub={subEnviados || undefined} />
        <KPI label="Entregados" value={fmt(m.entregados)} sub={`${porcentaje(entregados, Number(m.enviados))} de los enviados`} />
        <KPI label="Respondieron" value={fmt(m.respondieron)} sub={`${porcentaje(respondieron, entregados)} de los entregados`} />
        <KPI label="Quieren volver" value={fmt(m.quieren_volver)} sub={`${porcentaje(Number(m.quieren_volver), respondieron)} de los que respondieron`} accent />
        <KPI label="Volverán después" value={fmt(m.volveran_mas_adelante)} sub="dijeron cuándo o por qué" />
        <KPI label="Bajas" value={fmt(m.bajas)} sub="sacarlos de ManyChat" tone={m.bajas ? "text-red-400" : undefined} />
      </div>

      <Comparacion difusiones={difusiones} actual={m.campana} />

      <div className={`${glass} p-6 mb-4`}>
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-[13px] uppercase tracking-[1.5px] text-white/40 font-mono tabular-nums">
            Quieren volver ({fmt(quierenVolver.length)})
          </h3>
          {quierenVolver.length > 0 && (
            <button type="button" onClick={() => descargarCsv(quierenVolver, `quieren-volver-difusion-${numero}.csv`)} className={`${btnSecundario} self-start sm:self-auto`}>
              Descargar CSV
            </button>
          )}
        </div>
        <p className="mb-4 -mt-2 text-xs text-white/50 text-pretty">
          Incluye a quien dice que quiere volver, pregunta el precio, pide el alias o pregunta cómo anotarse. El CSV trae nombre, celular, segmento y qué dijo.
        </p>
        {quierenVolver.length === 0 ? (
          <SinDatos alto="h-[120px]">Todavía no hay respuestas de este tipo</SinDatos>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[1fr_1fr_2fr_0.7fr_0.8fr] gap-3 px-4 pb-3 border-b border-white/[0.06]">
              {["Nombre", "Celular", "Qué dijo", "Cuándo", "Seguimiento"].map(h => (
                <span key={h} className="text-[10px] uppercase tracking-[1.5px] text-white/50 font-mono">{h}</span>
              ))}
            </div>
            <ul>
              {quierenVolver.map(f => {
                const seguimiento = SEGUIMIENTO[f.seguimiento] || SEGUIMIENTO.pendiente;
                return (
                  <li key={`${f.campana}-${f.session_id}`} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr_0.7fr_0.8fr] gap-2 lg:gap-3 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <span className="flex items-center text-sm text-white/80 font-medium">{f.nombre || "Sin nombre"}</span>
                    <span className="flex items-center"><Celular numero={f.celular} /></span>
                    <div className="flex flex-col justify-center">
                      <span className="text-sm text-white/70 text-pretty">{f.resumen || "Sin resumen"}</span>
                      {f.cita && <span className="text-xs italic text-white/55 text-pretty">“{f.cita}”</span>}
                    </div>
                    <span className="flex items-center text-xs text-white/55 font-mono" title={formatDate(f.ultimo_mensaje_at)}>{haceCuanto(f.ultimo_mensaje_at)}</span>
                    <span className="flex items-center"><Etiqueta cls={seguimiento.cls}>{seguimiento.label}</Etiqueta></span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
        <Card title="Por qué dejaron de venir">
          <Barras datos={motivos} color={C.blue} vacio="Todavía no hay respuestas" />
          <p className="mt-4 text-xs text-white/50 text-pretty">
            Un motivo por persona (el principal). “No dijo por qué” incluye a quien solo pregunta el precio.
          </p>
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Quejas y sugerencias concretas">
            <Barras datos={quejas} color={C.orange} vacio="Nadie mencionó quejas" />
            <p className="mt-4 text-xs text-white/50 text-pretty">Aparecen aunque el motivo principal sea otro.</p>
          </Card>

          <Card title="Respuestas por segmento">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {(enviadosSeg.length ? enviadosSeg : [{ s: "A" }, { s: "B" }, { s: "C" }]).map(({ s, enviados }) => (
                <div key={s}>
                  <dt className="text-xs text-white/55">{s}{enviados ? ` · ${fmt(enviados)} enviados` : ""}</dt>
                  <dd className="font-semibold text-white/85 tabular-nums">{fmt(seg[s] || 0)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-white/50 text-pretty">El segmento de cada respuesta es el que tenía el contacto en ManyChat.</p>
          </Card>
        </div>
      </div>

      <div className={`${glass} p-6 mb-6`}>
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-[13px] uppercase tracking-[1.5px] text-white/40 font-mono tabular-nums">
            Todas las respuestas ({fmt(visibles.length)})
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {visibles.length > 0 && (
              <button type="button" onClick={() => descargarCsv(visibles, `respuestas-difusion-${numero}.csv`, true)} className={`${btnSecundario} tabular-nums`}>
                Descargar CSV ({fmt(visibles.length)})
              </button>
            )}
          <div className="sm:w-64">
            <label htmlFor="buscar-difusion" className="sr-only">Buscar por nombre o celular</label>
            <input
              id="buscar-difusion"
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setLimite(FEED_PAGE); }}
              placeholder="Buscar por nombre o celular…"
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-white/90 placeholder:text-white/40 focus:border-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>
          </div>
        </div>

        <div className="flex gap-6 flex-wrap mb-5">
          <FilterGroup label="Intención">
            <FilterPill label="Todas" active={!intencion} onClick={() => { setIntencion(""); setLimite(FEED_PAGE); }} />
            {FILTROS_INTENCION.map(k => (
              <FilterPill key={k} label={intencionLabel(k)} active={intencion === k} onClick={() => { setIntencion(k); setLimite(FEED_PAGE); }} />
            ))}
          </FilterGroup>
          <FilterGroup label="Motivo">
            <FilterPill label="Todos" active={!motivo} onClick={() => { setMotivo(""); setLimite(FEED_PAGE); }} />
            {motivosFiltro.map(k => (
              <FilterPill key={k} label={motivoLabel(k)} active={motivo === k} onClick={() => { setMotivo(k); setLimite(FEED_PAGE); }} />
            ))}
          </FilterGroup>
        </div>

        <div className="hidden lg:grid grid-cols-[1fr_0.4fr_0.9fr_0.9fr_0.9fr_1.6fr_0.4fr] gap-3 px-4 pb-3 border-b border-white/[0.06]">
          {["Persona", "Seg.", "Intención", "Motivo", "Queja", "Resumen", "Conf."].map(h => (
            <span key={h} className="text-[10px] uppercase tracking-[1.5px] text-white/50 font-mono">{h}</span>
          ))}
        </div>

        {visibles.length === 0 ? (
          <div className="py-12 text-center text-white/40 text-sm font-mono">
            {filas.length === 0 ? "Todavía no hay respuestas clasificadas" : "Ninguna respuesta coincide con estos filtros"}
          </div>
        ) : (
          <ul>
            {visibles.slice(0, limite).map(f => {
              const conf = f.confianza == null ? null : Number(f.confianza);
              return (
                <li key={`${f.campana}-${f.session_id}`} className="grid grid-cols-1 lg:grid-cols-[1fr_0.4fr_0.9fr_0.9fr_0.9fr_1.6fr_0.4fr] gap-2 lg:gap-3 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm text-white/80 font-medium">{f.nombre || "Sin nombre"}</span>
                    <Celular numero={f.celular} />
                  </div>
                  <span className="flex items-center text-sm font-mono text-white/40">{f.segmento || "—"}</span>
                  <span className="flex items-center"><Etiqueta cls={INTENCION[f.intencion]?.cls || INTENCION.sin_dato.cls}>{intencionLabel(f.intencion)}</Etiqueta></span>
                  <span className="flex items-center text-sm text-white/60">{motivoLabel(f.motivo)}</span>
                  <span className="flex items-center">
                    {f.tema_queja
                      ? <Etiqueta cls="bg-orange-400/10 border-orange-400/20 text-orange-400">{f.tema_queja}</Etiqueta>
                      : <span className="text-sm text-white/45">—</span>}
                  </span>
                  <div className="flex flex-col justify-center">
                    <span className="text-sm text-white/70 text-pretty">{f.resumen || "Sin resumen"}</span>
                    {f.cita && <span className="text-xs italic text-white/55 text-pretty">“{f.cita}”</span>}
                  </div>
                  <span className={`flex items-center text-sm font-mono tabular-nums ${conf != null && conf < 0.7 ? "text-yellow-400" : "text-white/50"}`}>
                    {conf == null ? "—" : String(conf.toFixed(2)).replace(".", ",")}
                    {conf != null && conf < 0.7 && <span className="sr-only"> (confianza baja, revisar)</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-xs text-white/50 text-pretty">
          La confianza menor a 0,7 se marca en amarillo: son las filas para revisar a mano.
        </p>
        {visibles.length > limite && (
          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setLimite(n => n + FEED_PAGE)}
              className="px-4 py-2 rounded-xl text-xs font-medium tabular-nums border bg-white/[0.03] border-white/[0.08] text-white/60 hover:bg-white/[0.06] hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-colors cursor-pointer"
            >
              Ver {Math.min(FEED_PAGE, visibles.length - limite)} más ({fmt(visibles.length - limite)} restantes)
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default DifusionTab;
