import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output
} from '@angular/core';
import {
  DetectedBuiltInHeader,
  SchoolCustomColumn,
  SchoolTableSchemaService
} from '../services/school-table-schema.service';

@Directive({
  selector: 'table[appSchoolTable]'
})
export class SchoolTableDirective implements AfterViewInit, OnDestroy {
  private readonly elRef = inject<ElementRef<HTMLTableElement>>(ElementRef);
  private readonly schemaService = inject(SchoolTableSchemaService);

  readonly appSchoolTable = input.required<string>();
  readonly tableTitle = input<string>('');
  readonly canAddRow = input<boolean>(false);
  readonly addRowLabel = input<string>('Add Record');

  readonly addRowClicked = output<string>();

  private observer: MutationObserver | null = null;
  private isApplying = false;
  private rafScheduled = false;
  private toolbarEl: HTMLElement | null = null;
  private registeredId = '';

  constructor() {
    effect(() => {
      const tableId = this.appSchoolTable();
      const title = this.tableTitle();
      const canAdd = this.canAddRow();
      const addLabel = this.addRowLabel();
      this.schemaService.isOwner();
      this.schemaService.schemaRevision();
      this.schemaService.schemas();
      void title;
      void canAdd;
      void addLabel;
      if (tableId && typeof document !== 'undefined') {
        this.scheduleApply();
      }
    });
  }

  ngAfterViewInit(): void {
    const tableId = this.appSchoolTable();
    const tableEl = this.elRef.nativeElement;
    this.registeredId = tableId;
    this.schemaService.registerTableElement(tableId, tableEl, this.tableTitle() || tableId);

    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => {
        if (!this.isApplying) {
          this.scheduleApply();
        }
      });
      this.observer.observe(tableEl, {
        childList: true,
        subtree: true
      });
    }

    this.scheduleApply();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.toolbarEl && this.toolbarEl.parentElement) {
      this.toolbarEl.parentElement.removeChild(this.toolbarEl);
      this.toolbarEl = null;
    }
    if (this.registeredId) {
      this.schemaService.unregisterTableElement(this.registeredId);
    }
  }

  private scheduleApply(): void {
    if (this.rafScheduled || typeof document === 'undefined') return;
    this.rafScheduled = true;
    const run = () => {
      this.rafScheduled = false;
      this.applySchema();
    };
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(run);
    } else {
      setTimeout(run, 0);
    }
  }

  private applySchema(): void {
    if (this.isApplying || typeof document === 'undefined') return;
    const tableEl = this.elRef.nativeElement;
    const tableId = this.appSchoolTable();
    if (!tableEl || !tableId) return;

    this.isApplying = true;
    if (this.observer) {
      this.observer.disconnect();
    }

    try {
      const schema = this.schemaService.getSchema(tableId);
      const isOwner = this.schemaService.isOwner();

      const headerRow = tableEl.querySelector('thead tr');
      if (!headerRow) {
        this.syncToolbar(tableEl, tableId, [], schema.customColumns.length, 0, isOwner);
        return;
      }

      // Remove previously injected custom <th> headers
      Array.from(headerRow.children).forEach((child) => {
        if ((child as HTMLElement).hasAttribute('data-scs-custom-col')) {
          headerRow.removeChild(child);
        }
      });

      const builtInThs = Array.from(headerRow.children) as HTMLElement[];
      const detectedHeaders: DetectedBuiltInHeader[] = [];
      let actionsColIndex = -1;

      builtInThs.forEach((th, idx) => {
        if (!th.hasAttribute('data-scs-orig-label')) {
          const raw = (th.textContent || '').replace(/\s+/g, ' ').trim();
          th.setAttribute('data-scs-orig-label', raw);
        }
        const origLabel = th.getAttribute('data-scs-orig-label') || '';
        const lower = origLabel.toLowerCase();
        if (
          idx === builtInThs.length - 1 &&
          (lower === 'actions' || lower === 'action' || lower === 'quick actions')
        ) {
          actionsColIndex = idx;
        } else {
          detectedHeaders.push({ index: idx, originalLabel: origLabel || `Column ${idx + 1}` });
        }
      });

      const hiddenSet = new Set(
        schema.hiddenColumns.filter((i) => i >= 0 && i < builtInThs.length && i !== actionsColIndex)
      );

      // Apply visibility & header rename on built-in <th>
      let visibleBuiltInCount = 0;
      builtInThs.forEach((th, idx) => {
        const isHidden = hiddenSet.has(idx);
        th.style.display = isHidden ? 'none' : '';
        if (!isHidden) visibleBuiltInCount++;

        const origLabel = th.getAttribute('data-scs-orig-label') || '';
        const renamed = schema.renamedHeaders[idx];
        const hasInteractive = Boolean(th.querySelector('input, select, button'));
        if (!hasInteractive && idx !== actionsColIndex) {
          const targetText = renamed && renamed.trim() ? renamed.trim() : origLabel;
          if ((th.textContent || '').trim() !== targetText) {
            th.textContent = targetText;
          }
        }
      });

      // Inject custom <th> elements right before Actions (or at end)
      const actionsTh = actionsColIndex >= 0 ? builtInThs[actionsColIndex] : null;
      schema.customColumns.forEach((col) => {
        const th = document.createElement('th');
        th.setAttribute('data-scs-custom-col', col.id);
        th.className = 'px-3.5 py-3 whitespace-nowrap text-indigo-700 bg-indigo-50/50';
        th.textContent = col.label;
        if (actionsTh) {
          headerRow.insertBefore(th, actionsTh);
        } else {
          headerRow.appendChild(th);
        }
      });

      // Update tbody rows
      const tbodies = Array.from(tableEl.querySelectorAll('tbody'));
      tbodies.forEach((tbody) => {
        const rows = Array.from(tbody.children).filter(
          (el) => el.tagName === 'TR'
        ) as HTMLTableRowElement[];

        rows.forEach((tr, rowIdx) => {
          // Remove previously injected custom <td> cells
          Array.from(tr.children).forEach((child) => {
            if ((child as HTMLElement).hasAttribute('data-scs-custom-cell')) {
              tr.removeChild(child);
            }
          });

          const builtInTds = Array.from(tr.children) as HTMLTableCellElement[];
          const isEmptyStateRow =
            builtInTds.length === 1 &&
            (builtInTds[0].hasAttribute('colspan') || builtInTds[0].hasAttribute('data-scs-empty-row'));

          if (isEmptyStateRow) {
            builtInTds[0].setAttribute('data-scs-empty-row', '1');
            builtInTds[0].setAttribute(
              'colspan',
              String(Math.max(1, visibleBuiltInCount + schema.customColumns.length))
            );
            return;
          }

          // Compute stable row key BEFORE hiding cells
          const rowKey = this.computeRowKey(tr, builtInTds, actionsColIndex, rowIdx);
          const rowLabel = this.computeRowLabel(builtInTds, actionsColIndex, rowKey);

          // Apply visibility on built-in <td>
          builtInTds.forEach((td, idx) => {
            td.style.display = hiddenSet.has(idx) ? 'none' : '';
          });

          // Inject custom <td> cells right before Actions cell (or at end)
          const actionsTd =
            actionsColIndex >= 0 && actionsColIndex < builtInTds.length
              ? builtInTds[actionsColIndex]
              : null;

          schema.customColumns.forEach((col) => {
            const td = this.createCustomCell(
              tableId,
              col,
              rowKey,
              rowLabel,
              schema.customCells[rowKey]?.[col.id],
              isOwner
            );
            if (actionsTd) {
              tr.insertBefore(td, actionsTd);
            } else {
              tr.appendChild(td);
            }
          });
        });
      });

      this.syncToolbar(
        tableEl,
        tableId,
        detectedHeaders,
        schema.customColumns.length,
        hiddenSet.size,
        isOwner
      );
    } finally {
      if (this.observer) {
        this.observer.observe(tableEl, {
          childList: true,
          subtree: true
        });
      }
      this.isApplying = false;
    }
  }

  private computeRowKey(
    tr: HTMLTableRowElement,
    builtInTds: HTMLTableCellElement[],
    actionsColIndex: number,
    rowIdx: number
  ): string {
    const explicit = tr.getAttribute('data-row-key');
    if (explicit && explicit.trim()) return explicit.trim();

    const parts: string[] = [];
    for (let i = 0; i < builtInTds.length && parts.length < 2; i++) {
      if (i === actionsColIndex) continue;
      const txt = (builtInTds[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (txt && txt !== '—') {
        parts.push(txt.slice(0, 32));
      }
    }
    if (parts.length > 0) {
      return parts.join('|').toLowerCase().replace(/[^a-z0-9|_-]+/g, '_');
    }
    return `row_${rowIdx}`;
  }

  private computeRowLabel(
    builtInTds: HTMLTableCellElement[],
    actionsColIndex: number,
    fallback: string
  ): string {
    for (let i = 0; i < builtInTds.length; i++) {
      if (i === actionsColIndex) continue;
      const txt = (builtInTds[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (txt && txt.length >= 2 && txt !== '—') {
        return txt.slice(0, 48);
      }
    }
    return fallback;
  }

  private createCustomCell(
    tableId: string,
    col: SchoolCustomColumn,
    rowKey: string,
    rowLabel: string,
    savedVal: string | undefined,
    isOwner: boolean
  ): HTMLTableCellElement {
    const td = document.createElement('td');
    td.setAttribute('data-scs-custom-cell', col.id);
    td.className = 'px-3.5 py-2.5 whitespace-nowrap text-xs';

    const val = savedVal !== undefined && savedVal !== '' ? savedVal : col.defaultValue || '—';

    if (col.type === 'badge' && val !== '—') {
      const badge = document.createElement('span');
      badge.className =
        'inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80';
      badge.textContent = val;
      td.appendChild(badge);
    } else if (col.type === 'number') {
      const span = document.createElement('span');
      span.className = 'font-mono font-semibold text-slate-800 tabular-nums';
      span.textContent = val;
      td.appendChild(span);
    } else {
      const span = document.createElement('span');
      span.className = val === '—' ? 'text-slate-400' : 'font-semibold text-slate-800';
      span.textContent = val;
      td.appendChild(span);
    }

    if (isOwner) {
      td.className += ' cursor-pointer hover:bg-indigo-50/70 transition-colors group';
      td.title = `Click to edit "${col.label}"`;
      const hint = document.createElement('span');
      hint.className =
        'ml-1.5 inline-block text-[9px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity';
      hint.textContent = 'Edit';
      td.appendChild(hint);

      td.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.schemaService.openCellEditor({
          tableId,
          tableTitle: this.tableTitle() || tableId,
          rowKey,
          rowLabel,
          colId: col.id,
          colLabel: col.label,
          colType: col.type,
          value: savedVal ?? col.defaultValue ?? ''
        });
      });
    }

    return td;
  }

  private syncToolbar(
    tableEl: HTMLTableElement,
    tableId: string,
    detectedHeaders: DetectedBuiltInHeader[],
    customCount: number,
    hiddenCount: number,
    isOwner: boolean
  ): void {
    const parent = tableEl.parentElement;
    if (!parent) return;

    if (!isOwner) {
      if (this.toolbarEl && this.toolbarEl.parentElement) {
        this.toolbarEl.parentElement.removeChild(this.toolbarEl);
        this.toolbarEl = null;
      }
      return;
    }

    if (!this.toolbarEl) {
      this.toolbarEl = document.createElement('div');
      this.toolbarEl.setAttribute('data-scs-table-toolbar', tableId);
      this.toolbarEl.className =
        'sticky left-0 z-10 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-50/95 border-b border-slate-200/80 text-[11px]';
      parent.insertBefore(this.toolbarEl, tableEl);
    }

    const title = this.tableTitle() || tableId.replace(/_/g, ' ');
    const visibleCount = Math.max(0, detectedHeaders.length - hiddenCount);

    // Clear and rebuild toolbar controls safely without innerHTML
    while (this.toolbarEl.firstChild) {
      this.toolbarEl.removeChild(this.toolbarEl.firstChild);
    }

    const left = document.createElement('div');
    left.className = 'flex items-center gap-2 flex-wrap';

    const ownerBadge = document.createElement('span');
    ownerBadge.className =
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold tracking-tight';
    ownerBadge.textContent = 'Owner CRUD';
    left.appendChild(ownerBadge);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'font-bold text-slate-700 capitalize';
    titleSpan.textContent = title;
    left.appendChild(titleSpan);

    const statsSpan = document.createElement('span');
    statsSpan.className = 'text-[10px] font-semibold text-slate-500 tabular-nums';
    const customPart = customCount > 0 ? ` · +${customCount} custom` : '';
    const hiddenPart = hiddenCount > 0 ? ` · ${hiddenCount} hidden` : '';
    statsSpan.textContent = `${visibleCount}/${detectedHeaders.length} cols${customPart}${hiddenPart}`;
    left.appendChild(statsSpan);

    const right = document.createElement('div');
    right.className = 'flex items-center gap-1.5 flex-wrap';

    const colBtn = document.createElement('button');
    colBtn.type = 'button';
    colBtn.className =
      'px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs';
    colBtn.textContent = 'Columns (CRUD)';
    colBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.schemaService.openColumnManager(tableId, title, detectedHeaders);
    });
    right.appendChild(colBtn);

    const csvBtn = document.createElement('button');
    csvBtn.type = 'button';
    csvBtn.className =
      'px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs';
    csvBtn.textContent = 'CSV';
    csvBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.schemaService.exportTableCsv(tableId, title);
    });
    right.appendChild(csvBtn);

    if (this.canAddRow()) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className =
        'px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer transition-colors shadow-2xs';
      addBtn.textContent = `+ ${this.addRowLabel() || 'Add'}`;
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.addRowClicked.emit(tableId);
        this.schemaService.triggerAddRow(tableId, title);
      });
      right.appendChild(addBtn);
    }

    this.toolbarEl.appendChild(left);
    this.toolbarEl.appendChild(right);
  }
}
