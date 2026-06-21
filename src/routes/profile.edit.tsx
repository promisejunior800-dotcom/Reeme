import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { updateProfile, uploadAvatar, getProfileAvatarUrl, fetchProfile } from '@/lib/profile-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const linkSchema = z.object({
  label: z.string().trim().max(40),
  url: z.string().trim().url({ message: 'Enter a valid URL' }).max(255),
});

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(80),
  username: z
    .string()
    .trim()
    .min(3, 'Min 3 characters')
    .max(24)
    .regex(/^[a-zA-Z0-9_.]+$/, 'Letters, numbers, _ and . only'),
  bio: z.string().trim().max(160).optional().or(z.literal('')),
  website: z
    .string()
    .trim()
    .max(255)
    .url('Enter a valid URL')
    .optional()
    .or(z.literal('')),
  links: z.array(linkSchema).max(5),
});

export const Route = createFileRoute('/profile/edit')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Edit Profile — Reeme' }] }),
  component: EditProfile,
});

function EditProfile() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    website: '',
    links: [] as Array<{ label: string; url: string }>,
  });

  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) {
          navigate({ to: '/auth' });
          return;
        }
        setUserId(sess.session.user.id);

        const profile = await fetchProfile(sess.session.user.id);
        if (profile) {
          setForm({
            full_name: profile.full_name ?? '',
            username: profile.username ?? '',
            bio: profile.bio ?? '',
            website: profile.website ?? '',
            links: (profile.links as Array<{ label: string; url: string }>) ?? [],
          });
          setAvatarPath(profile.avatar_url);
          const url = await getProfileAvatarUrl(profile.avatar_url);
          setAvatarPreview(url);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const onFile = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const path = await uploadAvatar(userId, file);
      if (path) {
        setAvatarPath(path);
        const url = await getProfileAvatarUrl(path);
        setAvatarPreview(url);
        toast.success('Photo updated');
      }
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    if (!userId) return;
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid form');
      return;
    }
    setSaving(true);
    try {
      const success = await updateProfile(userId, {
        full_name: parsed.data.full_name,
        username: parsed.data.username,
        bio: parsed.data.bio || null,
        website: parsed.data.website || null,
        links: parsed.data.links,
        avatar_url: avatarPath,
      });
      if (success) {
        toast.success('Profile saved');
        navigate({ to: '/profile' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-3 py-3 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/profile' })}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-base font-semibold">Edit profile</h1>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </header>

      <div className="flex flex-col items-center gap-3 px-5 pt-6">
        <Avatar className="size-24 ring-2 ring-border">
          {avatarPreview && <AvatarImage src={avatarPreview} />}
          <AvatarFallback>{form.full_name.slice(0, 2).toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <Button
          variant="link"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-1 size-4" />
          {uploading ? 'Uploading…' : 'Change photo'}
        </Button>
      </div>

      <div className="space-y-4 px-5 pt-4">
        <Field
          label="Full name"
          value={form.full_name}
          onChange={(v) => setForm({ ...form, full_name: v })}
        />
        <Field
          label="Username"
          value={form.username}
          onChange={(v) => setForm({ ...form, username: v })}
        />
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell people about yourself"
            maxLength={160}
            rows={3}
          />
          <p className="text-right text-xs text-muted-foreground">{form.bio.length}/160</p>
        </div>
        <Field
          label="Website"
          value={form.website}
          onChange={(v) => setForm({ ...form, website: v })}
          placeholder="https://"
          type="url"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Links</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setForm({
                  ...form,
                  links: [...form.links, { label: '', url: '' }],
                })
              }
              disabled={form.links.length >= 5}
            >
              <Plus className="mr-1 size-4" /> Add
            </Button>
          </div>
          {form.links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Label"
                value={l.label}
                onChange={(e) => {
                  const next = [...form.links];
                  next[i] = { ...next[i], label: e.target.value };
                  setForm({ ...form, links: next });
                }}
                className="w-1/3"
              />
              <Input
                placeholder="https://"
                value={l.url}
                onChange={(e) => {
                  const next = [...form.links];
                  next[i] = { ...next[i], url: e.target.value };
                  setForm({ ...form, links: next });
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setForm({
                    ...form,
                    links: form.links.filter((_, idx) => idx !== i),
                  })
                }
                aria-label="Remove link"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
