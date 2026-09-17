import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function Analytics() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/analytics/groups'),
      API.get('/analytics/students'),
    ])
      .then(([g, s]) => {
        setGroups(g.data.groups || []);
        setStudents(s.data.students || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <PageHeading eyebrow="Admin workspace" title="Analytics" text="Spot momentum and places where support can help." />
        <p className="mt-8 text-slate-500">Loading analytics...</p>
      </>
    );
  }

  return (
    <>
      <PageHeading eyebrow="Admin workspace" title="Analytics" text="Spot momentum and places where support can help." />

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-950">Group progress</h2>
          <p className="mt-1 text-sm text-slate-500">Track assignment progress across groups.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Group</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Members</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Submitted</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Rate</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => (
                <tr key={group.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{group.name}</td>
                  <td className="px-6 py-4 text-slate-600">{group.memberCount}</td>
                  <td className="px-6 py-4 text-slate-600">{group.submittedAssignments}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-emerald-800">
                      {group.submissionRate}%
                    </span>
                  </td>
                </tr>
              ))}

              {groups.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No group data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-950">Student progress</h2>
          <p className="mt-1 text-sm text-slate-500">Track assignment progress for each student.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Student</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Groups</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Submitted</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Rate</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{student.groupCount}</td>
                  <td className="px-6 py-4 text-slate-600">{student.submittedAssignments}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-emerald-800">
                      {student.submissionRate}%
                    </span>
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No student data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}