import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/format';
import { useRetailProducts } from '../hooks/useRetailProducts';
import { useCreateSale } from '../hooks/useRetailSales';
import { ReceiptModal } from '../components/ReceiptModal';
import { METHOD_OPTIONS, METHOD_LABEL } from '../lib/paymentMethod';
import type { ApiError } from '@/api/client';
import type { CartItem, RetailPaymentMethod, RetailProduct, RetailProductVariant, RetailSale } from '../types';

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function POSPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query, 300);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<RetailPaymentMethod>('cash');
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [completedSale, setCompletedSale] = useState<RetailSale | null>(null);

  const { data } = useRetailProducts();
  const createSale = useCreateSale();

  const products = data?.data || [];
  const results = useMemo(() => {
    if (debouncedQuery.trim().length < 2) return [];
    const q = debouncedQuery.trim().toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
  }, [products, debouncedQuery]);

  function inCartQty(variantId: number): number {
    return cart.find((c) => c.variant.id === variantId)?.quantity ?? 0;
  }

  function addToCart(product: RetailProduct, variant: RetailProductVariant) {
    const stock = variant.inventory?.quantity_in_stock ?? 0;
    const current = inCartQty(variant.id);
    if (current >= stock) {
      toast.error('No more stock available for this variant.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.variant.id === variant.id);
      if (existing) {
        return prev.map((c) => (c.variant.id === variant.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { variant: { ...variant, product }, quantity: 1, unit_price: Number(product.sale_price) }];
    });
  }

  function updateQty(variantId: number, qty: number) {
    setCart((prev) =>
      prev.map((c) => {
        if (c.variant.id !== variantId) return c;
        const stock = c.variant.inventory?.quantity_in_stock ?? 0;
        const clamped = Math.max(1, Math.min(qty, stock || qty));
        return { ...c, quantity: clamped };
      })
    );
  }

  function updatePrice(variantId: number, price: number) {
    setCart((prev) => prev.map((c) => (c.variant.id === variantId ? { ...c, unit_price: Math.max(0, price) } : c)));
  }

  function removeFromCart(variantId: number) {
    setCart((prev) => prev.filter((c) => c.variant.id !== variantId));
  }

  const total = cart.reduce((sum, c) => sum + c.quantity * c.unit_price, 0);

  function handleConfirmSale() {
    if (cart.length === 0) return;

    createSale.mutate(
      {
        payment_method: paymentMethod,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        items: cart.map((c) => ({ variant_id: c.variant.id, quantity: c.quantity, unit_price: c.unit_price })),
      },
      {
        onSuccess: (res) => {
          toast.success('Sale recorded.');
          setCompletedSale(res.data);
        },
        onError: (err) => {
          const message = (err as ApiError)?.message || 'Failed to record sale.';
          toast.error(message);
        },
      }
    );
  }

  function resetAfterReceipt() {
    setCompletedSale(null);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('cash');
    setQuery('');
  }

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">NEW SALE</div>
        </div>
      </div>
      <StitchDivider />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {/* Left: search + results */}
        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
          <input
            type="text"
            placeholder="Search products by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', marginBottom: 14 }}
            autoFocus
          />

          {debouncedQuery.trim().length < 2 && (
            <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Type at least 2 characters to search products.</p>
          )}

          {debouncedQuery.trim().length >= 2 && results.length === 0 && (
            <EmptyState title="No products found" subtitle="Try a different search term." />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {results.map((product) => (
              <div key={product.id} className="form-section" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <b>{product.name}</b>
                  <span className="cell-mono">{formatCurrency(product.sale_price)}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {product.variants.map((v) => {
                    const stock = v.inventory?.quantity_in_stock ?? 0;
                    const disabled = stock <= 0;
                    const label = [v.size, v.color].filter(Boolean).join(' / ') || `#${v.id}`;
                    return (
                      <div
                        key={v.id}
                        className={`swatch-chip${disabled ? ' disabled' : ''}`}
                        style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : { cursor: 'pointer' }}
                        onClick={() => !disabled && addToCart(product, v)}
                      >
                        {label} ({stock})
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: cart */}
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <div className="form-section" style={{ padding: 16, position: 'sticky', top: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Cart</h3>

            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>No items yet. Click a variant to add it.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {cart.map((c) => (
                  <div key={c.variant.id} style={{ borderBottom: '1px solid var(--border-strong)', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.variant.product.name}</div>
                        <div className="cell-muted" style={{ fontSize: 11.5 }}>
                          {[c.variant.size, c.variant.color].filter(Boolean).join(' / ') || '—'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => removeFromCart(c.variant.id)}
                        aria-label="Remove"
                      >
                        &times;
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        min={1}
                        max={c.variant.inventory?.quantity_in_stock ?? undefined}
                        value={c.quantity}
                        onChange={(e) => updateQty(c.variant.id, Number(e.target.value) || 1)}
                        style={{ width: 60 }}
                      />
                      <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>×</span>
                      <input
                        type="number"
                        min={0}
                        value={c.unit_price}
                        onChange={(e) => updatePrice(c.variant.id, Number(e.target.value) || 0)}
                        style={{ width: 90 }}
                      />
                      <span className="cell-mono" style={{ marginLeft: 'auto', fontSize: 13 }}>
                        {formatCurrency(c.quantity * c.unit_price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <div className="field" style={{ marginBottom: 12 }}>
              <label>Payment Method</label>
              <div className="swatch-group" style={{ marginTop: 6 }}>
                {METHOD_OPTIONS.map((m) => (
                  <div
                    key={m}
                    className={`swatch-chip${paymentMethod === m ? ' selected' : ''}`}
                    onClick={() => setPaymentMethod(m)}
                  >
                    {METHOD_LABEL[m]}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setCustomerOpen((v) => !v)}
                style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 12.5, cursor: 'pointer', padding: 0 }}
              >
                {customerOpen ? '− Hide customer details' : '+ Add customer details (optional)'}
              </button>
              {customerOpen && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="text" placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <input type="text" placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
              )}
            </div>

            <Button
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={cart.length === 0 || createSale.isPending}
              onClick={handleConfirmSale}
            >
              {createSale.isPending ? 'Recording…' : 'Confirm Sale'}
            </Button>
          </div>
        </div>
      </div>

      <ReceiptModal sale={completedSale} onClose={resetAfterReceipt} />
    </>
  );
}
