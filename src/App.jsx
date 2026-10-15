import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import DelfinaDashboard from "./components/DelfinaDashboard";
import Login from "./components/Login";

function App() {
  const [session, setSession] = useState(undefined); // undefined = todavía no sabemos

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-dvh bg-[#050505]">
      {session === undefined ? null : session ? (
        <DelfinaDashboard email={session.user.email} onSignOut={() => supabase.auth.signOut()} />
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
