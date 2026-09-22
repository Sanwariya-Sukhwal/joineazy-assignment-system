import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ==========================================
  // Load Assignments + Courses + Submission Data
  // ==========================================
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [assignmentsResponse, coursesResponse] =
          await Promise.all([
            API.get('/assignments'),
            API.get('/courses'),
          ]);

        const assignmentList =
          assignmentsResponse.data.assignments || [];

        const courseList =
          coursesResponse.data.courses || [];

        setCourses(courseList);

        // Load submission information for each assignment
        const assignmentsWithProgress =
          await Promise.all(
            assignmentList.map(async (assignment) => {
              try {
                const { data } = await API.get(
                  `/submissions/assignment/${assignment.id}`
                );

                const submissions =
                  data.submissions || [];

                const totalSubmissions =
                  submissions.length;

                const submittedCount =
                  submissions.filter(
                    (submission) =>
                      submission.isSubmitted === true ||
                      submission.is_submitted === true
                  ).length;

                const acknowledgedCount =
                  submissions.filter(
                    (submission) =>
                      submission.acknowledged === true
                  ).length;

                const submissionRate =
                  totalSubmissions > 0
                    ? Math.round(
                        (submittedCount /
                          totalSubmissions) *
                          100
                      )
                    : 0;

                const acknowledgementRate =
                  totalSubmissions > 0
                    ? Math.round(
                        (acknowledgedCount /
                          totalSubmissions) *
                          100
                      )
                    : 0;

                return {
                  ...assignment,
                  totalSubmissions,
                  submittedCount,
                  acknowledgedCount,
                  submissionRate,
                  acknowledgementRate,
                };
              } catch (submissionError) {
                console.error(
                  `Load submission data for assignment ${assignment.id} error:`,
                  submissionError
                );

                return {
                  ...assignment,
                  totalSubmissions: 0,
                  submittedCount: 0,
                  acknowledgedCount: 0,
                  submissionRate: 0,
                  acknowledgementRate: 0,
                };
              }
            })
          );

        setAssignments(assignmentsWithProgress);
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

    loadData();
  }, []);

  // ==========================================
  // Delete Assignment
  // ==========================================
  const deleteAssignment = async (assignmentId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this assignment?'
    );

    if (!confirmed) return;

    try {
      setError('');

      await API.delete(`/assignments/${assignmentId}`);

      setAssignments((prev) =>
        prev.filter(
          (assignment) =>
            assignment.id !== assignmentId
        )
      );
    } catch (err) {
      console.error(
        'Delete assignment error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Failed to delete assignment'
      );
    }
  };

  // ==========================================
  // Find Course Name
  // ==========================================
  const getCourseName = (assignment) => {
    const course = courses.find(
      (item) =>
        String(item.id) ===
        String(assignment.courseId)
    );

    return (
      course?.name ||
      assignment.courseName ||
      'Course not assigned'
    );
  };

  // ==========================================
  // Assignment Status
  // ==========================================
  const getAssignmentStatus = (dueDateValue) => {
    if (!dueDateValue) {
      return {
        label: 'No deadline',
        className:
          'bg-slate-100 text-slate-600',
      };
    }

    const dueDate = new Date(dueDateValue);
    const now = new Date();

    if (dueDate < now) {
      return {
        label: 'Past due',
        className:
          'bg-red-50 text-red-600',
      };
    }

    return {
      label: 'Active',
      className:
        'bg-emerald-50 text-emerald-700',
    };
  };

  // ==========================================
  // Format Date
  // ==========================================
  const formatDate = (dateValue) => {
    if (!dateValue) return '—';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ==========================================
  // Submission Type
  // ==========================================
  const getSubmissionType = (assignment) => {
    const type =
      assignment.submissionType ||
      assignment.submission_type ||
      'group';

    return type.toLowerCase();
  };

  return (
    <>
      <PageHeading
        eyebrow="Professor workspace"
        title="Assignments"
        text="Publish and monitor every assignment, submission, and acknowledgement."
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime-100 text-xl text-[#216452]">
            ✓
          </div>

          <h3 className="mt-5 text-lg font-semibold text-slate-900">
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
        <div className="space-y-5">
          {assignments.map((assignment) => {
            const dueDate = assignment.dueDate
              ? new Date(assignment.dueDate)
              : null;

            const submissionType =
              getSubmissionType(assignment);

            const status =
              getAssignmentStatus(
                assignment.dueDate
              );

            return (
              <article
                key={assignment.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                {/* =========================
                    Header
                ========================= */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        {getCourseName(assignment)}
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
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <h2 className="mt-4 text-xl font-semibold text-slate-900">
                      {assignment.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {assignment.description ||
                        'No description provided.'}
                    </p>
                  </div>

                  {/* =========================
                      Due Date
                  ========================= */}
                  <div className="shrink-0 rounded-lg bg-slate-50 px-4 py-3 text-left lg:min-w-[150px] lg:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Due date
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {formatDate(
                        assignment.dueDate
                      )}
                    </p>
                  </div>
                </div>

                {/* =========================
                    Progress
                ========================= */}
                <div className="my-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Submission */}
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          Submission progress
                        </p>

                        <p className="mt-2 text-xl font-bold text-slate-900">
                          {assignment.submissionRate ??
                            0}
                          %
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-slate-500">
                        {assignment.submittedCount ??
                          0}{' '}
                        /{' '}
                        {assignment.totalSubmissions ??
                          0}
                      </span>
                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#216452] transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              Number(
                                assignment.submissionRate
                              ) || 0,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Acknowledgement */}
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          Acknowledgement
                        </p>

                        <p className="mt-2 text-xl font-bold text-slate-900">
                          {assignment.acknowledgementRate ??
                            0}
                          %
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-slate-500">
                        {assignment.acknowledgedCount ??
                          0}{' '}
                        /{' '}
                        {assignment.totalSubmissions ??
                          0}
                      </span>
                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#c5f34b] transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              Number(
                                assignment.acknowledgementRate
                              ) || 0,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* =========================
                    Bottom Details
                ========================= */}
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* OneDrive */}
                    <div className="text-sm text-slate-500">
                      {assignment.oneDriveLink ? (
                        <a
                          href={
                            assignment.oneDriveLink
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#216452] hover:underline"
                        >
                          Open OneDrive link →
                        </a>
                      ) : (
                        <span>
                          No OneDrive link
                        </span>
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
                          deleteAssignment(
                            assignment.id
                          )
                        }
                        className="inline-flex items-center justify-center rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
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