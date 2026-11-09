import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string): void { this.push('success', message); }
  error(message: string): void { this.push('error', message); }

  private push(type: Toast['type'], message: string): void {
    const id = crypto.randomUUID();
    this.toasts.update(current => [...current, { id, type, message }]);
    setTimeout(() => {
      this.toasts.update(current => current.filter(t => t.id !== id));
    }, 4000);
  }
}