type Props = {
  busy: boolean;
  error: string | null;
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string) => void;
  onGuest: () => void;
  onTutorial: () => void;
};

/** Mobile-only auth layout (landscape-first). Not shared with desktop AuthView. */
export function MobileAuthView({ busy, error, onLogin, onRegister, onGuest, onTutorial }: Props) {
  return (
    <div className="mobile-auth">
      <div className="mobile-auth-panel sg-framed">
        <button
          type="button"
          className="primary mobile-auth-guest"
          disabled={busy}
          onClick={onGuest}
        >
          Play as guest
        </button>
        <p className="muted mobile-auth-or">Or sign in / register</p>
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onLogin(String(fd.get("username") ?? ""), String(fd.get("password") ?? ""));
          }}
        >
          <label>
            Username
            <input name="username" autoComplete="username" required disabled={busy} />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={busy}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="mobile-auth-actions">
            <button type="submit" className="primary" disabled={busy}>
              Sign in
            </button>
            <button
              type="button"
              className="ghost"
              disabled={busy}
              onClick={(e) => {
                const form = e.currentTarget.form;
                if (!form) return;
                const fd = new FormData(form);
                onRegister(String(fd.get("username") ?? ""), String(fd.get("password") ?? ""));
              }}
            >
              Register
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={onTutorial}>
              Tutorial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
