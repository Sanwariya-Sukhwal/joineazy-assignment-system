import { useEffect, useState } from 'react';
import API from '../../services/api';
import AssignmentCard from '../../components/AssignmentCard';
import GroupCard from '../../components/GroupCard';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupProgress, setGroupProgress] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [coursesRes, assignmentsRes, groupsRes] = await Promise.all([
          API.get('/student/courses'),
          API.get('/assignments'),
          API.get('/groups/my-groups'),
        ]);

        const courseList = coursesRes.data.courses || [];
        const assignmentList = assignmentsRes.data.assignments || [];
        const groupList = groupsRes.data.groups || [];

        setCourses(courseList);
        setAssignments(assignmentList);
        setGroups(groupList);

        const progress = await Promise.all(
          groupList.map(async (group) => {
            try {
              const { data } = await API.get(
                `/assignments/group/${group.id}`
              );

              const groupAssignments = data.assignments || [];

              const submitted = groupAssignments.filter(
                (assignment) => assignment.isSubmitted
              ).length;

              const acknowledged = groupAssignments.filter(
                (assignment) => assignment.acknowledged
              ).length;

              const total = groupAssignments.length;

              const submissionPercentage =
                total > 0
                  ? Math.round((submitted / total) * 100)
                  : 0;

              const acknowledgementPercentage =
                total > 0
                  ? Math.round((acknowledged / total) * 100)
                  : 0;

              return {
                ...group,
                total,
                submitted,
                acknowledged,
                submissionPercentage,
                acknowledgementPercentage,
              };
            } catch (error) {
              return {
                ...group,
                total: 0,
                submitted: 0,
                acknowledged: 0,
                submissionPercentage: 0,
                acknowledgementPercentage: 0,
              };
            }
          })
        );

        setGroupProgress(progress);
      } catch (error) {
        console.error('Student dashboard loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const totalGroupAssignments = groupProgress.reduce(
    (sum, group) => sum + group.total,
    0
  );

  const totalSubmitted = groupProgress.reduce(
    (sum, group) => sum + group.submitted,
    0
  );

  const totalAcknowledged = groupProgress.reduce(
    (sum, group) => sum + group.acknowledged,
    0
  );

  const submissionRate =
    totalGroupAssignments > 0
      ? Math.round(
          (totalSubmitted / totalGroupAssignments) * 100
        )
      : 0;

  const acknowledgementRate =
    totalGroupAssignments > 0
      ? Math.round(
          (totalAcknowledged / totalGroupAssignments) * 100
        )
      : 0;

  const openAssignments = assignments.filter(
    (assignment) =>
      assignment.dueDate &&
      new Date(assignment.dueDate) > new Date()
  ).length;

  return (
    <>
      <PageHeading
        eyebrow="Student workspace"
        title={`Good to see you, ${user?.firstName}.`}
        text="Keep track of your courses, assignments, groups, and submission progress."
      />

      {/* =========================
          Dashboard Stats
      ========================= */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          value={loading ? '—' : courses.length}
          label="Enrolled courses"
          icon="▣"
        />

        <Stat
          value={loading ? '—' : assignments.length}
          label="Assignments"
          icon="✓"
        />

        <Stat
          value={loading ? '—' : groups.length}
          label="Your groups"
          icon="👥"
        />

        <Stat
          value={loading ? '—' : openAssignments}
          label="Still open"
          icon="•"
        />
      </div>

      {/* =========================
          Progress
      ========================= */}
      <section className="mb-10 grid gap-6 lg:grid-cols-2">

        {/* Submission */}
        <ProgressCard
          eyebrow="Submission progress"
          value={submissionRate}
          count={`${totalSubmitted} submitted`}
          text="Your group assignment submission progress."
        />

        {/* Acknowledgement */}
        <ProgressCard
          eyebrow="Acknowledgement"
          value={acknowledgementRate}
          count={`${totalAcknowledged} acknowledged`}
          text="Assignment acknowledgement progress."
        />
      </section>

      {/* =========================
          Your Courses
      ========================= */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Your courses
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Courses you are currently enrolled in.
            </p>
          </div>

          <span className="text-sm font-semibold text-slate-500">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'}
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading courses...
            </p>
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              You are not enrolled in any course yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      Course
                    </span>

                    <h3 className="mt-4 text-xl font-bold text-slate-900">
                      {course.name}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {course.description ||
                        'No course description available.'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Professor
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {course.professorName || 'Professor'}
                  </p>

                  {course.professorEmail && (
                    <p className="mt-1 text-sm text-slate-500">
                      {course.professorEmail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================
          Latest Assignments
      ========================= */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Latest assignments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review your latest assignment work.
            </p>
          </div>

          <a
            className="text-sm font-semibold text-emerald-800 hover:underline"
            href="/student/assignments"
          >
            See all →
          </a>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading assignments...
            </p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              No assignments available yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.slice(0, 3).map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
              />
            ))}
          </div>
        )}
      </section>

      {/* =========================
          Group Progress
      ========================= */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            Group progress
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            See submission and acknowledgement progress for your groups.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {groupProgress.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-950">
                    {group.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {group.submitted} of {group.total} assignments submitted
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-emerald-800">
                  {group.submissionPercentage}%
                </span>
              </div>

              {/* Submission */}
              <div className="mt-5">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Submission</span>
                  <span>{group.submissionPercentage}%</span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-700 transition-all duration-500"
                    style={{
                      width: `${group.submissionPercentage}%`,
                    }}
                  />
                </div>
              </div>

              {/* Acknowledgement */}
              <div className="mt-5">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Acknowledgement</span>
                  <span>
                    {group.acknowledgementPercentage}%
                  </span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#c5f34b] transition-all duration-500"
                    style={{
                      width: `${group.acknowledgementPercentage}%`,
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 flex justify-between text-xs font-medium text-slate-500">
                <span>
                  {group.total === 0
                    ? 'No assignments'
                    : group.submissionPercentage === 100
                    ? 'All submitted'
                    : 'Submission in progress'}
                </span>

                <span>
                  {group.acknowledgementPercentage === 100
                    ? 'Acknowledged'
                    : 'Acknowledgement pending'}
                </span>
              </div>
            </div>
          ))}

          {groupProgress.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center md:col-span-2">
              <p className="text-sm text-slate-500">
                No group progress available yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================
          Your Groups
      ========================= */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Your groups
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your student groups and members.
            </p>
          </div>

          <a
            className="text-sm font-semibold text-emerald-800 hover:underline"
            href="/student/group"
          >
            Manage →
          </a>
        </div>

        <div className="grid gap-3">
          {groups.slice(0, 2).map((group) => (
            <GroupCard
              key={group.id}
              group={group}
            />
          ))}

          {groups.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                You are not part of a group yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function Stat({ value, label, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <strong className="block text-3xl font-bold text-slate-900">
            {value}
          </strong>

          <span className="mt-1 block text-sm text-slate-500">
            {label}
          </span>
        </div>

        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#c5f34b]/40 text-sm font-bold text-[#216452]">
          {icon}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   PROGRESS CARD
========================================================= */

function ProgressCard({
  eyebrow,
  value,
  count,
  text,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#216452]">
        {eyebrow}
      </p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {value}%
        </h2>

        <span className="text-sm font-semibold text-slate-500">
          {count}
        </span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#216452] transition-all duration-700"
          style={{
            width: `${Math.min(Math.max(value, 0), 100)}%`,
          }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   PAGE HEADING
========================================================= */

export function PageHeading({
  eyebrow,
  title,
  text,
  action,
}) {
  return (
    <div className="mb-9 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-800">
          {eyebrow}
        </p>

        <h1 className="mb-3 mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>

        <p className="max-w-xl text-slate-500">
          {text}
        </p>
      </div>

      {action}
    </div>
  );
}