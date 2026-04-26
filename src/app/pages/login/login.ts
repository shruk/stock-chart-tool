import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>Stock Dashboard</h1>
        <p>Sign in to access stock details and full analytics.</p>
        <button class="google-btn" (click)="auth.signInWithGoogle()">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 48px 40px;
      text-align: center;
      max-width: 360px;
      width: 100%;
      h1 { margin: 0 0 8px; color: #f1f5f9; font-size: 1.5rem; }
      p { color: #94a3b8; margin: 0 0 32px; font-size: 0.9rem; }
    }
    .google-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fff;
      color: #1e293b;
      border: none;
      border-radius: 6px;
      padding: 12px 20px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      justify-content: center;
      &:hover { background: #f1f5f9; }
    }
  `]
})
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    if (this.auth.isLoggedIn()) this.router.navigate(['/']);
    this.auth.client.auth.onAuthStateChange((_, session) => {
      if (session) this.router.navigate(['/']);
    });
  }
}
