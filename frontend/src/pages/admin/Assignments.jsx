import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // =========================
  // Load Assignments
  // =========================
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await API.get('/assignments');

        setAssignments(data.assignments || []);
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
  // Delete Assignment
  // =========================
  const deleteAssignment = async (assignmentId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this assignment?'
    );

    if (!confirmed) return;

    try {
      await API.delete(`/assignments/${assignmentId}`);

      setAssignments((prev) =>
        prev.filter(
          (assignment) => assignment.id !== assignmentId
        )
      );
    } catch (err) {
      console.error('Delete assignment error:', err);

      setError(
        err.response?.data?.error ||
        'Failed to delete assignment'
      );
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="Admin workspace"
        title="Assignments"
        text="Publish and monitor every brief."
        action={
          <a
            href="/admin/assignments/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40]"
          >
            New assignment
          </a>
        }
      />

      {/* =========================
          Error
      ========================= */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* =========================
          Loading
      ========================= */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-slate-500">
            Loading assignments...
          </p>
        </div>
      ) : assignments.length === 0 ? (
        /* =========================
            Empty State
        ========================= */
        <div className="border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            No assignments yet
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Create your first assignment to get started.
          </p>

          <a
            href="/admin/assignments/new"
            className="mt-5 inline-flex items-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40]"
          >
            Create assignment
          </a>
        </div>
      ) : (
        /* =========================
            Assignment List
        ========================= */
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const dueDate = assignment.dueDate
              ? new Date(assignment.dueDate)
              : null;

            return (
              <article
                key={assignment.id}
                className="border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                {/* Top */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      Assignment
                    </span>

                    <h2 className="mt-4 text-xl font-semibold text-slate-900">
                      {assignment.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {assignment.description ||
                        'No description provided.'}
                    </p>
                  </div>

                  {/* Due date */}
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Due date
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
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
                  </div>
                </div>

                {/* Divider */}
                <div className="my-5 border-t border-slate-100" />

                {/* Details */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    {assignment.oneDriveLink ? (
                      <a
                        href={assignment.oneDriveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#216452] hover:underline"
                      >
                        Open OneDrive link →
                      </a>
                    ) : (
                      <span>No OneDrive link</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <a
                      href={`/admin/assignments/${assignment.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </a>

                    <a
                      href={`/admin/assignments/${assignment.id}/edit`}
                      className="inline-flex items-center justify-center rounded-lg border border-[#216452] px-4 py-2.5 text-sm font-semibold text-[#216452] transition hover:bg-[#216452] hover:text-white"
                    >
                      Edit
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        deleteAssignment(assignment.id)
                      }
                      className="inline-flex items-center justify-center rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}