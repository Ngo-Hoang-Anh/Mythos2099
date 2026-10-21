import { useState, type FormEvent } from "react";
import { SgIconImg } from "./UiChrome";

/** Temporary: hide account login/register until accounts are ready. */
const SHOW_ACCOUNT_AUTH = false;

export function AuthView({
  busy,
  error,
  onLogin,
  onRegister,
  onGuest,
  onTutorial,
}: {
  busy: boolean;
  error: string | null;
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string) => void;
  onGuest: () => void;
  onTutorial?: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "login") onLogin(username, password);
    else onRegister(username, password);
  }

  return (
    <div className="auth-screen">
      <div className="sg-framed auth-panel">
        <p className="eyebrow">Mythos2099</p>
        <h1>Play</h1>
        <p className="muted">Jump in as a guest to test online matches.</p>
        {SHOW_ACCOUNT_AUTH ? (
          <>
            <button type="button" className="primary" disabled={busy} onClick={onGuest}>
              {busy ? "Connecting…" : "Play as guest"}
            </button>
            <form className="auth-form" onSubmit={submit}>
              <p className="muted auth-optional">{mode === "login" ? "Or sign in" : "Or create an account"}</p>
              <label>
                Username
                <input
                  value={username}
                  autoComplete="username"
                  maxLength={16}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="ghost" disabled={busy || username.trim().length < 3 || password.length < 4}>
                {busy ? "Connecting…" : mode === "login" ? "Sign in" : "Register"}
              </button>
            </form>
            <button
              type="button"
              className="ghost"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
            </button>
            {onTutorial ? (
              <button type="button" className="primary sg-btn-row" onClick={onTutorial}>
                <SgIconImg name="help" tone="gold" size={22} />
                Play tutorial
              </button>
            ) : null}
          </>
        ) : (
          <div className="auth-guest-actions">
            <button type="button" className="primary" disabled={busy} onClick={onGuest}>
              {busy ? "Connecting…" : "Play as guest"}
            </button>
            {error ? <p className="error">{error}</p> : null}
            {onTutorial ? (
              <button type="button" className="primary sg-btn-row" onClick={onTutorial}>
                <SgIconImg name="help" tone="gold" size={22} />
                Play tutorial
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
