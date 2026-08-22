import { useState } from 'react';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { useRetailInventory } from '../hooks/useRetailInventory';
import { LowStockBadge } from '../components/LowStockBadge';
import { RestockModal } from '../components/RestockModal';
import { AdjustStockModal } from '../components/AdjustStockModal';

export default function InventoryPage() {
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [restockTarget, setRestockTarget] = useState<{ id: number; label: string } | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<{ id: number; label: string; qty: number } | null>(null);

  const { data, isLoading, error } = useRetailInventory(lowStockOnly);
  const items = data?.data || [];

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">INVENTORY</div>
        </div>
      </div>
      <StitchDivider />

      <div className="filter-bar">
        <div className="swatch-group" style={{ marginTop: 0 }}>
          <div className={`swatch-chip${!lowStockOnly ? ' selected' : ''}`} onClick={() => setLowStockOnly(false)}>All Items</div>
          <div className={`swatch-chip${lowStockOnly ? ' selected' : ''}`} onClick={() => setLowStockOnly(true)}>Low Stock Only</div>
        </div>
      </div>

      {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading inventory…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load inventory.</p>}

      {data && (
        items.length === 0 ? (
          <EmptyState title="No items found" subtitle={lowStockOnly ? 'Nothing is currently low on stock.' : 'No products yet.'} />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th><th>Size</th><th>Color</th><th>SKU</th>
                  <th>Stock</th><th>Threshold</th><th>Last Restocked</th><th></th><th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const label = `${item.variant?.product?.name || ''} ${item.variant?.size || ''} ${item.variant?.color || ''}`.trim();
                  return (
                    <tr key={item.id}>
                      <td>{item.variant?.product?.name || '—'}</td>
                      <td>{item.variant?.size || '—'}</td>
                      <td>{item.variant?.color || '—'}</td>
                      <td className="cell-mono cell-muted">{item.variant?.sku || '—'}</td>
                      <td className="cell-mono">
                        {item.quantity_in_stock}{' '}
                        <LowStockBadge qty={item.quantity_in_stock} threshold={item.low_stock_threshold} />
                      </td>
                      <td className="cell-mono cell-muted">{item.low_stock_threshold}</td>
                      <td className="cell-muted">{item.last_restocked_at ? formatDate(item.last_restocked_at) : 'Never'}</td>
                      <td>
                        <Button variant="outline" sm onClick={() => setRestockTarget({ id: item.retail_product_variant_id, label })}>
                          Restock
                        </Button>
                      </td>
                      <td>
                        <Button variant="outline" sm onClick={() => setAdjustTarget({ id: item.retail_product_variant_id, label, qty: item.quantity_in_stock })}>
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      <RestockModal
        variantId={restockTarget?.id ?? null}
        label={restockTarget?.label}
        onClose={() => setRestockTarget(null)}
      />
      <AdjustStockModal
        variantId={adjustTarget?.id ?? null}
        currentQty={adjustTarget?.qty}
        label={adjustTarget?.label}
        onClose={() => setAdjustTarget(null)}
      />
    </>
  );
}
