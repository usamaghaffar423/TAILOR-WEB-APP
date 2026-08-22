import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useCreateRetailProduct } from '../hooks/useRetailProducts';

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
}

interface DraftVariant {
  size: string;
  color: string;
}

export function AddProductModal({ open, onClose }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [variants, setVariants] = useState<DraftVariant[]>([{ size: '', color: '' }]);
  const create = useCreateRetailProduct();

  function reset() {
    setName('');
    setCategory('');
    setDescription('');
    setPrice('');
    setVariants([{ size: '', color: '' }]);
  }

  function updateVariant(i: number, field: keyof DraftVariant, value: string) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const cleanVariants = variants
      .filter((v) => v.size.trim() || v.color.trim())
      .map((v) => ({ size: v.size.trim() || undefined, color: v.color.trim() || undefined }));

    create.mutate(
      {
        name: name.trim(),
        category: category.trim() || null,
        description: description.trim() || null,
        sale_price: Number(price),
        variants: cleanVariants.length > 0 ? cleanVariants : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Product created.');
          reset();
          onClose();
        },
        onError: () => toast.error('Failed to create product.'),
      }
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Product"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
          <Button variant="outline" sm onClick={onClose}>Cancel</Button>
          <Button sm onClick={handleSubmit} disabled={create.isPending || !name.trim() || !price}>
            {create.isPending ? 'Saving…' : 'Create Product'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="productName">Name</label>
          <input id="productName" type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="productCategory">Category</label>
          <select id="productCategory" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">— Select —</option>
            <option value="shalwar-kameez">Shalwar Kameez</option>
            <option value="shirt">Shirt</option>
            <option value="pant">Pant</option>
            <option value="waistcoat">Waistcoat</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="productPrice">Sale Price (Rs)</label>
          <input id="productPrice" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="productDescription">Description</label>
          <textarea id="productDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>

        <div className="field">
          <label>Variants (size / color) — optional, can add more later</label>
          {variants.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="text" placeholder="Size (e.g. M)" value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} />
              <input type="text" placeholder="Color (e.g. Blue)" value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} />
            </div>
          ))}
          <Button type="button" variant="outline" sm onClick={() => setVariants((prev) => [...prev, { size: '', color: '' }])}>
            + Add Another Variant
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
