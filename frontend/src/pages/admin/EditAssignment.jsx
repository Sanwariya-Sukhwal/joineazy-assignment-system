import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function EditAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    oneDriveLink: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // =========================
  // Load Assignment
  // =========================
  useEffect(() => {
    const loadAssignment = async () => {
      try {
        setLoading(true);

        const { data } = await API.get(`/assignments/${id}`);

        const assignment = data.assignment;

        setForm({
          title: assignment.title || '',
          description: assignment.description || '',
          dueDate: assignment.dueDate
            ? new Date(assignment.dueDate)
                .toISOString()
                .slice(0, 16)
            : '',
          oneDriveLink: assignment.oneDriveLink || '',
        });
      } catch (err) {
        console.error('Load assignment error:', err);

        setError(
          err.response?.data?.error ||
          'Failed to load assignment'
        );
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [id]);

  const update = (key) => (e) => {
    setForm({
      ...form,
      [key]: e.target.value,
    });
  };

  // =========================
  // Update Assignment
  // =========================
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await API.put(`/assignments/${id}`, form);

      navigate('/admin/assignments');
    } catch (err) {
      console.error('Update assignment error:', err);

      setError(
        err.response?.data?.error ||
        'Failed to update assignment'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="Admin workspace"
        title="Edit assignment"
        text="Update the assignment brief, deadline, or submission link."
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading assignment...
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-5">
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Title
            </label>

            <input
              id="title"
              type="text"
              value={form.title}
              onChange={update('title')}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
            />
          </div>

          {/* Description */}
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
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
            />
          </div>

          {/* Due Date + OneDrive */}
          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="dueDate"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Due date
              </label>

              <input
                id="dueDate"
                type="datetime-local"
                value={form.dueDate}
                onChange={update('dueDate')}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
              />
            </div>

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
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/assignments')}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Updating...'
                : 'Update assignment'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}