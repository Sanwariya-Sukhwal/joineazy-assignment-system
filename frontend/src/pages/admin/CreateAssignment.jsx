import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function CreateAssignment() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    oneDriveLink: '',
    courseId: '',
    submissionType: 'group',
  });

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  // ==========================================
  // Load Professor Courses
  // ==========================================
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        setError('');

        const { data } = await API.get('/courses');

        setCourses(data.courses || []);
      } catch (err) {
        console.error('Load courses error:', err);

        setError(
          err.response?.data?.error ||
            'Failed to load courses'
        );
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  // ==========================================
  // Update Form
  // ==========================================
  const update = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  // ==========================================
  // Submit Assignment
  // ==========================================
  const submit = async (event) => {
    event.preventDefault();

    setError('');

    if (!form.courseId) {
      setError('Please select a course.');
      return;
    }

    if (!form.title.trim()) {
      setError('Assignment title is required.');
      return;
    }

    if (!form.dueDate) {
      setError('Due date is required.');
      return;
    }

    const selectedDueDate = new Date(form.dueDate);

    if (Number.isNaN(selectedDueDate.getTime())) {
      setError('Please enter a valid due date.');
      return;
    }

    if (selectedDueDate <= new Date()) {
      setError('Due date must be in the future.');
      return;
    }

    try {
      setSubmitting(true);

      await API.post('/assignments', {
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate,
        oneDriveLink: form.oneDriveLink.trim(),
        courseId: Number(form.courseId),
        submissionType: form.submissionType,
      });

      navigate('/admin/assignments');
    } catch (err) {
      console.error('Create assignment error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to create assignment'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="Professor workspace"
        title="New assignment"
        text="Create a clear assignment brief with a course, submission type, and deadline."
      />

      <form
        onSubmit={submit}
        className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {/* =========================
            Error
        ========================= */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* =========================
            Course + Submission Type
        ========================= */}
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Course */}
          <div>
            <label
              htmlFor="courseId"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Course *
            </label>

            <select
              id="courseId"
              value={form.courseId}
              onChange={update('courseId')}
              disabled={loadingCourses || submitting}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15 disabled:bg-slate-50"
            >
              <option value="">
                {loadingCourses
                  ? 'Loading courses...'
                  : courses.length === 0
                  ? 'No courses available'
                  : 'Select a course'}
              </option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.name}
                </option>
              ))}
            </select>

            {!loadingCourses && courses.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                Create a course before publishing an assignment.
              </p>
            )}
          </div>

          {/* Submission Type */}
          <div>
            <label
              htmlFor="submissionType"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Submission type *
            </label>

            <select
              id="submissionType"
              value={form.submissionType}
              onChange={update('submissionType')}
              disabled={submitting}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15 disabled:bg-slate-50"
            >
              <option value="individual">
                Individual
              </option>

              <option value="group">
                Group
              </option>
            </select>

            <p className="mt-2 text-xs text-slate-400">
              {form.submissionType === 'group'
                ? 'The group leader can acknowledge the assignment for the group.'
                : 'Each enrolled student submits and acknowledges individually.'}
            </p>
          </div>
        </div>

        {/* =========================
            Title
        ========================= */}
        <div className="mb-5">
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Title *
          </label>

          <input
            id="title"
            type="text"
            value={form.title}
            onChange={update('title')}
            placeholder="Assignment title"
            required
            disabled={submitting}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15 disabled:bg-slate-50"
          />
        </div>

        {/* =========================
            Description
        ========================= */}
        <div className="mb-5">
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Description
          </label>

          <textarea
            id="description"
            rows={5}
            value={form.description}
            onChange={update('description')}
            placeholder="Describe the assignment..."
            disabled={submitting}
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15 disabled:bg-slate-50"
          />
        </div>

        {/* =========================
            Due Date + OneDrive
        ========================= */}
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Due Date */}
          <div>
            <label
              htmlFor="dueDate"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Due date *
            </label>

            <input
              id="dueDate"
              type="datetime-local"
              value={form.dueDate}
              onChange={update('dueDate')}
              required
              disabled={submitting}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15 disabled:bg-slate-50"
            />

            <p className="mt-2 text-xs text-slate-400">
              Students must submit before this deadline.
            </p>
          </div>

          {/* OneDrive */}
          <div>
            <label
              htmlFor="oneDriveLink"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              OneDrive link
            </label>

            <input
              id="oneDriveLink"
              type="url"
              value={form.oneDriveLink}
              onChange={update('oneDriveLink')}
              placeholder="https://onedrive.live.com/..."
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* =========================
            Assignment Summary
        ========================= */}
        <div className="mb-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#216452]">
            Assignment setup
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">
                Course
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {courses.find(
                  (course) =>
                    String(course.id) ===
                    String(form.courseId)
                )?.name || 'Not selected'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Submission
              </p>

              <p className="mt-1 text-sm font-semibold capitalize text-slate-700">
                {form.submissionType}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Status
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                Ready to publish
              </p>
            </div>
          </div>
        </div>

        {/* =========================
            Actions
        ========================= */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/admin/assignments')}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              submitting ||
              loadingCourses ||
              courses.length === 0
            }
            className="inline-flex items-center justify-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Publishing...'
              : 'Publish assignment'}
          </button>
        </div>
      </form>
    </>
  );
}