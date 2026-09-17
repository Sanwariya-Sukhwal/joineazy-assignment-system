import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from './StudentDashboard';

export default function MyGroup() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMessage, setMemberMessage] = useState('');
  const [memberError, setMemberError] = useState('');
  const [loading, setLoading] = useState(true);

  const create = async (e) => {
    e.preventDefault();

    try {
      const { data } = await API.post('/groups', { name, description });

      setGroups((prev) => [data.group, ...prev]);
      setName('');
      setDescription('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create group');
    }
  };

  useEffect(() => {
    const loadGroups = async () => {
      try {
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

  const handleSelectGroup = async (groupId) => {
    if (selectedGroup === groupId) {
      setSelectedGroup(null);
      setSelectedGroupData(null);
      setMemberEmail('');
      setMemberMessage('');
      setMemberError('');
      return;
    }

    setMemberEmail('');
    setMemberMessage('');
    setMemberError('');

    try {
      const { data } = await API.get(`/groups/${groupId}`);
      setSelectedGroup(groupId);
      setSelectedGroupData(data.group);
    } catch (error) {
      setMemberError(error.response?.data?.error || 'Failed to load group members');
    }
  };

  const addMember = async (e) => {
    e.preventDefault();

    if (!selectedGroup) return;

    setMemberMessage('');
    setMemberError('');

    try {
      await API.post(`/groups/${selectedGroup}/members`, {
        email: memberEmail,
      });

      setMemberMessage('Member added successfully');
      setMemberEmail('');

      const { data } = await API.get(`/groups/${selectedGroup}`);
      setSelectedGroupData(data.group);

      setGroups((prev) =>
        prev.map((group) =>
          group.id === selectedGroup
            ? { ...group, memberCount: data.group.members.length }
            : group
        )
      );
    } catch (error) {
      setMemberError(error.response?.data?.error || 'Failed to add member');
    }
  };

  const removeMember = async (studentId) => {
    if (!selectedGroup) return;

    if (!window.confirm('Are you sure you want to remove this member?')) return;

    setMemberMessage('');
    setMemberError('');

    try {
      await API.delete(`/groups/${selectedGroup}/members/${studentId}`);

      setMemberMessage('Member removed successfully');

      const { data } = await API.get(`/groups/${selectedGroup}`);
      setSelectedGroupData(data.group);

      setGroups((prev) =>
        prev.map((group) =>
          group.id === selectedGroup
            ? { ...group, memberCount: data.group.members.length }
            : group
        )
      );
    } catch (error) {
      setMemberError(error.response?.data?.error || 'Failed to remove member');
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="Student workspace"
        title="My groups"
        text="Find your collaborators and keep the work moving."
      />

      {/* Create Group */}
      <form
        onSubmit={create}
        className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1.4fr_auto]"
      >
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
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        />

        <button
          type="submit"
          className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
        >
          Create group
        </button>
      </form>

      {/* Groups */}
      {loading ? (
        <p className="mt-8 text-slate-500">Loading groups...</p>
      ) : (
        <div className="mt-6 space-y-5">
          {groups.map((group) => (
            <div key={group.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              
              {/* Group Card */}
              <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lime-200 text-lg font-bold text-slate-900">
                    {group.name?.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-950">
                      {group.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {group.description || 'Collaborative workspace'}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      Led by{' '}
                      <span className="font-semibold text-slate-900">
                        {group.leaderName || 'you'}
                      </span>
                      {' · '}
                      {group.memberCount ?? 1} member{(group.memberCount ?? 1) === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectGroup(group.id)}
                  className="w-full rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-700 hover:bg-emerald-50 sm:w-auto"
                >
                  {selectedGroup === group.id ? 'Close' : 'View members'}
                </button>
              </div>

              {/* Selected Group */}
              {selectedGroup === group.id && selectedGroupData && (
                <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-slate-950">
                      {selectedGroupData.name} Members
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Manage students in this group.
                    </p>
                  </div>

                  {/* Members */}
                  <div className="space-y-3">
                    {selectedGroupData.members?.length > 0 ? (
                      selectedGroupData.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {member.firstName} {member.lastName}
                            </p>

                            <p className="mt-1 break-all text-sm text-slate-500">
                              {member.email}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {member.id === selectedGroupData.leaderId && (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Leader
                              </span>
                            )}

                            {member.id !== selectedGroupData.leaderId && (
                              <button
                                type="button"
                                onClick={() => removeMember(member.id)}
                                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-3 text-sm text-slate-500">
                        No members found.
                      </p>
                    )}
                  </div>

                  {/* Add Member */}
                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <h3 className="mb-3 text-base font-bold text-slate-900">
                      Add member
                    </h3>

                    <form
                      onSubmit={addMember}
                      className="flex flex-col gap-3 sm:flex-row"
                    >
                      <input
                        type="email"
                        placeholder="Student email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                      />

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 sm:w-auto"
                      >
                        Add member
                      </button>
                    </form>
                  </div>

                  {memberMessage && (
                    <p className="mt-3 text-sm font-semibold text-emerald-700">
                      {memberMessage}
                    </p>
                  )}

                  {memberError && (
                    <p className="mt-3 text-sm font-semibold text-red-600">
                      {memberError}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {groups.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="font-semibold text-slate-900">No groups yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Create your first group above.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}