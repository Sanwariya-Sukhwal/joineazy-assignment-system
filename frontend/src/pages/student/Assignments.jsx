import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from './StudentDashboard';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  // =========================
  // Load Student Assignments
  // =========================
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError('');

        // Get student's groups
        const { data: groupData } = await API.get(
          '/groups/my-groups'
        );

        const groups = groupData.groups || [];

        if (groups.length === 0) {
          setAssignments([]);
          return;
        }

        // Get assignments for each group
        const assignmentResponses = await Promise.all(
          groups.map((group) =>
            API.get(`/assignments/group/${group.id}`)
          )
        );

        const allAssignments = assignmentResponses.flatMap(
        ({ data }, index) =>
            (data.assignments || []).map((assignment) => ({
            ...assignment,
            groupId: groups[index].id,
            }))
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
        console.error('Load assignments error:', err);

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
  // Confirm Submission
  // =========================
  const confirmSubmission = async (assignmentId, groupId) => {
    try {
      setSubmittingId(assignmentId);
      setError('');

        const { data } = await API.post(
        `/submissions/${assignmentId}/confirm`,
        {
            groupId,
        }
        );
      setAssignments((prevAssignments) =>
        prevAssignments.map((assignment) =>
          assignment.id === assignmentId
            ? {
                ...assignment,
                isSubmitted: true,
                submittedAt:
                  data.submission?.submittedAt ||
                  new Date().toISOString(),
              }
            : assignment
        )
      );

      setConfirmingId(null);
    } catch (err) {
      console.error('Confirm submission error:', err);

      setError(
        err.response?.data?.error ||
        'Failed to confirm submission'
      );
    } finally {
      setSubmittingId(null);
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
          text="Your briefs, deadlines, and submission links."
        />

        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-slate-500">
            Loading assignments...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="Student workspace"
        title="Assignments"
        text="Your briefs, deadlines, and submission links."
      />

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* No assignments */}
      {assignments.length === 0 ? (
        <div className="border border-slate-200 bg-white px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            No assignments yet
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Your group does not have any assignments right now.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {assignments.map((assignment) => {
            const isSubmitted =
              assignment.isSubmitted === true;

            const dueDate = assignment.dueDate
              ? new Date(assignment.dueDate)
              : null;

            return (
              <article
                key={assignment.id}
                className="border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                {/* Top row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Status */}
                  <span
                    className={
                      isSubmitted
                        ? 'w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                        : 'w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700'
                    }
                  >
                    {isSubmitted ? 'Submitted' : 'Open'}
                  </span>

                  {/* Due date */}
                  <span className="text-sm text-slate-500">
                    Due{' '}
                    {dueDate
                      ? dueDate.toLocaleDateString(
                          'en-US',
                          {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )
                      : '—'}
                  </span>
                </div>

                {/* Assignment information */}
                <div className="mt-5">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {assignment.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {assignment.description ||
                      'No description provided.'}
                  </p>
                </div>

                {/* Divider */}
                <div className="my-5 border-t border-slate-100" />

                {/* Actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {assignment.oneDriveLink && (
                    <a
                      href={assignment.oneDriveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40] sm:w-auto"
                    >
                      Open Assignment
                    </a>
                  )}

                  {!isSubmitted ? (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmingId(assignment.id)
                      }
                      className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                    >
                      Yes, I have submitted
                    </button>
                  ) : (
                    <span className="inline-flex w-fit items-center rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                      ✓ Submission confirmed
                    </span>
                  )}
                </div>

                {/* Submitted date */}
                {isSubmitted &&
                  assignment.submittedAt && (
                    <p className="mt-3 text-xs text-slate-500">
                      Submitted on{' '}
                      {new Date(
                        assignment.submittedAt
                      ).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}

                {/* =========================
                    Confirmation Modal
                ========================= */}
                {confirmingId === assignment.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Confirm submission
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Are you sure you have submitted this
                        assignment?
                      </p>

                      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmingId(null)
                          }
                          disabled={
                            submittingId === assignment.id
                          }
                          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                            onClick={() =>
                            confirmSubmission(
                                assignment.id,
                                assignment.groupId
                            )
                            }
                          disabled={
                            submittingId === assignment.id
                          }
                          className="rounded-lg bg-[#216452] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingId === assignment.id
                            ? 'Confirming...'
                            : 'Yes, Confirm'}
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