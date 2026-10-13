import { useCallback, useEffect, useState } from 'react';

// Small shared pieces: messages, pagination, dates and a data-loading hook.

export function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <div className="notice notice-error" role="alert">
      <p>{error.message}</p>
      {error.details?.length > 0 && (
        <ul>
          {error.details.map((detail) => (
            <li key={detail.field}>{detail.issue}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SuccessMessage({ children }) {
  if (!children) return null;

  return (
    <div className="notice notice-success" role="status">
      {children}
    </div>
  );
}

export function Pagination({ page, size, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / size));

  return (
    <div className="pagination">
      <span>
        {total} {total === 1 ? 'resultado' : 'resultados'} · página {page} de {pages}
      </span>
      <div>
        <button type="button" className="button-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Anterior
        </button>
        <button type="button" className="button-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}

// The API sends UTC instants; they are shown in the reader's own time zone
export function formatDate(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const STATUS_LABELS = { open: 'Abierto', overdue: 'Vencido', closed: 'Cerrado' };

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}

// Loads data, keeps loading and error state, and exposes reload()
export function useLoad(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const reload = useCallback(() => {
    let cancelled = false;

    setState((previous) => ({ ...previous, loading: true, error: null }));

    run()
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error) => !cancelled && setState({ data: null, error, loading: false }));

    return () => {
      cancelled = true;
    };
  }, [run]);

  useEffect(() => reload(), [reload]);

  return { ...state, reload };
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoIso(days) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}
