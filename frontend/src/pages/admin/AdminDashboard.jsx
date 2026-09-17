import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function AdminDashboard() {
  const [overview, setOverview] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await API.get('/analytics/overview');

        setOverview(data.overview || {});
      } catch (err) {
        console.error('Load analytics overview error:', err);

        setError(
          err.response?.data?.error ||
          'Failed to load dashboard analytics'
        );
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const stats = [
    {
      key: 'totalStudents',
      label: 'Students',
      icon: '👥',
    },
    {
      key: 'totalGroups',
      label: 'Groups',
      icon: '◉',
    },
    {
      key: 'totalAssignments',
      label: 'Assignments',
      icon: '✓',
    },
    {
      key: 'submissionRate',
      label: 'Submission rate',
      icon: '%',
      suffix: '%',
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Admin workspace"
        title="The whole picture."
        text="A quick read on people, groups, and assignment momentum."
        action={
          <a
            href="/admin/assignments/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40]"
          >
            New assignment
          </a>
        }
      />

      {/* =========================
          Error
      ========================= */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* =========================
          Statistics
      ========================= */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>

                <strong className="mt-3 block text-3xl font-bold tracking-tight text-slate-900">
                  {loading
                    ? '—'
                    : `${overview[stat.key] ?? 0}${stat.suffix || ''}`}
                </strong>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c5f34b]/40 text-sm font-bold text-[#216452]">
                {stat.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* =========================
          Submission Pulse
      ========================= */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#216452]">
          Submission pulse
        </p>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          {loading
            ? '—'
            : overview.submittedCount ?? 0}{' '}
          submissions confirmed
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use analytics to see where groups may need a nudge.
        </p>

        <a
          href="/admin/analytics"
          className="mt-5 inline-flex items-center text-sm font-semibold text-[#216452] transition hover:text-[#194f40] hover:underline"
        >
          Open analytics
          <span className="ml-1">→</span>
        </a>
      </section>
    </>
  );
}