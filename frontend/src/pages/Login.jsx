import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Unable to sign in.'
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] lg:grid lg:grid-cols-2">

      {/* =========================
          Left Side
      ========================= */}
      <section className="hidden min-h-screen flex-col justify-between bg-[#216452] p-10 text-white lg:flex xl:p-14">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5f34b] text-lg font-bold text-[#174f42]">
              J
            </span>

            <span className="text-lg font-semibold tracking-tight">
              joineazy
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#c5f34b]">
            Assignment system
          </p>

          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            Build better work, together.
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-white/75">
            A clear home for every brief, group, and deadline.
          </p>
        </div>

        {/* Bottom */}
        <p className="text-sm text-white/50">
          Collaborative assignment workspace
        </p>
      </section>

      {/* =========================
          Right Side
      ========================= */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">

        <div className="w-full max-w-md">

          {/* Mobile Brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5f34b] text-lg font-bold text-[#174f42]">
              J
            </span>

            <span className="text-lg font-semibold text-slate-900">
              joineazy
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#216452]">
              Welcome back
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Sign in to your workspace
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Access your assignments, groups, and progress.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={submit}
            className="space-y-5"
          >

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email
              </label>

              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                required
                placeholder="Enter your email"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <input
                id="login-password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                required
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
              />
            </div>

            {/* Sign In */}
            <button
              type="submit"
              className="w-full rounded-lg bg-[#216452] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#194f40] focus:outline-none focus:ring-2 focus:ring-[#216452]/30 focus:ring-offset-2"
            >
              Sign in
            </button>
          </form>

          {/* Register */}
          <p className="mt-7 text-center text-sm text-slate-500">
            New here?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#216452] hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}