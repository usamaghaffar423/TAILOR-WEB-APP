import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

const API_URL = import.meta.env.VITE_API_URL ?? '';

/** Fetches a storage-relative path (e.g. `uploads/shop/logo.png`) through the
 * authenticated `/api/uploads/{path}` route and returns a blob object URL —
 * plain <img src> can't attach the Bearer token this API requires. */
export function useAuthedImage(path: string | null | undefined): string | null {
  const token = useAuthStore((s) => s.token);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;

    fetch(`${API_URL}/api/uploads/${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.blob() : Promise.reject(res)))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, token]);

  return url;
}
