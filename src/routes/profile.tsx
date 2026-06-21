import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfile, fetchUserPosts, getProfileAvatarUrl } from '@/lib/profile-service';
import { signOut } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Pencil, Link as LinkIcon, Grid3x3, Star, Play, Video } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '@/lib/profile-service';

export const Route = createFileRoute('/profile')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Profile — Reeme' }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<'grid' | 'videos' | 'highlights'>('grid');
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Array<{ id: string; url: string }>>([]);
  const [videos, setVideos] = useState<Array<{ id: string; url: string }>>([]);
  const [postCount, setPostCount] = useState(0);

  // Load user's posts when profile changes
  useEffect(() => {
    if (!profile) return;

    (async () => {
      const posts = await fetchUserPosts(profile.id);
      setPostCount(posts.postCount);
      setPhotos(posts.photos);
      setVideos(posts.videos);
    })();
  }, [profile]);

  // Load profile on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) {
          navigate({ to: '/auth' });
          return;
        }

        const loadedProfile = await fetchProfile(sess.session.user.id);
        if (loadedProfile) {
          setProfile(loadedProfile);
          const url = await getProfileAvatarUrl(loadedProfile.avatar_url);
          setAvatarUrl(url);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading profile…</div>
      </div>
    );
  }

  const initials = (profile.full_name || profile.username || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight">@{profile.username}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            try {
              await signOut();
              navigate({ to: '/auth' });
            } catch {
              // Error is handled by signOut
            }
          }}
          aria-label="Sign out"
        >
          <LogOut className="size-5" />
        </Button>
      </header>

      <section className="px-5 pt-6">
        <div className="flex items-center gap-5">
          <Avatar className="size-20 ring-2 ring-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.full_name} />}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 justify-around text-center">
            <Stat label="Posts" value={postCount} />
            <Stat label="Followers" value={0} />
            <Stat label="Following" value={0} />
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <h2 className="text-base font-semibold text-foreground">{profile.full_name}</h2>
          {profile.bio && (
            <p className="whitespace-pre-line text-sm text-foreground/90">{profile.bio}</p>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <LinkIcon className="size-3.5" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {profile.links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.links.map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border px-3 py-1 text-xs text-foreground hover:bg-accent"
                >
                  {l.label || l.url}
                </a>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => navigate({ to: '/profile/edit' })}
        >
          <Pencil className="mr-1 size-4" />
          Edit profile
        </Button>
      </section>

      <nav className="mt-6 grid grid-cols-3 border-y border-border">
        <button
          onClick={() => setTab('grid')}
          className={`flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
            tab === 'grid'
              ? 'border-b-2 border-foreground text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          <Grid3x3 className="size-4" />
          Photos
        </button>
        <button
          onClick={() => setTab('videos')}
          className={`flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
            tab === 'videos'
              ? 'border-b-2 border-foreground text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          <Video className="size-4" />
          Videos
        </button>
        <button
          onClick={() => setTab('highlights')}
          className={`flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
            tab === 'highlights'
              ? 'border-b-2 border-foreground text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          <Star className="size-4" />
          Highlights
        </button>
      </nav>

      <section className="px-1 pt-1">
        {tab === 'grid' ? (
          photos.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No photos yet
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {photos.map((p) => (
                <div key={p.id} className="aspect-square overflow-hidden bg-muted/40">
                  <img src={p.url} alt="" className="size-full object-cover" />
                </div>
              ))}
            </div>
          )
        ) : tab === 'videos' ? (
          videos.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No videos yet
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className="relative aspect-square overflow-hidden bg-muted/40"
                >
                  <video
                    src={v.url}
                    className="size-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="size-6 text-white drop-shadow" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No highlights yet
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-base font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
