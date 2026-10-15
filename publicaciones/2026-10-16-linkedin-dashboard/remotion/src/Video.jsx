import React from "react";
import {
  AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring, Easing,
} from "remotion";
import { loadFont as loadSG } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadJB } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: SG } = loadSG("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
const { fontFamily: JB } = loadJB("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });

// Estética de los carruseles anteriores
const BG = "#04070a";
const GREEN = "#00f48e";
const TEAL = "#16e0a2";
const CYAN = "#00feca";
const RED = "#ff3d57";
const ORANGE = "#ff9933";
const MUTED = "#9aa7a3";
const SOFT = "#c9d4d0";
const CARD = "rgba(14, 24, 22, 0.78)";
const LINE = "rgba(22, 224, 162, 0.28)";

// Datos reales, dashboard_metricas al 15/10/2026
const CLASES_POR_DIA = [
  ["06", 3], ["07", 8], ["08", 6], ["09", 5], ["10", 4],
  ["11", 5], ["12", 3], ["13", 5], ["14", 8], ["15", 2],
];
const QUEJAS = [
  ["Sobre Delfina", 6],
  ["Atención del personal", 2],
  ["Clases y profes", 2],
  ["Cobros y promos", 2],
  ["Horarios", 1],
];

// Escenas: [desde, duración]
const S = {
  hook: [0, 130],
  error: [130, 165],
  flujo: [295, 140],
  clases: [435, 180],
  delfina: [615, 165],
  quejas: [780, 165],
  falta: [945, 135],
  cierre: [1080, 120],
};
export const DURACION = 1200;

const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

// ---------- piezas ----------
const Fondo = () => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 80) * 70;
  const b = Math.cos(f / 100) * 60;
  const blob = (extra) => ({
    position: "absolute", borderRadius: "50%", filter: "blur(150px)", pointerEvents: "none", ...extra,
  });
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <div style={blob({ width: 760, height: 760, left: -260 + a, top: -220 + b, background: GREEN, opacity: 0.22 })} />
      <div style={blob({ width: 680, height: 680, right: -240 - b, bottom: -200 + a, background: CYAN, opacity: 0.18 })} />
      <div
        style={{
          position: "absolute", inset: 0, opacity: 0.55,
          backgroundImage:
            "linear-gradient(rgba(22,224,162,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(22,224,162,.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, #000 30%, transparent 75%)",
          maskImage: "radial-gradient(ellipse at 50% 40%, #000 30%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
};

const useEntrada = (delay = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping: 200 } });
};

const Sube = ({ delay = 0, children, style }) => {
  const p = useEntrada(delay);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)`, ...style }}>{children}</div>
  );
};

const Escena = ({ dur, children }) => {
  const f = useCurrentFrame();
  const salida = interpolate(f, [dur - 14, dur], [1, 0], ease);
  return (
    <AbsoluteFill
      style={{
        padding: "96px 88px 170px", display: "flex", flexDirection: "column",
        opacity: salida, fontFamily: SG, color: "#fff",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Tag = ({ children, color = TEAL, dot = GREEN }) => (
  <Sube style={{ alignSelf: "flex-start" }}>
    <div
      style={{
        fontFamily: JB, fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color,
        display: "inline-flex", alignItems: "center", gap: 14, border: `1px solid ${LINE}`,
        borderRadius: 999, padding: "12px 24px", background: "rgba(6,20,16,.6)",
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: "50%", background: dot, boxShadow: `0 0 14px ${dot}` }} />
      {children}
    </div>
  </Sube>
);

const Card = ({ children, style }) => (
  <div
    style={{
      background: CARD, border: `1px solid ${LINE}`, borderRadius: 32,
      boxShadow: "0 30px 80px rgba(0,0,0,.55), 0 0 60px rgba(0,244,142,.08)", ...style,
    }}
  >
    {children}
  </div>
);

const Numero = ({ to, delay = 0, dur = 45, decimales = 0 }) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [delay, delay + dur], [0, to], { ...ease, easing: Easing.out(Easing.cubic) });
  return <>{v.toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}</>;
};

const Pie = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, DURACION], [0, 1]);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 88px 72px", fontFamily: JB }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#5f6e6a", fontSize: 22, letterSpacing: "0.08em" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, border: `1px solid ${LINE}`, background: "rgba(0,244,142,.07)", display: "grid", placeItems: "center" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: GREEN, boxShadow: `0 0 12px ${GREEN}` }} />
          </div>
          DELFINA · GYMBOX
        </div>
        <span>DATOS REALES · 15/10</span>
      </div>
      <div style={{ marginTop: 22, height: 4, borderRadius: 4, background: "rgba(255,255,255,.06)" }}>
        <div style={{ width: `${p * 100}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${GREEN}, ${CYAN})` }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- escenas ----------
const Hook = () => {
  const f = useCurrentFrame();
  const palabras = "¿Cuántos de esos leads vinieron al gym?".split(" ");
  return (
    <Escena dur={S.hook[1]}>
      <Tag>Dashboard de Delfina</Tag>
      <div style={{ marginTop: "auto", marginBottom: "auto" }}>
        <Sube delay={8}>
          <div style={{ fontFamily: JB, fontSize: 30, color: MUTED, marginBottom: 36 }}>
            La pregunta del dueño del gimnasio:
          </div>
        </Sube>
        <h1 style={{ fontSize: 118, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.0, margin: 0 }}>
          {palabras.map((p, i) => {
            const o = interpolate(f, [22 + i * 6, 34 + i * 6], [0, 1], ease);
            return (
              <span key={i} style={{ opacity: o, display: "inline-block", marginRight: 26, transform: `translateY(${(1 - o) * 24}px)`, color: i >= 4 ? GREEN : "#fff" }}>
                {p}
              </span>
            );
          })}
        </h1>
      </div>
    </Escena>
  );
};

const Problema = () => {
  const f = useCurrentFrame();
  const filas = [
    ["Calificado", false], ["Interesado", true], ["Sin respuesta", false],
    ["Calificado", false], ["Calificado", true], ["Interesado", false],
  ];
  const marca = interpolate(f, [70, 85], [0, 1], ease);
  return (
    <Escena dur={S.error[1]}>
      <Tag color="#ff8a98" dot={RED}>El problema</Tag>
      <Sube delay={6} style={{ marginTop: 60 }}>
        <h1 style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02, margin: 0 }}>
          El dashboard no la contestaba.
        </h1>
      </Sube>
      <Sube delay={16} style={{ marginTop: 28 }}>
        <div style={{ fontSize: 36, color: SOFT, lineHeight: 1.35 }}>
          Adivinaba el estado de cada lead contando mensajes.
        </div>
      </Sube>
      <Sube delay={26} style={{ marginTop: 40 }}>
        <Card style={{ padding: "18px 34px" }}>
          {filas.map(([estado, mal], i) => {
            const rojo = mal ? marca : 0;
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 24, padding: "13px 0",
                  borderBottom: i < filas.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none",
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: 220 - (i % 3) * 40, height: 16, borderRadius: 8, background: "rgba(255,255,255,.16)" }} />
                  <div style={{ width: 140, height: 12, borderRadius: 6, marginTop: 10, background: "rgba(255,255,255,.07)" }} />
                </div>
                <div
                  style={{
                    fontFamily: JB, fontSize: 22, padding: "8px 18px", borderRadius: 999,
                    border: `1px solid ${rojo > 0.5 ? "rgba(255,61,87,.6)" : LINE}`,
                    color: rojo > 0.5 ? "#ff8a98" : TEAL,
                    background: rojo > 0.5 ? "rgba(255,61,87,.12)" : "rgba(0,244,142,.06)",
                    transform: `scale(${1 + Math.sin(rojo * Math.PI) * 0.12})`,
                  }}
                >
                  {rojo > 0.5 ? "✗ estimado" : estado}
                </div>
              </div>
            );
          })}
        </Card>
      </Sube>
      <Sube delay={92} style={{ marginTop: 34 }}>
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.02em", color: RED }}>
          Le erraba en 1 de cada 3.
        </div>
      </Sube>
    </Escena>
  );
};

const Flujo = () => {
  const f = useCurrentFrame();
  const pasos = [
    ["Charla por WhatsApp o Instagram", "La persona pregunta, Delfina contesta"],
    ["Delfina marca la etapa", "Interesado · calificado · clase de prueba"],
    ["Se guarda al instante", "Cada respuesta actualiza el lead"],
    ["El dashboard lo lee", "Sin estimar nada"],
  ];
  const progreso = interpolate(f, [30, 120], [0, 1], ease);
  return (
    <Escena dur={S.flujo[1]}>
      <Tag>La solución</Tag>
      <Sube delay={6} style={{ marginTop: 60 }}>
        <h1 style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02, margin: 0 }}>
          Ahora lee lo que <span style={{ color: GREEN }}>sabe Delfina.</span>
        </h1>
      </Sube>
      <div style={{ position: "relative", marginTop: 64 }}>
        <div style={{ position: "absolute", left: 37, top: 40, bottom: 40, width: 2, background: "rgba(22,224,162,.18)" }} />
        <div style={{ position: "absolute", left: 37, top: 40, width: 2, height: `calc((100% - 80px) * ${progreso})`, background: GREEN, boxShadow: `0 0 12px ${GREEN}` }} />
        {pasos.map(([t, s], i) => {
          const activo = progreso >= i / (pasos.length - 1) - 0.001;
          return (
            <Sube key={i} delay={20 + i * 22} style={{ display: "flex", alignItems: "center", gap: 36, marginBottom: i < 3 ? 34 : 0 }}>
              <div
                style={{
                  width: 76, height: 76, borderRadius: 22, flexShrink: 0, display: "grid", placeItems: "center",
                  fontFamily: JB, fontSize: 30, fontWeight: 700, position: "relative",
                  border: `1px solid ${activo ? GREEN : LINE}`, color: activo ? BG : TEAL,
                  background: activo ? GREEN : "rgba(6,20,16,.9)", boxShadow: activo ? `0 0 30px rgba(0,244,142,.45)` : "none",
                }}
              >
                {i + 1}
              </div>
              <Card style={{ flex: 1, padding: "26px 32px" }}>
                <div style={{ fontSize: 36, fontWeight: 600 }}>{t}</div>
                <div style={{ fontFamily: JB, fontSize: 22, color: MUTED, marginTop: 8 }}>{s}</div>
              </Card>
            </Sube>
          );
        })}
      </div>
    </Escena>
  );
};

const Clases = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const max = 8;
  return (
    <Escena dur={S.clases[1]}>
      <Tag>La pregunta, contestada (casi)</Tag>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 34, marginTop: 70 }}>
        <Sube delay={6}>
          <div style={{ fontSize: 290, fontWeight: 700, lineHeight: 0.85, letterSpacing: "-0.05em", color: GREEN, textShadow: "0 0 60px rgba(0,244,142,.35)" }}>
            <Numero to={49} delay={10} dur={55} />
          </div>
        </Sube>
        <Sube delay={20} style={{ paddingBottom: 18 }}>
          <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.1 }}>clases de prueba<br />confirmadas</div>
          <div style={{ fontFamily: JB, fontSize: 24, color: MUTED, marginTop: 12 }}>desde el 6 de octubre</div>
        </Sube>
      </div>
      <Sube delay={34} style={{ marginTop: 50 }}>
        <Card style={{ padding: "40px 40px 30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: JB, fontSize: 22, color: MUTED, marginBottom: 26 }}>
            <span>Clases de prueba por día</span>
            <span style={{ color: TEAL }}>33 en los últimos 7 días</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 22, height: 360 }}>
            {CLASES_POR_DIA.map(([dia, n], i) => {
              const p = spring({ frame: f - 45 - i * 5, fps, config: { damping: 18, stiffness: 90 } });
              const h = (n / max) * 300 * p;
              return (
                <div key={dia} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  <div style={{ fontFamily: JB, fontSize: 24, color: "#fff", opacity: p, marginBottom: 10 }}>{n}</div>
                  <div style={{ width: "100%", maxWidth: 58, height: h, borderRadius: "12px 12px 4px 4px", background: `linear-gradient(180deg, ${GREEN}, rgba(0,244,142,.25))`, boxShadow: "0 0 24px rgba(0,244,142,.25)" }} />
                  <div style={{ fontFamily: JB, fontSize: 20, color: MUTED, marginTop: 14 }}>{dia}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </Sube>
      <Sube delay={100} style={{ marginTop: 34 }}>
        <div style={{ fontSize: 32, color: SOFT, lineHeight: 1.35 }}>
          Cada vez que Delfina confirma una clase, se cuenta sola.
        </div>
      </Sube>
    </Escena>
  );
};

const Pestanas = ({ activa, desde }) => {
  const f = useCurrentFrame();
  const tabs = ["Leads", "Quejas", "Delfina"];
  const x = interpolate(f, [10, 34], [desde, activa], { ...ease, easing: Easing.inOut(Easing.cubic) });
  const ancho = 270;
  return (
    <Sube style={{ marginTop: 50 }}>
      <div style={{ position: "relative", display: "flex", padding: 8, borderRadius: 24, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", width: ancho * 3 + 16 }}>
        <div style={{ position: "absolute", top: 8, left: 8 + x * ancho, width: ancho, height: 72, borderRadius: 18, background: "rgba(0,244,142,.14)", border: `1px solid ${GREEN}` }} />
        {tabs.map((t, i) => (
          <div key={t} style={{ width: ancho, height: 72, display: "grid", placeItems: "center", fontSize: 30, fontWeight: 600, position: "relative", color: Math.round(x) === i ? GREEN : MUTED }}>
            {t}
          </div>
        ))}
      </div>
    </Sube>
  );
};

const Kpi = ({ valor, sufijo = "", etiqueta, delay, color = "#fff" }) => (
  <Sube delay={delay}>
    <Card style={{ padding: "26px 32px", height: 178, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color }}>
        <Numero to={valor} delay={delay + 6} />{sufijo}
      </div>
      <div style={{ fontFamily: JB, fontSize: 22, color: MUTED, lineHeight: 1.3 }}>{etiqueta}</div>
    </Card>
  </Sube>
);

const DelfinaTab = () => (
  <Escena dur={S.delfina[1]}>
    <Tag>Pestaña Delfina · últimos 7 días</Tag>
    <Sube delay={4} style={{ marginTop: 50 }}>
      <h1 style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.04, margin: 0 }}>
        Cómo trabaja Delfina, <span style={{ color: GREEN }}>sin preguntarle a nadie.</span>
      </h1>
    </Sube>
    <Pestanas activa={2} desde={0} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 36 }}>
      <Kpi valor={996} etiqueta="mensajes recibidos" delay={30} />
      <Kpi valor={238} etiqueta="personas distintas" delay={38} />
      <Kpi valor={17} sufijo=" s" etiqueta="demora mediana en responder" delay={46} color={GREEN} />
      <Kpi valor={12} sufijo=" h" etiqueta="hora pico de mensajes" delay={54} />
      <Kpi valor={0} etiqueta="charlas trabadas" delay={62} color={GREEN} />
      <Kpi valor={0} etiqueta="respuestas de emergencia" delay={70} color={GREEN} />
    </div>
  </Escena>
);

const QuejasTab = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Escena dur={S.quejas[1]}>
      <Tag color="#ffc285" dot={ORANGE}>Pestaña Quejas · desde el 5/10</Tag>
      <Sube delay={4} style={{ marginTop: 50 }}>
        <h1 style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.04, margin: 0 }}>
          <Numero to={13} delay={8} dur={30} /> quejas detectadas.
        </h1>
      </Sube>
      <Pestanas activa={1} desde={2} />
      <Sube delay={26} style={{ marginTop: 36 }}>
        <Card style={{ padding: "40px 40px 20px" }}>
          {QUEJAS.map(([cat, n], i) => {
            const p = spring({ frame: f - 34 - i * 6, fps, config: { damping: 200 } });
            const destacada = i === 0;
            return (
              <div key={cat} style={{ marginBottom: 26 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, marginBottom: 12, color: destacada ? "#fff" : SOFT, fontWeight: destacada ? 600 : 400 }}>
                  <span>{cat}</span>
                  <span style={{ fontFamily: JB, color: destacada ? ORANGE : MUTED }}>{n}</span>
                </div>
                <div style={{ height: 18, borderRadius: 9, background: "rgba(255,255,255,.05)" }}>
                  <div style={{ width: `${(n / 6) * 100 * p}%`, height: "100%", borderRadius: 9, background: destacada ? `linear-gradient(90deg, ${ORANGE}, ${RED})` : "rgba(22,224,162,.55)" }} />
                </div>
              </div>
            );
          })}
        </Card>
      </Sube>
      <Sube delay={90} style={{ marginTop: 36 }}>
        <div style={{ fontSize: 38, lineHeight: 1.3, color: SOFT }}>
          La que más quejas recibe es <span style={{ color: ORANGE, fontWeight: 700 }}>la propia Delfina.</span> Por eso se leen todas.
        </div>
      </Sube>
    </Escena>
  );
};

const Falta = () => (
  <Escena dur={S.falta[1]}>
    <Tag>Lo que todavía no sé</Tag>
    <div style={{ marginTop: "auto", marginBottom: "auto" }}>
      <Sube delay={8}>
        <h1 style={{ fontSize: 100, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.0, margin: 0 }}>
          Cuántos de esos <span style={{ color: GREEN }}>49</span> cruzaron la puerta.
        </h1>
      </Sube>
      <Sube delay={30} style={{ marginTop: 44 }}>
        <div style={{ fontSize: 40, color: SOFT, lineHeight: 1.35 }}>
          Eso lo sabe la recepción, no el WhatsApp.<br />Es la próxima pieza.
        </div>
      </Sube>
    </div>
  </Escena>
);

const Cierre = () => (
  <Escena dur={S.cierre[1] + 14}>
    <div style={{ marginTop: "auto", marginBottom: "auto" }}>
      <Sube delay={4}>
        <div style={{ fontFamily: JB, fontSize: 28, color: TEAL, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 40 }}>
          La lección
        </div>
      </Sube>
      <Sube delay={12}>
        <h1 style={{ fontSize: 86, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, margin: 0 }}>
          Un dashboard con números aproximados te da confianza en algo{" "}
          <span style={{ color: GREEN }}>que no es cierto.</span>
        </h1>
      </Sube>
    </div>
  </Escena>
);

export const Video = () => (
  <AbsoluteFill>
    <Fondo />
    <Sequence from={S.hook[0]} durationInFrames={S.hook[1]}><Hook /></Sequence>
    <Sequence from={S.error[0]} durationInFrames={S.error[1]}><Problema /></Sequence>
    <Sequence from={S.flujo[0]} durationInFrames={S.flujo[1]}><Flujo /></Sequence>
    <Sequence from={S.clases[0]} durationInFrames={S.clases[1]}><Clases /></Sequence>
    <Sequence from={S.delfina[0]} durationInFrames={S.delfina[1]}><DelfinaTab /></Sequence>
    <Sequence from={S.quejas[0]} durationInFrames={S.quejas[1]}><QuejasTab /></Sequence>
    <Sequence from={S.falta[0]} durationInFrames={S.falta[1]}><Falta /></Sequence>
    <Sequence from={S.cierre[0]} durationInFrames={S.cierre[1]}><Cierre /></Sequence>
    <Pie />
  </AbsoluteFill>
);
