import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groupsRes, assignmentsRes] = await Promise.all([
          API.get('/groups'),
          API.get('/assignments'),
        ]);

        setGroups(groupsRes.data.groups || []);
        setAssignments(assignmentsRes.data.assignments || []);
      } catch (error) {
        setMessage('Failed to load groups or assignments.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAssign = async (groupId) => {
    const assignmentId = selected[groupId];

    if (!assignmentId) {
      setMessage('Please select an assignment first.');
      return;
    }

    try {
      setAssigning(`${groupId}-${assignmentId}`);
      setMessage('');

      await API.post(`/assignments/${assignmentId}/groups`, {
        groupId,
      });

      const group = groups.find((item) => item.id === groupId);
      const assignment = assignments.find((item) => item.id === Number(assignmentId));

      setMessage(`"${assignment?.title}" assigned to ${group?.name} successfully.`);

      setSelected((prev) => ({
        ...prev,
        [groupId]: '',
      }));
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to assign assignment.');
    } finally {
      setAssigning(null);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeading eyebrow="Admin workspace" title="Groups" text="See how the class is organized." />
        <p className="mt-8 text-slate-500">Loading groups...</p>
      </>
    );
  }

  return (
    <>
      <PageHeading eyebrow="Admin workspace" title="Groups" text="See how the class is organized." />

      {message && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      <div className="mt-8 grid gap-5">
        {groups.map((group) => (
          <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-lime-200 text-lg font-bold text-slate-900">
                    {group.name?.slice(0, 1).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-950">{group.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {group.description || 'Collaborative workspace'}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-600">
                  Led by <span className="font-semibold">{group.leaderName || 'Student'}</span>
                </p>
              </div>

              <div className="w-full lg:max-w-md">
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Assign assignment
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={selected[group.id] || ''}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [group.id]: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Select assignment</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.title}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleAssign(group.id)}
                    disabled={assigning === `${group.id}-${selected[group.id]}`}
                    className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {assigning === `${group.id}-${selected[group.id]}` ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}