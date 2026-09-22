import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from './StudentDashboard';
import { useAuth } from '../../context/AuthContext';

export default function Assignments() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmingId, setConfirmingId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [acknowledgeConfirmId, setAcknowledgeConfirmId] =
    useState(null);

  // =========================
  // Load Student Assignments
  // =========================
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: groupData } =
          await API.get('/groups/my-groups');

        const groupList = groupData.groups || [];

        setGroups(groupList);

        if (groupList.length === 0) {
          setAssignments([]);
          return;
        }

        // Get assignments for each student group
        const assignmentResponses = await Promise.all(
          groupList.map((group) =>
            API.get(`/assignments/group/${group.id}`)
          )
        );

        const allAssignments =
          assignmentResponses.flatMap(
            ({ data }, index) =>
              (data.assignments || []).map(
                (assignment) => ({
                  ...assignment,
                  groupId: groupList[index].id,
                  groupName: groupList[index].name,
                  groupLeaderId:
                    groupList[index].leaderId,
                })
              )
          );

        // Remove duplicate assignments
        const uniqueAssignments = Array.from(
          new Map(
            allAssignments.map((assignment) => [
              assignment.id,
              assignment,
            ])
          ).values()
        );

        setAssignments(uniqueAssignments);
      } catch (err) {
        console.error(
          'Load student assignments error:',
          err
        );

        setError(
          err.response?.data?.error ||
            'Failed to load assignments'
        );
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  // =========================
  // Helpers
  // =========================

  const getSubmissionType = (assignment) => {
    return (
      assignment.submissionType ||
      assignment.submission_type ||
      'group'
    ).toLowerCase();
  };

  const isGroupAssignment = (assignment) => {
    return getSubmissionType(assignment) === 'group';
  };

  const isIndividualAssignment = (assignment) => {
    return getSubmissionType(assignment) === 'individual';
  };

  const getAcknowledged = (assignment) => {
    return (
      assignment.acknowledged === true ||
      assignment.isAcknowledged === true
    );
  };

  const getIsSubmitted = (assignment) => {
    return assignment.isSubmitted === true;
  };

  const getIsLeader = (assignment) => {
    if (!isGroupAssignment(assignment)) {
      return true;
    }

    return (
      Number(assignment.groupLeaderId) ===
      Number(user?.id)
    );
  };

  const getDueDate = (assignment) => {
    if (!assignment.dueDate) return null;

    const date = new Date(assignment.dueDate);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  };

  const isOverdue = (assignment) => {
    const dueDate = getDueDate(assignment);

    return (
      dueDate &&
      dueDate.getTime() < Date.now() &&
      !getIsSubmitted(assignment)
    );
  };

  const getStatus = (assignment) => {
    const submitted = getIsSubmitted(assignment);
    const acknowledged = getAcknowledged(assignment);

    if (acknowledged) {
      return 'Acknowledged';
    }

    if (submitted) {
      return 'Submitted';
    }

    if (isOverdue(assignment)) {
      return 'Overdue';
    }

    return 'Open';
  };

  // =========================
  // Confirm Submission
  // =========================
  const confirmSubmission = async (assignment) => {
    try {
      setSubmittingId(assignment.id);
      setError('');

      const payload = {};

      if (isGroupAssignment(assignment)) {
        payload.groupId = assignment.groupId;
      }

      const { data } = await API.post(
        `/submissions/${assignment.id}/confirm`,
        payload
      );

      setAssignments((previous) =>
        previous.map((item) =>
          item.id === assignment.id
            ? {
                ...item,
                isSubmitted: true,
                submittedAt:
                  data.submission?.submittedAt ||
                  new Date().toISOString(),
              }
            : item
        )
      );

      setConfirmingId(null);
    } catch (err) {
      console.error(
        'Confirm submission error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Failed to confirm submission'
      );
    } finally {
      setSubmittingId(null);
    }
  };

  // =========================
  // Acknowledge Assignment
  // =========================
  const acknowledgeAssignment = async (
    assignment
  ) => {
    try {
      setAcknowledgingId(assignment.id);
      setError('');

      const payload = {};

      if (isGroupAssignment(assignment)) {
        payload.groupId = assignment.groupId;
      }

      const { data } = await API.post(
        `/submissions/${assignment.id}/acknowledge`,
        payload
      );

      setAssignments((previous) =>
        previous.map((item) =>
          item.id === assignment.id
            ? {
                ...item,
                acknowledged: true,
                isAcknowledged: true,
                acknowledgedAt:
                  data.submission?.acknowledgedAt ||
                  new Date().toISOString(),
              }
            : item
        )
      );

      setAcknowledgeConfirmId(null);
    } catch (err) {
      console.error(
        'Acknowledge assignment error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Failed to acknowledge assignment'
      );
    } finally {
      setAcknowledgingId(null);
    }
  };

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <>
        <PageHeading
          eyebrow="Student workspace"
          title="Assignments"
          text="Review your assignments, deadlines, submission status, and acknowledgement progress."
        />

        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#216452]" />

            <p className="mt-4 text-sm text-slate-500">
              Loading assignments...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="Student workspace"
        title="Assignments"
        text="Review your assignments, deadlines, submission status, and acknowledgement progress."
      />

      {/* =========================
          Error
      ========================= */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* =========================
          Assignment Summary
      ========================= */}
      {assignments.length > 0 && (
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total assignments"
            value={assignments.length}
          />

          <SummaryCard
            label="Submitted"
            value={
              assignments.filter(
                getIsSubmitted
              ).length
            }
          />

          <SummaryCard
            label="Acknowledged"
            value={
              assignments.filter(
                getAcknowledged
              ).length
            }
          />
        </div>
      )}

      {/* =========================
          No Assignments
      ========================= */}
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 text-xl text-emerald-800">
            ✓
          </div>

          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            No assignments yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Your professor has not assigned any
            assignments to your group yet.
          </p>
        </div>
      ) : (
        /* =========================
           Assignment List
        ========================= */
        <div className="space-y-6">
          {assignments.map((assignment) => {
            const submitted =
              getIsSubmitted(assignment);

            const acknowledged =
              getAcknowledged(assignment);

            const groupAssignment =
              isGroupAssignment(assignment);

            const individualAssignment =
              isIndividualAssignment(
                assignment
              );

            const leader =
              getIsLeader(assignment);

            const overdue =
              isOverdue(assignment);

            const dueDate =
              getDueDate(assignment);

            const status =
              getStatus(assignment);

            return (
              <article
                key={`${assignment.id}-${assignment.groupId || 'individual'}`}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* =========================
                    Header
                ========================= */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {assignment.courseName && (
                          <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {assignment.courseName}
                          </span>
                        )}

                        <span
                          className={
                            groupAssignment
                              ? 'inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'
                              : 'inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700'
                          }
                        >
                          {groupAssignment
                            ? 'Group'
                            : 'Individual'}
                        </span>

                        <StatusBadge
                          status={status}
                        />
                      </div>

                      {/* Title */}
                      <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        {assignment.title}
                      </h2>

                      {/* Description */}
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {assignment.description ||
                          'No description provided.'}
                      </p>
                    </div>

                    {/* Due Date */}
                    <div className="shrink-0 rounded-xl bg-slate-50 px-5 py-4 lg:min-w-[170px] lg:text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Due date
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
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

                      {dueDate && (
                        <p className="mt-1 text-xs text-slate-500">
                          {dueDate.toLocaleTimeString(
                            'en-US',
                            {
                              hour: 'numeric',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* =========================
                      Assignment Details
                  ========================= */}
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem
                      label="Submission"
                      value={
                        groupAssignment
                          ? 'Group submission'
                          : 'Individual submission'
                      }
                    />

                    {groupAssignment && (
                      <InfoItem
                        label="Group"
                        value={
                          assignment.groupName ||
                          'Your group'
                        }
                      />
                    )}

                    {groupAssignment && (
                    <InfoItem
                      label="Acknowledgement"
                      value={
                        acknowledged
                          ? 'Acknowledged by group leader'
                          : leader
                          ? 'You can acknowledge'
                          : 'Group leader acknowledges'
                      }
                    />
                    )}
                  </div>

                  {/* =========================
                      Progress
                  ========================= */}
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ProgressBox
                      label="Submission progress"
                      value={submitted ? 100 : 0}
                      text={
                        submitted
                          ? 'Submitted'
                          : overdue
                          ? 'Deadline passed'
                          : 'Not submitted'
                      }
                    />

                    <ProgressBox
                      label="Acknowledgement"
                      value={
                        acknowledged ? 100 : 0
                      }
                      text={
                        acknowledged
                          ? 'Acknowledged'
                          : submitted
                          ? leader
                            ? 'Ready to acknowledge'
                            : 'Waiting for group leader'
                          : 'Submit first'
                      }
                    />
                  </div>

                  {/* =========================
                      OneDrive / Resource
                  ========================= */}
                  {assignment.oneDriveLink && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <a
                        href={
                          assignment.oneDriveLink
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center font-semibold text-[#216452] hover:underline"
                      >
                        Open assignment resource →
                      </a>
                    </div>
                  )}

                  {/* =========================
                      Actions
                  ========================= */}
                  <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:flex-wrap">
                    {/* Submit */}
                    {!submitted ? (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmingId(
                            assignment.id
                          )
                        }
                        disabled={overdue}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {overdue
                          ? 'Deadline passed'
                          : individualAssignment
                          ? 'Confirm my submission'
                          : 'Confirm group submission'}
                      </button>
                    ) : (
                      <span className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 sm:w-auto">
                        ✓ Submission confirmed
                      </span>
                    )}

                    {/* Acknowledge */}
                    {submitted &&
                      !acknowledged &&
                      (individualAssignment ||
                        leader) && (
                        <button
                          type="button"
                          onClick={() =>
                            setAcknowledgeConfirmId(
                              assignment.id
                            )
                          }
                          className="inline-flex w-full items-center justify-center rounded-lg border border-[#216452] bg-white px-5 py-2.5 text-sm font-semibold text-[#216452] transition hover:bg-[#216452] hover:text-white sm:w-auto"
                        >
                          Acknowledge assignment
                        </button>
                      )}

                    {/* Waiting for leader */}
                    {submitted &&
                      !acknowledged &&
                      groupAssignment &&
                      !leader && (
                        <span className="inline-flex w-full items-center justify-center rounded-lg bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-700 sm:w-auto">
                          Waiting for group leader
                        </span>
                      )}

                    {/* Acknowledged */}
                    {acknowledged && (
                      <span className="inline-flex w-full items-center justify-center rounded-lg bg-lime-100 px-5 py-2.5 text-sm font-semibold text-emerald-800 sm:w-auto">
                        ✓ Assignment acknowledged
                      </span>
                    )}
                  </div>

                  {/* Submitted Date */}
                  {submitted &&
                    assignment.submittedAt && (
                      <p className="mt-4 text-xs text-slate-500">
                        Submitted on{' '}
                        {new Date(
                          assignment.submittedAt
                        ).toLocaleString(
                          'en-US',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    )}

                  {/* Acknowledged Date */}
                  {acknowledged &&
                    assignment.acknowledgedAt && (
                      <p className="mt-1 text-xs text-slate-500">
                        Acknowledged on{' '}
                        {new Date(
                          assignment.acknowledgedAt
                        ).toLocaleString(
                          'en-US',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    )}
                </div>

                {/* =========================
                    Submission Modal
                ========================= */}
                {confirmingId === assignment.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-xl text-amber-700">
                        !
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-900">
                        Confirm submission
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {groupAssignment
                          ? 'Confirm that your group has submitted this assignment. This will mark the assignment as submitted for your group.'
                          : 'Confirm that you have submitted this assignment.'}
                      </p>

                      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmingId(null)
                          }
                          disabled={
                            submittingId ===
                            assignment.id
                          }
                          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            confirmSubmission(
                              assignment
                            )
                          }
                          disabled={
                            submittingId ===
                            assignment.id
                          }
                          className="rounded-lg bg-[#216452] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingId ===
                          assignment.id
                            ? 'Confirming...'
                            : 'Yes, Confirm'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================
                    Acknowledgement Modal
                ========================= */}
                {acknowledgeConfirmId ===
                  assignment.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-lime-100 text-xl text-emerald-800">
                        ✓
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-900">
                        Acknowledge assignment
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {groupAssignment
                          ? 'As the group leader, confirm that your group acknowledges this assignment. This acknowledgement will be reflected for the entire group.'
                          : 'Confirm that you acknowledge this assignment.'}
                      </p>

                      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setAcknowledgeConfirmId(
                              null
                            )
                          }
                          disabled={
                            acknowledgingId ===
                            assignment.id
                          }
                          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            acknowledgeAssignment(
                              assignment
                            )
                          }
                          disabled={
                            acknowledgingId ===
                            assignment.id
                          }
                          className="rounded-lg bg-[#216452] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {acknowledgingId ===
                          assignment.id
                            ? 'Acknowledging...'
                            : 'Yes, Acknowledge'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

/* =========================
   Summary Card
========================= */

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <strong className="mt-2 block text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </strong>
    </div>
  );
}

/* =========================
   Status Badge
========================= */

function StatusBadge({ status }) {
  const styles = {
    Open: 'bg-sky-50 text-sky-700',
    Submitted:
      'bg-emerald-50 text-emerald-700',
    Acknowledged:
      'bg-lime-100 text-emerald-800',
    Overdue:
      'bg-red-50 text-red-700',
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

/* =========================
   Info Item
========================= */

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

/* =========================
   Progress Box
========================= */

function ProgressBox({
  label,
  value,
  text,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>

        <span className="text-xs font-semibold text-slate-500">
          {value}%
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#216452] transition-all duration-700"
          style={{
            width: `${Math.min(
              Math.max(value || 0, 0),
              100
            )}%`,
          }}
        />
      </div>

      <p className="mt-2 text-xs font-medium text-slate-500">
        {text}
      </p>
    </div>
  );
}