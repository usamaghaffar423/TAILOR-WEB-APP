import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { customersApi } from '@/api/customers';

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddCustomerModal({ open, onClose, onSaved }: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const mutation = useMutation({
    mutationFn: () => customersApi.store({ name: name.trim(), phone: phone.trim(), address: address.trim() || null }),
    onSuccess: () => {
      toast.success('Customer added');
      setName('');
      setPhone('');
      setAddress('');
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave() {
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Customer"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>Save Customer</Button>
        </>
      }
    >
      <div className="field">
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Phone</label>
        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="field">
        <label>Address (optional)</label>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
    </Dialog>
  );
}
