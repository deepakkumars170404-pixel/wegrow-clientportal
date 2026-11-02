import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Icon } from '../common/Icons';
import {
  fmt,
  fmtS,
  fmtL,
  D,
  iso,
  DOW,
  MON,
  MONF,
  TODAY,
  addDays
} from '../../utils/date';

interface CalendarPageProps {
  onOpenSession: (id: string) => void;
  onOpenAction: (id: string) => void;
  onOpenEvent: (id: string) => void;
}

const CAL_LBL: Record<string, string> = {
  session: 'Session',
  deadline: 'Deadline',
  event: 'Event',
  milestone: 'Milestone',
  review: 'Review'
};

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onOpenSession,
  onOpenAction,
  onOpenEvent
}) => {
  const { client } = usePortal();
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month');
  const [calCursor, setCalCursor] = useState('2026-12-01');
  const [weekCursor, setWeekCursor] = useState('2026-12-13');

  if (!client) return null;

  // Build calendar items
  const calendarItems = () => {
    const out: any[] = [];
    client.sessions.forEach((s) =>
      out.push({ date: s.date, type: 'session', title: s.title, ref: s.id, time: s.time })
    );
    client.actions.forEach((a) =>
      out.push({ date: a.due, type: 'deadline', title: a.title, ref: a.id })
    );
    client.events.forEach((e) =>
      out.push({ date: e.date, type: 'event', title: e.title, ref: e.id, time: e.time })
    );
    client.months.forEach((m) => {
      const [y, mm] = m.key.split('-').map(Number);
      const last = new Date(y, mm, 0);
      out.push({
        date: iso(last),
        type: 'milestone',
        title: `Month ${m.n} close: ${m.theme}`,
        ref: 'M' + m.n
      });
      out.push({
        date: `${m.key}-26`,
        type: 'review',
        title: `Monthly review — ${m.name}`,
        ref: 'M' + m.n
      });
    });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  };

  const allItems = calendarItems();

  const handleChipClick = (type: string, ref: string) => {
    if (type === 'session') onOpenSession(ref);
    else if (type === 'deadline') onOpenAction(ref);
    else if (type === 'event') onOpenEvent(ref);
  };

  const handleNav = (n: number) => {
    if (view === 'month') {
      if (n === 0) {
        setCalCursor(TODAY.slice(0, 7) + '-01');
      } else {
        const x = D(calCursor);
        x.setMonth(x.getMonth() + n);
        setCalCursor(iso(x));
      }
    } else {
      if (n === 0) {
        const x = D(TODAY);
        x.setDate(x.getDate() - x.getDay());
        setWeekCursor(iso(x));
      } else {
        setWeekCursor(addDays(weekCursor, 7 * n));
      }
    }
  };

  // Month grid calculations
  const curDate = D(calCursor);
  const monthStart = new Date(curDate);
  monthStart.setDate(1 - curDate.getDay());
  const monthCells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(monthStart);
    d.setDate(monthStart.getDate() + i);
    const k = iso(d);
    const isOut = d.getMonth() !== curDate.getMonth();
    const isToday = k === TODAY;
    const dayItems = allItems.filter((x) => x.date === k);

    monthCells.push(
      <div key={i} className={`day ${isOut ? 'out' : ''} ${isToday ? 'today' : ''}`}>
        <span className="dn">{d.getDate()}</span>
        {dayItems.slice(0, 3).map((item, idx) => (
          <div
            key={idx}
            className={`chip c-${item.type}`}
            title={item.title}
            onClick={() => handleChipClick(item.type, item.ref)}
          >
            {item.title}
          </div>
        ))}
        {dayItems.length > 3 && (
          <div className="tiny muted" style={{ paddingLeft: 4 }}>
            +{dayItems.length - 3} more
          </div>
        )}
      </div>
    );
    if (i >= 34 && d.getMonth() !== curDate.getMonth() && d.getDay() === 6) break;
  }

  // Week view calculations
  const weekStart = D(weekCursor);
  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return iso(d);
  });

  // Agenda view calculations
  const agendaItems = allItems.filter((x) => x.date >= TODAY && x.date <= addDays(TODAY, 60));
  const byDay: Record<string, any[]> = {};
  agendaItems.forEach((x) => {
    byDay[x.date] = byDay[x.date] || [];
    byDay[x.date].push(x);
  });

  const getLabel = () => {
    if (view === 'month') return `${MONF[curDate.getMonth()]} ${curDate.getFullYear()}`;
    if (view === 'week') return `${fmtS(weekDays[0])} – ${fmt(weekDays[6])}`;
    return 'Next 60 days';
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Calendar</h1>
          <p>Sessions, deadlines, events, reviews and milestones in one view.</p>
        </div>
        <div className="seg">
          {(['month', 'week', 'agenda'] as const).map((v) => (
            <button
              key={v}
              className={view === v ? 'on' : ''}
              onClick={() => setView(v)}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="row-between" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {view !== 'agenda' && (
            <>
              <button className="iconbtn" onClick={() => handleNav(-1)} aria-label="Previous">
                <Icon name="chevL" />
              </button>
              <button className="iconbtn" onClick={() => handleNav(1)} aria-label="Next">
                <Icon name="chevR" />
              </button>
              <button className="btn sm" onClick={() => handleNav(0)}>
                Today
              </button>
            </>
          )}
          <b style={{ fontSize: 18, marginLeft: 6 }}>{getLabel()}</b>
        </div>

        <div className="legend">
          {Object.entries(CAL_LBL).map(([k, v]) => (
            <span key={k}>
              <i className={`c-${k}`} style={{ background: 'currentColor' }} />
              {v}
            </span>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <div className="cal">
          {DOW.map((d) => (
            <div key={d} className="dow">
              {d}
            </div>
          ))}
          {monthCells}
        </div>
      )}

      {view === 'week' && (
        <div className="tablewrap">
          <div className="week">
            {weekDays.map((k) => {
              const dayItems = allItems.filter((x) => x.date === k);
              const isToday = k === TODAY;
              return (
                <div key={k} className={`wd ${isToday ? 'today' : ''}`}>
                  <div className="small" style={{ fontWeight: 700 }}>
                    {DOW[D(k).getDay()]} <span className="muted">{D(k).getDate()}</span>
                  </div>
                  {dayItems.length > 0 ? (
                    dayItems.map((x, idx) => (
                      <div
                        key={idx}
                        className={`chip c-${x.type}`}
                        style={{ whiteSpace: 'normal', padding: '6px 8px' }}
                        onClick={() => handleChipClick(x.type, x.ref)}
                      >
                        {x.time && <div className="tiny" style={{ opacity: 0.8 }}>{x.time.split(' –')[0]}</div>}
                        {x.title}
                      </div>
                    ))
                  ) : (
                    <div className="tiny muted">Nothing scheduled</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'agenda' && (
        <div className="card" style={{ padding: '8px 22px' }}>
          {Object.entries(byDay).map(([d, xs]) => (
            <div key={d} className="li" style={{ alignItems: 'flex-start' }}>
              <div
                className="datebox"
                style={d === TODAY ? {} : { background: 'var(--surface-2)', color: 'var(--ink-2)' }}
              >
                <b>{D(d).getDate()}</b>
                <span>{MON[D(d).getMonth()]}</span>
              </div>
              <div className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="tiny muted" style={{ fontWeight: 700 }}>
                  {fmtL(d)}
                </div>
                {xs.map((x, idx) => (
                  <div
                    key={idx}
                    className={`chip c-${x.type}`}
                    style={{ whiteSpace: 'normal', padding: '7px 10px', fontSize: 13 }}
                    onClick={() => handleChipClick(x.type, x.ref)}
                  >
                    <b>{CAL_LBL[x.type]}</b> · {x.title}
                    {x.time ? ` · ${x.time}` : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
