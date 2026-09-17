import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Register from './pages/Register';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentAssignments from './pages/student/Assignments';
import MyGroup from './pages/student/MyGroup';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAssignments from './pages/admin/Assignments';
import CreateAssignment from './pages/admin/CreateAssignment';
import EditAssignment from './pages/admin/EditAssignment';
import Groups from './pages/admin/Groups';
import Analytics from './pages/admin/Analytics';

import ProtectedRoute from './routes/ProtectedRoute';

function RoleRoute({ role, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppLayout() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-[15rem_minmax(0,1fr)]">
        <Sidebar />
        <main className="w-full max-w-7xl px-5 py-9 sm:px-8 lg:px-12">
          <Routes>
            <Route path="/dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />} />
            <Route path="/student/assignments" element={<RoleRoute role="student"><StudentAssignments /></RoleRoute>} />
            <Route path="/student/group" element={<RoleRoute role="student"><MyGroup /></RoleRoute>} />
            <Route path="/admin/assignments" element={<RoleRoute role="admin"><AdminAssignments /></RoleRoute>} />
            <Route path="/admin/assignments/new" element={<RoleRoute role="admin"><CreateAssignment /></RoleRoute>} />
            <Route path="/admin/assignments/:id/edit" element={<RoleRoute role="admin"><EditAssignment /></RoleRoute>} />
            <Route path="/admin/groups" element={<RoleRoute role="admin"><Groups /></RoleRoute>} />
            <Route path="/admin/analytics" element={<RoleRoute role="admin"><Analytics /></RoleRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AppLayout />} />
          </Route>
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}