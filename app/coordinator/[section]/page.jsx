export default function Placeholder({ params }) {
  return (
    <div className="card p-10 text-center">
      <h1 className="text-2xl font-semibold capitalize">{params.section.replace("-", " ")}</h1>
      <p className="mt-2 text-slate-500">This page is not built yet.</p>
    </div>
  );
}
