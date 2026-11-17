import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pagination-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div [class]="containerClass()">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <span class="font-medium tabular-nums">
          Showing
          <span class="font-bold text-slate-900">{{ startItem() }}</span>
          -
          <span class="font-bold text-slate-900">{{ endItem() }}</span>
          of
          <span class="font-bold text-slate-900">{{ safeTotalItems() }}</span>
          {{ itemLabel() }}
        </span>
        <div class="flex items-center gap-4 sm:gap-6 select-none">
          <button
            type="button"
            (click)="goPrevious()"
            [disabled]="safePage() <= 1"
            aria-label="Previous page"
            class="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-xs hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span class="font-semibold text-slate-500 text-sm tabular-nums whitespace-nowrap">
            Page
            <span class="text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 mx-1 font-bold">{{ safePage() }}</span>
            of {{ totalPages() }}
          </span>
          <button
            type="button"
            (click)="goNext()"
            [disabled]="safePage() >= totalPages()"
            aria-label="Next page"
            class="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-xs hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationBarComponent {
  page = input<number>(1);
  pageSize = input<number>(5);
  totalItems = input<number>(0);
  itemLabel = input<string>('records');
  containerClass = input<string>('px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/40');

  pageChange = output<number>();

  safeTotalItems = computed(() => Math.max(0, Number(this.totalItems()) || 0));
  safePageSize = computed(() => Math.max(1, Number(this.pageSize()) || 1));
  totalPages = computed(() => Math.max(1, Math.ceil(this.safeTotalItems() / this.safePageSize())));
  safePage = computed(() => Math.min(this.totalPages(), Math.max(1, Number(this.page()) || 1)));

  startItem = computed(() =>
    this.safeTotalItems() === 0 ? 0 : (this.safePage() - 1) * this.safePageSize() + 1
  );

  endItem = computed(() =>
    Math.min(this.safeTotalItems(), this.safePage() * this.safePageSize())
  );

  goPrevious(): void {
    const prev = Math.max(1, this.safePage() - 1);
    if (prev !== this.safePage()) {
      this.pageChange.emit(prev);
    }
  }

  goNext(): void {
    const next = Math.min(this.totalPages(), this.safePage() + 1);
    if (next !== this.safePage()) {
      this.pageChange.emit(next);
    }
  }
}
