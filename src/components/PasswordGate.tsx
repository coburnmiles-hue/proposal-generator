import { useState } from 'react';

const PASS = 'Thywillbedone8675!';
const SESSION_KEY = 'pg_auth';

interface Props { children: React.ReactNode; }

export function PasswordGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASS) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div className="gate-overlay">
      <div className="gate-card">
        <p className="gate-label">PROPOSAL GENERATOR</p>
        <h1 className="gate-title">Welcome back</h1>
        <p className="gate-subtitle">Enter your password to continue</p>
        <form onSubmit={handleSubmit} className="gate-form">
          <input
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            placeholder="Password"
            className={`gate-input${error ? ' gate-input-error' : ''}`}
            autoFocus
          />
          {error && <p className="gate-error">Incorrect password. Try again.</p>}
          <button type="submit" className="gate-btn">Unlock</button>
        </form>
      </div>
    </div>
  );
}
