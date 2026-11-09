import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown, X } from 'lucide-angular';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  type?: 'text' | 'badge' | 'currency' | 'date' | 'avatar' | 'actions';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="apple-data-table-container rounded-[20px] bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden transition-all">
      <!-- Table Header Bar: Search & Controls -->
      <div *ngIf="showControls" class="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gradient-to-b from-slate-50/50 to-white">
        <div class="flex items-center gap-3 flex-1">
          <div *ngIf="searchable" class="relative flex-1 max-w-md">
            <lucide-icon [name]="'search'" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></lucide-icon>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              [placeholder]="searchPlaceholder"
              class="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
            <button
              *ngIf="searchTerm"
              (click)="clearSearch()"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600">
              <lucide-icon [name]="'x'" class="w-3.5 h-3.5"></lucide-icon>
            </button>
          </div>
          <ng-content select="[table-filters]"></ng-content>
        </div>

        <div class="flex items-center gap-2 justify-end">
          <ng-content select="[table-actions]"></ng-content>
          <span class="text-[11px] font-bold text-slate-400 tabular-nums">
            Total: {{ processedData.length }} records
          </span>
        </div>
      </div>

      <!-- Table Body Container -->
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="bg-slate-50/80 text-slate-600 uppercase font-black tracking-wider text-[10px] border-b border-slate-200/80 select-none">
            <tr>
              <th
                *ngFor="let col of columns"
                [style.width]="col.width"
                (click)="sort(col)"
                [class.cursor-pointer]="col.sortable !== false"
                [class.hover:bg-slate-100]="col.sortable !== false"
                [class.text-left]="!col.align || col.align === 'left'"
                [class.text-center]="col.align === 'center'"
                [class.text-right]="col.align === 'right'"
                class="px-4 py-3.5 transition-colors">
                <div class="flex items-center gap-1.5" [class.justify-center]="col.align === 'center'" [class.justify-end]="col.align === 'right'">
                  <span>{{ col.label }}</span>
                  <span *ngIf="col.sortable !== false" class="text-slate-400">
                    <lucide-icon *ngIf="sortColumn !== col.key" [name]="'arrow-up-down'" class="w-3 h-3 opacity-40"></lucide-icon>
                    <lucide-icon *ngIf="sortColumn === col.key && sortDirection === 'asc'" [name]="'chevron-up'" class="w-3 h-3 text-indigo-600"></lucide-icon>
                    <lucide-icon *ngIf="sortColumn === col.key && sortDirection === 'desc'" [name]="'chevron-down'" class="w-3 h-3 text-indigo-600"></lucide-icon>
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 font-medium">
            <tr
              *ngFor="let row of paginatedData; let i = index"
              (click)="rowClick.emit(row)"
              class="hover:bg-slate-50/70 transition-colors group">
              <td
                *ngFor="let col of columns"
                [class.text-left]="!col.align || col.align === 'left'"
                [class.text-center]="col.align === 'center'"
                [class.text-right]="col.align === 'right'"
                class="px-4 py-3.5 text-slate-700">
                <ng-container [ngSwitch]="col.type">
                  <!-- Currency Formatted -->
                  <span *ngSwitchCase="'currency'" class="font-mono font-bold tabular-nums text-slate-900">
                    {{ currencySymbol }} {{ (row[col.key] || 0) | number:'1.0-0' }}
                  </span>

                  <!-- Date -->
                  <span *ngSwitchCase="'date'" class="font-mono tabular-nums text-slate-500">
                    {{ row[col.key] }}
                  </span>

                  <!-- Badge -->
                  <span *ngSwitchCase="'badge'" class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block"
                    [class.bg-emerald-50]="row[col.key] === 'Active' || row[col.key] === 'Paid' || row[col.key] === 'Present' || row[col.key] === 'Approved'"
                    [class.text-emerald-700]="row[col.key] === 'Active' || row[col.key] === 'Paid' || row[col.key] === 'Present' || row[col.key] === 'Approved'"
                    [class.bg-amber-50]="row[col.key] === 'Pending' || row[col.key] === 'Late' || row[col.key] === 'Under Review'"
                    [class.text-amber-700]="row[col.key] === 'Pending' || row[col.key] === 'Late' || row[col.key] === 'Under Review'"
                    [class.bg-rose-50]="row[col.key] === 'Suspended' || row[col.key] === 'Overdue' || row[col.key] === 'Absent' || row[col.key] === 'Rejected'"
                    [class.text-rose-700]="row[col.key] === 'Suspended' || row[col.key] === 'Overdue' || row[col.key] === 'Absent' || row[col.key] === 'Rejected'">
                    {{ row[col.key] }}
                  </span>

                  <!-- Default Text -->
                  <span *ngSwitchDefault class="tabular-nums">
                    {{ row[col.key] }}
                  </span>
                </ng-container>
              </td>
            </tr>

            <!-- Empty State -->
            <tr *ngIf="paginatedData.length === 0">
              <td [attr.colspan]="columns.length" class="px-4 py-12 text-center text-slate-400">
                <div class="flex flex-col items-center justify-center space-y-2">
                  <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <lucide-icon [name]="'search'" class="w-5 h-5"></lucide-icon>
                  </div>
                  <p class="text-xs font-bold text-slate-600">No records found matching your search</p>
                  <p class="text-[11px] text-slate-400">Try adjusting your filters or search keywords</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div *ngIf="showPagination && processedData.length > 0" class="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs">
        <div class="text-slate-500 font-medium tabular-nums">
          Showing <span class="font-bold text-slate-900">{{ startIndex + 1 }}</span> to <span class="font-bold text-slate-900">{{ endIndex }}</span> of <span class="font-bold text-slate-900">{{ processedData.length }}</span> entries
        </div>

        <div class="flex items-center gap-1.5 select-none">
          <!-- Previous Button -->
          <button
            (click)="previousPage()"
            [disabled]="currentPage === 1"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95">
            <lucide-icon [name]="'chevron-left'" class="w-3.5 h-3.5"></lucide-icon>
            <span class="hidden sm:inline">Previous</span>
          </button>

          <!-- Numbered Page Pills -->
          <button
            *ngFor="let p of visiblePages"
            (click)="goToPage(p)"
            class="w-7 h-7 rounded-lg font-bold text-xs cursor-pointer transition-all tabular-nums"
            [class.bg-indigo-600]="currentPage === p"
            [class.text-white]="currentPage === p"
            [class.shadow-xs]="currentPage === p"
            [class.bg-slate-100]="currentPage !== p"
            [class.text-slate-700]="currentPage !== p"
            [class.hover:bg-slate-200]="currentPage !== p">
            {{ p }}
          </button>

          <!-- Next Button -->
          <button
            (click)="nextPage()"
            [disabled]="currentPage === totalPages"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95">
            <span class="hidden sm:inline">Next</span>
            <lucide-icon [name]="'chevron-right'" class="w-3.5 h-3.5"></lucide-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .custom-scrollbar::-webkit-scrollbar {
      height: 6px;
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.4);
      border-radius: 9999px;
    }
  `]
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() columns: DataTableColumn[] = [];
  @Input() data: any[] = [];
  @Input() pageSize: number = 8;
  @Input() searchable: boolean = true;
  @Input() searchPlaceholder: string = 'Search table records...';
  @Input() showControls: boolean = true;
  @Input() showPagination: boolean = true;
  @Input() currencySymbol: string = 'PKR';

  @Output() rowClick = new EventEmitter<any>();

  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;

  processedData: any[] = [];
  paginatedData: any[] = [];

  ngOnInit(): void {
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageSize']) {
      this.refresh();
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.refresh();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.refresh();
  }

  sort(col: DataTableColumn): void {
    if (col.sortable === false) return;
    if (this.sortColumn === col.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col.key;
      this.sortDirection = 'asc';
    }
    this.refresh();
  }

  refresh(): void {
    let result = [...(this.data || [])];

    // Filter by search
    if (this.searchTerm && this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      result = result.filter(item => {
        return Object.values(item).some(val => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Sort
    if (this.sortColumn) {
      result.sort((a, b) => {
        const valA = a[this.sortColumn];
        const valB = b[this.sortColumn];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return this.sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        return this.sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    this.processedData = result;

    // Boundary check for current page
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) this.currentPage = 1;

    // Paginate
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedData = this.processedData.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.processedData.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    return Math.min(this.processedData.length, (this.currentPage - 1) * this.pageSize);
  }

  get endIndex(): number {
    return Math.min(this.processedData.length, this.currentPage * this.pageSize);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.refresh();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.refresh();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.refresh();
    }
  }
}
