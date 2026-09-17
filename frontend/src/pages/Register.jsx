import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (e) => {
    setForm({
      ...form,
      [key]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Unable to create account.'
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
            Start together
          </p>

          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            Turn group work into momentum.
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-white/75">
            Bring people, plans, and progress into one calm
            workspace.
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
              Create account
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Join your workspace
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Create your student account and start
              collaborating.
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

            {/* First + Last Name */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* First Name */}
              <div>
                <label
                  htmlFor="first-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  First name
                </label>

                <input
                  id="first-name"
                  value={form.firstName}
                  onChange={update('firstName')}
                  required
                  placeholder="First name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="last-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Last name
                </label>

                <input
                  id="last-name"
                  value={form.lastName}
                  onChange={update('lastName')}
                  required
                  placeholder="Last name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="register-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email
              </label>

              <input
                id="register-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                placeholder="Enter your email"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <input
                id="register-password"
                type="password"
                minLength={6}
                value={form.password}
                onChange={update('password')}
                required
                placeholder="Minimum 6 characters"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
              />
            </div>

            {/* Create Account */}
            <button
              type="submit"
              className="w-full rounded-lg bg-[#216452] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#194f40] focus:outline-none focus:ring-2 focus:ring-[#216452]/30 focus:ring-offset-2"
            >
              Create account
            </button>
          </form>

          {/* Login */}
          <p className="mt-7 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#216452] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}