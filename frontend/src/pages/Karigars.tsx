import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { karigarsApi } from '@/api/karigars';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { KarigarCard } from '@/components/karigars/KarigarCard';
import { AddKarigarModal } from '@/components/karigars/AddKarigarModal';

export default function Karigars() {
  const [q, setQ] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['karigars'],
    queryFn: () => karigarsApi.index(),
  });

  const karigars = (data?.data || []).filter(
    (k) => !q.trim() || k.name.toLowerCase().includes(q.toLowerCase()) || (k.speciality || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">KARIGARS</div>
        </div>
        <div className="hero-actions">
          <Button onClick={() => setAddOpen(true)}>+ Add Karigar</Button>
        </div>
      </div>
      <StitchDivider />

      <div className="filter-bar">
        <input type="text" placeholder="Search name or speciality..." value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 280 }} />
      </div>

      {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading karigars…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load karigars.</p>}

      {data && (
        karigars.length === 0 ? (
          <EmptyState title="No karigars found" subtitle="Try a different search, or add a new karigar." />
        ) : (
          <div className="card-grid">
            {karigars.map((k) => <KarigarCard key={k.id} karigar={k} />)}
          </div>
        )
      )}

      <AddKarigarModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false);
          refetch();
        }}
      />
    </>
  );
}
