import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><a className="flex items-center font-bold tracking-tight text-emerald-900" href="/dashboard"><span className="mr-2 grid h-8 w-8 place-items-center rounded-full bg-lime-300 text-slate-900">J</span>joineazy</a><div className="flex items-center gap-4"><div className="hidden text-right sm:block"><strong className="block text-sm text-slate-900">{user?.firstName} {user?.lastName}</strong><small className="text-xs capitalize text-slate-500">{user?.role}</small></div><button className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={logout}>Log out</button></div></header>;
}