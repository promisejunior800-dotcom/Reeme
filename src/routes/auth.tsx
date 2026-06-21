import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { signUp, signIn, getSession } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Sign in — Reeme' },
      { name: 'description', content: 'Sign in or create your Reeme account.' },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name').max(80),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be 3+ chars')
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, 'Letters, numbers, _ and . only'),
  country_code: z.string().trim().regex(/^\+\d{1,4}$/, 'e.g. +1, +234'),
  phone: z.string().trim().regex(/^\d{6,15}$/, 'Digits only, 6–15'),
  email: z.string().trim().email('Invalid email').max(255),
  password: z.string().min(8, 'At least 8 characters').max(72),
});

const signInSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(1, 'Enter password'),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session) navigate({ to: '/' });
    })();
  }, [navigate]);

  const [up, setUp] = useState({
    full_name: '',
    username: '',
    country_code: '+1',
    phone: '',
    email: '',
    password: '',
  });
  const [si, setSi] = useState({ email: '', password: '' });

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(up);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await signUp(parsed.data);
      toast.success('Welcome to Reeme!');
      navigate({ to: '/' });
    } catch {
      // Error is handled by signUp function
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signInSchema.safeParse(si);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await signIn(parsed.data);
      navigate({ to: '/' });
    } catch {
      // Error is handled by signIn function
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Reeme</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join the network.</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="si-email">Email</Label>
                <Input
                  id="si-email"
                  type="email"
                  value={si.email}
                  onChange={(e) => setSi({ ...si, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-password">Password</Label>
                <Input
                  id="si-password"
                  type="password"
                  value={si.password}
                  onChange={(e) => setSi({ ...si, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={up.full_name}
                  onChange={(e) => setUp({ ...up, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={up.username}
                  onChange={(e) => setUp({ ...up, username: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <div className="space-y-2">
                  <Label htmlFor="country_code">Code</Label>
                  <Input
                    id="country_code"
                    placeholder="+1"
                    value={up.country_code}
                    onChange={(e) => setUp({ ...up, country_code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    value={up.phone}
                    onChange={(e) => setUp({ ...up, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-email">Email</Label>
                <Input
                  id="su-email"
                  type="email"
                  value={up.email}
                  onChange={(e) => setUp({ ...up, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-password">Password</Label>
                <Input
                  id="su-password"
                  type="password"
                  value={up.password}
                  onChange={(e) => setUp({ ...up, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
