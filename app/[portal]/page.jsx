export default function Portal({ params }) {
  return (
    <main className="grid min-h-screen place-items-center">
      <div className="card p-10 text-center">
        <h1 className="text-2xl font-semibold capitalize">{params.portal} portal</h1>
        <p className="mt-2 text-slate-500">This portal is not built yet.</p>
        <a href="/" className="btn-primary mt-4">Back home</a>
      </div>
    </main>
  );
}
