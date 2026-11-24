import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly toasts = signal<Toast[]>([]);
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  success(message: string, title = 'Login Successful'): void {
    this.push('success', message, title);
  }

  error(message: string, title = 'Notice'): void {
    this.push('error', message, title);
  }

  warning(message: string, title = 'Notice'): void {
    this.push('warning', message, title);
  }

  info(message: string, title = 'Notification'): void {
    this.push('info', message, title);
  }

  dismiss(id: string): void {
    const t = this.timers.get(id);
    if (t) {
      clearTimeout(t);
      this.timers.delete(id);
    }
    this.toasts.update(current => current.filter(item => item.id !== id));
  }

  clear(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers.clear();
    this.toasts.set([]);
  }

  private push(type: Toast['type'], message: string, title: string): void {
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);

    this.toasts.update(current => [...current.slice(-2), { id, type, title, message }]);
    const timer = setTimeout(() => this.dismiss(id), 4500);
    this.timers.set(id, timer);
  }
}