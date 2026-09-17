import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function CreateAssignment() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    oneDriveLink: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const update = (key) => (e) => {
    setForm({
      ...form,
      [key]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await API.post('/assignments', form);

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
        eyebrow="Admin workspace"
        title="New assignment"
        text="Give groups a clear brief and a fair deadline."
      />

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
            placeholder="Assignment title"
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
            placeholder="Describe the assignment..."
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/15"
          />
        </div>

        {/* Due Date + OneDrive */}
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Due Date */}
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
              ? 'Publishing...'
              : 'Publish assignment'}
          </button>

        </div>
      </form>
    </>
  );
}