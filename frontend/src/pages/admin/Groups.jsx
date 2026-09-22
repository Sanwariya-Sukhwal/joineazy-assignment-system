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
  const [error, setError] = useState('');

  // ==========================================
  // Load Groups + Assignments
  // ==========================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [groupsRes, assignmentsRes] =
        await Promise.all([
          API.get('/groups'),
          API.get('/assignments'),
        ]);

      const basicGroups =
        groupsRes.data.groups || [];

      setAssignments(
        assignmentsRes.data.assignments || []
      );

      // Load complete group details including members
      const detailedGroups = await Promise.all(
        basicGroups.map(async (group) => {
          try {
            const { data } = await API.get(
              `/groups/${group.id}`
            );

            return {
              ...group,
              ...data.group,
              members: data.group?.members || [],
            };
          } catch (err) {
            console.error(
              `Load group ${group.id} error:`,
              err
            );

            return {
              ...group,
              members: group.members || [],
            };
          }
        })
      );

      setGroups(detailedGroups);
    } catch (err) {
      console.error(
        'Load groups error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Failed to load groups or assignments.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Assign Assignment To Group
  // ==========================================
  const handleAssign = async (groupId) => {
    const assignmentId =
      selected[groupId];

    if (!assignmentId) {
      setError(
        'Please select an assignment first.'
      );
      setMessage('');
      return;
    }

    try {
      setAssigning(
        `${groupId}-${assignmentId}`
      );

      setError('');
      setMessage('');

      await API.post(
        `/assignments/${assignmentId}/groups`,
        {
          groupId: Number(groupId),
        }
      );

      const group = groups.find(
        (item) => item.id === groupId
      );

      const assignment =
        assignments.find(
          (item) =>
            item.id === Number(assignmentId)
        );

      setMessage(
        `"${assignment?.title}" assigned to ${
          group?.name || 'group'
        } successfully.`
      );

      setSelected((prev) => ({
        ...prev,
        [groupId]: '',
      }));
    } catch (err) {
      console.error(
        'Assign assignment error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Failed to assign assignment.'
      );
      setMessage('');
    } finally {
      setAssigning(null);
    }
  };

  // ==========================================
  // Loading
  // ==========================================
  if (loading) {
    return (
      <>
        <PageHeading
          eyebrow="Professor workspace"
          title="Groups"
          text="Review student groups, leaders, members, and assignment progress."
        />

        <div className="mt-8 flex items-center justify-center py-16">
          <p className="text-sm text-slate-500">
            Loading groups...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="Professor workspace"
        title="Groups"
        text="Review student groups, leaders, members, and assignment progress."
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
          Success
      ========================= */}
      {message && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      {/* =========================
          Empty State
      ========================= */}
      {groups.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 text-xl">
            👥
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900">
            No groups yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Student groups will appear here once
            they create or join a group.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6">
          {groups.map((group) => {
            const members =
              group.members || [];

            const memberCount =
              members.length ||
              group.memberCount ||
              group.member_count ||
              0;

            const isAssigning =
              assigning ===
              `${group.id}-${selected[group.id]}`;

            return (
              <article
                key={group.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                {/* =========================
                    Group Header
                ========================= */}
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lime-200 text-lg font-bold text-slate-900">
                        {group.name
                          ?.slice(0, 1)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-950">
                            {group.name}
                          </h3>

                          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {memberCount}{' '}
                            {memberCount === 1
                              ? 'member'
                              : 'members'}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {group.description ||
                            'Collaborative workspace'}
                        </p>

                        <p className="mt-3 text-sm text-slate-600">
                          Leader:{' '}
                          <span className="font-semibold text-slate-900">
                            {group.leaderName ||
                              group.leader_name ||
                              'Student'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =========================
                      Assign Assignment
                  ========================= */}
                  <div className="w-full xl:max-w-md">
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Assign assignment
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <select
                        value={
                          selected[group.id] ||
                          ''
                        }
                        onChange={(e) => {
                          setSelected(
                            (prev) => ({
                              ...prev,
                              [group.id]:
                                e.target.value,
                            })
                          );

                          setError('');
                          setMessage('');
                        }}
                        className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
                      >
                        <option value="">
                          Select assignment
                        </option>

                        {assignments.map(
                          (assignment) => (
                            <option
                              key={
                                assignment.id
                              }
                              value={
                                assignment.id
                              }
                            >
                              {assignment.title}
                            </option>
                          )
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          handleAssign(
                            group.id
                          )
                        }
                        disabled={
                          !selected[group.id] ||
                          isAssigning
                        }
                        className="rounded-xl bg-[#216452] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#194f40] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAssigning
                          ? 'Assigning...'
                          : 'Assign'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* =========================
                    Members
                ========================= */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#216452]">
                        Group members
                      </p>

                      <h4 className="mt-1 text-lg font-bold text-slate-900">
                        Students
                      </h4>
                    </div>

                    <span className="text-sm font-medium text-slate-500">
                      {memberCount}{' '}
                      {memberCount === 1
                        ? 'student'
                        : 'students'}
                    </span>
                  </div>

                  {members.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
                      <p className="text-sm font-medium text-slate-600">
                        No members found.
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Students can be added to this
                        group from the group workspace.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {members.map(
                        (member, index) => {
                          const firstName =
                            member.firstName ||
                            member.first_name ||
                            '';

                          const lastName =
                            member.lastName ||
                            member.last_name ||
                            '';

                          const fullName =
                            `${firstName} ${lastName}`.trim() ||
                            member.name ||
                            'Student';

                          const isLeader =
                            Number(
                              member.id
                            ) ===
                            Number(
                              group.leaderId ||
                                group.leader_id
                            );

                          return (
                            <div
                              key={
                                member.id ||
                                index
                              }
                              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                                  {fullName
                                    .slice(0, 1)
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {fullName}
                                  </p>

                                  <p className="truncate text-xs text-slate-500">
                                    {member.email ||
                                      'No email'}
                                  </p>
                                </div>
                              </div>

                              {isLeader && (
                                <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                  Leader
                                </span>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}