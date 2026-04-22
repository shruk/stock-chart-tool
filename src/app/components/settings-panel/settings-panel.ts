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
  showKey = signal(false);
  saved = signal(false);

  openPanel() {
    this.apiKeyDraft.set(this.settingsSvc.apiKey());
    this.saved.set(false);
    this.open.set(true);
  }

  close() {
    this.open.set(false);
  }

  save() {
    this.settingsSvc.saveApiKey(this.apiKeyDraft());
    this.saved.set(true);
  }
}
