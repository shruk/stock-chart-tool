import { Component, inject, signal } from '@angular/core';
import { SettingsService } from '../../services/settings';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
})
export class SettingsPanelComponent {
  private settingsSvc = inject(SettingsService);

  open = signal(false);
  apiKeyDraft = signal('');
  finnhubKeyDraft = signal('');
  fmpKeyDraft = signal('');
  showKey = signal(false);
  showFinnhubKey = signal(false);
  showFmpKey = signal(false);
  saved = signal(false);

  openPanel() {
    this.apiKeyDraft.set(this.settingsSvc.apiKey());
    this.finnhubKeyDraft.set(this.settingsSvc.finnhubKey());
    this.fmpKeyDraft.set(this.settingsSvc.fmpKey());
    this.saved.set(false);
    this.open.set(true);
  }

  close() { this.open.set(false); }

  save() {
    this.settingsSvc.saveApiKey(this.apiKeyDraft());
    this.settingsSvc.saveFinnhubKey(this.finnhubKeyDraft());
    this.settingsSvc.saveFmpKey(this.fmpKeyDraft());
    this.saved.set(true);
  }
}
