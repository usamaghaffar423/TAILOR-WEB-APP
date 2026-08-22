import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { useRetailProducts } from '../hooks/useRetailProducts';
import { AddProductModal } from '../components/AddProductModal';

export default function ProductsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const { data, isLoading, error } = useRetailProducts();
  const navigate = useNavigate();
  const products = data?.data || [];

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">RETAIL PRODUCTS</div>
        </div>
        <div className="hero-actions">
          <Button onClick={() => setAddOpen(true)}>+ Add Product</Button>
        </div>
      </div>
      <StitchDivider />

      {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading products…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load products.</p>}

      {data && (
        products.length === 0 ? (
          <EmptyState title="No products yet" subtitle="Add your first ready-made product to get started." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Category</th><th>Price</th><th>Variants</th><th>Status</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="row-clickable" onClick={() => navigate(`/retail/products/${p.id}`)} style={{ cursor: 'pointer' }}>
                    <td>{p.name}</td>
                    <td className="cell-muted">{p.category || '—'}</td>
                    <td className="cell-mono">{formatCurrency(p.sale_price)}</td>
                    <td className="cell-mono">{p.variants.length}</td>
                    <td>
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: 999,
                        background: p.is_active ? 'var(--green-pale, rgba(60,180,90,0.12))' : 'var(--surface-2)',
                        color: p.is_active ? 'var(--green-bright, #3cb45a)' : 'var(--text-faint)',
                        border: `1px solid ${p.is_active ? 'var(--green, #3cb45a)' : 'var(--border-strong)'}`,
                      }}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <AddProductModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
