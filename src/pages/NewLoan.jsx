import { useState } from 'react';
import { useSession } from '../session.jsx';
import { ErrorMessage, SuccessMessage, formatDate, useLoad } from '../ui.jsx';

const MAX_BOOKS = 3;

// HU-06: one member, one to three different books. The API enforces every rule
// (limit of 3, overdue books, no copies left) and its message is shown as is.
export default function NewLoan() {
  const { call } = useSession();
  const [memberText, setMemberText] = useState('');
  const [bookText, setBookText] = useState('');
  const [member, setMember] = useState(null);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [sending, setSending] = useState(false);

  const memberResults = useLoad(
    () => (memberText.trim() ? call('/members', { query: { q: memberText, size: 5 } }) : Promise.resolve(null)),
    [memberText],
  );
  const bookResults = useLoad(
    () => (bookText.trim() ? call('/books', { query: { q: bookText, size: 5 } }) : Promise.resolve(null)),
    [bookText],
  );

  function addBook(book) {
    if (books.length < MAX_BOOKS && !books.some((chosen) => chosen.id === book.id)) {
      setBooks([...books, book]);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setCreated(null);

    try {
      const loan = await call('/loans', {
        method: 'POST',
        body: { member_id: member.id, items: books.map((book) => ({ book_id: book.id })) },
      });

      setCreated(loan);
      setBooks([]);
      setBookText('');
    } catch (failure) {
      setError(failure);
    } finally {
      setSending(false);
    }
  }

  return (
    <section>
      <h1>Prestar libros</h1>

      <form className="card" onSubmit={submit}>
        <h2>1. Socio</h2>
        {member ? (
          <p className="chosen">
            <strong>{member.full_name}</strong> · documento {member.document_number}
            <button type="button" className="button-secondary" onClick={() => setMember(null)}>
              Cambiar socio
            </button>
          </p>
        ) : (
          <>
            <label>
              Buscar socio por nombre o documento
              <input type="search" value={memberText} onChange={(e) => setMemberText(e.target.value)} />
            </label>
            <ul className="results">
              {memberResults.data?.items.map((found) => (
                <li key={found.id}>
                  <button type="button" className="button-secondary" onClick={() => setMember(found)}>
                    Elegir a {found.full_name} ({found.document_number})
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2>2. Libros (hasta {MAX_BOOKS})</h2>
        <label>
          Buscar libro por título o autor
          <input type="search" value={bookText} onChange={(e) => setBookText(e.target.value)} disabled={books.length >= MAX_BOOKS} />
        </label>
        <ul className="results">
          {bookResults.data?.items.map((found) => (
            <li key={found.id}>
              <button
                type="button"
                className="button-secondary"
                disabled={found.available_copies === 0 || books.some((chosen) => chosen.id === found.id)}
                onClick={() => addBook(found)}
              >
                Agregar «{found.title}»
              </button>
              <span className="muted">
                {found.available_copies === 0 ? 'Sin ejemplares disponibles' : `${found.available_copies} disponibles`}
              </span>
            </li>
          ))}
        </ul>

        {books.length > 0 && (
          <ul className="chosen-list">
            {books.map((book) => (
              <li key={book.id}>
                {book.title}
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setBooks(books.filter((chosen) => chosen.id !== book.id))}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        <ErrorMessage error={error} />

        {created && (
          <SuccessMessage>
            Préstamo registrado. Vence el {formatDate(created.items[0].due_at)}.
          </SuccessMessage>
        )}

        <div className="form-actions">
          <button type="submit" disabled={!member || books.length === 0 || sending}>
            {sending ? 'Registrando…' : 'Registrar préstamo'}
          </button>
        </div>
      </form>
    </section>
  );
}
