export default function StatCard({ label, value, note, tone }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      <p className={`mt-1 text-xs ${tone}`}>{note}</p>
    </div>
  );
}
