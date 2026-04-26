import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>Admin Dashboard</h1>

        @if (auth.isAdmin()) {
          <p>Redirecting…</p>
        } @else if (auth.isLoggedIn()) {
          <div class="denied">
            <div class="denied-icon">⛔</div>
            <p class="denied-msg">Access denied. This site is for administrators only.</p>
            <p class="denied-email">Signed in as <strong>{{ auth.user()?.email }}</strong></p>
            <button class="signout-btn" (click)="auth.signOut()">Sign out</button>
          </div>
        } @else {
          <p>Admin access only. Sign in with your Google account.</p>
          <button class="google-btn" (click)="auth.signInWithGoogle()">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 48px 40px;
      text-align: center;
      max-width: 360px;
      width: 100%;
      h1 { margin: 0 0 8px; color: #0f172a; font-size: 1.5rem; }
      p { color: #64748b; margin: 0 0 32px; font-size: 0.9rem; }
    }
    .google-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 20px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      justify-content: center;
      &:hover { background: #f8fafc; border-color: #94a3b8; }
    }
    .denied {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .denied-icon { font-size: 2.5rem; }
    .denied-msg { color: #dc2626; font-size: 0.9rem; margin: 0; }
    .denied-email { color: #94a3b8; font-size: 0.8rem; margin: 0; strong { color: #475569; } }
    .signout-btn {
      margin-top: 8px;
      background: transparent;
      border: 1px solid #e2e8f0;
      color: #64748b;
      border-radius: 6px;
      padding: 8px 20px;
      font-size: 0.85rem;
      cursor: pointer;
      &:hover { border-color: #94a3b8; color: #0f172a; }
    }
  `]
})
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    if (this.auth.isAdmin()) this.router.navigate(['/']);
    this.auth.client.auth.onAuthStateChange((_, session) => {
      if (session && this.auth.isAdmin()) this.router.navigate(['/']);
    });
  }
}
