import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase';

export type Role = 'guest' | 'member' | 'admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private supabaseSvc = inject(SupabaseService);
  private client = this.supabaseSvc.client;

  user = signal<any>(null);
  role = signal<Role>('guest');
  loading = signal(true);

  isLoggedIn = computed(() => this.role() !== 'guest');
  isAdmin = computed(() => this.role() === 'admin');
  isMember = computed(() => this.role() === 'member' || this.role() === 'admin');

  async init() {
    const { data: { session } } = await this.client.auth.getSession();
    await this.applySession(session);

    this.client.auth.onAuthStateChange(async (_, session) => {
      await this.applySession(session);
    });
  }

  private async applySession(session: any) {
    if (!session?.user) {
      this.user.set(null);
      this.role.set('guest');
      this.loading.set(false);
      return;
    }

    this.user.set(session.user);

    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    this.role.set((data?.role as Role) ?? 'member');
    this.loading.set(false);
  }

  async signInWithGoogle() {
    await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  }

  async signOut() {
    await this.client.auth.signOut();
    this.router.navigate(['/']);
  }
}
