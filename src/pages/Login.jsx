import { useState } from 'react';
import { useSession } from '../session.jsx';
import { ErrorMessage } from '../ui.jsx';

// HU-01: sign in. The API never says whether the user or the password was wrong (CA-01.2).
export default function Login() {
  const { login } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      await login(username, password);
    } catch (failure) {
      setError(failure);
      setSending(false);
    }
  }

  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <h1>Manager Library</h1>
        <p className="muted">Inicia sesión para gestionar el catálogo, los socios y los préstamos.</p>

        <label>
          Usuario
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required autoFocus />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <ErrorMessage error={error} />

        <button type="submit" disabled={sending}>
          {sending ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
