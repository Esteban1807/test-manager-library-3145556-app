import { useState } from 'react';
import { useSession } from '../session.jsx';
import { ErrorMessage, SuccessMessage } from '../ui.jsx';

// HU-02 (admin): register a librarian. The API only accepts the role "librarian" (CA-02.3).
export default function Users() {
  const { call } = useSession();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError(null);
    setMessage('');

    try {
      const created = await call('/users', { method: 'POST', body: { ...form, role: 'librarian' } });
      setForm({ username: '', password: '' });
      setMessage(`Se creó el bibliotecario «${created.username}».`);
    } catch (failure) {
      setError(failure);
    }
  }

  return (
    <section>
      <h1>Bibliotecarios</h1>

      <form className="card form-grid" onSubmit={submit}>
        <h2>Dar de alta un bibliotecario</h2>
        <label>
          Nombre de usuario
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            maxLength={120}
            autoComplete="off"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            required
          />
        </label>
        <p className="muted">El nombre se guarda en minúsculas y sin espacios al inicio ni al final.</p>
        <ErrorMessage error={error} />
        <SuccessMessage>{message}</SuccessMessage>
        <div className="form-actions">
          <button type="submit">Crear bibliotecario</button>
        </div>
      </form>
    </section>
  );
}
