import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';

export default function Login() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const loginRes = await authApi.login(email.trim(), password);
      // Login only returns { token, admin } — shop settings come from /auth/me,
      // which needs the token attached first.
      useAuthStore.setState({ token: loginRes.data.token, isAuthenticated: true });
      const meRes = await authApi.me();
      return { token: loginRes.data.token, admin: meRes.data.admin, shop: meRes.data.shop };
    },
    onSuccess: ({ token, admin, shop }) => {
      setAuth(token, admin, shop);
      navigate('/', { replace: true });
    },
    onError: (e: Error) => {
      useAuthStore.getState().clearAuth();
      setError(e.message);
    },
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    mutation.mutate();
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <form onSubmit={handleSubmit} className="form-section" style={{ width: '100%', maxWidth: 380, margin: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div className="brand-mark" style={{ margin: '0 auto 14px' }}>
            <span>TM</span>
          </div>
          <div className="display" style={{ fontSize: 30 }}>Top Man Tailor</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 4 }}>Sign in to Order Studio</div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="loginEmail">Email</label>
          <input id="loginEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label htmlFor="loginPassword">Password</label>
          <input id="loginPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && (
          <div style={{ background: 'var(--red-pale)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 12px', color: 'var(--red-bright)', fontSize: 12.5, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <Button type="submit" disabled={mutation.isPending} style={{ width: '100%', justifyContent: 'center' }}>
          {mutation.isPending ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
