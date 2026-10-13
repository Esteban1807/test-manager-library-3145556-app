import { useState } from 'react';
import { useSession } from '../session.jsx';
import { ErrorMessage, Pagination, SuccessMessage, useLoad } from '../ui.jsx';

// HU-05: list, search and register members. Members are never deleted (CA-05.3).
export default function Members() {
  const { call } = useSession();
  const [filters, setFilters] = useState({ q: '', page: 1 });
  const [form, setForm] = useState({ full_name: '', document_number: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [activeLoans, setActiveLoans] = useState({});

  const members = useLoad(() => call('/members', { query: { ...filters, size: 10 } }), [filters]);

  async function submit(event) {
    event.preventDefault();
    setError(null);
    setMessage('');

    try {
      const created = await call('/members', { method: 'POST', body: form });
      setForm({ full_name: '', document_number: '' });
      setMessage(`Se registró a ${created.full_name}.`);
      members.reload();
    } catch (failure) {
      setError(failure);
    }
  }

  async function showActiveLoans(member) {
    const detail = await call(`/members/${member.id}`);
    setActiveLoans((previous) => ({ ...previous, [member.id]: detail.active_loans }));
  }

  return (
    <section>
      <h1>Socios</h1>

      <form className="card form-grid" onSubmit={submit}>
        <h2>Registrar socio</h2>
        <label>
          Nombre completo
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            maxLength={200}
            required
          />
        </label>
        <label>
          Documento
          <input
            value={form.document_number}
            onChange={(e) => setForm({ ...form, document_number: e.target.value })}
            maxLength={30}
            required
          />
        </label>
        <ErrorMessage error={error} />
        <SuccessMessage>{message}</SuccessMessage>
        <div className="form-actions">
          <button type="submit">Registrar socio</button>
        </div>
      </form>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Buscar por nombre o documento
          <input type="search" value={filters.q} onChange={(e) => setFilters({ q: e.target.value, page: 1 })} />
        </label>
      </form>

      <ErrorMessage error={members.error} />

      {members.data && members.data.items.length === 0 && <p className="empty">No hay socios que coincidan con la búsqueda.</p>}

      {members.data && members.data.items.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Libros sin devolver</th>
              </tr>
            </thead>
            <tbody>
              {members.data.items.map((member) => (
                <tr key={member.id}>
                  <td>{member.full_name}</td>
                  <td className="mono">{member.document_number}</td>
                  <td>
                    {activeLoans[member.id] !== undefined ? (
                      `${activeLoans[member.id]} de 3`
                    ) : (
                      <button type="button" className="button-secondary" onClick={() => showActiveLoans(member)}>
                        Consultar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={members.data.page}
            size={members.data.size}
            total={members.data.total}
            onPage={(page) => setFilters({ ...filters, page })}
          />
        </>
      )}
    </section>
  );
}
