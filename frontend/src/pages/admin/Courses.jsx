import { useEffect, useState } from 'react';
import API from '../../services/api';
import { PageHeading } from '../student/StudentDashboard';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [courseStudents, setCourseStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [courseForm, setCourseForm] = useState({
    name: '',
    description: '',
  });

  const [selectedStudentId, setSelectedStudentId] = useState('');

  // ==========================================
  // Load Professor Courses
  // ==========================================
  const loadCourses = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  // ==========================================
  // Initial Load
  // ==========================================
  useEffect(() => {
    loadCourses();
  }, []);

  // ==========================================
  // Load All Students
  // ==========================================
  const loadStudents = async () => {
    try {
      setStudentsLoading(true);
      setError('');

      const { data } = await API.get('/students');

      setStudents(data.students || []);
    } catch (err) {
      console.error('Load students error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to load students'
      );
    } finally {
      setStudentsLoading(false);
    }
  };

  // ==========================================
  // Open Manage Students
  // ==========================================
  const openManageStudents = async (course) => {
    try {
      setSelectedCourse(course);
      setSelectedStudentId('');
      setError('');
      setSuccess('');

      await loadStudents();

      setStudentsLoading(true);

      const { data } = await API.get(
        `/students/course/${course.id}`
      );

      setCourseStudents(data.students || []);
    } catch (err) {
      console.error('Load course students error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to load course students'
      );
    } finally {
      setStudentsLoading(false);
    }
  };

  // ==========================================
  // Close Manage Students
  // ==========================================
  const closeManageStudents = () => {
    setSelectedCourse(null);
    setCourseStudents([]);
    setSelectedStudentId('');
    setSuccess('');
  };

  // ==========================================
  // Create / Update Form
  // ==========================================
  const openCreateForm = () => {
    setEditingCourse(null);

    setCourseForm({
      name: '',
      description: '',
    });

    setShowCreate(true);
    setError('');
    setSuccess('');
  };

  const openEditForm = (course) => {
    setEditingCourse(course);

    setCourseForm({
      name: course.name || '',
      description: course.description || '',
    });

    setShowCreate(true);
    setError('');
    setSuccess('');
  };

  const closeCourseForm = () => {
    setShowCreate(false);
    setEditingCourse(null);

    setCourseForm({
      name: '',
      description: '',
    });
  };

  // ==========================================
  // Submit Course Form
  // ==========================================
  const handleCourseSubmit = async (event) => {
    event.preventDefault();

    if (!courseForm.name.trim()) {
      setError('Course name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (editingCourse) {
        await API.put(
          `/courses/${editingCourse.id}`,
          {
            name: courseForm.name.trim(),
            description: courseForm.description.trim(),
          }
        );

        setSuccess('Course updated successfully.');
      } else {
        await API.post('/courses', {
          name: courseForm.name.trim(),
          description: courseForm.description.trim(),
        });

        setSuccess('Course created successfully.');
      }

      closeCourseForm();

      await loadCourses();
    } catch (err) {
      console.error('Save course error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to save course'
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Delete Course
  // ==========================================
  const deleteCourse = async (courseId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this course?'
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await API.delete(`/courses/${courseId}`);

      setCourses((prev) =>
        prev.filter((course) => course.id !== courseId)
      );

      if (selectedCourse?.id === courseId) {
        closeManageStudents();
      }

      setSuccess('Course deleted successfully.');
    } catch (err) {
      console.error('Delete course error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to delete course'
      );
    }
  };

  // ==========================================
  // Enroll Student
  // ==========================================
  const enrollStudent = async () => {
    if (!selectedCourse || !selectedStudentId) {
      setError('Please select a student');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await API.post(
        `/students/course/${selectedCourse.id}`,
        {
          studentId: Number(selectedStudentId),
        }
      );

      const { data } = await API.get(
        `/students/course/${selectedCourse.id}`
      );

      setCourseStudents(data.students || []);
      setSelectedStudentId('');

      setCourses((prev) =>
        prev.map((course) =>
          course.id === selectedCourse.id
            ? {
                ...course,
                student_count:
                  data.students?.length || 0,
              }
            : course
        )
      );

      setSelectedCourse((prev) =>
        prev
          ? {
              ...prev,
              student_count:
                data.students?.length || 0,
            }
          : prev
      );

      setSuccess('Student enrolled successfully.');
    } catch (err) {
      console.error('Enroll student error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to enroll student'
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Remove Student
  // ==========================================
  const removeStudent = async (studentId) => {
    if (!selectedCourse) return;

    const confirmed = window.confirm(
      'Remove this student from the course?'
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await API.delete(
        `/students/course/${selectedCourse.id}/${studentId}`
      );

      const { data } = await API.get(
        `/students/course/${selectedCourse.id}`
      );

      setCourseStudents(data.students || []);

      setCourses((prev) =>
        prev.map((course) =>
          course.id === selectedCourse.id
            ? {
                ...course,
                student_count:
                  data.students?.length || 0,
              }
            : course
        )
      );

      setSelectedCourse((prev) =>
        prev
          ? {
              ...prev,
              student_count:
                data.students?.length || 0,
            }
          : prev
      );

      setSuccess('Student removed successfully.');
    } catch (err) {
      console.error('Remove student error:', err);

      setError(
        err.response?.data?.error ||
          'Failed to remove student'
      );
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="Professor workspace"
        title="Courses"
        text="Create courses, manage students, and keep your classes organized."
        action={
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40]"
          >
            New course
          </button>
        }
      />

      {/* =========================
          Messages
      ========================= */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {/* =========================
          Create / Edit Course
      ========================= */}
      {showCreate && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#216452]">
                {editingCourse
                  ? 'Edit course'
                  : 'New course'}
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {editingCourse
                  ? 'Update course details'
                  : 'Create a new course'}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeCourseForm}
              className="text-sm font-semibold text-slate-400 hover:text-slate-700"
            >
              Close
            </button>
          </div>

          <form
            onSubmit={handleCourseSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Course name *
              </label>

              <input
                type="text"
                value={courseForm.name}
                onChange={(event) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Java Full Stack Development"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <textarea
                rows="4"
                value={courseForm.description}
                onChange={(event) =>
                  setCourseForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe this course..."
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#216452] focus:ring-2 focus:ring-[#216452]/10"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCourseForm}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? 'Saving...'
                  : editingCourse
                  ? 'Update course'
                  : 'Create course'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =========================
          Course List
      ========================= */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-slate-500">
            Loading courses...
          </p>
        </div>
      ) : courses.length === 0 ? (
        <div className="border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime-100 text-xl">
            ▣
          </div>

          <h3 className="mt-5 text-lg font-semibold text-slate-900">
            No courses yet
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Create your first course and start enrolling students.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-5 inline-flex items-center rounded-lg bg-[#216452] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40]"
          >
            Create course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {courses.map((course) => (
            <article
              key={course.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    Course
                  </span>

                  <h2 className="mt-4 text-xl font-bold text-slate-900">
                    {course.name}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {course.description ||
                      'No course description provided.'}
                  </p>
                </div>

                <div className="shrink-0 rounded-lg bg-lime-100 px-3 py-2 text-center">
                  <strong className="block text-lg font-bold text-[#216452]">
                    {course.student_count ?? 0}
                  </strong>

                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Students
                  </span>
                </div>
              </div>

              <div className="my-5 border-t border-slate-100" />

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    openManageStudents(course)
                  }
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#216452] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#194f40]"
                >
                  Manage students
                </button>

                <button
                  type="button"
                  onClick={() => openEditForm(course)}
                  className="inline-flex items-center justify-center rounded-lg border border-[#216452] px-4 py-2.5 text-sm font-semibold text-[#216452] transition hover:bg-[#216452] hover:text-white"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => deleteCourse(course.id)}
                  className="inline-flex items-center justify-center rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* =========================
          Manage Students Panel
      ========================= */}
      {selectedCourse && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#216452]">
                Student enrollment
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {selectedCourse.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage students enrolled in this course.
              </p>
            </div>

            <button
              type="button"
              onClick={closeManageStudents}
              className="text-sm font-semibold text-slate-400 hover:text-slate-700"
            >
              Close
            </button>
          </div>

          {/* Enroll */}
          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Enroll student
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedStudentId}
                onChange={(event) =>
                  setSelectedStudentId(event.target.value)
                }
                disabled={studentsLoading || saving}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#216452]"
              >
                <option value="">
                  {studentsLoading
                    ? 'Loading students...'
                    : 'Select a student'}
                </option>

                {students
                  .filter(
                    (student) =>
                      !courseStudents.some(
                        (enrolled) =>
                          enrolled.id === student.id
                      )
                  )
                  .map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.firstName} {student.lastName} —{' '}
                      {student.email}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={enrollStudent}
                disabled={!selectedStudentId || saving}
                className="rounded-lg bg-[#216452] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#194f40] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Enroll'}
              </button>
            </div>
          </div>

          {/* Enrolled Students */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Enrolled students
              </h3>

              <span className="text-sm font-semibold text-slate-500">
                {courseStudents.length} student
                {courseStudents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {studentsLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Loading students...
              </div>
            ) : courseStudents.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No students enrolled yet.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Select a student above to enroll them.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {courseStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {student.firstName} {student.lastName}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {student.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeStudent(student.id)
                      }
                      className="shrink-0 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}