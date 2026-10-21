import { days, events } from "@/lib/mock";

const hours = [9, 10, 11, 12, 13];
const color = {
  violet: "bg-violet-100 text-violet-800 border-violet-400",
  sky: "bg-sky-100 text-sky-800 border-sky-400",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-400",
  amber: "bg-amber-100 text-amber-800 border-amber-400",
};

export default function WeekGrid() {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] grid-cols-[48px_repeat(5,1fr)] text-xs">
        <div />
        {days.map((d) => <div key={d} className="border-b p-2 text-center font-medium text-slate-500">{d}</div>)}
        {hours.map((h) => (
          <div key={h} className="contents">
            <div className="p-2 text-slate-400">{String(h).padStart(2, "0")}:00</div>
            {days.map((_, di) => {
              const e = events.find((x) => x.d === di && x.h === h);
              return (
                <div key={di} className="h-16 border-b border-l p-1">
                  {e && (
                    <div className={`h-full rounded-md border-l-4 p-1.5 ${color[e.c]}`}>
                      <p className="font-medium">{e.name}</p>
                      <p className="opacity-80">{e.sub}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
