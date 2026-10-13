import { useSession } from '../session.jsx';
import { ErrorMessage, formatDate, useLoad } from '../ui.jsx';

// HU-09: lines not returned whose due date has passed, most days late first.
export default function Overdue() {
  const { call } = useSession();
  const overdue = useLoad(() => call('/loans/overdue'), []);

  return (
    <section>
      <h1>Libros vencidos</h1>

      <ErrorMessage error={overdue.error} />

      {overdue.data && overdue.data.items.length === 0 && <p className="empty">No hay libros vencidos.</p>}

      {overdue.data && overdue.data.items.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Libro</th>
              <th>Socio</th>
              <th>Venció</th>
              <th>Días de retraso</th>
            </tr>
          </thead>
          <tbody>
            {overdue.data.items.map((line) => (
              <tr key={line.item_id}>
                <td>{line.book_title}</td>
                <td>{line.member_name}</td>
                <td>{formatDate(line.due_at)}</td>
                <td>{line.days_late}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
