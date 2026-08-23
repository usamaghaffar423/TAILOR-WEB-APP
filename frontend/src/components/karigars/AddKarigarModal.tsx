import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { karigarsApi } from '@/api/karigars';

interface AddKarigarModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddKarigarModal({ open, onClose, onSaved }: AddKarigarModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [capacity, setCapacity] = useState('6');

  const mutation = useMutation({
    mutationFn: () =>
      karigarsApi.store({
        name: name.trim(),
        phone: phone.trim() || null,
        speciality: speciality.trim() || null,
        max_capacity: parseInt(capacity, 10) || 6,
      }),
    onSuccess: () => {
      toast.success('Karigar added');
      setName('');
      setPhone('');
      setSpeciality('');
      setCapacity('6');
      queryClient.invalidateQueries({ queryKey: ['karigars'] });
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
      title="Add Karigar"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>Save Karigar</Button>
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
