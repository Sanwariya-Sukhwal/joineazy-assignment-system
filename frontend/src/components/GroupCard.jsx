export default function GroupCard({ group, onSelect }) {
  const memberCount = group.memberCount ?? 1;

  return (
    <article className="flex items-center gap-4 border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lime-300 font-bold text-slate-900">
        {group.name?.slice(0, 1).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="mb-1 font-semibold text-slate-900">{group.name}</h3>

        <p className="mb-1 text-sm text-slate-500">
          {group.description || 'Collaborative workspace'} ·{' '}
          {memberCount} member{memberCount === 1 ? '' : 's'}
        </p>

        <small className="text-xs text-slate-500">
          Led by {group.leaderName || 'you'}
        </small>
      </div>

      {onSelect && (
        <button
          type="button"
          className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={() => onSelect(group.id)}
        >
          View
        </button>
      )}
    </article>
  );
}