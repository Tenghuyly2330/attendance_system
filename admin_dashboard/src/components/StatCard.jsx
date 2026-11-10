export default function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-black p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-black text-black tracking-tight">{value}</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-zinc-600 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
