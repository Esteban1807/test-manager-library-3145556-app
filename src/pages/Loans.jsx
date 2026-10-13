import { useState } from 'react';
import { useSession } from '../session.jsx';
import { ErrorMessage, Pagination, STATUS_LABELS, StatusBadge, SuccessMessage, formatDate, useLoad } from '../ui.jsx';

// HU-07 and HU-08: list loans by status and dates, and return one line at a time.
export default function Loans() {
  const { call } = useSession();
  const [filters, setFilters] = useState({ status: '', from: '', to: '', page: 1 });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const loans = useLoad(() => call('/loans', { query: { ...filters, size: 10 } }), [filters]);

  const set = (field) => (event) => setFilters({ ...filters, [field]: event.target.value, page: 1 });

  async function returnItem(loan, item) {
    setError(null);
    setMessage('');

    try {
      await call(`/loans/${loan.id}/items/${item.id}/return`, { method: 'POST' });
      setMessage(`Se registró la devolución de «${item.book_title}».`);
      loans.reload();
    } catch (failure) {
      setError(failure);
    }
  }

  return (
    <section>
      <h1>Préstamos</h1>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Estado
          <select value={filters.status} onChange={set('status')}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Desde
          <input type="date" value={filters.from} onChange={set('from')} />
        </label>
        <label>
          Hasta
          <input type="date" value={filters.to} onChange={set('to')} />
        </label>
      </form>

      <SuccessMessage>{message}</SuccessMessage>
      <ErrorMessage error={error ?? loans.error} />

      {loans.data && loans.data.items.length === 0 && <p className="empty">No hay préstamos con esos filtros.</p>}

      {loans.data?.items.map((loan) => (
        <article className="card loan" key={loan.id}>
          <header>
            <span>Prestado el {formatDate(loan.loaned_at)}</span>
            <StatusBadge status={loan.status} />
          </header>
          <table>
            <thead>
              <tr>
                <th>Libro</th>
                <th>Categoría</th>
                <th>Vence</th>
                <th>Devolución</th>
              </tr>
            </thead>
            <tbody>
              {loan.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.book_title}</td>
                  <td>{item.category_name}</td>
                  <td>{formatDate(item.due_at)}</td>
                  <td>
                    {item.returned_at ? (
                      `Devuelto el ${formatDate(item.returned_at)}`
                    ) : (
                      <button type="button" onClick={() => returnItem(loan, item)}>
                        Registrar devolución
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ))}

      {loans.data && loans.data.total > 0 && (
        <Pagination
          page={loans.data.page}
          size={loans.data.size}
          total={loans.data.total}
          onPage={(page) => setFilters({ ...filters, page })}
        />
      )}
    </section>
  );
}
