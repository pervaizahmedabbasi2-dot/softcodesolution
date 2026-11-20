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
  DetectedTableRow,
  OrderedTableColumn,
  SchoolCustomColumn,
  SchoolCustomRow,
  SchoolTableSchema,
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
  private titleBannerEl: HTMLElement | null = null;
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
    if (this.titleBannerEl && this.titleBannerEl.parentElement) {
      this.titleBannerEl.parentElement.removeChild(this.titleBannerEl);
      this.titleBannerEl = null;
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

      // Sync custom title banner for ALL portals when Owner sets a custom title
      this.syncTitleBanner(tableEl, tableId, schema, isOwner);

      const headerRow = tableEl.querySelector('thead tr');
      if (!headerRow) {
        this.syncToolbar(tableEl, tableId, [], schema, 0, isOwner);
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
          (lower === 'actions' || lower === 'action' || lower === 'quick actions' || lower === 'remove')
        ) {
          actionsColIndex = idx;
        } else {
          detectedHeaders.push({ index: idx, originalLabel: origLabel || `Column ${idx + 1}` });
        }
      });

      this.schemaService.updateRegisteredHeaders(tableId, detectedHeaders);

      const hiddenLabelSet = new Set((schema.hiddenColumnLabels || []).map((l) => l.toLowerCase()));
      const isCanonicalMatch = schema.tableId === tableId;
      const hiddenIndexSet = new Set(
        isCanonicalMatch
          ? schema.hiddenColumns.filter((i) => i >= 0 && i < builtInThs.length && i !== actionsColIndex)
          : []
      );

      // Combine index-based and label-based visibility for cross-portal sibling consistency
      const effectiveHiddenSet = new Set<number>();
      builtInThs.forEach((th, idx) => {
        if (idx === actionsColIndex) return;
        const origLabel = (th.getAttribute('data-scs-orig-label') || '').trim().toLowerCase();
        if (hiddenIndexSet.has(idx) || (origLabel && hiddenLabelSet.has(origLabel))) {
          effectiveHiddenSet.add(idx);
        } else if (!isCanonicalMatch && schema.hiddenColumns.includes(idx) && schema.hiddenColumnLabels.length === 0) {
          effectiveHiddenSet.add(idx);
        }
      });

      // Apply visibility & header rename on built-in <th>
      let visibleBuiltInCount = 0;
      builtInThs.forEach((th, idx) => {
        const isHidden = effectiveHiddenSet.has(idx);
        th.style.display = isHidden ? 'none' : '';
        if (!isHidden) visibleBuiltInCount++;

        const origLabel = th.getAttribute('data-scs-orig-label') || '';
        const origKey = origLabel.trim().toLowerCase();
        const renamed =
          schema.renamedHeadersByLabel?.[origKey] ??
          (isCanonicalMatch ? schema.renamedHeaders[idx] : undefined);
        const hasInteractive = Boolean(th.querySelector('input, select, button'));
        if (!hasInteractive && idx !== actionsColIndex) {
          const targetText = renamed && renamed.trim() ? renamed.trim() : origLabel;
          if ((th.textContent || '').trim() !== targetText) {
            th.textContent = targetText;
          }
        }
      });

      // Resolve exact column order (First / After Specific Column / End before Actions)
      const orderedColumns = this.schemaService.resolveOrderedColumns(
        tableId,
        detectedHeaders,
        schema,
        effectiveHiddenSet
      );

      // Inject custom <th> elements in exact resolved positions, matching sibling native headers
      const nativeThClass =
        builtInThs.find((el, i) => i !== actionsColIndex && (el.className || '').trim().length > 0)?.className ||
        'py-3 px-4 whitespace-nowrap';
      const actionsTh = actionsColIndex >= 0 ? builtInThs[actionsColIndex] : null;
      orderedColumns.forEach((item, oIdx) => {
        if (item.kind !== 'custom') return;
        const col = item.col;
        const th = document.createElement('th');
        th.setAttribute('data-scs-custom-col', col.id);
        th.className = `${nativeThClass} whitespace-nowrap`;
        th.textContent = col.label;

        let refTh: HTMLElement | null = actionsTh;
        for (let k = oIdx + 1; k < orderedColumns.length; k++) {
          const nextItem = orderedColumns[k];
          if (nextItem.kind === 'builtin' && nextItem.header.index < builtInThs.length) {
            refTh = builtInThs[nextItem.header.index];
            break;
          }
        }
        if (refTh) {
          headerRow.insertBefore(th, refTh);
        } else {
          headerRow.appendChild(th);
        }
      });

      // Update tbody rows
      const tbodies = Array.from(tableEl.querySelectorAll('tbody'));
      tbodies.forEach((tbody, tbodyIdx) => {
        // Remove previously injected standalone custom rows
        Array.from(tbody.children).forEach((child) => {
          if ((child as HTMLElement).hasAttribute('data-scs-custom-row')) {
            tbody.removeChild(child);
          }
        });

        const rows = Array.from(tbody.children).filter(
          (el) => el.tagName === 'TR'
        ) as HTMLTableRowElement[];

        const detectedRows: DetectedTableRow[] = [];
        const rowElMap = new Map<string, HTMLTableRowElement>();
        let firstBuiltInTr: HTMLTableRowElement | null = null;

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
            const visibleCustomCount = schema.customColumns.filter(
              (c) => !c.scope || c.scope === 'table' || c.scope === 'both'
            ).length;
            builtInTds[0].setAttribute('data-scs-empty-row', '1');
            builtInTds[0].setAttribute(
              'colspan',
              String(Math.max(1, visibleBuiltInCount + visibleCustomCount))
            );
            return;
          }

          if (!firstBuiltInTr) firstBuiltInTr = tr;

          // Compute stable row key(s) BEFORE hiding cells
          const explicitKey = (tr.getAttribute('data-row-key') || '').trim();
          const contentKey = this.computeContentRowKey(builtInTds, actionsColIndex, rowIdx);
          const rowKey = explicitKey || contentKey;
          const rowLabel = this.computeRowLabel(builtInTds, actionsColIndex, rowKey);

          if (tbodyIdx === 0) {
            detectedRows.push({ rowKey, label: rowLabel });
            if (explicitKey) rowElMap.set(explicitKey, tr);
            if (contentKey) rowElMap.set(contentKey, tr);
            rowElMap.set(rowKey, tr);
          }

          // Apply visibility on built-in <td>
          builtInTds.forEach((td, idx) => {
            td.style.display = effectiveHiddenSet.has(idx) ? 'none' : '';
          });

          // Inject custom <td> cells in exact resolved column positions
          const actionsTd =
            actionsColIndex >= 0 && actionsColIndex < builtInTds.length
              ? builtInTds[actionsColIndex]
              : null;

          orderedColumns.forEach((item, oIdx) => {
            if (item.kind !== 'custom') return;
            const col = item.col;
            const savedVal =
              (explicitKey ? schema.customCells[explicitKey]?.[col.id] : undefined) ??
              schema.customCells[contentKey]?.[col.id];
            const effectiveRowKey = explicitKey && schema.customCells[explicitKey]?.[col.id] !== undefined
              ? explicitKey
              : (schema.customCells[contentKey]?.[col.id] !== undefined ? contentKey : rowKey);

            const td = this.createCustomCell(
              tableId,
              col,
              effectiveRowKey,
              rowLabel,
              savedVal,
              isOwner
            );

            let refTd: HTMLElement | null = actionsTd;
            for (let k = oIdx + 1; k < orderedColumns.length; k++) {
              const nextItem = orderedColumns[k];
              if (nextItem.kind === 'builtin' && nextItem.header.index < builtInTds.length) {
                refTd = builtInTds[nextItem.header.index];
                break;
              }
            }
            if (refTd) {
              tr.insertBefore(td, refTd);
            } else {
              tr.appendChild(td);
            }
          });
        });

        if (tbodyIdx === 0) {
          this.schemaService.updateRegisteredRows(tableId, detectedRows);
        }

        // Inject standalone custom rows at chosen positions (Top / After Specific Row / Bottom)
        if (tbodyIdx === 0 && (schema.customRows || []).length > 0) {
          const buildRow = (crow: SchoolCustomRow) =>
            this.createStandaloneCustomRow(
              tableId,
              crow,
              orderedColumns,
              detectedHeaders,
              actionsColIndex,
              schema,
              isOwner
            );

          const topRows: SchoolCustomRow[] = [];
          const bottomRows: SchoolCustomRow[] = [];
          const targetedRows: SchoolCustomRow[] = [];

          for (const crow of schema.customRows) {
            const pos = (crow.insertAfterRowKey || '').trim();
            if (!pos || pos === '__first__') {
              topRows.push(crow);
            } else if (pos === '__last__') {
              bottomRows.push(crow);
            } else if (pos.startsWith('after:')) {
              targetedRows.push(crow);
            } else {
              topRows.push(crow);
            }
          }

          // Top rows (maintain creation/batch order)
          topRows.forEach((crow) => {
            const tr = buildRow(crow);
            rowElMap.set(crow.rowKey, tr);
            if (firstBuiltInTr) {
              tbody.insertBefore(tr, firstBuiltInTr);
            } else if (tbody.firstChild) {
              tbody.insertBefore(tr, tbody.firstChild);
            } else {
              tbody.appendChild(tr);
            }
          });

          // Bottom rows
          bottomRows.forEach((crow) => {
            const tr = buildRow(crow);
            rowElMap.set(crow.rowKey, tr);
            tbody.appendChild(tr);
          });

          // Rows anchored after a specific existing built-in or custom row
          const afterTailMap = new Map<string, HTMLTableRowElement>();
          let pending = [...targetedRows];
          let safety = pending.length + 2;
          while (pending.length > 0 && safety-- > 0) {
            const nextPending: SchoolCustomRow[] = [];
            let progressed = false;
            for (const crow of pending) {
              const targetKey = (crow.insertAfterRowKey || '').slice(6).trim();
              const anchorEl = afterTailMap.get(targetKey) || rowElMap.get(targetKey);
              if (anchorEl && anchorEl.parentElement === tbody) {
                const tr = buildRow(crow);
                tbody.insertBefore(tr, anchorEl.nextSibling);
                afterTailMap.set(targetKey, tr);
                rowElMap.set(crow.rowKey, tr);
                progressed = true;
              } else {
                nextPending.push(crow);
              }
            }
            pending = nextPending;
            if (!progressed) break;
          }

          // Any targeted rows whose target was filtered/not present fallback cleanly to bottom
          for (const crow of pending) {
            const tr = buildRow(crow);
            rowElMap.set(crow.rowKey, tr);
            tbody.appendChild(tr);
          }
        }
      });

      this.syncToolbar(
        tableEl,
        tableId,
        detectedHeaders,
        schema,
        effectiveHiddenSet.size,
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

  private getChromeMountTarget(
    tableEl: HTMLTableElement
  ): { container: HTMLElement; beforeEl: Element | null; externalScroll: boolean } | null {
    const parent = tableEl.parentElement;
    if (!parent) return null;
    if (parent.hasAttribute('data-scs-table-scroll') && parent.parentElement) {
      return { container: parent.parentElement, beforeEl: parent, externalScroll: true };
    }
    return { container: parent, beforeEl: tableEl, externalScroll: false };
  }

  private syncTitleBanner(
    tableEl: HTMLTableElement,
    tableId: string,
    schema: SchoolTableSchema,
    isOwner: boolean
  ): void {
    const mount = this.getChromeMountTarget(tableEl);
    if (!mount) return;

    const customTitle = (schema.customTitle || '').trim();
    if (!customTitle) {
      if (this.titleBannerEl && this.titleBannerEl.parentElement) {
        this.titleBannerEl.parentElement.removeChild(this.titleBannerEl);
        this.titleBannerEl = null;
      }
      return;
    }

    if (!this.titleBannerEl) {
      this.titleBannerEl = document.createElement('div');
      this.titleBannerEl.setAttribute('data-scs-custom-title-banner', tableId);
      this.titleBannerEl.className = mount.externalScroll
        ? 'px-3.5 py-2 bg-indigo-50/75 border-b border-indigo-200/70 flex items-center justify-between gap-2 text-xs'
        : 'sticky left-0 z-10 px-3.5 py-2 bg-indigo-50/75 border-b border-indigo-200/70 flex items-center justify-between gap-2 text-xs';
      mount.container.insertBefore(this.titleBannerEl, mount.beforeEl);
    } else if (this.titleBannerEl.parentElement !== mount.container) {
      mount.container.insertBefore(this.titleBannerEl, mount.beforeEl);
    }

    while (this.titleBannerEl.firstChild) {
      this.titleBannerEl.removeChild(this.titleBannerEl.firstChild);
    }

    const left = document.createElement('div');
    left.className = 'flex items-center gap-2 min-w-0';

    const titleEl = document.createElement('span');
    titleEl.className = 'font-black text-slate-900 truncate';
    titleEl.textContent = customTitle;
    left.appendChild(titleEl);

    if (isOwner) {
      const badge = document.createElement('span');
      badge.className = 'px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold shrink-0';
      badge.textContent = 'Custom Title';
      left.appendChild(badge);
    }

    this.titleBannerEl.appendChild(left);

    if (isOwner) {
      const removeTitleBtn = document.createElement('button');
      removeTitleBtn.type = 'button';
      removeTitleBtn.className =
        'px-2 py-0.5 rounded-md bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-700 text-[10px] font-bold cursor-pointer shrink-0';
      removeTitleBtn.textContent = 'Remove Title';
      removeTitleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.schemaService.openConfirm({
          title: 'Remove Custom Heading?',
          message: `Are you sure you want to remove the custom heading "${customTitle}"?`,
          confirmLabel: 'Remove',
          danger: true,
          onConfirm: () => {
            this.schemaService.updateTableTitle(tableId, '');
          }
        });
      });
      this.titleBannerEl.appendChild(removeTitleBtn);
    }
  }

  private createStandaloneCustomRow(
    tableId: string,
    crow: SchoolCustomRow,
    orderedColumns: OrderedTableColumn[],
    detectedHeaders: DetectedBuiltInHeader[],
    actionsColIndex: number,
    schema: SchoolTableSchema,
    isOwner: boolean
  ): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.setAttribute('data-scs-custom-row', crow.rowKey);
    tr.setAttribute('data-row-key', crow.rowKey);
    tr.className = 'hover:bg-slate-50/80 transition-colors';

    orderedColumns.forEach((item) => {
      if (item.kind === 'builtin') {
        const h = item.header;
        const td = document.createElement('td');
        td.className = 'px-3.5 py-2.5 text-xs font-semibold text-slate-800 whitespace-nowrap';
        td.style.display = item.hidden ? 'none' : '';
        const val =
          crow.values[`built_${h.index}`] ??
          crow.values[h.originalLabel] ??
          '—';
        td.textContent = val || '—';
        tr.appendChild(td);
      } else {
        const col = item.col;
        const savedVal =
          crow.values[col.id] ??
          schema.customCells[crow.rowKey]?.[col.id] ??
          col.defaultValue ??
          '';
        const td = this.createCustomCell(
          tableId,
          col,
          crow.rowKey,
          crow.rowLabel || 'Custom Row',
          savedVal,
          isOwner
        );
        tr.appendChild(td);
      }
    });

    if (actionsColIndex >= 0) {
      const actTd = document.createElement('td');
      actTd.className = 'px-3.5 py-2.5 text-right whitespace-nowrap';
      if (isOwner) {
        const wrap = document.createElement('div');
        wrap.className = 'inline-flex items-center gap-1';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className =
          'px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] cursor-pointer';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.schemaService.openColumnManager(
            tableId,
            schema.customTitle || this.tableTitle() || tableId,
            detectedHeaders,
            'rows'
          );
        });
        wrap.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className =
          'px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] cursor-pointer';
        delBtn.textContent = 'Remove';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.schemaService.openConfirm({
            title: 'Delete Table Row?',
            message: `Are you sure you want to delete "${crow.rowLabel || 'this row'}" from the table?`,
            confirmLabel: 'Delete',
            danger: true,
            onConfirm: () => {
              this.schemaService.deleteCustomRow(tableId, crow.rowKey);
            }
          });
        });
        wrap.appendChild(delBtn);

        actTd.appendChild(wrap);
      } else {
        const badge = document.createElement('span');
        badge.className = 'text-[10px] font-semibold text-slate-400';
        badge.textContent = crow.submittedByRole ? `Via ${crow.submittedByRole}` : 'Synced';
        actTd.appendChild(badge);
      }
      tr.appendChild(actTd);
    }

    return tr;
  }

  private computeContentRowKey(
    builtInTds: HTMLTableCellElement[],
    actionsColIndex: number,
    rowIdx: number
  ): string {
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

    if ((col.type === 'badge' || col.type === 'select') && val !== '—') {
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
      td.title = `Click to edit or remove "${col.label}"`;
      const hint = document.createElement('span');
      hint.setAttribute('data-scs-ignore-export', '1');
      hint.className =
        'ml-1.5 inline-block text-[9px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity';
      hint.textContent = 'Edit';
      td.appendChild(hint);

      td.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.schemaService.openCellEditor({
          tableId,
          tableTitle: this.schemaService.getSchema(tableId).customTitle || this.tableTitle() || tableId,
          rowKey,
          rowLabel,
          colId: col.id,
          colLabel: col.label,
          colType: col.type,
          colOptions: col.options,
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
    schema: SchoolTableSchema,
    hiddenCount: number,
    isOwner: boolean
  ): void {
    const mount = this.getChromeMountTarget(tableEl);
    if (!mount) return;

    if (!isOwner) {
      if (this.toolbarEl && this.toolbarEl.parentElement) {
        this.toolbarEl.parentElement.removeChild(this.toolbarEl);
        this.toolbarEl = null;
      }
      return;
    }

    const anchor =
      this.titleBannerEl && this.titleBannerEl.parentElement === mount.container
        ? this.titleBannerEl
        : mount.beforeEl;

    if (!this.toolbarEl) {
      this.toolbarEl = document.createElement('div');
      this.toolbarEl.setAttribute('data-scs-table-toolbar', tableId);
      this.toolbarEl.className = mount.externalScroll
        ? 'flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50/95 border-b border-slate-200/80 text-[11px]'
        : 'sticky left-0 z-10 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-50/95 border-b border-slate-200/80 text-[11px]';
      mount.container.insertBefore(this.toolbarEl, anchor);
    } else if (this.toolbarEl.parentElement !== mount.container) {
      mount.container.insertBefore(this.toolbarEl, anchor);
    }

    const title = schema.customTitle || this.tableTitle() || tableId.replace(/_/g, ' ');
    const visibleCount = Math.max(0, detectedHeaders.length - hiddenCount);
    const customCount = schema.customColumns.filter((c) => !c.scope || c.scope === 'table' || c.scope === 'both').length;
    const customRowCount = (schema.customRows || []).length;

    while (this.toolbarEl.firstChild) {
      this.toolbarEl.removeChild(this.toolbarEl.firstChild);
    }

    const left = document.createElement('div');
    left.className = 'flex items-center gap-2 flex-wrap';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'font-bold text-slate-800';
    titleSpan.textContent = title;
    left.appendChild(titleSpan);

    const statsSpan = document.createElement('span');
    statsSpan.className = 'text-[10px] font-semibold text-slate-500 tabular-nums';
    const customPart = customCount > 0 ? ` · +${customCount} custom` : '';
    const hiddenPart = hiddenCount > 0 ? ` · ${hiddenCount} hidden` : '';
    const rowPart = customRowCount > 0 ? ` · +${customRowCount} added rows` : '';
    statsSpan.textContent = `${visibleCount}/${detectedHeaders.length} cols${customPart}${hiddenPart}${rowPart}`;
    left.appendChild(statsSpan);

    const right = document.createElement('div');
    right.className = 'flex items-center gap-1.5 flex-wrap';

    const manageBtn = document.createElement('button');
    manageBtn.type = 'button';
    manageBtn.className =
      'px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs';
    manageBtn.textContent = 'Edit Table';
    manageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.schemaService.openColumnManager(tableId, title, detectedHeaders, 'columns');
    });
    right.appendChild(manageBtn);

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
