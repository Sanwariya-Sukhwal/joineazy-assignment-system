import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function AdminAssignmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [groups, setGroups] = useState([]);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ==========================================
  // Load Assignment Data
  // ==========================================
  useEffect(() => {
    loadAssignmentData();
  }, [id]);

  const loadAssignmentData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        assignmentResponse,
        groupsResponse,
        assignedGroupsResponse,
        submissionsResponse,
      ] = await Promise.all([
        API.get(`/assignments/${id}`),
        API.get('/groups'),
        API.get(`/assignments/${id}/groups`),
        API.get(`/submissions/assignment/${id}`),
      ]);

      setAssignment(
        assignmentResponse.data.assignment || null
      );

      setGroups(
        groupsResponse.data.groups || []
      );

      setAssignedGroups(
        assignedGroupsResponse.data.groups || []
      );

      setSubmissions(
        submissionsResponse.data.submissions || []
      );
    } catch (err) {
      console.error(
        'Load assignment details error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Failed to load assignment details'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Assign Group
  // ==========================================
  const assignGroup = async () => {
    if (!selectedGroupId) {
      setError('Please select a group first.');
      return;
    }

    try {
      setAssigning(true);
      setError('');
      setSuccess('');

      await API.post(
        `/assignments/${id}/groups`,
        {
          groupId: Number(selectedGroupId),
        }
      );

      setSuccess(
        'Group assigned to this assignment successfully.'
      );

      setSelectedGroupId('');

      await loadAssignmentData();
    } catch (err) {
      console.error(
        'Assign group error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Failed to assign group'
      );
    } finally {
      setAssigning(false);
    }
  };

  // ==========================================
  // Helpers
  // ==========================================
  const getSubmissionType = () => {
    const type =
      assignment?.submissionType ||
      assignment?.submission_type ||
      'group';

    return type.toLowerCase();
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '—';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isPastDue = () => {
    if (!assignment?.dueDate) return false;

    return new Date(assignment.dueDate) < new Date();
  };

  const isSubmitted = (submission) =>
    submission.isSubmitted === true ||
    submission.is_submitted === true;

  const isAcknowledged = (submission) =>
    submission.acknowledged === true;

  const getStudentName = (submission) => {
    if (submission.studentName) {
      return submission.studentName;
    }

    if (
      submission.firstName ||
      submission.lastName
    ) {
      return `${submission.firstName || ''} ${
        submission.lastName || ''
      }`.trim();
    }

    return 'Student';
  };

  const getGroupMemberCount = (group) => {
    return (
      group.memberCount ??
      group.member_count ??
      group.members?.length ??
      0
    );
  };

  const submittedCount = submissions.filter(
    isSubmitted
  ).length;

  const acknowledgedCount = submissions.filter(
    isAcknowledged
  ).length;

  const submissionRate =
    submissions.length > 0
      ? Math.round(
          (submittedCount / submissions.length) *
            100
        )
      : 0;

  const acknowledgementRate =
    submissions.length > 0
      ? Math.round(
          (acknowledgedCount /
            submissions.length) *
            100
        )
      : 0;

  // Groups already assigned to this assignment
  const assignedGroupIds = new Set(
    assignedGroups.map((group) =>
      String(
        group.groupId ??
          group.group_id ??
          group.id
      )
    )
  );

  const availableGroups = groups.filter(
    (group) =>
      !assignedGroupIds.has(
        String(group.id)
      )
  );

  // ==========================================
  // Loading
  // ==========================================
  if (loading) {
    return (
      <>
        <PageHeading
          eyebrow="Professor workspace"
          title="Assignment details"
          text="Review assignment details, groups, submissions, and acknowledgement progress."
        />

        <div className="py-16 text-center text-sm text-slate-500">
          Loading assignment details...
        </div>
      </>
    );
  }

  // ==========================================
  // Error / Not Found
  // ==========================================
  if (error && !assignment) {
    return (
      <>
        <PageHeading
          eyebrow="Professor workspace"
          title="Assignment details"
          text="Review assignment details and progress."
        />

        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
          <p className="text-sm font-medium text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/admin/assignments')
            }
            className="mt-5 rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to assignments
          </button>
        </div>
      </>
    );
  }

  const submissionType = getSubmissionType();

  return (
    <>
      <PageHeading
        eyebrow="Professor workspace"
        title={assignment.title}
        text="Review assignment details, groups, submissions, and acknowledgement progress."
        action={
          <button
            type="button"
            onClick={() =>
              navigate(
                `/admin/assignments/${id}/edit`
              )
            }
            className="inline-flex items-center justify-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40]"
          >
            Edit assignment
          </button>
        }
      />

      {/* =========================
          Success Message
      ========================= */}
      {success && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {/* =========================
          Error Message
      ========================= */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* =========================
          Assignment Information
      ========================= */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {assignment.courseName ||
              assignment.course_name ||
              'Course not assigned'}
          </span>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              submissionType === 'individual'
                ? 'bg-violet-50 text-violet-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {submissionType === 'individual'
              ? 'Individual'
              : 'Group'}
          </span>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              isPastDue()
                ? 'bg-red-50 text-red-600'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {isPastDue() ? 'Past due' : 'Active'}
          </span>
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-900">
          {assignment.title}
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          {assignment.description ||
            'No description provided.'}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoBox
            label="Course"
            value={
              assignment.courseName ||
              assignment.course_name ||
              'Not assigned'
            }
          />

          <InfoBox
            label="Submission type"
            value={submissionType}
            capitalize
          />

          <InfoBox
            label="Due date"
            value={formatDate(
              assignment.dueDate
            )}
          />
        </div>

        {assignment.oneDriveLink && (
          <div className="mt-5">
            <a
              href={assignment.oneDriveLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-[#216452] hover:underline"
            >
              Open OneDrive resource →
            </a>
          </div>
        )}
      </section>

      {/* =========================
          Progress Overview
      ========================= */}
      <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ProgressCard
          title="Submission progress"
          percentage={submissionRate}
          count={`${submittedCount} / ${submissions.length}`}
          description="Students or groups that have submitted."
          barClass="bg-[#216452]"
        />

        <ProgressCard
          title="Acknowledgement"
          percentage={acknowledgementRate}
          count={`${acknowledgedCount} / ${submissions.length}`}
          description="Students or groups that have acknowledged."
          barClass="bg-[#c5f34b]"
        />
      </section>

      {/* =========================
          Assign Groups
      ========================= */}
      {submissionType === 'group' && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#216452]">
              Assignment setup
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Assign groups
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select the groups that should complete
              this assignment.
            </p>
          </div>

          {/* Select Group */}
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <label
              htmlFor="assignment-group"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Select group
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                id="assignment-group"
                value={selectedGroupId}
                onChange={(e) =>
                  setSelectedGroupId(
                    e.target.value
                  )
                }
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
              >
                <option value="">
                  Select a group
                </option>

                {availableGroups.map((group) => (
                  <option
                    key={group.id}
                    value={group.id}
                  >
                    {group.name} (
                    {getGroupMemberCount(group)}{' '}
                    members)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={assignGroup}
                disabled={
                  !selectedGroupId ||
                  assigning
                }
                className="inline-flex items-center justify-center rounded-lg bg-[#216452] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#194f40] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assigning
                  ? 'Assigning...'
                  : 'Assign group'}
              </button>
            </div>

            {availableGroups.length === 0 && (
              <p className="mt-3 text-xs text-slate-500">
                {groups.length === 0
                  ? 'No groups are available yet. Create a group first.'
                  : 'All available groups are already assigned to this assignment.'}
              </p>
            )}
          </div>

          {/* Assigned Groups */}
          <div className="mt-7">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-slate-900">
                Assigned groups
              </h3>

              <span className="text-sm text-slate-500">
                {assignedGroups.length}{' '}
                {assignedGroups.length === 1
                  ? 'group'
                  : 'groups'}
              </span>
            </div>

            {assignedGroups.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No groups assigned yet.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Assign a group above to start
                  tracking progress.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {assignedGroups.map(
                  (group, index) => (
                    <div
                      key={
                        group.id ||
                        group.groupId ||
                        group.group_id ||
                        index
                      }
                      className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {group.name ||
                            group.groupName ||
                            group.group_name ||
                            `Group ${index + 1}`}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {getGroupMemberCount(
                            group
                          )}{' '}
                          members
                        </p>

                        {(group.leaderName ||
                          group.leader_name) && (
                          <p className="mt-1 text-xs text-slate-400">
                            Leader:{' '}
                            {group.leaderName ||
                              group.leader_name}
                          </p>
                        )}
                      </div>

                      <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        Assigned
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================
          Submission Monitoring
      ========================= */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#216452]">
            Submission monitoring
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Submission status
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track submission and acknowledgement
            status.
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              No submission records yet.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Submission records will appear after
              students or groups submit.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {submission.groupName ||
                      submission.group_name ||
                      getStudentName(
                        submission
                      )}
                  </p>

                  {submission.email && (
                    <p className="mt-1 text-sm text-slate-500">
                      {submission.email}
                    </p>
                  )}

                  {submission.submittedAt && (
                    <p className="mt-1 text-xs text-slate-400">
                      Submitted:{' '}
                      {formatDate(
                        submission.submittedAt
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    active={isSubmitted(
                      submission
                    )}
                    activeText="Submitted"
                    inactiveText="Pending"
                  />

                  <StatusBadge
                    active={isAcknowledged(
                      submission
                    )}
                    activeText="Acknowledged"
                    inactiveText="Not acknowledged"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================
          Back
      ========================= */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() =>
            navigate('/admin/assignments')
          }
          className="text-sm font-semibold text-[#216452] hover:underline"
        >
          ← Back to assignments
        </button>
      </div>
    </>
  );
}

// ==========================================
// Info Box
// ==========================================
function InfoBox({
  label,
  value,
  capitalize = false,
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-semibold text-slate-800 ${
          capitalize ? 'capitalize' : ''
        }`}
      >
        {value}
      </p>
    </div>
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
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {percentage}%
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
            width: `${Math.min(
              Math.max(
                Number(percentage) || 0,
                0
              ),
              100
            )}%`,
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
// Status Badge
// ==========================================
function StatusBadge({
  active,
  activeText,
  inactiveText,
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}