import { useState } from "react";
import { supabase } from "../lib/supabase";

const glass = "relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]";

function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    });
    if (otpError) {
      setStatus("error");
      setError("No pudimos mandar el link. Revisá el mail o pedile acceso a Nahuel.");
      return;
    }
    setStatus("sent");
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className={`${glass} w-full max-w-sm p-8`}>
        <h1 className="text-2xl font-bold tracking-tight text-balance text-white/95">Delfina Dashboard</h1>
        <p className="mt-1.5 text-sm text-pretty text-white/50">Entrá con el link que te mandamos por mail.</p>

        {status === "sent" ? (
          <p role="status" className="mt-6 text-sm text-pretty text-emerald-400">
            Listo. Si {email} tiene acceso, en un minuto te llega el link para entrar.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-[1.5px] text-white/50">
              Mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={status === "error"}
              aria-describedby={status === "error" ? "login-error" : undefined}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              placeholder="nombre@mail.com"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-1 cursor-pointer rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-wait disabled:opacity-60"
            >
              {status === "sending" ? "Mandando…" : "Mandarme el link"}
            </button>
            {status === "error" && (
              <p id="login-error" role="alert" className="text-sm text-red-400">{error}</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

export default Login;
