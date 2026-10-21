import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Download,
  ExternalLink,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  ListFilter,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Users,
  UserRound,
  X,
  Zap,
} from "lucide-react";

type Page =
  | "Overview"
  | "Placement calendar"
  | "Candidates"
  | "Interviewers"
  | "Placement drives"
  | "AI scheduler"
  | "Conflicts"
  | "Evaluations"
  | "Rankings"
  | "Analytics"
  | "Notifications"
  | "Integrations"
  | "Settings"
  | "My profile";

type EventItem = {
  time: string;
  duration: string;
  title: string;
  detail: string;
  tone: string;
  column: number;
  row: number;
};

const navigation: { label: string; icon: typeof LayoutDashboard; items: Page[] }[] = [
  { label: "Workspace", icon: LayoutDashboard, items: ["Overview", "Placement calendar"] },
  { label: "People", icon: Users, items: ["Candidates", "Interviewers"] },
  { label: "Planning", icon: CalendarDays, items: ["Placement drives", "AI scheduler", "Conflicts"] },
  { label: "Review", icon: Activity, items: ["Evaluations", "Rankings", "Analytics"] },
];

const events: EventItem[] = [
  { time: "09:00", duration: "45 min", title: "Aranya Shah", detail: "Priya Nair · Coding", tone: "lilac", column: 1, row: 1 },
  { time: "09:00", duration: "45 min", title: "Dev Joshi", detail: "Rohan Mehta · Technical", tone: "lilac", column: 3, row: 1 },
  { time: "09:00", duration: "45 min", title: "Mohan Mehta", detail: "Anika Patel · HR", tone: "lilac", column: 5, row: 1 },
  { time: "10:00", duration: "45 min", title: "Neha Kapoor", detail: "Rohan Mehta · Coding", tone: "blue", column: 2, row: 2 },
  { time: "10:00", duration: "45 min", title: "Rahul Patel", detail: "Priya Nair · Technical", tone: "peach", column: 3, row: 2 },
  { time: "10:00", duration: "45 min", title: "Zoya Ali", detail: "Maya Chen · HR", tone: "mint", column: 4, row: 2 },
  { time: "11:00", duration: "45 min", title: "Rohan Mehta", detail: "Anika Patel · Coding", tone: "blue", column: 1, row: 3 },
  { time: "11:00", duration: "45 min", title: "Ishan Rao", detail: "Priya Nair · HR", tone: "lilac", column: 2, row: 3 },
  { time: "11:00", duration: "45 min", title: "Ananya Shah", detail: "Rohan Mehta · Technical", tone: "lilac", column: 5, row: 3 },
  { time: "13:00", duration: "45 min", title: "Panel calibration", detail: "All interviewers · Meet", tone: "blue", column: 1, row: 5 },
  { time: "13:00", duration: "45 min", title: "Zoya Ali", detail: "Anika Patel · Coding", tone: "mint", column: 3, row: 5 },
  { time: "13:00", duration: "45 min", title: "Neha Kapoor", detail: "Priya Nair · Technical", tone: "mint", column: 4, row: 5 },
  { time: "13:00", duration: "45 min", title: "Placement review", detail: "Coordinator · Meet", tone: "blue", column: 5, row: 5 },
];

const candidates = [
  { name: "Ananya Shah", initials: "AS", role: "Product Designer", round: "Technical", status: "Scheduled", date: "Today, 9:00 AM", score: "—", color: "violet" },
  { name: "Priya Nair", initials: "PN", role: "Frontend Engineer", round: "Coding", status: "In review", date: "Today, 10:00 AM", score: "—", color: "blue" },
  { name: "Dev Joshi", initials: "DJ", role: "Data Analyst", round: "HR", status: "Completed", date: "Yesterday", score: "4.8", color: "orange" },
  { name: "Zoya Ali", initials: "ZA", role: "Product Designer", round: "Coding", status: "Scheduled", date: "Today, 1:00 PM", score: "—", color: "green" },
  { name: "Rohan Mehta", initials: "RM", role: "Frontend Engineer", round: "Technical", status: "Awaiting feedback", date: "Oct 21, 11:00 AM", score: "—", color: "pink" },
  { name: "Neha Kapoor", initials: "NK", role: "Data Analyst", round: "Coding", status: "Completed", date: "Oct 20, 2:30 PM", score: "4.5", color: "teal" },
];

const drives = [
  { company: "Northstar Labs", role: "Engineering", window: "Nov 2–6, 2026", candidates: "240", coverage: "228 / 240 scheduled", status: "Published", progress: 95, logo: "N", logoClass: "brand-northstar" },
  { company: "Meridian Finance", role: "Analyst", window: "Nov 9–11, 2026", candidates: "96", coverage: "Awaiting availability", status: "Collecting", progress: 42, logo: "M", logoClass: "brand-meridian" },
  { company: "Studio Fieldwork", role: "Product Design", window: "Nov 16–18, 2026", candidates: "64", coverage: "Draft schedule", status: "Draft", progress: 18, logo: "F", logoClass: "brand-fieldwork" },
];

function App() {
  const [page, setPage] = useState<Page>("Overview");
  const [isPublic, setIsPublic] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem("arclight-theme") === "dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"drive" | "interview" | "signin" | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [week, setWeek] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All candidates");
  const [toast, setToast] = useState("");

  const toggleTheme = () => {
    setDark((current) => {
      const next = !current;
      localStorage.setItem("arclight-theme", next ? "dark" : "light");
      return next;
    });
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  useEffect(() => {
    const handleCalendarToast = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail) notify(detail);
    };
    window.addEventListener("arclight:toast", handleCalendarToast);
    return () => window.removeEventListener("arclight:toast", handleCalendarToast);
  }, []);

  const navigate = (next: Page) => {
    setPage(next);
    setIsPublic(false);
    setMobileOpen(false);
    setNotificationOpen(false);
  };

  return (
    <div className={dark ? "app dark" : "app"}>
      {isPublic ? (
        <Landing
          dark={dark}
          onTheme={toggleTheme}
          onOpenApp={() => {
            setIsPublic(false);
            setPage("Overview");
          }}
          onSignIn={() => setModal("signin")}
        />
      ) : (
        <div className="workspace">
          <Sidebar
            page={page}
            onNavigate={navigate}
            onLanding={() => setIsPublic(true)}
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />
          <main className="main-area">
            <Topbar
              page={page}
              query={query}
              setQuery={setQuery}
              onMenu={() => setMobileOpen(true)}
              dark={dark}
              onTheme={toggleTheme}
              onNotifications={() => setNotificationOpen((open) => !open)}
              onCreate={() => setModal(page === "Candidates" ? "interview" : "drive")}
            />
            <div className="page-content">
              {page === "Overview" && (
                <Overview
                  onNavigate={navigate}
                  onCreate={() => setModal("drive")}
                  onNotify={notify}
                  week={week}
                  setWeek={setWeek}
                />
              )}
              {page === "Placement calendar" && (
                <CalendarPage
                  week={week}
                  setWeek={setWeek}
                  onBook={() => setModal("interview")}
                  onNotify={notify}
                />
              )}
              {page === "Candidates" && (
                <CandidatesPage
                  query={query}
                  filter={activeFilter}
                  setFilter={setActiveFilter}
                  onAdd={() => setModal("interview")}
                />
              )}
              {page === "Placement drives" && <DrivesPage onCreate={() => setModal("drive")} />}
              {page === "AI scheduler" && <SchedulerPage onNotify={notify} />}
              {page === "Conflicts" && <ConflictsPage onNotify={notify} />}
              {page === "Interviewers" && <InterviewersPage query={query} />}
              {page === "Evaluations" && <EvaluationsPage />}
              {page === "Rankings" && <RankingsPage />}
              {page === "Analytics" && <AnalyticsPage />}
              {page === "Notifications" && <NotificationsPage />}
              {page === "Integrations" && <IntegrationsPage onNotify={notify} />}
              {page === "Settings" && <SettingsPage dark={dark} onTheme={toggleTheme} />}
              {page === "My profile" && <ProfilePage />}
            </div>
            {notificationOpen && <NotificationPopover onClose={() => setNotificationOpen(false)} />}
          </main>
        </div>
      )}
      {modal && <Modal type={modal} onClose={() => setModal(null)} onNotify={notify} />}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  );
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand ${inverse ? "brand-inverse" : ""}`}>
      <span className="brand-mark"><span /><span /><span /></span>
      <span>Arclight</span>
    </span>
  );
}

function Sidebar({
  page,
  onNavigate,
  onLanding,
  mobileOpen,
  onClose,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  onLanding: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const secondary: { label: string; icon: typeof LayoutDashboard; page: Page }[] = [
    { label: "Notifications", icon: Bell, page: "Notifications" },
    { label: "Integrations", icon: Zap, page: "Integrations" },
    { label: "Settings", icon: Settings, page: "Settings" },
  ];
  return (
    <>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={onClose} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <button className="sidebar-brand" onClick={onLanding} aria-label="Go to Arclight home"><Brand inverse /></button>
          <button className="sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
          <button className="workspace-select">
            <span className="workspace-avatar">W</span>
            <span className="workspace-copy"><strong>Westlake University</strong><small>Coordinator workspace</small></span>
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="side-scroll">
          {navigation.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item === "Overview" ? LayoutDashboard : item === "Placement calendar" ? CalendarDays : item === "Candidates" || item === "Interviewers" ? Users : item === "AI scheduler" ? Sparkles : item === "Conflicts" ? Activity : item === "Placement drives" ? GraduationCap : item === "Evaluations" ? CheckCheck : item === "Rankings" ? ArrowDownRight : Activity;
                return <button key={item} className={`nav-item ${page === item ? "nav-active" : ""}`} onClick={() => onNavigate(item)}><Icon size={16} strokeWidth={1.8} /><span>{item}</span>{item === "Conflicts" && <span className="nav-count">3</span>}</button>;
              })}
            </div>
          ))}
          <div className="nav-group">
            <div className="nav-label">Manage</div>
            {secondary.map(({ label, icon: Icon, page: destination }) => <button key={label} className={`nav-item ${page === destination ? "nav-active" : ""}`} onClick={() => onNavigate(destination)}><Icon size={16} strokeWidth={1.8} /><span>{label}</span>{label === "Notifications" && <span className="nav-dot" />}</button>)}
          </div>
        </div>
        <div className="sidebar-bottom">
          <button className="sidebar-help"><CircleHelp size={16} /><span>Help & support</span><ArrowUpRight size={13} /></button>
          <button className="profile-mini" onClick={() => onNavigate("My profile")}>
            <span className="avatar avatar-maya">MC</span>
            <span className="profile-copy"><strong>Maya Chen</strong><small>Coordinator</small></span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({
  page,
  query,
  setQuery,
  onMenu,
  dark,
  onTheme,
  onNotifications,
  onCreate,
}: {
  page: Page;
  query: string;
  setQuery: (query: string) => void;
  onMenu: () => void;
  dark: boolean;
  onTheme: () => void;
  onNotifications: () => void;
  onCreate: () => void;
}) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={onMenu}><Menu size={19} /></button>
      <div className="crumbs"><span>Workspace</span><ChevronRight size={13} /><strong>{page}</strong></div>
      <label className="global-search">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, drives, interviews..." />
        <kbd><Command size={10} /> K</kbd>
      </label>
      <div className="topbar-actions">
        <span className="demo-pill"><span /> Demo workspace</span>
        <button className="icon-button" onClick={onTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button className="icon-button top-notify" onClick={onNotifications} aria-label="Notifications"><Bell size={17} /><i /></button>
        <button className="button button-primary button-small top-create" onClick={onCreate}><Plus size={15} /> Create new</button>
      </div>
    </header>
  );
}

function PageHeading({ eyebrow, title, subtitle, action, secondary }: { eyebrow?: string; title: string; subtitle: string; action?: React.ReactNode; secondary?: React.ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="heading-actions">{secondary}{action}</div>
    </div>
  );
}

function Overview({ onNavigate, onCreate, onNotify, week, setWeek }: { onNavigate: (page: Page) => void; onCreate: () => void; onNotify: (message: string) => void; week: number; setWeek: (week: number) => void }) {
  return (
    <>
      <PageHeading eyebrow="WEDNESDAY, OCTOBER 21, 2026  /  OVERVIEW" title="A clearer view of placement week." subtitle="Good morning, Maya. Here's what needs your attention for Westlake 2026." secondary={<button className="button button-quiet" onClick={() => onNotify("Your placement report is ready to download.")}><Download size={14} /> Export report</button>} action={<button className="button button-primary" onClick={onCreate}><Plus size={15} /> Create drive</button>} />
      <section className="metric-grid">
        <MetricCard label="Active placement drives" value="4" note="2 opening this week" tone="green" icon={GraduationCap} trend="+2 this month" />
        <MetricCard label="Candidates in workflow" value="240" note="228 scheduled · 95% coverage" tone="violet" icon={Users} trend="+12% vs last drive" />
        <MetricCard label="Interviews this week" value="228" note="Across 6 panels · 4 rooms" tone="blue" icon={CalendarDays} trend="86% capacity" />
        <MetricCard label="Needs your attention" value="3" note="2 conflicts · 1 dropout request" tone="amber" icon={Activity} trend="Review now" />
      </section>
      <div className="attention-banner">
        <span className="attention-icon"><Activity size={16} /></span>
        <div><strong>Three scheduling issues, one place to resolve them.</strong><span>Two availability conflicts and Alex Rivera's dropout request need a coordinator review.</span></div>
        <button onClick={() => onNavigate("Conflicts")}>Review issues <ArrowRight size={14} /></button>
      </div>
      <div className="overview-layout">
        <section className="panel week-panel">
          <div className="panel-heading">
            <div><h2>Your placement week</h2><p>Northstar Labs · November 2–6 · 2026</p></div>
            <div className="calendar-actions"><span className="timezone-tag">PST</span><button className="text-link" onClick={() => onNavigate("Placement calendar")}>Open calendar <ArrowRight size={13} /></button></div>
          </div>
          <MiniCalendar week={week} setWeek={setWeek} />
          <div className="calendar-legend"><span><i className="legend-dot dot-coding" /> Coding</span><span><i className="legend-dot dot-technical" /> Technical</span><span><i className="legend-dot dot-hr" /> HR</span><span><i className="legend-dot dot-panel" /> Panel / event</span><span className="legend-tail">45-minute interviews · local time</span></div>
        </section>
        <aside className="right-rail">
          <section className="panel up-next">
            <div className="panel-heading"><div><h2>Up next</h2><p>Your next interviews</p></div><button className="text-link" onClick={() => onNavigate("Placement calendar")}>View all</button></div>
            <div className="next-date"><span className="live-dot" /> TODAY · 09:00</div>
            <div className="next-person"><span className="avatar avatar-sage">AS</span><div><strong>Ananya Shah</strong><span>Technical screen · R1</span></div><button className="icon-button compact"><MoreHorizontal size={16} /></button></div>
            <div className="next-details"><span>Priya Nair · C-201</span><span>45 minutes · Google Meet</span></div>
            <button className="button button-outline button-full" onClick={() => onNotify("Interview details opened for Ananya Shah.")}>Interview details <ArrowUpRight size={13} /></button>
            <div className="next-divider" />
            <div className="panel-heading calendar-health-heading"><div><h2>Calendar health</h2><p>225 of 228 events synced</p></div><span className="health-check"><Check size={13} /></span></div>
            <div className="sync-caption">3 invites queued for retry. Duplicate prevention is enabled.</div>
            <span className="integration-chip"><span className="google-g">G</span> GOOGLE CALENDAR · SYNCED</span>
            <button className="text-link manage-link" onClick={() => onNavigate("Integrations")}>Manage integration <ArrowRight size={13} /></button>
          </section>
        </aside>
      </div>
      <DrivesTable compact onViewAll={() => onNavigate("Placement drives")} />
    </>
  );
}

function MetricCard({ label, value, note, tone, icon: Icon, trend }: { label: string; value: string; note: string; tone: string; icon: typeof Users; trend: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={15} /></span></div><strong className="metric-value">{value}</strong><div className="metric-bottom"><span className={`metric-note ${tone}`}>{note}</span><span className="metric-trend"><ArrowUpRight size={12} /> {trend}</span></div></div>;
}

function MiniCalendar({ week, setWeek }: { week: number; setWeek: (week: number) => void }) {
  const weekLabels = week === 0 ? ["MON 02", "TUE 03", "WED 04", "THU 05", "FRI 06"] : week < 0 ? ["MON 26", "TUE 27", "WED 28", "THU 29", "FRI 30"] : ["MON 09", "TUE 10", "WED 11", "THU 12", "FRI 13"];
  return (
    <div className="mini-calendar">
      <div className="calendar-grid">
        <div className="time-head"><button aria-label="Previous week" onClick={() => setWeek(week - 1)}><ChevronLeft size={13} /></button></div>
        {weekLabels.map((day, index) => <div className={`day-head ${index === 2 ? "today-head" : ""}`} key={day}>{day}</div>)}
        {["09:00", "10:00", "11:00", "12:00", "13:00"].map((time, rowIndex) => <div className="time-label" style={{ gridRow: rowIndex + 2 }} key={time}>{time}</div>)}
        {weekLabels.map((_, colIndex) => <div key={colIndex} className={`calendar-cell ${colIndex === 2 ? "today-cell" : ""}`} style={{ gridColumn: colIndex + 2, gridRow: "2 / span 5" }} />)}
        {events.map((event, index) => <button key={`${week}-${event.title}-${index}`} className={`calendar-event event-${event.tone}`} style={{ gridColumn: event.column + 1, gridRow: event.row + 1 }} title={`${event.time} · ${event.title} · ${event.detail}`} onClick={() => window.dispatchEvent(new CustomEvent("arclight:toast", { detail: `${event.title} · ${event.detail}` }))}><strong>{event.time} · {event.duration}</strong><span>{event.title}</span><small>{event.detail}</small></button>)}
        <div className="lunch-label" style={{ gridColumn: "2 / 7", gridRow: 5 }}>Lunch break <span>·</span> Lunch break <span>·</span> Lunch break <span>·</span> Lunch break <span>·</span> Lunch break</div>
        <div className="time-foot"><button aria-label="Next week" onClick={() => setWeek(week + 1)}><ChevronRight size={13} /></button></div>
      </div>
    </div>
  );
}

function DrivesTable({ compact, onViewAll }: { compact?: boolean; onViewAll: () => void }) {
  return (
    <section className={`panel drives-panel ${compact ? "drives-compact" : ""}`}>
      <div className="panel-heading"><div><h2>Active placement drives</h2><p>Keep an eye on coverage and upcoming windows</p></div><button className="text-link" onClick={onViewAll}>View all drives <ArrowRight size={13} /></button></div>
      <div className="table-wrap"><table className="data-table drive-table"><thead><tr><th>DRIVE</th><th>INTERVIEW WINDOW</th><th>CANDIDATES</th><th>SCHEDULING COVERAGE</th><th>STATUS</th></tr></thead><tbody>{drives.slice(0, compact ? 2 : 3).map((drive) => <tr key={drive.company}><td><div className="drive-name"><span className={`company-logo ${drive.logoClass}`}>{drive.logo}</span><div><strong>{drive.company}</strong><small>{drive.role}</small></div></div></td><td>{drive.window}</td><td>{drive.candidates}</td><td><div className="coverage-cell"><span>{drive.coverage}</span><div className="progress-track"><i style={{ width: `${drive.progress}%` }} /></div></div></td><td><StatusBadge status={drive.status} /></td></tr>)}</tbody></table></div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className = status.toLowerCase().replace(/\s/g, "-");
  return <span className={`status-badge status-${className}`}><i />{status}</span>;
}

function CalendarPage({ week, setWeek, onBook, onNotify }: { week: number; setWeek: (week: number) => void; onBook: () => void; onNotify: (message: string) => void }) {
  const dateText = week === 0 ? "November 2–6, 2026" : week < 0 ? "October 26–30, 2026" : "November 9–13, 2026";
  return (
    <>
      <PageHeading eyebrow="PLANNING / CALENDAR" title="Placement calendar" subtitle="Every interview, panel, and room — in one clear view." secondary={<button className="button button-outline" onClick={() => onNotify("Calendar exported as an .ics file.")}><Download size={14} /> Export .ics</button>} action={<button className="button button-primary" onClick={onBook}><Plus size={15} /> Schedule interview</button>} />
      <section className="panel calendar-full-panel">
        <div className="calendar-toolbar"><div className="calendar-title"><button className="icon-button" aria-label="Previous week" onClick={() => setWeek(week - 1)}><ChevronLeft size={17} /></button><button className="icon-button" aria-label="Next week" onClick={() => setWeek(week + 1)}><ChevronRight size={17} /></button><h2>{dateText}</h2><button className="button button-outline button-today" onClick={() => setWeek(0)}>Today</button></div><div className="calendar-toolbar-actions"><button className="button button-outline"><Users size={14} /> All interviewers <ChevronDown size={13} /></button><button className="button button-outline"><SlidersHorizontal size={14} /> Filters</button><div className="segmented"><button className="selected">Week</button><button onClick={() => onNotify("Month view is coming soon.")}>Month</button></div></div></div>
        <CalendarGrid week={week} onNotify={onNotify} />
        <div className="calendar-footer"><div className="calendar-legend"><span><i className="legend-dot dot-coding" /> Coding</span><span><i className="legend-dot dot-technical" /> Technical</span><span><i className="legend-dot dot-hr" /> HR</span><span><i className="legend-dot dot-panel" /> Panel / event</span></div><span>45-minute interviews · Pacific time (UTC−07:00)</span></div>
      </section>
      <div className="calendar-summary"><span><i className="summary-dot green-dot" /> 228 interviews scheduled</span><span><i className="summary-dot violet-dot" /> 4 rooms in use</span><span><i className="summary-dot amber-dot" /> 3 open availability slots</span><button className="text-link" onClick={() => onNotify("A calendar invite link has been copied.")}>Share calendar <ExternalLink size={13} /></button></div>
    </>
  );
}

function CalendarGrid({ week, onNotify }: { week: number; onNotify: (message: string) => void }) {
  const [selected, setSelected] = useState<EventItem | null>(null);
  const days = week === 0 ? ["MON 02", "TUE 03", "WED 04", "THU 05", "FRI 06"] : week < 0 ? ["MON 26", "TUE 27", "WED 28", "THU 29", "FRI 30"] : ["MON 09", "TUE 10", "WED 11", "THU 12", "FRI 13"];
  return (
    <>
      <div className="full-calendar">
        <div className="full-calendar-head"><div className="full-time-head">GMT−07</div>{days.map((day, index) => <div key={day} className={`full-day-head ${index === 2 && week === 0 ? "today-head" : ""}`}>{day}<small>{["Mon", "Tue", "Wed", "Thu", "Fri"][index]}</small></div>)}</div>
        <div className="full-calendar-body">
          <div className="full-time-column">{["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"].map((time) => <div key={time}>{time}</div>)}</div>
          {days.map((day, index) => <div className={`full-day-column ${index === 2 && week === 0 ? "today-full-column" : ""}`} key={day}>{Array.from({ length: 8 }, (_, i) => <div className="hour-line" key={i} />)}</div>)}
          {events.map((event, index) => <button key={`${event.title}-${index}`} className={`full-calendar-event event-${event.tone}`} style={{ left: `${10.8 + (event.column - 1) * 17.8}%`, top: `${Math.max(14, (event.row - 1) * 91 + 20)}px`, height: event.row === 5 ? "63px" : "63px" }} onClick={() => setSelected(event)}><strong>{event.time} · {event.duration}</strong><span>{event.title}</span><small>{event.detail}</small></button>)}
        </div>
      </div>
      {selected && <div className="event-detail"><div><strong>{selected.title}</strong><span>{selected.time} · {selected.duration} · {selected.detail}</span></div><button className="button button-outline button-small" onClick={() => { onNotify(`Interview details opened for ${selected.title}.`); setSelected(null); }}>View details <ArrowUpRight size={12} /></button><button className="icon-button compact" aria-label="Close details" onClick={() => setSelected(null)}><X size={15} /></button></div>}
    </>
  );
}

function CandidatesPage({ query, filter, setFilter, onAdd }: { query: string; filter: string; setFilter: (filter: string) => void; onAdd: () => void }) {
  const [roleFilter, setRoleFilter] = useState("All roles");
  const filtered = useMemo(() => candidates.filter((candidate) => {
    const matchesQuery = `${candidate.name} ${candidate.role} ${candidate.round}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = filter === "All candidates" || candidate.status === filter;
    const matchesRole = roleFilter === "All roles" || candidate.role === roleFilter;
    return matchesQuery && matchesStatus && matchesRole;
  }), [query, filter, roleFilter]);
  return (
    <>
      <PageHeading eyebrow="PEOPLE / CANDIDATES" title="Candidates" subtitle="Track every candidate from first round to final decision." action={<button className="button button-primary" onClick={onAdd}><Plus size={15} /> Add candidate</button>} />
      <div className="people-stats"><span><strong>240</strong> Total candidates</span><span><strong>186</strong> In progress</span><span><strong>38</strong> Completed</span><span><strong>16</strong> Awaiting action</span></div>
      <section className="panel list-panel">
        <div className="list-toolbar"><div className="filter-tabs">{["All candidates", "Scheduled", "In review", "Awaiting feedback"].map((status) => <button key={status} className={filter === status ? "filter-active" : ""} onClick={() => setFilter(status)}>{status}{status === "All candidates" && <span>240</span>}</button>)}</div><div className="list-filters"><label className="select-wrap"><Filter size={14} /><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option>All roles</option><option>Product Designer</option><option>Frontend Engineer</option><option>Data Analyst</option></select><ChevronDown size={13} /></label><button className="button button-outline button-small"><ListFilter size={14} /> More filters</button></div></div>
        <div className="table-wrap"><table className="data-table candidates-table"><thead><tr><th><input type="checkbox" aria-label="Select all candidates" /></th><th>CANDIDATE</th><th>ROLE</th><th>ROUND</th><th>INTERVIEW</th><th>STATUS</th><th>SCORE</th><th /></tr></thead><tbody>{filtered.map((candidate) => <tr key={candidate.name}><td><input type="checkbox" aria-label={`Select ${candidate.name}`} /></td><td><div className="candidate-cell"><span className={`avatar avatar-${candidate.color}`}>{candidate.initials}</span><div><strong>{candidate.name}</strong><small>{candidate.name.toLowerCase().replace(" ", ".")}@westlake.edu</small></div></div></td><td>{candidate.role}</td><td><span className="round-tag">{candidate.round}</span></td><td>{candidate.date}</td><td><StatusBadge status={candidate.status} /></td><td>{candidate.score}</td><td><button className="icon-button compact" aria-label={`More actions for ${candidate.name}`}><MoreHorizontal size={16} /></button></td></tr>)}</tbody></table>{filtered.length === 0 && <EmptyState title="No candidates found" detail="Try a different search or adjust your filters." />}</div>
        <div className="table-pagination"><span>Showing <strong>{filtered.length ? 1 : 0}–{filtered.length}</strong> of 240 candidates</span><div><button className="button button-outline button-small" disabled>Previous</button><button className="button button-outline button-small">Next <ArrowRight size={13} /></button></div></div>
      </section>
    </>
  );
}

function DrivesPage({ onCreate }: { onCreate: () => void }) {
  const [tab, setTab] = useState("All drives");
  return <><PageHeading eyebrow="PLANNING / PLACEMENT DRIVES" title="Placement drives" subtitle="Create a well-run process for every hiring team." action={<button className="button button-primary" onClick={onCreate}><Plus size={15} /> New placement drive</button>} /><div className="drive-overview"><div><span>Active drives</span><strong>4</strong><small>Across 3 hiring partners</small></div><div><span>Open roles</span><strong>7</strong><small>Engineering, product & data</small></div><div><span>Average coverage</span><strong>86%</strong><small>+12% vs. last month</small></div><div><span>Upcoming</span><strong>2</strong><small>Next window opens Nov 2</small></div></div><section className="panel list-panel"><div className="drives-tabs">{["All drives", "Active", "Drafts", "Completed"].map((value) => <button key={value} className={tab === value ? "filter-active" : ""} onClick={() => setTab(value)}>{value}</button>)}</div><DrivesTable onViewAll={() => setTab("All drives")} /></section></>;
}

function SchedulerPage({ onNotify }: { onNotify: (message: string) => void }) {
  const [generated, setGenerated] = useState(false);
  return <><PageHeading eyebrow="PLANNING / AI SCHEDULER" title="A schedule that just works." subtitle="Set your constraints. Arclight finds the best fit for everyone." action={<button className="button button-outline" onClick={() => onNotify("Your current scheduling settings have been saved.")}><Settings size={14} /> Scheduler settings</button>} /><div className="scheduler-layout"><section className="panel scheduler-config"><div className="section-kicker"><span className="sparkle-chip"><Sparkles size={15} /></span><div><h2>Build a new schedule</h2><p>Northstar Labs · Engineering · Nov 2–6, 2026</p></div></div><div className="form-section"><label>Interview rounds</label><div className="round-steps"><div><span>01</span><strong>Coding</strong><small>45 min · 1 interviewer</small><Check size={14} /></div><ArrowRight size={15} /><div><span>02</span><strong>Technical</strong><small>60 min · 2 interviewers</small><Check size={14} /></div><ArrowRight size={15} /><div><span>03</span><strong>HR</strong><small>30 min · 1 interviewer</small><Check size={14} /></div></div></div><div className="scheduler-fields"><label><span>Interview window</span><select defaultValue="Nov 2–6, 2026"><option>Nov 2–6, 2026</option><option>Nov 9–13, 2026</option></select></label><label><span>Daily hours</span><select defaultValue="09:00 AM – 05:00 PM"><option>09:00 AM – 05:00 PM</option><option>08:00 AM – 04:00 PM</option></select></label><label><span>Room capacity</span><select defaultValue="4 rooms · max 4 candidates"><option>4 rooms · max 4 candidates</option><option>2 rooms · max 2 candidates</option></select></label><label><span>Break between interviews</span><select defaultValue="15 minutes"><option>15 minutes</option><option>30 minutes</option></select></label></div><div className="constraints-box"><div><strong>Scheduling preferences</strong><button className="text-link" onClick={() => onNotify("Preference editor is ready.")}>Edit preferences</button></div><div className="preference-chips"><span><Check size={12} /> Prefer morning slots</span><span><Check size={12} /> Avoid back-to-back interviews</span><span><Check size={12} /> Match interviewer skills</span><span><Check size={12} /> Honor candidate availability</span></div></div><button className="button button-primary button-generate" onClick={() => setGenerated(true)}><Sparkles size={16} /> Generate smart schedule <ArrowRight size={15} /></button></section><aside className="scheduler-side"><div className="ai-note"><div className="ai-note-icon"><Sparkles size={16} /></div><strong>Better schedules, fewer compromises.</strong><p>Arclight balances interviewer skills, candidate preferences, availability, and room capacity to build an efficient schedule.</p><a href="#scheduler-details">How scheduling works <ArrowRight size={13} /></a></div><div className="panel readiness-card"><h3>Schedule readiness</h3><div className="readiness-score">92<span>/ 100</span><i>Ready to schedule</i></div><div className="readiness-row"><span>Candidate availability</span><strong>95%</strong><div><i style={{ width: "95%" }} /></div></div><div className="readiness-row"><span>Interviewer coverage</span><strong>89%</strong><div><i style={{ width: "89%" }} /></div></div><div className="readiness-row"><span>Room availability</span><strong>100%</strong><div><i style={{ width: "100%" }} /></div></div></div></aside></div>{generated && <div className="generated-banner"><CheckCheck size={17} /><div><strong>Your schedule is ready for review.</strong><span>228 interviews placed across 4 rooms. 0 hard conflicts found.</span></div><button className="button button-outline button-small" onClick={() => onNotify("Schedule published to all participants.")}>Review & publish <ArrowRight size={13} /></button><button className="icon-button compact" aria-label="Dismiss" onClick={() => setGenerated(false)}><X size={15} /></button></div>}</>;
}

function ConflictsPage({ onNotify }: { onNotify: (message: string) => void }) {
  const [resolved, setResolved] = useState<string[]>([]);
  const conflicts = [{ title: "Interviewer availability overlap", detail: "Priya Nair is assigned to two interviews at 10:00 AM on Nov 3.", candidate: "Priya Nair · Coding round", severity: "Scheduling conflict", icon: "PN", color: "blue" }, { title: "Room capacity exceeded", detail: "Room C-201 has 5 panelists booked; max capacity is 4.", candidate: "Northstar Labs · Panel review", severity: "Room conflict", icon: "NS", color: "violet" }, { title: "Interviewer cancellation request", detail: "Alex Rivera is unavailable on Nov 4. 3 interviews may need moving.", candidate: "Alex Rivera · 3 affected candidates", severity: "Availability change", icon: "AR", color: "orange" }];
  return <><PageHeading eyebrow="PLANNING / CONFLICTS" title="A few things need a closer look." subtitle="Resolve scheduling issues before they reach candidates." action={<button className="button button-outline" onClick={() => onNotify("All conflicts are up to date.")}><Activity size={14} /> Refresh conflicts</button>} /><div className="conflict-summary"><span className="conflict-count">3</span><div><strong>Open conflicts</strong><span>2 high priority · 1 schedule change</span></div><span className="conflict-updated">Last checked just now</span></div><div className="conflict-list">{conflicts.filter((item) => !resolved.includes(item.title)).map((conflict) => <section className="panel conflict-card" key={conflict.title}><span className={`avatar avatar-${conflict.color}`}>{conflict.icon}</span><div className="conflict-copy"><div className="conflict-title-row"><h2>{conflict.title}</h2><StatusBadge status={conflict.severity} /></div><p>{conflict.detail}</p><span className="conflict-candidate">{conflict.candidate}</span></div><div className="conflict-actions"><button className="button button-outline button-small" onClick={() => onNotify(`Details opened: ${conflict.title}`)}>View details</button><button className="button button-primary button-small" onClick={() => { setResolved([...resolved, conflict.title]); onNotify("Conflict resolved. Unaffected interviews were preserved."); }}>{conflict.title.includes("cancellation") ? "Reschedule affected" : "Resolve conflict"} <ArrowRight size={13} /></button></div></section>)}</div>{resolved.length === conflicts.length && <EmptyState title="You're all caught up" detail="Every placement scheduling conflict has been resolved." />}</>;
}

function InterviewersPage({ query }: { query: string }) {
  const interviewerData = [{ name: "Priya Nair", initials: "PN", specialty: "Frontend · System design", availability: "Available", interviews: 18, color: "blue" }, { name: "Rohan Mehta", initials: "RM", specialty: "Backend · Data systems", availability: "In an interview", interviews: 24, color: "pink" }, { name: "Anika Patel", initials: "AP", specialty: "Product · UX research", availability: "Available", interviews: 16, color: "orange" }, { name: "Maya Chen", initials: "MC", specialty: "Leadership · Culture", availability: "On leave", interviews: 12, color: "sage" }, { name: "Alex Rivera", initials: "AR", specialty: "Data · Analytics", availability: "Availability changed", interviews: 20, color: "violet" }];
  return <><PageHeading eyebrow="PEOPLE / INTERVIEWERS" title="Your interview team" subtitle="Find the right panel, see who's available, and keep workloads balanced." action={<button className="button button-primary"><Plus size={15} /> Invite interviewer</button>} /><div className="people-stats"><span><strong>32</strong> Interviewers</span><span><strong>26</strong> Available today</span><span><strong>4</strong> Teams</span><span><strong>90%</strong> Utilization</span></div><section className="panel list-panel"><div className="list-toolbar"><div className="filter-tabs"><button className="filter-active">All interviewers <span>32</span></button><button>Available</button><button>Needs attention</button></div><button className="button button-outline button-small"><SlidersHorizontal size={14} /> Filter</button></div><div className="table-wrap"><table className="data-table candidates-table"><thead><tr><th>INTERVIEWER</th><th>SKILLS & SPECIALTIES</th><th>AVAILABILITY</th><th>THIS WEEK</th><th>WORKLOAD</th><th /></tr></thead><tbody>{interviewerData.filter((entry) => `${entry.name} ${entry.specialty}`.toLowerCase().includes(query.toLowerCase())).map((interviewer) => <tr key={interviewer.name}><td><div className="candidate-cell"><span className={`avatar avatar-${interviewer.color}`}>{interviewer.initials}</span><div><strong>{interviewer.name}</strong><small>Westlake interviewer</small></div></div></td><td>{interviewer.specialty}</td><td><StatusBadge status={interviewer.availability} /></td><td>{interviewer.interviews} interviews</td><td><div className="load-meter"><i style={{ width: `${Math.min(95, interviewer.interviews * 3.5)}%` }} /></div></td><td><button className="icon-button compact"><MoreHorizontal size={16} /></button></td></tr>)}</tbody></table></div></section></>;
}

function EvaluationsPage() {
  return <><PageHeading eyebrow="REVIEW / EVALUATIONS" title="Evaluation queue" subtitle="Structured feedback that keeps every decision fair and on time." action={<button className="button button-outline"><Download size={14} /> Export scores</button>} /><div className="people-stats"><span><strong>18</strong> Awaiting feedback</span><span><strong>42</strong> Submitted today</span><span><strong>96%</strong> Blind review enabled</span><span><strong>4.6</strong> Average score</span></div><section className="panel list-panel"><div className="list-toolbar"><div className="filter-tabs"><button className="filter-active">Needs feedback <span>18</span></button><button>Recently submitted</button><button>All evaluations</button></div><button className="button button-outline button-small"><Filter size={14} /> Filter by round</button></div><div className="table-wrap"><table className="data-table candidates-table"><thead><tr><th>CANDIDATE</th><th>ROUND</th><th>INTERVIEWER</th><th>INTERVIEWED</th><th>FEEDBACK DUE</th><th>STATUS</th></tr></thead><tbody>{candidates.slice(0, 4).map((candidate, index) => <tr key={candidate.name}><td><div className="candidate-cell"><span className={`avatar avatar-${candidate.color}`}>{candidate.initials}</span><div><strong>Candidate {String(index + 1).padStart(2, "0")}</strong><small>Blind review · ID AR-{240 + index}</small></div></div></td><td><span className="round-tag">{candidate.round}</span></td><td>{["Priya Nair", "Rohan Mehta", "Anika Patel", "Maya Chen"][index]}</td><td>{candidate.date}</td><td>{index < 2 ? "Today, 5:00 PM" : "Tomorrow"}</td><td><StatusBadge status={index === 0 ? "Awaiting feedback" : "In review"} /></td></tr>)}</tbody></table></div></section></>;
}

function RankingsPage() {
  return <><PageHeading eyebrow="REVIEW / RANKINGS" title="Thoughtful decisions, backed by evidence." subtitle="Compare structured, blind evaluations across every interview round." secondary={<button className="button button-outline"><Download size={14} /> Export rankings</button>} action={<button className="button button-primary"><SlidersHorizontal size={14} /> Adjust rubric</button>} /><section className="panel rankings-note"><Sparkles size={16} /><div><strong>Blind review is on</strong><span>Candidate identities are hidden until the review window closes on Nov 8.</span></div><button className="text-link">Review settings <ArrowRight size={13} /></button></section><section className="panel list-panel"><div className="list-toolbar"><div className="panel-heading"><div><h2>Northstar Labs · Engineering</h2><p>Rankings based on 3 rounds · 228 candidates</p></div></div><button className="button button-outline button-small">All rounds <ChevronDown size={13} /></button></div><div className="table-wrap"><table className="data-table candidates-table ranking-table"><thead><tr><th>RANK</th><th>CANDIDATE</th><th>CODING</th><th>TECHNICAL</th><th>HR</th><th>OVERALL</th><th>RECOMMENDATION</th></tr></thead><tbody>{[["01", "Candidate 108", "4.9", "4.8", "4.7", "4.8", "Strong yes"], ["02", "Candidate 042", "4.7", "4.8", "4.6", "4.7", "Strong yes"], ["03", "Candidate 183", "4.8", "4.5", "4.7", "4.6", "Yes"], ["04", "Candidate 091", "4.6", "4.6", "4.5", "4.6", "Yes"], ["05", "Candidate 217", "4.5", "4.4", "4.6", "4.5", "Yes"]].map((row, index) => <tr key={row[0]}><td><span className={`rank-number ${index === 0 ? "rank-first" : ""}`}>{row[0]}</span></td><td><strong>{row[1]}</strong></td>{row.slice(2, 6).map((score, i) => <td className={i === 3 ? "overall-score" : ""} key={i}>{score}</td>)}<td><span className="recommendation">{row[6]}</span></td></tr>)}</tbody></table></div></section></>;
}

function AnalyticsPage() {
  return <><PageHeading eyebrow="REVIEW / ANALYTICS" title="Your placement program, at a glance." subtitle="Make better decisions with a little more clarity." secondary={<button className="button button-outline"><CalendarDays size={14} /> Last 30 days <ChevronDown size={13} /></button>} action={<button className="button button-outline"><Download size={14} /> Export report</button>} /><div className="metric-grid analytics-metrics"><MetricCard label="Time to schedule" value="1.8 days" note="0.6 days faster" tone="green" icon={Clock3} trend="−25% vs. last month" /><MetricCard label="Candidate experience" value="4.8/5" note="From 184 responses" tone="violet" icon={Users} trend="+0.3 vs. last month" /><MetricCard label="Interviewer utilization" value="82%" note="Healthy team capacity" tone="blue" icon={Activity} trend="On target" /><MetricCard label="Schedule coverage" value="95%" note="228 of 240 placed" tone="amber" icon={CalendarDays} trend="+8% vs. last month" /></div><div className="analytics-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>Interviews over time</h2><p>Completed interviews · last 8 weeks</p></div><span className="chart-legend"><i /> This period</span></div><div className="bar-chart">{[["W1", 43], ["W2", 55], ["W3", 48], ["W4", 72], ["W5", 61], ["W6", 85], ["W7", 69], ["W8", 96]].map(([label, height], index) => <div className="bar-group" key={label}><span className="bar-value">{Number(height) * 2}</span><i style={{ height: `${height}%`, opacity: index === 7 ? 1 : 0.56 }} /><small>{label}</small></div>)}</div></section><section className="panel round-chart-panel"><div className="panel-heading"><div><h2>Progress by round</h2><p>Candidate pipeline · this drive</p></div></div><div className="pipeline-list">{[["Coding", "240", "100%", "coding"], ["Technical", "192", "80%", "technical"], ["HR", "134", "56%", "hr"]].map(([label, count, width, tone]) => <div key={label}><div><span>{label}</span><strong>{count}</strong></div><div className={`pipeline-track ${tone}`}><i style={{ width }} /></div></div>)}</div><div className="pipeline-foot"><span>56% completed all rounds</span><button className="text-link">View funnel <ArrowRight size={13} /></button></div></section></div></>;
}

function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  return <><PageHeading eyebrow="MANAGE / NOTIFICATIONS" title="A little less to keep in your head." subtitle="Important changes, thoughtfully kept in one place." action={<button className="button button-outline" onClick={() => setUnreadOnly(!unreadOnly)}><CheckCheck size={14} /> {unreadOnly ? "Show all" : "Mark all as read"}</button>} /><div className="notification-filters"><button className={!unreadOnly ? "filter-active" : ""} onClick={() => setUnreadOnly(false)}>All notifications</button><button className={unreadOnly ? "filter-active" : ""} onClick={() => setUnreadOnly(true)}>Unread <span>3</span></button></div><section className="panel notification-list">{[{ icon: CalendarDays, title: "A new interview has been scheduled", body: "Ananya Shah · Technical screen · Tomorrow at 9:00 AM", time: "12 minutes ago", color: "violet", unread: true }, { icon: Users, title: "Alex Rivera updated availability", body: "3 interviews on Nov 4 may need a new interviewer.", time: "48 minutes ago", color: "amber", unread: true }, { icon: CheckCheck, title: "Candidate feedback submitted", body: "Priya Nair submitted feedback for Candidate 108.", time: "2 hours ago", color: "green", unread: true }, { icon: Activity, title: "Northstar Labs drive is 95% scheduled", body: "228 of 240 candidates now have a confirmed interview.", time: "Yesterday", color: "blue", unread: false }].filter((notice) => !unreadOnly || notice.unread).map((notice) => <NotificationRow key={notice.title} {...notice} />)}</section></>;
}

function NotificationRow({ icon: Icon, title, body, time, color, unread }: { icon: typeof Bell; title: string; body: string; time: string; color: string; unread: boolean }) {
  return <div className={`notification-row ${unread ? "notification-unread" : ""}`}><span className={`notification-icon ${color}`}><Icon size={16} /></span><div className="notification-copy"><strong>{title}</strong><span>{body}</span><small>{time}</small></div>{unread && <i className="unread-dot" />}</div>;
}

function IntegrationsPage({ onNotify }: { onNotify: (message: string) => void }) {
  const integrations = [{ name: "Google Calendar", category: "Calendar sync", detail: "Keep interviews and panel events in sync with your team's calendars.", monogram: "G", tone: "google", state: "Connected" }, { name: "Microsoft Outlook", category: "Calendar sync", detail: "Sync interviewer availability and send polished calendar invites.", monogram: "O", tone: "outlook", state: "Connect" }, { name: "Zoom", category: "Video conferencing", detail: "Create secure meeting links for remote interviews.", monogram: "Z", tone: "zoom", state: "Connect" }, { name: "Slack", category: "Team notifications", detail: "Send schedule changes and feedback reminders to your team.", monogram: "#", tone: "slack", state: "Connect" }];
  return <><PageHeading eyebrow="MANAGE / INTEGRATIONS" title="The tools your team already uses." subtitle="A connected workflow, without another place to check." /><div className="integration-grid">{integrations.map((integration) => <section className="panel integration-card" key={integration.name}><span className={`integration-logo ${integration.tone}`}>{integration.monogram}</span><div className="integration-info"><span>{integration.category}</span><h2>{integration.name}</h2><p>{integration.detail}</p></div>{integration.state === "Connected" ? <div className="connected-state"><Check size={13} /> Connected</div> : <button className="button button-outline button-small" onClick={() => onNotify(`${integration.name} connection is ready to set up.`)}>Connect <ArrowRight size={13} /></button>}</section>)}</div><section className="panel sync-settings"><div><h2>Calendar sync preferences</h2><p>Manage how Arclight keeps your calendars up to date.</p></div><SettingToggle title="Automatically sync schedule changes" detail="Keep all participant calendars in sync" initial /><SettingToggle title="Send candidate reminders" detail="24 hours before each interview" initial /><SettingToggle title="Include private candidate details" detail="Only visible to authorized coordinators" /></section></>;
}

function SettingsPage({ dark, onTheme }: { dark: boolean; onTheme: () => void }) {
  return <><PageHeading eyebrow="MANAGE / SETTINGS" title="A workspace that works your way." subtitle="Fine-tune how your placement team collaborates." /><div className="settings-layout"><div className="settings-nav"><button className="setting-nav-active"><Settings size={15} /> General</button><button><Users size={15} /> Team & permissions</button><button><Bell size={15} /> Notifications</button><button><CalendarDays size={15} /> Scheduling</button><button><ShieldIcon /> Privacy & security</button></div><div className="settings-content"><section className="panel settings-section"><h2>Workspace details</h2><p>Basic information about your placement team.</p><label>Workspace name<input defaultValue="Westlake University" /></label><label>Academic year<input defaultValue="2026–2027" /></label><label>Time zone<select defaultValue="Pacific Time (UTC−07:00)"><option>Pacific Time (UTC−07:00)</option><option>Mountain Time (UTC−06:00)</option><option>Eastern Time (UTC−04:00)</option></select></label><button className="button button-primary button-small">Save changes</button></section><section className="panel settings-section"><h2>Your preferences</h2><p>Make Arclight feel like your own.</p><SettingToggle title="Dark appearance" detail="Use a darker color palette across the workspace" initial={dark} onChange={onTheme} /><SettingToggle title="Weekly placement summary" detail="Get a Monday morning overview by email" initial /><SettingToggle title="Show interview details in calendar" detail="Control what appears on shared calendar events" /></section></div></div></>;
}

function ShieldIcon() {
  return <span className="shield-symbol">◇</span>;
}

function ProfilePage() {
  return <><PageHeading eyebrow="MANAGE / MY PROFILE" title="Your profile" subtitle="The details your team sees when you work together." /><div className="profile-layout"><section className="panel profile-card"><span className="profile-large-avatar">MC</span><h2>Maya Chen</h2><p>Placement Coordinator</p><span className="profile-workspace"><span className="workspace-avatar">W</span> Westlake University</span><button className="button button-outline button-small">Change photo</button></section><section className="panel settings-section profile-form"><h2>Personal information</h2><p>Update your name, role, and contact details.</p><div className="profile-fields"><label>First name<input defaultValue="Maya" /></label><label>Last name<input defaultValue="Chen" /></label></div><label>Work email<input defaultValue="maya.chen@westlake.edu" type="email" /></label><label>Role<input defaultValue="Placement Coordinator" /></label><button className="button button-primary button-small">Save changes</button></section></div></>;
}

function SettingToggle({ title, detail, initial = false, onChange }: { title: string; detail: string; initial?: boolean; onChange?: () => void }) {
  const [enabled, setEnabled] = useState(initial);
  return <div className="setting-toggle"><div><strong>{title}</strong><span>{detail}</span></div><button className={`toggle ${enabled ? "toggle-on" : ""}`} role="switch" aria-checked={enabled} aria-label={title} onClick={() => { setEnabled(!enabled); onChange?.(); }}><i /></button></div>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span><Search size={19} /></span><strong>{title}</strong><p>{detail}</p></div>;
}

function NotificationPopover({ onClose }: { onClose: () => void }) {
  return <div className="notification-popover"><div className="popover-header"><strong>Notifications</strong><button className="text-link">Mark all as read</button><button className="icon-button compact" onClick={onClose} aria-label="Close notifications"><X size={15} /></button></div><NotificationRow icon={CalendarDays} title="Interview scheduled" body="Ananya Shah · Tomorrow, 9:00 AM" time="12 min ago" color="violet" unread /><NotificationRow icon={Users} title="Availability changed" body="3 interviews may need a new interviewer." time="48 min ago" color="amber" unread /><button className="popover-footer" onClick={onClose}>View all notifications <ArrowRight size={13} /></button></div>;
}

function Modal({ type, onClose, onNotify }: { type: "drive" | "interview" | "signin"; onClose: () => void; onNotify: (message: string) => void }) {
  const isDrive = type === "drive";
  const isSignIn = type === "signin";
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    onNotify(isSignIn ? "Welcome back to Arclight." : isDrive ? "Your placement drive has been created." : "Candidate added to the placement drive.");
    window.setTimeout(onClose, 700);
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><span className="eyebrow">{isSignIn ? "YOUR WORKSPACE" : isDrive ? "NEW PLACEMENT DRIVE" : "CANDIDATE DETAILS"}</span><h2 id="modal-title">{isSignIn ? "Welcome back." : isDrive ? "Create a placement drive" : "Add a candidate"}</h2><p>{isSignIn ? "Sign in to pick up where your team left off." : isDrive ? "Start with the basics. You can refine the schedule later." : "Add someone to your active placement drive."}</p></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div><form onSubmit={handleSubmit}>{isSignIn ? <><label>Work email<input type="email" placeholder="you@university.edu" required autoFocus /></label><label>Password<input type="password" placeholder="Enter your password" required minLength={6} /></label><button type="button" className="modal-forgot" onClick={() => onNotify("Password recovery instructions are on their way.")}>Forgot password?</button></> : isDrive ? <><label>Drive name<input placeholder="e.g. Northstar Labs · Engineering" required /></label><div className="modal-row"><label>Hiring partner<input placeholder="Company name" required /></label><label>Interview window<input type="date" required /></label></div><label>Role / program<input placeholder="e.g. Software Engineering" required /></label><label>Candidate capacity<input type="number" min="1" placeholder="240" required /></label></> : <><div className="modal-row"><label>First name<input placeholder="First name" required autoFocus /></label><label>Last name<input placeholder="Last name" required /></label></div><label>Candidate email<input type="email" placeholder="candidate@university.edu" required /></label><label>Placement drive<select required defaultValue=""><option value="" disabled>Select a drive</option><option>Northstar Labs · Engineering</option><option>Meridian Finance · Analyst</option></select></label><label>Round eligibility<select defaultValue="Coding"><option>Coding</option><option>Technical</option><option>HR</option></select></label></>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={submitted}>{submitted ? <><Check size={15} /> Saved</> : isSignIn ? "Sign in" : isDrive ? "Create drive" : "Add candidate"} {!submitted && <ArrowRight size={14} />}</button></div></form><div className="modal-foot"><span><LifeBuoy size={13} /> Need a hand? <a href="mailto:support@arclight.example">Contact support</a></span></div></div></div>;
}

function Landing({ dark, onTheme, onOpenApp, onSignIn }: { dark: boolean; onTheme: () => void; onOpenApp: () => void; onSignIn: () => void }) {
  const [faq, setFaq] = useState<number | null>(0);
  return (
    <div className="landing">
      <header className="landing-nav"><a className="landing-brand" href="#" aria-label="Arclight home"><Brand /></a><nav className="landing-links"><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#faq">Resources</a></nav><div className="landing-nav-actions"><button className="icon-button" aria-label="Toggle theme" onClick={onTheme}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="text-link landing-login" onClick={onSignIn}>Sign in</button><button className="button button-primary button-small" onClick={onOpenApp}>Explore workspace <ArrowRight size={14} /></button></div></header>
      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy"><span className="announcement-pill"><span className="announcement-pulse" /> A calmer kind of placement season <ArrowRight size={12} /></span><h1>Great placements.<br /><em>Less calendar chaos.</em></h1><p className="hero-description">Smart scheduling for the people doing the work. Bring interviews, candidates, and your calendar together — so everyone gets to focus on what matters.</p><div className="hero-actions"><button className="button button-primary" onClick={onOpenApp}>Explore the workspace <ArrowRight size={15} /></button><button className="button button-outline" onClick={onSignIn}>Sign in to Arclight</button></div><div className="hero-social-proof"><div className="avatar-stack"><span>MC</span><span>PN</span><span>AP</span><span>+8</span></div><div><strong>Made for the people behind every placement.</strong><span>Thoughtful coordination starts here.</span></div></div></div>
          <div className="landing-hero-aside"><div className="hero-aside-rule" /><div className="hero-aside-item"><span className="aside-icon violet"><CalendarDays size={15} /></span><div><strong>Goodbye calendar Tetris.</strong><p>Find the schedule that works for everyone.</p></div></div><div className="hero-aside-item"><span className="aside-icon green"><Users size={15} /></span><div><strong>Everyone knows what's next.</strong><p>A clear path for candidates, interviewers, and you.</p></div></div><div className="hero-aside-item"><span className="aside-icon amber"><Sparkles size={15} /></span><div><strong>Built around real people.</strong><p>Smart defaults, with room for human judgment.</p></div></div><span className="hero-aside-foot">Thoughtfully designed for placement teams</span></div>
          <div className="hero-preview"><div className="preview-topbar"><div><span className="preview-dot" /><span className="preview-dot" /><span className="preview-dot" /></div><span>ARCLIGHT · PLACEMENT WEEK</span><button onClick={onOpenApp}>Open workspace <ArrowUpRight size={12} /></button></div><div className="preview-main"><div className="preview-heading"><div><span>YOUR PLACEMENT WEEK</span><strong>A schedule with room to breathe.</strong></div><div className="preview-avatars"><span>PN</span><span>RM</span><span>AP</span><i>+4</i></div></div><MiniCalendar week={0} setWeek={() => {}} /><div className="preview-bottom"><span><i /> 228 interviews thoughtfully placed</span><span><Check size={12} /> No scheduling conflicts</span><button onClick={onOpenApp}>See the full calendar <ArrowRight size={12} /></button></div></div></div>
        </section>
        <section className="logo-strip"><span>MADE TO WORK WITH YOUR TEAM'S FAVORITE TOOLS</span><div><strong className="logo-google"><i>G</i> Google Calendar</strong><strong className="logo-slack"><i>✳</i> slack</strong><strong className="logo-zoom">zoom</strong><strong className="logo-outlook"><i>▣</i> Outlook</strong><strong className="logo-notion">◧ notion</strong></div></section>
        <section className="landing-section features-section" id="features"><div className="section-intro"><span className="eyebrow">COMPLEX LOGISTICS. CLEARER WORK.</span><h2>Scheduling is hard.<br /><em>It doesn't have to feel that way.</em></h2><p>Bring the moving pieces together, and let a little thoughtful automation take the weight off everyone's shoulders.</p></div><div className="feature-cards"><FeatureCard number="01" icon={<Sparkles size={18} />} title="Built for the real world" detail="Round requirements, interviewer expertise, room limits, candidate preferences — Arclight keeps all the details in view." /><FeatureCard number="02" icon={<CalendarDays size={18} />} title="People first, always" detail="Let candidates find a time that works, make rescheduling easy, and keep everyone in the loop when plans change." /><FeatureCard number="03" icon={<Activity size={18} />} title="Reviews that feel fair" detail="Structured, blind evaluations give every candidate room to be seen for what they can do." /></div></section>
        <section className="landing-section how-section" id="how-it-works"><div className="how-aside"><span className="eyebrow">A LITTLE LESS TO JUGGLE</span><div className="how-dark-card"><span className="dark-card-label"><Sparkles size={13} /> A BETTER WAY TO SCHEDULE</span><h3>Not just a slot.<br />The right fit.</h3><div className="dark-step"><i>01</i><span>Gather preferences</span><Check size={13} /></div><div className="dark-step"><i>02</i><span>Find the best match</span><Check size={13} /></div><div className="dark-step"><i>03</i><span>Make room for people</span><ArrowRight size={13} /></div><div className="dark-card-note">A little more thoughtful, by design.</div></div></div><div className="how-copy"><span className="eyebrow">HOW IT WORKS</span><h2>Know why it works.<br /><em>Know what changes.</em></h2><p>In the background, Arclight balances the constraints no one should have to juggle by hand.</p><div className="how-point"><span><Check size={13} /></span><div><strong>Every requirement has a place.</strong><small>Skills, availability, rooms, round order, and interview length are all accounted for.</small></div></div><div className="how-point"><span><Check size={13} /></span><div><strong>When something changes, we adapt.</strong><small>Reschedule just the affected interviews — the rest of the plan stays put.</small></div></div><div className="how-point"><span><Check size={13} /></span><div><strong>There's always a human in the loop.</strong><small>See what changed, understand why, and choose what happens next.</small></div></div><button className="button button-outline how-button" onClick={onOpenApp}>Take a look around <ArrowRight size={14} /></button></div></section>
        <section className="perspectives-section"><div><span className="eyebrow">ONE PLATFORM. THREE CLEAR PERSPECTIVES.</span><h2>Everyone knows where they stand.</h2><p>Less chasing updates. More room for the conversations that matter.</p></div><div className="perspective-cards"><Perspective icon={<Users size={17} />} label="COORDINATOR" title="See the whole placement week." detail="Keep drives, panels, and candidate progress in a single, calm view." /><Perspective icon={<UserRound size={17} />} label="INTERVIEWER" title="Focus on the conversation." detail="Know who's next, find the right context, leave thoughtful feedback." /><Perspective icon={<GraduationCap size={17} />} label="CANDIDATE" title="Your next step, made clear." detail="Pick a time that works and always know what comes next." /></div></section>
        <section className="landing-section faq-section" id="faq"><div className="faq-intro"><span className="eyebrow">GOOD QUESTIONS, HONEST ANSWERS.</span><h2>Clarity before<br /><em>you start.</em></h2><p>A few things teams like to know before placement season begins.</p></div><div className="faq-list">{[{ q: "How does smart scheduling actually work?", a: "Arclight first honors the hard requirements: interviewer availability and skills, room capacity, round eligibility, and interview length. Then it optimizes softer preferences like morning interviews and fewer back-to-back sessions. You always review the schedule before it goes out." }, { q: "Can candidates book their own interview times?", a: "Yes. You can share a booking link with eligible candidates so they choose from the slots that fit your team's constraints. A confirmed booking is reserved immediately, so two people can't take the same slot." }, { q: "What happens if someone has to cancel?", a: "Arclight identifies only the interviews affected by the change, preserves every unaffected booking, and suggests new matches. Your coordinator reviews the changes before anyone is notified." }, { q: "Can we keep using the calendar tools we already have?", a: "Yes. Sync interview events with Google Calendar or Outlook, and create video meeting links with supported conferencing tools." }].map((item, index) => <div className={`faq-item ${faq === index ? "faq-open" : ""}`} key={item.q}><button onClick={() => setFaq(faq === index ? null : index)}><strong>{item.q}</strong><span>{faq === index ? <X size={15} /> : <Plus size={15} />}</span></button>{faq === index && <p>{item.a}</p>}</div>)}</div></section>
        <section className="landing-cta"><span className="cta-orbit orbit-one" /><span className="cta-orbit orbit-two" /><span className="eyebrow">A LITTLE MORE ROOM TO THINK</span><h2>Make room for what comes next.</h2><p>Less calendar chaos. Better conversations. A little more space for the work that matters.</p><button className="button button-light" onClick={onOpenApp}>See what Arclight can do <ArrowRight size={14} /></button><span className="cta-foot">A calmer placement season starts with one good decision.</span></section>
      </main>
      <footer className="landing-footer"><Brand /><span>Thoughtfully designed for the people behind every placement.</span><div><a href="#features">Features</a><a href="#faq">Help</a><button onClick={onSignIn}>Sign in</button><span>© 2026 Arclight</span></div></footer>
    </div>
  );
}

function FeatureCard({ number, icon, title, detail }: { number: string; icon: React.ReactNode; title: string; detail: string }) {
  return <article className="feature-card"><div className="feature-card-top"><span>{number}</span><i>{icon}</i></div><h3>{title}</h3><p>{detail}</p><a href="#how-it-works">A little more clarity <ArrowUpRight size={13} /></a></article>;
}

function Perspective({ icon, label, title, detail }: { icon: React.ReactNode; label: string; title: string; detail: string }) {
  return <article className="perspective-card"><span className="perspective-icon">{icon}</span><span className="eyebrow">{label}</span><h3>{title}</h3><p>{detail}</p><a href="#how-it-works">See how it works <ArrowRight size={12} /></a></article>;
}

export default App;
