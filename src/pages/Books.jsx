import { useEffect, useState } from 'react';
import { fetchCover } from '../api.js';
import { useSession } from '../session.jsx';
import { ErrorMessage, Pagination, SuccessMessage, useLoad } from '../ui.jsx';

const EMPTY = { title: '', author: '', isbn: '', category_id: '', total_copies: 1 };

// HU-03 and HU-04: search the catalog; the admin also creates, edits, retires books and manages covers.
export default function Books() {
  const { call, isAdmin } = useSession();
  const [filters, setFilters] = useState({ q: '', category_id: '', page: 1 });
  const [editing, setEditing] = useState(null); // null = closed, {} = new, book = edit
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState(null);

  const categories = useLoad(() => call('/categories'), []);
  const books = useLoad(() => call('/books', { query: { ...filters, size: 10 } }), [filters]);

  function done(text) {
    setEditing(null);
    setActionError(null);
    setMessage(text);
    books.reload();
  }

  async function retire(book) {
    if (!window.confirm(`¿Dar de baja «${book.title}»? Dejará de aparecer en el catálogo.`)) return;

    try {
      await call(`/books/${book.id}`, { method: 'DELETE' });
      done(`«${book.title}» se dio de baja.`);
    } catch (failure) {
      setMessage('');
      setActionError(failure);
    }
  }

  return (
    <section>
      <div className="section-head">
        <h1>Catálogo</h1>
        {isAdmin && (
          <button type="button" onClick={() => setEditing({})}>
            Nuevo libro
          </button>
        )}
      </div>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Buscar por título o autor
          <input
            type="search"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
          />
        </label>
        <label>
          Categoría
          <select
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value, page: 1 })}
          >
            <option value="">Todas</option>
            {categories.data?.items.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </form>

      <SuccessMessage>{message}</SuccessMessage>
      <ErrorMessage error={actionError ?? books.error} />

      {editing && (
        <BookForm
          book={editing}
          categories={categories.data?.items ?? []}
          onCancel={() => setEditing(null)}
          onSaved={(saved) => done(`«${saved.title}» se guardó.`)}
        />
      )}

      {books.data && books.data.items.length === 0 && <p className="empty">No hay libros que coincidan con la búsqueda.</p>}

      {books.data && books.data.items.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Portada</th>
                <th>Título</th>
                <th>Autor</th>
                <th>ISBN</th>
                <th>Categoría</th>
                <th>Disponibles</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {books.data.items.map((book) => (
                <tr key={book.id}>
                  <td>
                    <Cover book={book} />
                  </td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td className="mono">{book.isbn}</td>
                  <td>{book.category.name}</td>
                  <td>
                    {book.available_copies} de {book.total_copies}
                  </td>
                  {isAdmin && (
                    <td className="actions">
                      <button type="button" className="button-secondary" onClick={() => setEditing(book)}>
                        Editar
                      </button>
                      <CoverActions book={book} onChanged={(text) => done(text)} onError={setActionError} />
                      <button type="button" className="button-danger" onClick={() => retire(book)}>
                        Dar de baja
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={books.data.page}
            size={books.data.size}
            total={books.data.total}
            onPage={(page) => setFilters({ ...filters, page })}
          />
        </>
      )}
    </section>
  );
}

function BookForm({ book, categories, onCancel, onSaved }) {
  const { call } = useSession();
  const isNew = !book.id;
  const [form, setForm] = useState(
    isNew
      ? EMPTY
      : { title: book.title, author: book.author, isbn: book.isbn, category_id: book.category.id, total_copies: book.total_copies },
  );
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setError(null);

    const body = { ...form, total_copies: Number(form.total_copies) };

    try {
      const saved = isNew
        ? await call('/books', { method: 'POST', body })
        : await call(`/books/${book.id}`, { method: 'PUT', body });

      onSaved(saved);
    } catch (failure) {
      setError(failure);
      setSending(false);
    }
  }

  return (
    <form className="card form-grid" onSubmit={submit}>
      <h2>{isNew ? 'Nuevo libro' : `Editar «${book.title}»`}</h2>

      <label>
        Título
        <input value={form.title} onChange={set('title')} maxLength={250} required />
      </label>
      <label>
        Autor
        <input value={form.author} onChange={set('author')} maxLength={200} required />
      </label>
      <label>
        ISBN (13 dígitos)
        <input value={form.isbn} onChange={set('isbn')} inputMode="numeric" pattern="\d{13}" disabled={!isNew} required />
      </label>
      <label>
        Categoría
        <select value={form.category_id} onChange={set('category_id')} required>
          <option value="">Elige una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Total de ejemplares
        <input type="number" min="1" value={form.total_copies} onChange={set('total_copies')} required />
      </label>

      <ErrorMessage error={error} />

      <div className="form-actions">
        <button type="submit" disabled={sending}>
          {sending ? 'Guardando…' : 'Guardar libro'}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// The cover needs the token, so it is fetched as a blob and shown from an object URL
function Cover({ book }) {
  const { session } = useSession();
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    if (book.cover_key) {
      fetchCover(book.id, session.token).then((created) => {
        objectUrl = created;
        if (!cancelled) setUrl(created);
      });
    } else {
      setUrl(null);
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [book.id, book.cover_key, session.token]);

  return url ? <img className="cover" src={url} alt={`Portada de ${book.title}`} /> : <span className="cover cover-empty">Sin portada</span>;
}

function CoverActions({ book, onChanged, onError }) {
  const { call } = useSession();

  async function upload(event) {
    const file = event.target.files[0];
    event.target.value = '';

    if (!file) return;

    const form = new FormData();
    form.append('file', file);
    // PUT with multipart is not parsed by PHP, so the method goes in the form (Laravel method spoofing)
    form.append('_method', 'PUT');

    try {
      await call(`/books/${book.id}/cover`, { method: 'POST', form });
      onChanged(`Se guardó la portada de «${book.title}».`);
    } catch (failure) {
      onError(failure);
    }
  }

  async function remove() {
    try {
      await call(`/books/${book.id}/cover`, { method: 'DELETE' });
      onChanged(`Se quitó la portada de «${book.title}».`);
    } catch (failure) {
      onError(failure);
    }
  }

  return (
    <>
      <label className="button-secondary file-button">
        {book.cover_key ? 'Cambiar portada' : 'Subir portada'}
        <input type="file" accept="image/jpeg,image/png" onChange={upload} />
      </label>
      {book.cover_key && (
        <button type="button" className="button-secondary" onClick={remove}>
          Quitar portada
        </button>
      )}
    </>
  );
}
