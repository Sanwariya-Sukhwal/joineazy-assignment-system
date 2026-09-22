import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeading } from './StudentDashboard';

export default function MyGroup() {
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupData, setSelectedGroupData] = useState(null);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberMessage, setMemberMessage] = useState('');
  const [memberError, setMemberError] = useState('');

  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);

  /* =========================================================
     LOAD MY GROUPS
  ========================================================= */

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);

        const { data } = await API.get('/groups/my-groups');

        setGroups(data.groups || []);
      } catch (error) {
        console.error('Get groups error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  /* =========================================================
     CREATE GROUP
  ========================================================= */

  const create = async (e) => {
    e.preventDefault();

    setCreateError('');

    if (!name.trim()) {
      setCreateError('Group name is required.');
      return;
    }

    try {
      setCreating(true);

      const { data } = await API.post('/groups', {
        name: name.trim(),
        description: description.trim(),
      });

      setGroups((prev) => [data.group, ...prev]);

      setName('');
      setDescription('');
    } catch (error) {
      console.error('Create group error:', error);

      setCreateError(
        error.response?.data?.error ||
          'Failed to create group'
      );
    } finally {
      setCreating(false);
    }
  };

  /* =========================================================
     SELECT GROUP
  ========================================================= */

  const handleSelectGroup = async (groupId) => {
    if (selectedGroup === groupId) {
      setSelectedGroup(null);
      setSelectedGroupData(null);
      setMemberEmail('');
      setMemberMessage('');
      setMemberError('');
      return;
    }

    setSelectedGroup(groupId);
    setSelectedGroupData(null);
    setMemberEmail('');
    setMemberMessage('');
    setMemberError('');

    try {
      setLoadingGroup(true);

      const { data } = await API.get(`/groups/${groupId}`);

      setSelectedGroupData(data.group);
    } catch (error) {
      console.error('Load group error:', error);

      setMemberError(
        error.response?.data?.error ||
          'Failed to load group members'
      );
    } finally {
      setLoadingGroup(false);
    }
  };

  /* =========================================================
     ADD MEMBER
  ========================================================= */

  const addMember = async (e) => {
    e.preventDefault();

    if (!selectedGroup) return;

    setMemberMessage('');
    setMemberError('');

    if (!memberEmail.trim()) {
      setMemberError('Student email is required.');
      return;
    }

    try {
      setAddingMember(true);

      await API.post(
        `/groups/${selectedGroup}/members`,
        {
          email: memberEmail.trim(),
        }
      );

      setMemberMessage(
        'Member added successfully.'
      );

      setMemberEmail('');

      const { data } = await API.get(
        `/groups/${selectedGroup}`
      );

      setSelectedGroupData(data.group);

      setGroups((prev) =>
        prev.map((group) =>
          group.id === selectedGroup
            ? {
                ...group,
                memberCount:
                  data.group.members?.length || 0,
              }
            : group
        )
      );
    } catch (error) {
      console.error('Add member error:', error);

      setMemberError(
        error.response?.data?.error ||
          'Failed to add member'
      );
    } finally {
      setAddingMember(false);
    }
  };

  /* =========================================================
     REMOVE MEMBER
  ========================================================= */

  const removeMember = async (studentId) => {
    if (!selectedGroup) return;

    const confirmed = window.confirm(
      'Are you sure you want to remove this member?'
    );

    if (!confirmed) return;

    setMemberMessage('');
    setMemberError('');

    try {
      setRemovingMember(studentId);

      await API.delete(
        `/groups/${selectedGroup}/members/${studentId}`
      );

      setMemberMessage(
        'Member removed successfully.'
      );

      const { data } = await API.get(
        `/groups/${selectedGroup}`
      );

      setSelectedGroupData(data.group);

      setGroups((prev) =>
        prev.map((group) =>
          group.id === selectedGroup
            ? {
                ...group,
                memberCount:
                  data.group.members?.length || 0,
              }
            : group
        )
      );
    } catch (error) {
      console.error('Remove member error:', error);

      setMemberError(
        error.response?.data?.error ||
          'Failed to remove member'
      );
    } finally {
      setRemovingMember(null);
    }
  };

  /* =========================================================
     CHECK LEADER
  ========================================================= */

  const isLeader =
    selectedGroupData &&
    Number(selectedGroupData.leaderId) ===
      Number(user?.id);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <PageHeading
        eyebrow="Student workspace"
        title="My groups"
        text="Find your collaborators and keep the work moving."
      />

      {/* =====================================================
          CREATE GROUP
      ===================================================== */}

      <form
        onSubmit={create}
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
            Create group
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Start a new collaboration
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            You automatically become the group leader.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_auto]">
          <input
            type="text"
            placeholder="New group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />

          <input
            type="text"
            placeholder="Group description (optional)"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />

          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating
              ? 'Creating...'
              : 'Create group'}
          </button>
        </div>

        {createError && (
          <p className="mt-3 text-sm font-semibold text-red-600">
            {createError}
          </p>
        )}
      </form>

      {/* =====================================================
          GROUPS
      ===================================================== */}

      {loading ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            Loading groups...
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {groups.map((group) => (
            <div
              key={group.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* =================================================
                  GROUP HEADER
              ================================================= */}

              <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lime-200 text-lg font-bold text-slate-900">
                    {group.name
                      ?.slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-950">
                        {group.name}
                      </h3>

                      {Number(group.leaderId) ===
                        Number(user?.id) && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Leader
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {group.description ||
                        'Collaborative workspace'}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      Led by{' '}
                      <span className="font-semibold text-slate-900">
                        {group.leaderName || 'Student'}
                      </span>
                      {' · '}
                      {group.memberCount ?? 1}{' '}
                      member
                      {(group.memberCount ?? 1) === 1
                        ? ''
                        : 's'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectGroup(group.id)
                  }
                  className="w-full rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-700 hover:bg-emerald-50 sm:w-auto"
                >
                  {selectedGroup === group.id
                    ? 'Close'
                    : 'View members'}
                </button>
              </div>

              {/* =================================================
                  SELECTED GROUP
              ================================================= */}

              {selectedGroup === group.id && (
                <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
                  {loadingGroup ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-500">
                        Loading group details...
                      </p>
                    </div>
                  ) : selectedGroupData ? (
                    <>
                      {/* Group status */}
                      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                              Group status
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {isLeader
                                ? 'You are the group leader'
                                : 'You are a group member'}
                            </p>
                          </div>

                          <span
                            className={
                              isLeader
                                ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                                : 'rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700'
                            }
                          >
                            {isLeader
                              ? 'Leader'
                              : 'Member'}
                          </span>
                        </div>
                      </div>

                      {/* =================================================
                          MEMBERS
                      ================================================= */}

                      <div>
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                              Group members
                            </p>

                            <h3 className="mt-1 text-xl font-bold text-slate-950">
                              {selectedGroupData.name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {isLeader
                                ? 'Manage students in your group.'
                                : 'View students in your group.'}
                            </p>
                          </div>

                          <span className="text-sm font-semibold text-slate-500">
                            {selectedGroupData.members
                              ?.length || 0}{' '}
                            student
                            {(selectedGroupData.members
                              ?.length || 0) === 1
                              ? ''
                              : 's'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {selectedGroupData.members
                            ?.length > 0 ? (
                            selectedGroupData.members.map(
                              (member) => {
                                const memberIsLeader =
                                  Number(member.id) ===
                                  Number(
                                    selectedGroupData.leaderId
                                  );

                                return (
                                  <div
                                    key={member.id}
                                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                                        {member.firstName
                                          ?.slice(0, 1)
                                          .toUpperCase()}
                                      </div>

                                      <div className="min-w-0">
                                        <p className="font-semibold text-slate-900">
                                          {member.firstName}{' '}
                                          {member.lastName}
                                        </p>

                                        <p className="mt-1 break-all text-sm text-slate-500">
                                          {member.email}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      {memberIsLeader && (
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                          Leader
                                        </span>
                                      )}

                                      {isLeader &&
                                        !memberIsLeader && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeMember(
                                                member.id
                                              )
                                            }
                                            disabled={
                                              removingMember ===
                                              member.id
                                            }
                                            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {removingMember ===
                                            member.id
                                              ? 'Removing...'
                                              : 'Remove'}
                                          </button>
                                        )}
                                    </div>
                                  </div>
                                );
                              }
                            )
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                              <p className="text-sm text-slate-500">
                                No members found.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* =================================================
                          ADD MEMBER — LEADER ONLY
                      ================================================= */}

                      {isLeader && (
                        <div className="mt-6 border-t border-slate-200 pt-6">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                            Group management
                          </p>

                          <h3 className="mt-2 text-base font-bold text-slate-900">
                            Add member
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Only the group leader can add students.
                          </p>

                          <form
                            onSubmit={addMember}
                            className="mt-4 flex flex-col gap-3 sm:flex-row"
                          >
                            <input
                              type="email"
                              placeholder="Student email"
                              value={memberEmail}
                              onChange={(e) =>
                                setMemberEmail(
                                  e.target.value
                                )
                              }
                              required
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                            />

                            <button
                              type="submit"
                              disabled={addingMember}
                              className="w-full rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                              {addingMember
                                ? 'Adding...'
                                : 'Add member'}
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Member notice */}
                      {!isLeader && (
                        <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                          Only the group leader can add or remove
                          members.
                        </div>
                      )}

                      {/* =================================================
                          MESSAGES
                      ================================================= */}

                      {memberMessage && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                          {memberMessage}
                        </div>
                      )}

                      {memberError && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                          {memberError}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-500">
                        Unable to load group details.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Empty state */}
          {groups.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 text-xl">
                👥
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No groups yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first group above to start
                collaborating.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}