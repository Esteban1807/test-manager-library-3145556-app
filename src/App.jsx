import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './session.jsx';
import Login from './pages/Login.jsx';
import Books from './pages/Books.jsx';
import Members from './pages/Members.jsx';
import NewLoan from './pages/NewLoan.jsx';
import Loans from './pages/Loans.jsx';
import Overdue from './pages/Overdue.jsx';
import Report from './pages/Report.jsx';
import Users from './pages/Users.jsx';

// What each role can open mirrors the roles of api-contract §3
const LINKS = [
  { to: '/libros', label: 'Catálogo' },
  { to: '/socios', label: 'Socios' },
  { to: '/prestar', label: 'Prestar' },
  { to: '/prestamos', label: 'Préstamos' },
  { to: '/vencidos', label: 'Vencidos' },
  { to: '/reporte', label: 'Reporte', adminOnly: true },
  { to: '/bibliotecarios', label: 'Bibliotecarios', adminOnly: true },
];

export default function App() {
  const { session, isAdmin, logout } = useSession();

  if (!session) return <Login />;

  return (
    <div className="shell">
      <header className="topbar">
        <strong className="brand">Manager Library</strong>
        <nav aria-label="Principal">
          {LINKS.filter((link) => !link.adminOnly || isAdmin).map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="who">
          <span>
            {session.username} · {isAdmin ? 'Administrador' : 'Bibliotecario'}
          </span>
          <button type="button" className="button-secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/libros" element={<Books />} />
          <Route path="/socios" element={<Members />} />
          <Route path="/prestar" element={<NewLoan />} />
          <Route path="/prestamos" element={<Loans />} />
          <Route path="/vencidos" element={<Overdue />} />
          {isAdmin && <Route path="/reporte" element={<Report />} />}
          {isAdmin && <Route path="/bibliotecarios" element={<Users />} />}
          <Route path="*" element={<Navigate to="/libros" replace />} />
        </Routes>
      </main>
    </div>
  );
}
