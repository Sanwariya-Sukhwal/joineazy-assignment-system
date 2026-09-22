import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ==========================================
// Student Navigation
// ==========================================
const studentLinks = [
  ['/dashboard', 'Overview'],
  ['/student/assignments', 'Assignments'],
  ['/student/group', 'My group'],
];

// ==========================================
// Professor Navigation
// ==========================================
const adminLinks = [
  ['/dashboard', 'Overview'],
  ['/admin/courses', 'Courses'],
  ['/admin/assignments', 'Assignments'],
  ['/admin/groups', 'Groups'],
  ['/admin/analytics', 'Analytics'],
];

export default function Sidebar() {
  const { user } = useAuth();

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const isProfessor = user?.role === 'admin';

  return (
    <aside className="border-b border-slate-200 bg-white p-5 md:border-b-0 md:border-r md:p-6">
      {/* =========================
          Workspace Label
      ========================= */}
      <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-800">
        Workspace
      </p>

      {/* =========================
          Navigation
      ========================= */}
      <nav className="mt-4 flex flex-wrap gap-1 md:grid">
        {links.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `rounded px-3 py-2.5 text-sm no-underline transition ${
                isActive
                  ? 'bg-emerald-900 text-white'
                  : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-900'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* =========================
          Workspace Tip
      ========================= */}
      <div className="mt-8 hidden rounded bg-lime-300 p-4 text-sm text-slate-900 md:block">
        <strong>
          {isProfessor
            ? 'Keep the class moving.'
            : 'Make progress together.'}
        </strong>

        <p className="mt-2 text-xs leading-5">
          {isProfessor
            ? 'Track courses, assignments, students, and submissions in one view.'
            : 'Your group workspace is ready when you are.'}
        </p>
      </div>
    </aside>
  );
}