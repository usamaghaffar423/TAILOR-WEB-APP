import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useHealthChecks } from '../hooks/useHealthChecks';
import { HEALTH_PIN_HASH, HEALTH_SESSION_KEY, LOCKOUT_SECONDS, MAX_PIN_ATTEMPTS } from '../constants';
import type { CheckResult, CheckStatus, HealthModule, PingResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '';

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const STATUS_COLOR: Record<CheckStatus, string> = {
  pending: '#64748b',
  ok: '#22c55e',
  slow: '#eab308',
  error: '#ef4444',
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  pending: 'PENDING',
  ok: 'OK',
  slow: 'SLOW',
  error: 'ERROR',
};

const MODULE_TITLE: Record<HealthModule, string> = {
  core: 'Core',
  tailoring: 'Tailoring',
  retail: 'Retail',
};

function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (lockedUntil === null) return;
    const tick = () => {
      const left = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (left <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setRemaining(0);
      } else {
        setRemaining(left);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const locked = lockedUntil !== null;

  function handleChange(idx: number, value: string) {
    if (locked) return;
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    setError(false);

    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }

    if (next.every((d) => d !== '')) {
      void submit(next.join(''));
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (locked) return;
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  async function submit(pin: string) {
    const hash = await hashPin(pin);
    if (hash === HEALTH_PIN_HASH) {
      sessionStorage.setItem(HEALTH_SESSION_KEY, '1');
      onUnlock();
      return;
    }

    setError(true);
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= MAX_PIN_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}>
      <style>{`
        @keyframes hd-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .hd-pin-box { transition: border-color .15s, box-shadow .15s; }
        .hd-pin-box:focus { outline: none; border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.25); }
      `}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 18 }}>🔒</div>
        <div style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>Developer Access</div>
        <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 6, marginBottom: 32 }}>Top Man Tailor — System Health</div>

        <div
          style={{ display: 'flex', gap: 10, justifyContent: 'center', animation: error ? 'hd-shake .4s' : undefined }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className="hd-pin-box"
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              disabled={locked}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              style={{
                width: 46,
                height: 56,
                textAlign: 'center',
                fontSize: 24,
                fontFamily: 'inherit',
                background: '#1e293b',
                border: `1.5px solid ${error ? '#ef4444' : '#334155'}`,
                borderRadius: 8,
                color: '#e2e8f0',
              }}
            />
          ))}
        </div>

        <div style={{ height: 24, marginTop: 14 }}>
          {locked ? (
            <div style={{ color: '#ef4444', fontSize: 13 }}>Too many attempts — locked for {remaining}s</div>
          ) : error ? (
            <div style={{ color: '#ef4444', fontSize: 13 }}>Invalid PIN</div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={locked || digits.some((d) => !d)}
          onClick={() => submit(digits.join(''))}
          style={{
            marginTop: 10,
            padding: '10px 32px',
            borderRadius: 8,
            border: 'none',
            background: locked || digits.some((d) => !d) ? '#334155' : '#3b82f6',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: locked || digits.some((d) => !d) ? 'not-allowed' : 'pointer',
          }}
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CheckStatus }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: 0.5,
        padding: '3px 8px',
        borderRadius: 999,
        color: STATUS_COLOR[status],
        border: `1px solid ${STATUS_COLOR[status]}`,
        background: `${STATUS_COLOR[status]}1a`,
      }}
    >
      {status === 'pending' && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[status], animation: 'hd-pulse 1s infinite' }} />
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}

function ModuleCard({ title, checks, results }: { title: string; checks: { id: string; label: string }[]; results: Record<string, CheckResult> }) {
  const okOrSlow = checks.filter((c) => results[c.id]?.status === 'ok' || results[c.id]?.status === 'slow').length;

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 18, flex: '1 1 280px', minWidth: 260 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{title}</div>
        <div style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>{okOrSlow}/{checks.length}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {checks.map((c) => {
          const r = results[c.id];
          const status = r?.status ?? 'pending';
          return (
            <div key={c.id} style={{ borderBottom: '1px solid #334155', paddingBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e1', fontSize: 12.5 }}>{c.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>
                    {r?.responseTimeMs !== null && r?.responseTimeMs !== undefined ? `${r.responseTimeMs}ms` : '—'}
                  </span>
                  <StatusBadge status={status} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ color: '#475569', fontSize: 10.5 }}>{r?.httpStatus ?? '—'}</span>
                {r?.error && <span style={{ color: '#ef4444', fontSize: 10.5 }}>{r.error}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResponseTimeChart({ checks, results }: { checks: { id: string; label: string }[]; results: Record<string, CheckResult> }) {
  const maxTime = Math.max(2000, ...checks.map((c) => results[c.id]?.responseTimeMs ?? 0));

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 18, marginTop: 20 }}>
      <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Response Times</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {checks.map((c) => {
          const r = results[c.id];
          const time = r?.responseTimeMs ?? 0;
          const status = r?.status ?? 'pending';
          const pct = Math.min(100, (time / maxTime) * 100);
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 150, flexShrink: 0, color: '#94a3b8', fontSize: 11, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.label}
              </div>
              <div style={{ flex: 1, background: '#0f172a', borderRadius: 4, height: 14, position: 'relative' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: STATUS_COLOR[status], transition: 'width .3s' }} />
              </div>
              <div style={{ width: 60, flexShrink: 0, color: '#64748b', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}>
                {r?.responseTimeMs !== null && r?.responseTimeMs !== undefined ? `${r.responseTimeMs}ms` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({ onLock }: { onLock: () => void }) {
  const token = useAuthStore((s) => s.token);
  const { checks, results, running, lastRunAt, runAll } = useHealthChecks(token);
  const [pingInfo, setPingInfo] = useState<PingResponse | null>(null);

  async function fetchPingInfo() {
    try {
      const res = await fetch(`${API_URL}/api/ping`, { headers: { Accept: 'application/json' } });
      if (res.ok) setPingInfo(await res.json());
    } catch {
      // Already reflected in the ping check's own status — nothing more to do here.
    }
  }

  function runEverything() {
    runAll();
    fetchPingInfo();
  }

  useEffect(() => {
    runEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = checks.length;
  const okCount = checks.filter((c) => results[c.id]?.status === 'ok').length;
  const slowCount = checks.filter((c) => results[c.id]?.status === 'slow').length;
  const errorCount = checks.filter((c) => results[c.id]?.status === 'error').length;
  const passingCount = okCount + slowCount;

  const overallColor = errorCount > 0 ? '#ef4444' : slowCount > 0 ? '#eab308' : '#22c55e';
  const overallText = errorCount > 0 ? 'System Issues Detected' : slowCount > 0 ? 'Degraded Performance' : passingCount === total ? 'All Systems Operational' : 'Checking…';
  const scorePct = total > 0 ? (passingCount / total) * 100 : 0;

  const moduleGroups: { key: HealthModule; checks: typeof checks }[] = [
    { key: 'core', checks: checks.filter((c) => c.module === 'core') },
    { key: 'tailoring', checks: checks.filter((c) => c.module === 'tailoring') },
    { key: 'retail', checks: checks.filter((c) => c.module === 'retail') },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'IBM Plex Mono', ui-monospace, monospace", padding: '28px 32px' }}>
      <style>{`
        @keyframes hd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>🔧 System Health</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Top Man Tailor</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastRunAt && (
            <span style={{ color: '#64748b', fontSize: 11 }}>
              Last checked: {new Date(lastRunAt).toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={runEverything}
            disabled={running}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: running ? '#1e293b' : '#3b82f6',
              color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            {running ? 'Running…' : 'Re-run All Checks'}
          </button>
          <button
            type="button"
            onClick={onLock}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            Lock
          </button>
        </div>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 22, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ color: overallColor, fontSize: 32, fontWeight: 700 }}>{passingCount} / {total}</div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>checks passing</div>
          </div>
          <div style={{ color: overallColor, fontSize: 14, fontWeight: 700 }}>{overallText}</div>
        </div>
        <div style={{ marginTop: 14, background: '#0f172a', borderRadius: 6, height: 10, overflow: 'hidden' }}>
          <div style={{ width: `${scorePct}%`, height: '100%', background: overallColor, transition: 'width .3s' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {moduleGroups.map((g) => (
          <ModuleCard key={g.key} title={MODULE_TITLE[g.key]} checks={g.checks} results={results} />
        ))}
      </div>

      <ResponseTimeChart checks={checks} results={results} />

      {pingInfo && (
        <div style={{ marginTop: 20, background: '#1e293b', borderRadius: 12, padding: '12px 18px', color: '#94a3b8', fontSize: 12 }}>
          {pingInfo.db_status === 'ok' ? 'MariaDB: Connected' : 'MariaDB: Error'}
          {pingInfo.db_latency !== null && ` · ${pingInfo.db_latency}ms`}
          {' · PHP '}{pingInfo.php_version}
          {' · Laravel '}{pingInfo.laravel}
        </div>
      )}

      <div style={{ textAlign: 'center', color: '#475569', fontSize: 11, marginTop: 32 }}>
        Checks run in parallel · Timeout: 5s · Session-locked · Not visible to shop admin
      </div>
    </div>
  );
}

export default function HealthDashboardPage() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(HEALTH_SESSION_KEY) === '1');

  function handleLock() {
    sessionStorage.removeItem(HEALTH_SESSION_KEY);
    setUnlocked(false);
  }

  if (!unlocked) {
    return <PinScreen onUnlock={() => setUnlocked(true)} />;
  }

  return <Dashboard onLock={handleLock} />;
}
