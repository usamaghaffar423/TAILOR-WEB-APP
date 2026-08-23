import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/api/customers';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';

export default function Customers() {
  const [q, setQ] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', q],
    queryFn: () => customersApi.index(q || undefined),
    staleTime: 15 * 60_000,
  });

  const customers = data?.data || [];

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">CUSTOMERS</div>
        </div>
        <div className="hero-actions">
          <Button onClick={() => setAddOpen(true)}>+ Add Customer</Button>
        </div>
      </div>
      <StitchDivider />

      <div className="filter-bar">
        <input type="text" placeholder="Search name, phone, or customer ID..." value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 280 }} />
      </div>

      {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading customers…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load customers.</p>}

      {data && (
        customers.length === 0 ? (
          <EmptyState title="No customers found" subtitle="Try a different search, or add a new customer." />
        ) : (
          <div className="card-grid">
            {customers.map((c) => <CustomerCard key={c.id} customer={c} />)}
          </div>
        )
      )}

      <AddCustomerModal
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
