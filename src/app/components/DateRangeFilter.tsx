import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface DateRangeFilterProps {
  from: Date;
  to: Date;
  onChange: (from: Date, to: Date) => void;
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<Date | null>(null);
  const [selecting, setSelecting] = useState<Date | null>(null); // first click
  const [calMonth, setCalMonth] = useState(new Date(from.getFullYear(), from.getMonth(), 1));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSelecting(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const totalDays = daysInMonth(year, month);
  const startWeekday = firstDayOfMonth(year, month);
  const days: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));

  function handleDayClick(day: Date) {
    if (!selecting) {
      setSelecting(day);
    } else {
      const [newFrom, newTo] = day < selecting ? [day, selecting] : [selecting, day];
      onChange(newFrom, newTo);
      setSelecting(null);
      setOpen(false);
    }
  }

  function inRange(day: Date) {
    const end = selecting ? (hovered ?? selecting) : to;
    const start = selecting ?? from;
    const [lo, hi] = end < start ? [end, start] : [start, end];
    return day >= lo && day <= hi;
  }

  function isStart(day: Date) {
    const start = selecting ?? from;
    return day.toDateString() === start.toDateString();
  }

  function isEnd(day: Date) {
    const end = selecting ? (hovered ?? selecting) : to;
    return day.toDateString() === end.toDateString();
  }

  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Quick month presets
  function applyMonth(offset: number) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    onChange(d, last);
    setOpen(false);
  }

  const isCurrentMonth =
    from.getFullYear() === new Date().getFullYear() &&
    from.getMonth() === new Date().getMonth() &&
    to.getDate() === new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();

  const label = isCurrentMonth
    ? monthLabel(from)
    : `${formatDate(from)} – ${formatDate(to)}`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-3 transition-colors"
        style={{
          height: 34,
          background: "var(--card)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          color: "var(--foreground)",
        }}
      >
        <CalendarDays size={13} style={{ color: "var(--muted-foreground)" }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
        <ChevronDown
          size={13}
          style={{ color: "var(--muted-foreground)", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute rounded-lg overflow-hidden"
          style={{
            top: "calc(100% + 6px)",
            left: 0,
            background: "var(--popover)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 50,
            width: 280,
          }}
        >
          {/* Quick presets */}
          <div className="flex gap-1.5 p-3" style={{ borderBottom: "1px solid var(--border)" }}>
            {[
              { label: "This month", offset: 0 },
              { label: "Last month", offset: -1 },
              { label: "2 months ago", offset: -2 },
            ].map(({ label, offset }) => (
              <button
                key={label}
                onClick={() => applyMonth(offset)}
                className="rounded px-2 py-1 transition-colors"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--secondary)")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Calendar header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <button
              onClick={() => setCalMonth(new Date(year, month - 1, 1))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2 }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{monthLabel(calMonth)}</span>
            <button
              onClick={() => setCalMonth(new Date(year, month + 1, 1))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid px-3 pb-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
            {weekdays.map((w) => (
              <div key={w} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", padding: "2px 0" }}>
                {w}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid px-3 pb-3" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
            {days.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const inR = inRange(day);
              const start = isStart(day);
              const end = isEnd(day);
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <button
                  key={day.toDateString()}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHovered(day)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    height: 30,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    borderRadius: start || end ? 6 : inR ? 0 : 6,
                    background: start || end
                      ? "var(--foreground)"
                      : inR
                      ? "var(--accent)"
                      : "transparent",
                    color: start || end
                      ? "var(--background)"
                      : inR
                      ? "var(--foreground)"
                      : isToday
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                    fontWeight: start || end || isToday ? 600 : 400,
                    outline: isToday && !start && !end ? "1px solid var(--border)" : "none",
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {selecting && (
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", textAlign: "center", paddingBottom: 10 }}>
              Now pick an end date
            </p>
          )}
        </div>
      )}
    </div>
  );
}
