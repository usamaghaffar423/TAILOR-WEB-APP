import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '@/api/settings';
import { StitchDivider } from '@/components/ui/StitchDivider';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { useAuthedImage } from '@/lib/useAuthedImage';
import { initials } from '@/lib/format';
import type { MeasurementTemplateField, ThemeDefault } from '@/types';

export default function Settings() {
  const queryClient = useQueryClient();
  const admin = useAuthStore((s) => s.admin);

  const { data: settingsRes } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.show(), staleTime: 30 * 60_000 });
  const { data: templatesRes } = useQuery({ queryKey: ['templates'], queryFn: () => settingsApi.getTemplates() });
  const shop = settingsRes?.data;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [themeDefault, setThemeDefault] = useState<ThemeDefault>('dark');

  useEffect(() => {
    if (shop) {
      setName(shop.name || '');
      setPhone(shop.phone || '');
      setAddress(shop.address || '');
      setThemeDefault(shop.theme_default);
    }
  }, [shop]);

  const logoUrl = useAuthedImage(shop?.logo_path);
  const bannerUrl = useAuthedImage(shop?.banner_path);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  function refreshShop() {
    queryClient.invalidateQueries({ queryKey: ['settings'] });
  }

  const saveShopMutation = useMutation({
    mutationFn: () => settingsApi.update({ name: name.trim(), phone: phone.trim() || null, address: address.trim() || null }),
    onSuccess: () => {
      toast.success('Shop details saved');
      refreshShop();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: () => {
      toast.success('Logo updated');
      refreshShop();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bannerMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadBanner(file),
    onSuccess: () => {
      toast.success('Banner updated');
      refreshShop();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const themeMutation = useMutation({
    mutationFn: (t: ThemeDefault) => settingsApi.update({ theme_default: t }),
    onSuccess: () => {
      toast.success('Default theme updated');
      refreshShop();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [tplKey, setTplKey] = useState<string>('');
  const [tplFields, setTplFields] = useState<MeasurementTemplateField[]>([]);
  useEffect(() => {
    if (templatesRes && !tplKey && templatesRes.data.length > 0) {
      const shalwarQameez = templatesRes.data.find((t) => t.template_key === 'shalwar-kameez-men');
      setTplKey((shalwarQameez || templatesRes.data[0]).template_key);
    }
  }, [templatesRes, tplKey]);
  useEffect(() => {
    const tpl = templatesRes?.data.find((t) => t.template_key === tplKey);
    if (tpl) setTplFields(tpl.fields);
  }, [tplKey, templatesRes]);

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      // Re-fetch immediately before saving — templatesRes can be stale if
      // this page (or another tab/admin) changed the template since it was
      // first loaded here, and tplFields was seeded from that snapshot.
      // Saving a stale label would silently overwrite a newer one.
      const fresh = await settingsApi.getTemplates();
      const label = fresh.data.find((t) => t.template_key === tplKey)?.label ?? templatesRes!.data.find((t) => t.template_key === tplKey)!.label;
      return settingsApi.updateTemplate(tplKey, { label, fields: tplFields });
    },
    onSuccess: () => {
      toast.success('Template updated');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearCacheMutation = useMutation({
    mutationFn: () => settingsApi.clearCache(),
    onSuccess: () => {
      toast.success('Cache cleared');
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const passwordMutation = useMutation({
    mutationFn: () => settingsApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function addField() {
    const label = window.prompt('New field label (e.g. "Cuff Width")');
    if (!label) return;
    const key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `field_${Date.now()}`;
    setTplFields((f) => [...f, { key, label: label.trim() }]);
  }

  return (
    <>
      <div className="hero-row">
        <div>
          <div className="hero-eyebrow">Order Studio</div>
          <div className="hero-title display">SETTINGS</div>
        </div>
      </div>
      <StitchDivider />

      <div className="form-section">
        <div className="form-section-title"><span className="num">1</span>Shop Details</div>
        <div className="form-grid cols-2">
          <div className="field"><label>Shop Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label>Phone</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="field span-2"><label>Address</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label>Logo</label>
          <div className="logo-upload">
            <div className="logo-upload-preview">
              {logoUrl ? <img src={logoUrl} alt="Shop logo" /> : initials(shop?.name || 'Top Man')}
            </div>
            <div className="logo-upload-actions">
              <Button variant="outline" sm onClick={() => logoInputRef.current?.click()}>Change Logo</Button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) logoMutation.mutate(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label>Banner</label>
          <div className="banner-upload-preview">
            {bannerUrl ? <img src={bannerUrl} alt="Shop banner" /> : 'No banner uploaded'}
          </div>
          <div style={{ marginTop: 8 }}>
            <Button variant="outline" sm onClick={() => bannerInputRef.current?.click()}>Change Banner</Button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) bannerMutation.mutate(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <Button onClick={() => saveShopMutation.mutate()} disabled={saveShopMutation.isPending}>Save Shop Details</Button>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">2</span>Measurement Templates</div>
        <div className="field" style={{ marginTop: 12, maxWidth: 320 }}>
          <label>Template</label>
          <select value={tplKey} onChange={(e) => setTplKey(e.target.value)}>
            {templatesRes?.data.map((t) => <option key={t.template_key} value={t.template_key}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          {tplFields.map((f, i) => (
            <div key={f.key} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                value={f.label}
                onChange={(e) => setTplFields((fields) => fields.map((ff, idx) => (idx === i ? { ...ff, label: e.target.value } : ff)))}
                style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', color: 'var(--text)', fontSize: 13 }}
              />
              <span className="cell-mono cell-muted" style={{ fontSize: 11, minWidth: 80 }}>{f.key}</span>
              <button className="modal-close" title="Remove field" onClick={() => setTplFields((fields) => fields.filter((_, idx) => idx !== i))}>&times;</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <Button variant="outline" sm onClick={addField}>+ Add Field</Button>
          <Button sm onClick={() => saveTemplateMutation.mutate()} disabled={saveTemplateMutation.isPending}>Save Template</Button>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">3</span>Default Theme</div>
        <div className="swatch-group" style={{ marginTop: 10 }}>
          {(['dark', 'light'] as ThemeDefault[]).map((t) => (
            <div
              key={t}
              className={`swatch-chip${themeDefault === t ? ' selected' : ''}`}
              onClick={() => {
                setThemeDefault(t);
                themeMutation.mutate(t);
              }}
            >
              {t === 'dark' ? 'Dark' : 'Light'}
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">4</span>Change Password</div>
        <div className="form-grid cols-2">
          <div className="field"><label>Current Password</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
          <div className="field"><label>New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
        </div>
        <div style={{ marginTop: 18 }}>
          <Button
            onClick={() => {
              if (!currentPassword || !newPassword) {
                toast.error('Both password fields are required');
                return;
              }
              passwordMutation.mutate();
            }}
            disabled={passwordMutation.isPending}
          >
            Change Password
          </Button>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">5</span>Karigars</div>
        <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 10 }}>
          Manage karigars (add, edit, remove) from the <a href="/karigars" style={{ color: 'var(--red)' }}>Karigars</a> page.
        </p>
      </div>

      <div className="form-section">
        <div className="form-section-title"><span className="num">6</span>System Cache</div>
        <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 10 }}>
          Clears all cached data on the server (dashboard, orders, customers, karigars, payments, settings, templates, and retail). Use this if data looks stale — it refreshes automatically every 3 days regardless.
        </p>
        <div style={{ marginTop: 14 }}>
          <Button variant="outline" onClick={() => clearCacheMutation.mutate()} disabled={clearCacheMutation.isPending}>
            {clearCacheMutation.isPending ? 'Clearing…' : 'Clear Cache'}
          </Button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>Signed in as {admin?.email}</p>
    </>
  );
}
