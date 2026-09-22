import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function AdminDashboard() {
  const [overview, setOverview] = useState({});
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ==========================================
  // Load Professor Dashboard Data
  // ==========================================
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const [overviewRes, coursesRes, assignmentsRes] =
          await Promise.all([
            API.get('/analytics/overview'),
            API.get('/courses'),
            API.get('/assignments'),
          ]);

        setOverview(overviewRes.data.overview || {});
        setCourses(coursesRes.data.courses || []);
        setAssignments(assignmentsRes.data.assignments || []);
      } catch (err) {
        console.error('Load professor dashboard error:', err);

        setError(
          err.response?.data?.error ||
            'Failed to load professor dashboard'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // ==========================================
  // Dashboard Statistics
  // ==========================================
  const stats = [
    {
      key: 'totalCourses',
      label: 'Courses',
      icon: '▣',
    },
    {
      key: 'totalStudents',
      label: 'Students',
      icon: '👥',
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
      {/* ==========================================
          Page Heading
      ========================================== */}
      <PageHeading
        eyebrow="Professor workspace"
        title="Your teaching overview."
        text="Track your courses, students, assignments, and submission progress from one place."
        action={
          <a
            href="/admin/assignments/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40]"
          >
            New assignment
          </a>
        }
      />

      {/* ==========================================
          Error
      ========================================== */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* ==========================================
          Main Statistics
      ========================================== */}
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

      {/* ==========================================
          Submission + Acknowledgement Progress
      ========================================== */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Submission Progress */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#216452]">
            Submission progress
          </p>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {loading
                  ? '—'
                  : `${overview.submissionRate ?? 0}%`}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Overall submission rate
              </p>
            </div>

            <span className="text-sm font-semibold text-slate-500">
              {loading
                ? '—'
                : `${overview.submittedCount ?? 0} submitted`}
            </span>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#216452] transition-all duration-700"
              style={{
                width: `${Math.min(
                  Math.max(
                    Number(overview.submissionRate) || 0,
                    0
                  ),
                  100
                )}%`,
              }}
            />
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Monitor assignment submissions and follow up with
            students when required.
          </p>
        </div>

        {/* Acknowledgement Progress */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#216452]">
            Acknowledgement
          </p>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {loading
                  ? '—'
                  : `${overview.acknowledgementRate ?? 0}%`}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Assignments acknowledged
              </p>
            </div>

            <span className="text-sm font-semibold text-slate-500">
              {loading
                ? '—'
                : `${overview.acknowledgedCount ?? 0} acknowledged`}
            </span>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#c5f34b] transition-all duration-700"
              style={{
                width: `${Math.min(
                  Math.max(
                    Number(overview.acknowledgementRate) || 0,
                    0
                  ),
                  100
                )}%`,
              }}
            />
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Track which students or groups still need to
            acknowledge assignments.
          </p>
        </div>
      </section>

      {/* ==========================================
          Courses Taught
      ========================================== */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#216452]">
              Courses taught
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Your courses
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your courses and enrolled students.
            </p>
          </div>

          <a
            href="/admin/courses"
            className="text-sm font-semibold text-[#216452] hover:underline"
          >
            View courses →
          </a>
        </div>

        {loading ? (
          <div className="mt-6 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
            <p className="font-semibold text-slate-800">
              No courses created yet.
            </p>

            <a
              href="/admin/courses"
              className="mt-3 inline-flex text-sm font-semibold text-[#216452] hover:underline"
            >
              Create your first course →
            </a>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {courses.slice(0, 4).map((course) => (
              <div
                key={course.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-[#216452] hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      Course
                    </span>

                    <h3 className="mt-3 truncate text-lg font-bold text-slate-900">
                      {course.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                      {course.description ||
                        'No course description provided.'}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-lg bg-[#c5f34b]/50 px-4 py-3 text-center">
                    <strong className="block text-xl font-bold text-[#216452]">
                      {course.student_count ?? 0}
                    </strong>

                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#216452]">
                      Students
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==========================================
          Recent Assignments
      ========================================== */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#216452]">
              Assignment activity
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Recent assignments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review assignments and their current setup.
            </p>
          </div>

          <a
            href="/admin/assignments"
            className="text-sm font-semibold text-[#216452] hover:underline"
          >
            View assignments →
          </a>
        </div>

        {loading ? (
          <div className="mt-6 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Loading assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
            <p className="font-semibold text-slate-800">
              No assignments created yet.
            </p>

            <a
              href="/admin/assignments/new"
              className="mt-3 inline-flex text-sm font-semibold text-[#216452] hover:underline"
            >
              Create assignment →
            </a>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {assignments.slice(0, 5).map((assignment) => {
              const dueDate = assignment.dueDate
                ? new Date(assignment.dueDate)
                : null;

              return (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        {assignment.courseName ||
                          'Assignment'}
                      </span>

                      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700">
                        {assignment.submissionType ||
                          'group'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">
                      {assignment.title}
                    </h3>

                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                      {assignment.description ||
                        'No description provided.'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Due date
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {dueDate
                          ? dueDate.toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )
                          : '—'}
                      </p>
                    </div>

                    <a
                      href={`/admin/assignments/${assignment.id}`}
                      className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==========================================
          Quick Actions
      ========================================== */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a
          href="/admin/courses"
          className="rounded-xl border border-slate-200 bg-white p-5 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-[#216452] hover:shadow-md"
        >
          <span className="text-2xl">▣</span>

          <h3 className="mt-3 font-bold text-slate-900">
            Manage courses
          </h3>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            Create courses and manage enrolled students.
          </p>
        </a>

        <a
          href="/admin/groups"
          className="rounded-xl border border-slate-200 bg-white p-5 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-[#216452] hover:shadow-md"
        >
          <span className="text-2xl">👥</span>

          <h3 className="mt-3 font-bold text-slate-900">
            Manage groups
          </h3>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            Review groups and their student members.
          </p>
        </a>

        <a
          href="/admin/analytics"
          className="rounded-xl border border-slate-200 bg-white p-5 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-[#216452] hover:shadow-md"
        >
          <span className="text-2xl">◔</span>

          <h3 className="mt-3 font-bold text-slate-900">
            Review analytics
          </h3>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            Monitor submissions and acknowledgement progress.
          </p>
        </a>
      </section>
    </>
  );
}