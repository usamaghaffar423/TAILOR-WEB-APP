import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { karigarsApi } from '@/api/karigars';
import type { Karigar } from '@/types';

interface EditKarigarModalProps {
  karigar: Karigar;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditKarigarModal({ karigar, open, onClose, onSaved }: EditKarigarModalProps) {
  const [name, setName] = useState(karigar.name);
  const [phone, setPhone] = useState(karigar.phone || '');
  const [speciality, setSpeciality] = useState(karigar.speciality || '');
  const [capacity, setCapacity] = useState(String(karigar.max_capacity));

  const mutation = useMutation({
    mutationFn: () =>
      karigarsApi.update(karigar.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        speciality: speciality.trim() || null,
        max_capacity: parseInt(capacity, 10) || 6,
      }),
    onSuccess: () => {
      toast.success('Karigar updated');
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSave() {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Edit ${karigar.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>Save Changes</Button>
        </>
      }
    >
      <div className="field">
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Phone (optional)</label>
        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="field">
        <label>Speciality (optional)</label>
        <input type="text" value={speciality} onChange={(e) => setSpeciality(e.target.value)} />
      </div>
      <div className="field">
        <label>Max Capacity</label>
        <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
      </div>
    </Dialog>
  );
}
