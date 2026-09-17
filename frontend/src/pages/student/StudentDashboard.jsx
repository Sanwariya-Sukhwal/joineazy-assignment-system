import { useEffect, useState } from 'react';
import API from '../../services/api';
import AssignmentCard from '../../components/AssignmentCard';
import GroupCard from '../../components/GroupCard';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupProgress, setGroupProgress] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [a, g] = await Promise.all([
          API.get('/assignments'),
          API.get('/groups/my-groups'),
        ]);

        const assignmentList = a.data.assignments || [];
        const groupList = g.data.groups || [];

        setAssignments(assignmentList);
        setGroups(groupList);

        const progress = await Promise.all(
          groupList.map(async (group) => {
            try {
              const { data } = await API.get(`/assignments/group/${group.id}`);
              const groupAssignments = data.assignments || [];

              const submitted = groupAssignments.filter(
                (assignment) => assignment.isSubmitted
              ).length;

              const total = groupAssignments.length;
              const percentage = total > 0 ? Math.round((submitted / total) * 100) : 0;

              return {
                ...group,
                total,
                submitted,
                percentage,
              };
            } catch (error) {
              return {
                ...group,
                total: 0,
                submitted: 0,
                percentage: 0,
              };
            }
          })
        );

        setGroupProgress(progress);
      } catch (error) {
        console.error('Dashboard loading error:', error);
      }
    };

    loadDashboard();
  }, []);

  return (
    <>
      <PageHeading
        eyebrow="Student workspace"
        title={`Good to see you, ${user?.firstName}.`}
        text="Keep an eye on what is next and what your group has already shipped."
      />

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat value={assignments.length} label="Assignments" />
        <Stat value={groups.length} label="Your groups" />
        <Stat
          value={assignments.filter((a) => new Date(a.dueDate) > new Date()).length}
          label="Still open"
        />
      </div>

      {/* Latest Assignments */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Latest assignments</h2>
        <a className="text-sm font-semibold text-emerald-800" href="/student/assignments">
          See all
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments.slice(0, 3).map((assignment) => (
          <AssignmentCard key={assignment.id} assignment={assignment} />
        ))}
      </div>

      {/* Group Progress */}
      <div className="mb-4 mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Group progress</h2>
        <p className="mt-1 text-sm text-slate-500">
          See how much assigned work your groups have completed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groupProgress.map((group) => (
          <div
            key={group.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-950">{group.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {group.submitted} of {group.total} assignments submitted
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-emerald-800">
                {group.percentage}%
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-700 transition-all duration-500"
                style={{ width: `${group.percentage}%` }}
              />
            </div>

            <div className="mt-3 flex justify-between text-xs font-medium text-slate-500">
              <span>Progress</span>
              <span>
                {group.total === 0 ? 'No assignments' : group.percentage === 100 ? 'Completed' : 'In progress'}
              </span>
            </div>
          </div>
        ))}

        {groupProgress.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">No group progress available yet.</p>
          </div>
        )}
      </div>

      {/* Your Groups */}
      <div className="mb-4 mt-10 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Your groups</h2>
        <a className="text-sm font-semibold text-emerald-800" href="/student/group">
          Manage
        </a>
      </div>

      <div className="grid gap-3">
        {groups.slice(0, 2).map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <strong className="block text-3xl font-bold text-slate-900">{value}</strong>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

export function PageHeading({ eyebrow, title, text, action }) {
  return (
    <div className="mb-9 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-800">
          {eyebrow}
        </p>
        <h1 className="mb-3 mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-xl text-slate-500">{text}</p>
      </div>

      {action}
    </div>
  );
}