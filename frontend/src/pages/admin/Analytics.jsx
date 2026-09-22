import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function Analytics() {
  const [overview, setOverview] = useState({});
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ==========================================
  // Load Analytics
  // ==========================================
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const [
          overviewRes,
          coursesRes,
          assignmentsRes,
          groupsRes,
          studentsRes,
        ] = await Promise.all([
          API.get('/analytics/overview'),
          API.get('/analytics/courses'),
          API.get('/analytics/assignments'),
          API.get('/analytics/groups'),
          API.get('/analytics/students'),
        ]);

        setOverview(
          overviewRes.data.overview || {}
        );

        setCourses(
          coursesRes.data.courses || []
        );

        setAssignments(
          assignmentsRes.data.assignments || []
        );

        setGroups(
          groupsRes.data.groups || []
        );

        setStudents(
          studentsRes.data.students || []
        );
      } catch (err) {
        console.error(
          'Load analytics error:',
          err
        );

        setError(
          err.response?.data?.error ||
            'Failed to load analytics.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  // ==========================================
  // Loading
  // ==========================================
  if (loading) {
    return (
      <>
        <PageHeading
          eyebrow="Professor workspace"
          title="Analytics"
          text="Track courses, students, assignments, submissions, and acknowledgement progress."
        />

        <div className="mt-8 flex items-center justify-center py-16">
          <p className="text-sm text-slate-500">
            Loading analytics...
          </p>
        </div>
      </>
    );
  }

  // ==========================================
  // Stats
  // ==========================================
  const stats = [
    {
      label: 'Students',
      value: overview.totalStudents ?? 0,
      icon: '👥',
    },
    {
      label: 'Courses',
      value: overview.totalCourses ?? 0,
      icon: '▣',
    },
    {
      label: 'Assignments',
      value: overview.totalAssignments ?? 0,
      icon: '✓',
    },
    {
      label: 'Active assignments',
      value: overview.activeAssignments ?? 0,
      icon: '●',
    },
    {
      label: 'Submitted',
      value: overview.submittedCount ?? 0,
      icon: '↑',
    },
    {
      label: 'Acknowledged',
      value: overview.acknowledgedCount ?? 0,
      icon: '✓',
    },
    {
      label: 'Submission rate',
      value: `${overview.submissionRate ?? 0}%`,
      icon: '%',
    },
    {
      label: 'Acknowledgement rate',
      value: `${overview.acknowledgementRate ?? 0}%`,
      icon: '%',
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Professor workspace"
        title="Analytics"
        text="Track courses, students, assignments, submissions, and acknowledgement progress."
      />

      {/* =========================
          Error
      ========================= */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* =========================
          Overview Stats
      ========================= */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </p>
              </div>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-sm font-bold text-[#216452]">
                {stat.icon}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* =========================
          Progress Overview
      ========================= */}
      <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ProgressCard
          title="Submission progress"
          percentage={
            overview.submissionRate ?? 0
          }
          count={`${overview.submittedCount ?? 0} submitted`}
          description="Overall assignment submission progress."
          barClass="bg-[#216452]"
        />

        <ProgressCard
          title="Acknowledgement progress"
          percentage={
            overview.acknowledgementRate ?? 0
          }
          count={`${overview.acknowledgedCount ?? 0} acknowledged`}
          description="Overall assignment acknowledgement progress."
          barClass="bg-[#c5f34b]"
        />
      </section>

      {/* =========================
          Course Analytics
      ========================= */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#216452]">
            Course analytics
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Course progress
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review students and assignment progress
            for each course.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Course
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Students
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assignments
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Submitted
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rate
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => (
                <tr
                  key={course.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">
                      {course.name}
                    </p>

                    {course.description && (
                      <p className="mt-1 max-w-md text-xs text-slate-500">
                        {course.description}
                      </p>
                    )}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {course.studentCount ??
                      course.student_count ??
                      0}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {course.assignmentCount ??
                      course.assignment_count ??
                      0}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {course.submittedAssignments ??
                      course.submitted_assignments ??
                      0}
                  </td>

                  <td className="px-6 py-4">
                    <RateBadge
                      value={
                        course.submissionRate ??
                        course.submission_rate ??
                        0
                      }
                    />
                  </td>
                </tr>
              ))}

              {courses.length === 0 && (
                <EmptyRow
                  colSpan="5"
                  text="No course analytics available."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================
          Assignment Analytics
      ========================= */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#216452]">
            Assignment analytics
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Assignment submission status
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor submitted and acknowledged work.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assignment
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Type
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Submitted
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Acknowledged
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rate
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {assignments.map(
                (assignment) => (
                  <tr
                    key={assignment.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {assignment.title}
                      </p>

                      {assignment.courseName && (
                        <p className="mt-1 text-xs text-slate-500">
                          {assignment.courseName}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-700">
                        {assignment.submissionType ||
                          assignment.submission_type ||
                          'group'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {assignment.totalAssigned ??
                        assignment.total_assigned ??
                        0}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {assignment.submittedCount ??
                        assignment.submitted_count ??
                        0}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {assignment.acknowledgedCount ??
                        assignment.acknowledged_count ??
                        0}
                    </td>

                    <td className="px-6 py-4">
                      <RateBadge
                        value={
                          assignment.submissionRate ??
                          assignment.submission_rate ??
                          0
                        }
                      />
                    </td>
                  </tr>
                )
              )}

              {assignments.length === 0 && (
                <EmptyRow
                  colSpan="6"
                  text="No assignment analytics available."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================
          Group Progress
      ========================= */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#216452]">
            Group analytics
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Group progress
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track assignment progress across groups.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Group
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Members
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assignments
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Submitted
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rate
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => (
                <tr
                  key={group.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {group.name}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {group.memberCount ??
                      group.member_count ??
                      0}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {group.totalAssignments ??
                      group.total_assignments ??
                      0}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {group.submittedAssignments ??
                      group.submitted_assignments ??
                      0}
                  </td>

                  <td className="px-6 py-4">
                    <RateBadge
                      value={
                        group.submissionRate ??
                        group.submission_rate ??
                        0
                      }
                    />
                  </td>
                </tr>
              ))}

              {groups.length === 0 && (
                <EmptyRow
                  colSpan="5"
                  text="No group data available."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================
          Student Progress
      ========================= */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#216452]">
            Student analytics
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Student progress
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track assignment progress for each student.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Student
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Groups
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assignments
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Submitted
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rate
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">
                      {student.firstName}{' '}
                      {student.lastName}
                    </p>

                    {student.email && (
                      <p className="mt-1 text-xs text-slate-500">
                        {student.email}
                      </p>
                    )}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {student.groupCount ??
                      student.group_count ??
                      0}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {student.totalAssignments ??
                      student.total_assignments ??
                      0}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {student.submittedAssignments ??
                      student.submitted_assignments ??
                      0}
                  </td>

                  <td className="px-6 py-4">
                    <RateBadge
                      value={
                        student.submissionRate ??
                        student.submission_rate ??
                        0
                      }
                    />
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <EmptyRow
                  colSpan="5"
                  text="No student data available."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ==========================================
// Progress Card
// ==========================================
function ProgressCard({
  title,
  percentage,
  count,
  description,
  barClass,
}) {
  const value = Math.min(
    Math.max(Number(percentage) || 0, 0),
    100
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}%
          </p>
        </div>

        <span className="text-sm font-semibold text-slate-500">
          {count}
        </span>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barClass}`}
          style={{
            width: `${value}%`,
          }}
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

// ==========================================
// Rate Badge
// ==========================================
function RateBadge({ value }) {
  const rate = Number(value) || 0;

  return (
    <span className="inline-flex rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-emerald-800">
      {rate}%
    </span>
  );
}

// ==========================================
// Empty Table Row
// ==========================================
function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-6 py-10 text-center text-sm text-slate-500"
      >
        {text}
      </td>
    </tr>
  );
}