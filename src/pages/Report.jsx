import { useState } from 'react';
import { useSession } from '../session.jsx';
import { ErrorMessage, daysAgoIso, todayIso, useLoad } from '../ui.jsx';

// HU-10 (admin): most borrowed books in a date range. No members and no librarians here (CA-10.3).
export default function Report() {
  const { call } = useSession();
  const [range, setRange] = useState({ from: daysAgoIso(30), to: todayIso() });

  const report = useLoad(() => call('/reports/most-borrowed', { query: range }), [range]);

  return (
    <section>
      <h1>Libros más prestados</h1>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Desde
          <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} required />
        </label>
        <label>
          Hasta
          <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} required />
        </label>
      </form>

      <ErrorMessage error={report.error} />

      {report.data && report.data.rows.length === 0 && <p className="empty">No hubo préstamos en ese rango de fechas.</p>}

      {report.data && report.data.rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Libro</th>
              <th>Categoría</th>
              <th>Veces prestado</th>
            </tr>
          </thead>
          <tbody>
            {report.data.rows.map((row) => (
              <tr key={`${row.book_id}-${row.book_title}-${row.category_name}`}>
                <td>{row.book_title}</td>
                <td>{row.category_name}</td>
                <td>{row.times_borrowed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
