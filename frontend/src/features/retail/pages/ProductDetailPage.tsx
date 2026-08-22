import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAuthedImage } from '@/lib/useAuthedImage';
import { useRetailProduct, useUpdateRetailProduct, useAddRetailVariant, useUploadVariantImage } from '../hooks/useRetailProducts';
import { useRetailMovements } from '../hooks/useRetailInventory';
import { LowStockBadge } from '../components/LowStockBadge';
import { RestockModal } from '../components/RestockModal';
import { AdjustStockModal } from '../components/AdjustStockModal';
import type { RetailProductVariant } from '../types';

function VariantImage({ variant, onUpload }: { variant: RetailProductVariant; onUpload: (file: File) => void }) {
  const imgUrl = useAuthedImage(variant.image_path);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        width: '100%',
        height: 120,
        borderRadius: 8,
        background: 'var(--surface-2)',
        border: '1px dashed var(--border-strong)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        marginBottom: 10,
      }}
    >
      {imgUrl ? (
        <img src={imgUrl} alt="Variant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Click to upload photo</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = id ? Number(id) : null;

  const { data, isLoading, error } = useRetailProduct(productId);
  const updateProduct = useUpdateRetailProduct();
  const addVariant = useAddRetailVariant();
  const uploadImage = useUploadVariantImage();

  const [restockTarget, setRestockTarget] = useState<{ id: number; label: string } | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<{ id: number; label: string; qty: number } | null>(null);
  const [movementsVariantId, setMovementsVariantId] = useState<number | null>(null);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  const { data: movementsRes } = useRetailMovements(movementsVariantId);
  const product = data?.data;

  if (productId === null) return null;

  function handleToggleActive() {
    if (!product) return;
    updateProduct.mutate(
      { id: product.id, payload: { is_active: !product.is_active } },
      {
        onSuccess: () => toast.success(product.is_active ? 'Product deactivated.' : 'Product activated.'),
        onError: () => toast.error('Failed to update product.'),
      }
    );
  }

  function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!product || (!newSize.trim() && !newColor.trim())) return;
    addVariant.mutate(
      { productId: product.id, data: { size: newSize.trim() || undefined, color: newColor.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success('Variant added.');
          setNewSize('');
          setNewColor('');
        },
        onError: () => toast.error('Failed to add variant.'),
      }
    );
  }

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow"><Link to="/retail/products">Retail Products</Link></div>
          <div className="hero-title display">{product?.name || 'Loading…'}</div>
        </div>
        {product && (
          <div className="hero-actions">
            <Button variant="outline" onClick={handleToggleActive} disabled={updateProduct.isPending}>
              {product.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        )}
      </div>
      <StitchDivider />

      {isLoading && <p style={{ color: 'var(--text-faint)' }}>Loading product…</p>}
      {error && <p style={{ color: 'var(--red-bright)' }}>Failed to load product.</p>}

      {product && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            <div className="field">
              <label>Category</label>
              <div>{product.category || '—'}</div>
            </div>
            <div className="field">
              <label>Sale Price</label>
              <div className="cell-mono">{formatCurrency(product.sale_price)}</div>
            </div>
            <div className="field">
              <label>Variants</label>
              <div className="cell-mono">{product.variants.length}</div>
            </div>
          </div>

          <h3 style={{ marginBottom: 12 }}>Variants</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
            {product.variants.map((v) => {
              const label = `${v.size || ''} ${v.color || ''}`.trim() || `Variant #${v.id}`;
              const qty = v.inventory?.quantity_in_stock ?? 0;
              const threshold = v.inventory?.low_stock_threshold ?? 5;
              return (
                <div key={v.id} className="form-section" style={{ padding: 14 }}>
                  <VariantImage
                    variant={v}
                    onUpload={(file) =>
                      uploadImage.mutate(
                        { variantId: v.id, file },
                        {
                          onSuccess: () => toast.success('Image uploaded.'),
                          onError: () => toast.error('Failed to upload image.'),
                        }
                      )
                    }
                  />
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{label}</div>
                  <div className="cell-muted" style={{ fontSize: 11.5, marginBottom: 8 }}>{v.sku || '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span className="cell-mono">{qty} in stock</span>
                    <LowStockBadge qty={qty} threshold={threshold} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Button variant="outline" sm onClick={() => setRestockTarget({ id: v.id, label })}>Restock</Button>
                    <Button variant="outline" sm onClick={() => setAdjustTarget({ id: v.id, label, qty })}>Adjust</Button>
                    <Button variant="outline" sm onClick={() => setMovementsVariantId(v.id === movementsVariantId ? null : v.id)}>
                      {v.id === movementsVariantId ? 'Hide History' : 'History'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAddVariant} style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'flex-end' }}>
            <div className="field">
              <label htmlFor="newVariantSize">New variant size</label>
              <input id="newVariantSize" type="text" value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="e.g. XXL" />
            </div>
            <div className="field">
              <label htmlFor="newVariantColor">Color</label>
              <input id="newVariantColor" type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="e.g. Grey" />
            </div>
            <Button type="submit" variant="outline" disabled={addVariant.isPending}>+ Add Variant</Button>
          </form>

          {movementsVariantId !== null && movementsRes && (
            <>
              <h3 style={{ marginBottom: 12 }}>Stock Movement History</h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Type</th><th>Qty</th><th>Note</th></tr>
                  </thead>
                  <tbody>
                    {movementsRes.data.map((m) => (
                      <tr key={m.id}>
                        <td className="cell-mono cell-muted">{formatDate(m.created_at)}</td>
                        <td>{m.type}</td>
                        <td className="cell-mono">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                        <td className="cell-muted">{m.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <RestockModal variantId={restockTarget?.id ?? null} label={restockTarget?.label} onClose={() => setRestockTarget(null)} />
      <AdjustStockModal
        variantId={adjustTarget?.id ?? null}
        currentQty={adjustTarget?.qty}
        label={adjustTarget?.label}
        onClose={() => setAdjustTarget(null)}
      />
    </>
  );
}
