const steps = ["Drive details", "Import candidates", "Schedule", "Review & publish"];

export default function Stepper({ current }) {
  return (
    <ol className="card flex flex-wrap justify-between gap-2 px-4 py-3 text-xs">
      {steps.map((s, i) => (
        <li key={s} aria-current={i + 1 === current ? "step" : undefined}
          className={i + 1 === current ? "font-semibold text-brand" : i + 1 < current ? "text-brand" : "text-slate-400"}>
          {i + 1 < current ? "✓ " : `${i + 1}. `}{s}
        </li>
      ))}
    </ol>
  );
}
