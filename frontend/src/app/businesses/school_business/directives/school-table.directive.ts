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
  readonly disableRowDetails = input<boolean>(false);
  readonly hideToolbarExports = input<boolean>(false);
  readonly hideToolbar = input<boolean>(false);

  readonly addRowClicked = output<string>();

  private observer: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private observedScrollHost: HTMLElement | null = null;
  private readonly detailViewports = new Set<HTMLElement>();
  private readonly boundDetailRows = new WeakSet<HTMLTableRowElement>();
  private expandedRowKey: string | null = null;
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
      const noDetails = this.disableRowDetails();
      const hideExports = this.hideToolbarExports();
      const hideToolbar = this.hideToolbar();
      this.schemaService.portalRole();
      this.schemaService.isOwner();
      this.schemaService.schemaRevision();
      this.schemaService.schemas();
      void title;
      void canAdd;
      void addLabel;
      void noDetails;
      void hideExports;
      void hideToolbar;
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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.observedScrollHost = null;
    this.detailViewports.clear();
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

      // Remove previously injected custom <th> headers and auto-injected Actions header
      Array.from(headerRow.children).forEach((child) => {
        const el = child as HTMLElement;
        if (el.hasAttribute('data-scs-custom-col') || el.hasAttribute('data-scs-auto-actions')) {
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
          (lower === 'actions' ||
            lower === 'action' ||
            lower === 'quick actions' ||
            lower === 'remove' ||
            lower === 'scope action' ||
            lower === 'focus' ||
            lower === 'manage')
        ) {
          actionsColIndex = idx;
        } else {
          detectedHeaders.push({ index: idx, originalLabel: origLabel || `Column ${idx + 1}` });
        }
      });

      this.schemaService.updateRegisteredHeaders(tableId, detectedHeaders);
      const enableRowQuickActions = !this.hideToolbar() && !this.hideToolbarExports();
      const needsAutoActionsCol = enableRowQuickActions && actionsColIndex === -1;

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

      if (needsAutoActionsCol) {
        const autoTh = document.createElement('th');
        autoTh.setAttribute('data-scs-auto-actions', '1');
        autoTh.className = `${nativeThClass} text-right whitespace-nowrap`;
        autoTh.textContent = 'Actions';
        headerRow.appendChild(autoTh);
      }

      // Align <tfoot> rows if an auto Actions column was added
      Array.from(tableEl.querySelectorAll('tfoot tr')).forEach((ftr) => {
        Array.from(ftr.children).forEach((child) => {
          if ((child as HTMLElement).hasAttribute('data-scs-auto-actions')) {
            ftr.removeChild(child);
          }
        });
        if (needsAutoActionsCol) {
          const blankTd = document.createElement('td');
          blankTd.setAttribute('data-scs-auto-actions', '1');
          blankTd.className = 'px-3 py-2';
          ftr.appendChild(blankTd);
        }
      });

      const effectiveTableTitle = (schema.customTitle || this.tableTitle() || tableId.replace(/_/g, ' ')).trim();

      // Update tbody rows
      this.detailViewports.clear();
      const tbodies = Array.from(tableEl.querySelectorAll('tbody'));
      tbodies.forEach((tbody, tbodyIdx) => {
        // Remove previously injected standalone custom rows & expanded row details
        Array.from(tbody.children).forEach((child) => {
          const el = child as HTMLElement;
          if (el.hasAttribute('data-scs-custom-row') || el.hasAttribute('data-scs-row-detail')) {
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
          // Remove previously injected custom <td> cells, auto Actions <td>, and inline quick actions
          Array.from(tr.children).forEach((child) => {
            const el = child as HTMLElement;
            if (el.hasAttribute('data-scs-custom-cell') || el.hasAttribute('data-scs-auto-actions')) {
              tr.removeChild(child);
            }
          });
          tr.querySelectorAll('[data-scs-row-quick-actions]').forEach((el) => el.remove());

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
              String(Math.max(1, visibleBuiltInCount + visibleCustomCount + (needsAutoActionsCol ? 1 : 0)))
            );
            return;
          }

          if (!firstBuiltInTr) firstBuiltInTr = tr;

          // Compute stable row key(s) BEFORE hiding cells
          const explicitKey = (tr.getAttribute('data-row-key') || '').trim();
          const contentKey = this.computeContentRowKey(builtInTds, actionsColIndex, rowIdx);
          const rowKey = explicitKey || contentKey;
          const rowLabel = this.computeRowLabel(builtInTds, actionsColIndex, rowKey);

          tr.setAttribute('data-scs-resolved-key', rowKey);
          tr.setAttribute('data-scs-resolved-label', rowLabel);
          this.syncRowDetailInteraction(tr, rowKey);

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

          // Inject universal per-row Details & Print quick actions into existing or auto-created Actions column
          if (enableRowQuickActions) {
            let targetActTd = actionsTd;
            const isAutoCell = !targetActTd;
            if (!targetActTd) {
              targetActTd = document.createElement('td');
              targetActTd.setAttribute('data-scs-auto-actions', '1');
              targetActTd.className = 'px-3.5 py-2.5 text-right whitespace-nowrap';
              tr.appendChild(targetActTd);
            }
            this.injectRowQuickActions(
              targetActTd,
              isAutoCell,
              tableId,
              effectiveTableTitle,
              headerRow as HTMLTableRowElement,
              tr,
              rowKey,
              rowLabel,
              actionsColIndex
            );
          }
        });

        if (tbodyIdx === 0) {
          this.schemaService.updateRegisteredRows(tableId, detectedRows);
        }

        // Inject standalone custom rows at chosen positions (Top / After Specific Row / Bottom)
        if (tbodyIdx === 0 && (schema.customRows || []).length > 0) {
          const buildRow = (crow: SchoolCustomRow) =>
            this.createStandaloneCustomRow(
              tableId,
              effectiveTableTitle,
              headerRow as HTMLTableRowElement,
              crow,
              orderedColumns,
              detectedHeaders,
              actionsColIndex,
              enableRowQuickActions,
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

        // Render inline expanded Row Details card beneath the clicked/Dossier-toggled row
        if (this.expandedRowKey) {
          const allTbodyRows = Array.from(tbody.children).filter(
            (el) =>
              el.tagName === 'TR' &&
              !el.hasAttribute('data-scs-row-detail') &&
              !el.querySelector('[data-scs-empty-row]')
          ) as HTMLTableRowElement[];
          const matchedTr = allTbodyRows.find(
            (r) => (r.getAttribute('data-scs-resolved-key') || '') === this.expandedRowKey
          );
          if (matchedTr) {
            const detailTr = this.createRowDetailTr(
              tableEl,
              tableId,
              headerRow as HTMLTableRowElement,
              matchedTr,
              actionsColIndex,
              schema
            );
            tbody.insertBefore(detailTr, matchedTr.nextSibling);
          }
        }
      });

      this.syncScrollHostResizeObserver(tableEl);

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
    effectiveTableTitle: string,
    headerRow: HTMLTableRowElement,
    crow: SchoolCustomRow,
    orderedColumns: OrderedTableColumn[],
    detectedHeaders: DetectedBuiltInHeader[],
    actionsColIndex: number,
    enableRowQuickActions: boolean,
    schema: SchoolTableSchema,
    isOwner: boolean
  ): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.setAttribute('data-scs-custom-row', crow.rowKey);
    tr.setAttribute('data-row-key', crow.rowKey);
    tr.setAttribute('data-scs-resolved-key', crow.rowKey);
    const resolvedLabel = crow.rowLabel || 'Custom Row';
    tr.setAttribute('data-scs-resolved-label', resolvedLabel);
    tr.className = 'hover:bg-slate-50/80 transition-colors';
    this.syncRowDetailInteraction(tr, crow.rowKey);

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
          resolvedLabel,
          savedVal,
          isOwner
        );
        tr.appendChild(td);
      }
    });

    if (actionsColIndex >= 0 || enableRowQuickActions) {
      const isAutoCell = actionsColIndex < 0;
      const actTd = document.createElement('td');
      if (isAutoCell) {
        actTd.setAttribute('data-scs-auto-actions', '1');
      }
      actTd.className = 'px-3.5 py-2.5 text-right whitespace-nowrap';
      const wrap = document.createElement('div');
      wrap.className = 'inline-flex items-center justify-end gap-1';

      if (actionsColIndex >= 0 && isOwner) {
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className =
          'px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] cursor-pointer';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.schemaService.openColumnManager(
            tableId,
            effectiveTableTitle,
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
            message: `Are you sure you want to delete "${resolvedLabel}" from the table?`,
            confirmLabel: 'Delete',
            danger: true,
            onConfirm: () => {
              this.schemaService.deleteCustomRow(tableId, crow.rowKey);
            }
          });
        });
        wrap.appendChild(delBtn);
      }

      actTd.appendChild(wrap);
      if (enableRowQuickActions) {
        this.injectRowQuickActions(
          actTd,
          isAutoCell,
          tableId,
          effectiveTableTitle,
          headerRow,
          tr,
          crow.rowKey,
          resolvedLabel,
          actionsColIndex
        );
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

  private createToolbarIcon(kind: 'csv' | 'table' | 'cards' | 'statement' | 'dossier' | 'qr', sizeClass = 'w-3.5 h-3.5'): SVGSVGElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('class', `${sizeClass} shrink-0`);

    const paths: string[] =
      kind === 'csv'
        ? ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']
        : kind === 'table' || kind === 'dossier'
          ? ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8']
          : kind === 'statement'
            ? ['M6 9V2h12v7', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 14h12v8H6z']
            : kind === 'qr'
              ? ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h3v3h-3z', 'M19 14h2v2h-2z', 'M14 19h2v2h-2z', 'M18 18h3v3h-3z']
              : ['M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M4 12h16', 'M12 4v16'];

    for (const d of paths) {
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    }
    return svg;
  }

  private extractSingleRowFields(
    headerRow: HTMLTableRowElement,
    sourceTr: HTMLTableRowElement,
    actionsColIndex: number
  ): {
    fields: Array<{ label: string; value: string; isCustom: boolean }>;
    headers: string[];
    values: string[];
  } {
    const headerCells = Array.from(headerRow.children) as HTMLElement[];
    const rowCells = Array.from(sourceTr.children) as HTMLElement[];
    const fields: Array<{ label: string; value: string; isCustom: boolean }> = [];
    const headers: string[] = [];
    const values: string[] = [];
    const pairCount = Math.min(headerCells.length, rowCells.length);

    for (let i = 0; i < pairCount; i++) {
      const th = headerCells[i];
      const td = rowCells[i];
      if (
        !th ||
        !td ||
        th.style.display === 'none' ||
        td.style.display === 'none' ||
        th.hasAttribute('data-scs-auto-actions') ||
        td.hasAttribute('data-scs-auto-actions')
      ) {
        continue;
      }

      const label = (th.textContent || '').replace(/\s+/g, ' ').trim();
      const lower = label.toLowerCase();
      if (
        (actionsColIndex >= 0 && i === actionsColIndex) ||
        lower === 'actions' ||
        lower === 'action' ||
        lower === 'quick actions' ||
        lower === 'remove' ||
        lower === 'scope action' ||
        lower === 'focus' ||
        lower === 'manage'
      ) {
        continue;
      }

      const inputEl = td.querySelector('input, select, textarea') as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | null;
      let value = '';
      if (inputEl) {
        if (inputEl instanceof HTMLSelectElement) {
          value = inputEl.options[inputEl.selectedIndex]?.text || inputEl.value || '';
        } else if (inputEl instanceof HTMLInputElement && inputEl.type === 'checkbox') {
          value = inputEl.checked ? 'Yes' : 'No';
        } else {
          value = inputEl.value || '';
        }
      }
      if (!value) {
        const clone = td.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('[data-scs-ignore-export]').forEach((n) => n.remove());
        value = (clone.textContent || '').replace(/\s+/g, ' ').trim();
      }

      const cleanLabel = label || `Field ${i + 1}`;
      const cleanValue = value || '—';
      fields.push({
        label: cleanLabel,
        value: cleanValue,
        isCustom: td.hasAttribute('data-scs-custom-cell')
      });
      headers.push(cleanLabel);
      values.push(cleanValue);
    }

    return { fields, headers, values };
  }

  private injectRowQuickActions(
    targetActTd: HTMLTableCellElement,
    isAutoCell: boolean,
    tableId: string,
    effectiveTableTitle: string,
    headerRow: HTMLTableRowElement,
    sourceTr: HTMLTableRowElement,
    rowKey: string,
    rowLabel: string,
    actionsColIndex: number
  ): void {
    const existingButtons = Array.from(targetActTd.querySelectorAll('button, a')) as HTMLElement[];
    const existingText = existingButtons
      .map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase())
      .join(' ');
    const existingTitles = existingButtons
      .map((b) => ((b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || '')).toLowerCase())
      .join(' ');

    const hasNativeDossier = /\b(dossier|details?)\b/.test(existingText) || /\b(dossier|detail)\b/.test(existingTitles);
    const hasNativeQr = /\bid\s*card\b/.test(existingText) || /\b(id\s*card|qr)\b/.test(existingTitles);
    const hasNativePrintSlip =
      /\b(print|receipt|challan|slip)\b/.test(existingText) ||
      /salary\s*slip|fee\s*challan|fee\s*receipt|3-copy\s*bank\s*challan|cashiering\s*receipt/.test(existingTitles);

    if (hasNativeDossier && hasNativeQr && hasNativePrintSlip) return;

    const isExpanded = this.expandedRowKey === rowKey;

    const quickBar = document.createElement('div');
    quickBar.setAttribute('data-scs-row-quick-actions', '1');
    quickBar.setAttribute('data-scs-ignore-export', '1');
    quickBar.setAttribute('data-scs-ignore-detail', '1');
    quickBar.className = 'inline-flex items-center justify-end gap-1 align-middle whitespace-nowrap';

    if (!hasNativeDossier) {
      const dossierBtn = document.createElement('button');
      dossierBtn.type = 'button';
      dossierBtn.title = isExpanded ? 'Hide Record Dossier & Details' : 'View Full Record Dossier & Details';
      dossierBtn.className = isExpanded
        ? 'px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-black text-[10px] inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs'
        : 'px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[10px] inline-flex items-center gap-1 cursor-pointer transition-colors';
      dossierBtn.appendChild(this.createToolbarIcon('dossier', 'w-3 h-3'));
      const dTxt = document.createElement('span');
      dTxt.textContent = isExpanded ? 'Hide' : 'Dossier';
      dossierBtn.appendChild(dTxt);
      dossierBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.expandedRowKey = this.expandedRowKey === rowKey ? null : rowKey;
        this.scheduleApply();
      });
      quickBar.appendChild(dossierBtn);
    }

    if (!hasNativeQr) {
      const qrBtn = document.createElement('button');
      qrBtn.type = 'button';
      qrBtn.title = 'View QR Verification & Digital Record Card';
      qrBtn.className =
        'p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 cursor-pointer inline-flex items-center justify-center transition-colors';
      qrBtn.appendChild(this.createToolbarIcon('qr', 'w-3.5 h-3.5'));
      qrBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const extracted = this.extractSingleRowFields(headerRow, sourceTr, actionsColIndex);
        if (extracted.headers.length === 0) return;
        this.schemaService.openSingleRecordStatement({
          tableId,
          tableTitle: effectiveTableTitle,
          recordLabel: rowLabel,
          headers: extracted.headers,
          values: extracted.values,
          initialFormat: 'card'
        });
      });
      quickBar.appendChild(qrBtn);
    }

    if (!hasNativePrintSlip) {
      const printBtn = document.createElement('button');
      printBtn.type = 'button';
      printBtn.title = 'Print Record Slip (A4 / 80mm & 58mm Rasheed / PDF / WhatsApp)';
      printBtn.className =
        'p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer inline-flex items-center justify-center transition-colors';
      printBtn.appendChild(this.createToolbarIcon('statement', 'w-3.5 h-3.5'));
      printBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const extracted = this.extractSingleRowFields(headerRow, sourceTr, actionsColIndex);
        if (extracted.headers.length === 0) return;
        this.schemaService.openSingleRecordStatement({
          tableId,
          tableTitle: effectiveTableTitle,
          recordLabel: rowLabel,
          headers: extracted.headers,
          values: extracted.values,
          initialFormat: 'a4'
        });
      });
      quickBar.appendChild(printBtn);
    }

    const innerFlex = !isAutoCell
      ? (Array.from(targetActTd.children).find(
          (c) => c.tagName === 'DIV' && /flex/.test((c as HTMLElement).className)
        ) as HTMLElement | undefined)
      : undefined;

    if (innerFlex) {
      innerFlex.appendChild(quickBar);
    } else {
      if (!isAutoCell && targetActTd.children.length > 0) {
        quickBar.classList.add('ml-1');
      }
      targetActTd.appendChild(quickBar);
    }
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

    const showExports = !this.hideToolbarExports();
    const showAddBtn = isOwner && this.canAddRow();

    if (this.hideToolbar() || (!isOwner && !showExports && !showAddBtn)) {
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
    const detailPart = !this.disableRowDetails() ? ' · Click row for Details' : '';
    if (isOwner) {
      const customPart = customCount > 0 ? ` · +${customCount} custom` : '';
      const hiddenPart = hiddenCount > 0 ? ` · ${hiddenCount} hidden` : '';
      const rowPart = customRowCount > 0 ? ` · +${customRowCount} added rows` : '';
      statsSpan.textContent = `${visibleCount}/${detectedHeaders.length} cols${customPart}${hiddenPart}${rowPart}${detailPart}`;
    } else {
      const dataRowCount = Array.from(tableEl.querySelectorAll('tbody tr')).filter(
        (tr) => !tr.hasAttribute('data-scs-row-detail') && !tr.querySelector('[data-scs-empty-row]') && !(tr.children.length === 1 && tr.children[0].hasAttribute('colspan'))
      ).length;
      statsSpan.textContent = `${dataRowCount} record${dataRowCount === 1 ? '' : 's'}${detailPart}`;
    }
    left.appendChild(statsSpan);

    const right = document.createElement('div');
    right.className = 'flex items-center gap-1.5 flex-wrap';

    if (showExports) {
      const statementBtn = document.createElement('button');
      statementBtn.type = 'button';
      statementBtn.className =
        'px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] inline-flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap';
      statementBtn.title = 'Search, filter by date range, view & print (A4 / 80mm / 58mm Rasheed / PDF / WhatsApp)';
      statementBtn.appendChild(this.createToolbarIcon('statement'));
      const stmtTxt = document.createElement('span');
      stmtTxt.textContent = 'Statement & Print';
      statementBtn.appendChild(stmtTxt);
      statementBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.schemaService.openStatementModal(tableId, title);
      });
      right.appendChild(statementBtn);

      const csvBtn = document.createElement('button');
      csvBtn.type = 'button';
      csvBtn.className =
        'px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap';
      csvBtn.title = 'Download visible table records as CSV';
      csvBtn.appendChild(this.createToolbarIcon('csv'));
      const csvTxt = document.createElement('span');
      csvTxt.textContent = 'Download CSV';
      csvBtn.appendChild(csvTxt);
      csvBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.schemaService.exportTableCsv(tableId, title);
      });
      right.appendChild(csvBtn);

      const tablePdfBtn = document.createElement('button');
      tablePdfBtn.type = 'button';
      tablePdfBtn.className =
        'px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap';
      tablePdfBtn.title = 'Download Row & Column Table PDF';
      tablePdfBtn.appendChild(this.createToolbarIcon('table'));
      const tablePdfTxt = document.createElement('span');
      tablePdfTxt.textContent = 'Table PDF';
      tablePdfBtn.appendChild(tablePdfTxt);
      tablePdfBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.schemaService.exportTablePdf(tableId, title);
      });
      right.appendChild(tablePdfBtn);

      const cardsPdfBtn = document.createElement('button');
      cardsPdfBtn.type = 'button';
      cardsPdfBtn.className =
        'px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap';
      cardsPdfBtn.title = 'Download Card / Widget-Wise PDF';
      cardsPdfBtn.appendChild(this.createToolbarIcon('cards'));
      const cardsPdfTxt = document.createElement('span');
      cardsPdfTxt.textContent = 'Cards PDF';
      cardsPdfBtn.appendChild(cardsPdfTxt);
      cardsPdfBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.schemaService.exportTableCardsPdf(tableId, title);
      });
      right.appendChild(cardsPdfBtn);
    }

    if (showAddBtn) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className =
        'px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] cursor-pointer transition-colors shadow-2xs whitespace-nowrap';
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

  private syncRowDetailInteraction(tr: HTMLTableRowElement, rowKey: string): void {
    if (this.disableRowDetails()) return;

    tr.classList.add('cursor-pointer', 'hover:bg-indigo-50/40', 'transition-colors');
    if (!tr.title) {
      tr.title = 'Click row for quick Details';
    }
    tr.classList.toggle('bg-indigo-50/40', this.expandedRowKey === rowKey);

    if (!this.boundDetailRows.has(tr)) {
      this.boundDetailRows.add(tr);
      tr.addEventListener('click', (ev: MouseEvent) => {
        if (this.disableRowDetails()) return;
        const target = ev.target as HTMLElement | null;
        if (!target) return;
        if (target.closest('button, a, input, select, textarea, label, [data-scs-ignore-detail]')) {
          return;
        }
        if (this.schemaService.isOwner() && target.closest('[data-scs-custom-cell]')) {
          return;
        }
        const key = (tr.getAttribute('data-scs-resolved-key') || '').trim();
        if (!key) return;
        this.expandedRowKey = this.expandedRowKey === key ? null : key;
        this.scheduleApply();
      });
    }
  }

  private createRowDetailTr(
    tableEl: HTMLTableElement,
    tableId: string,
    headerRow: HTMLTableRowElement,
    sourceTr: HTMLTableRowElement,
    actionsColIndex: number,
    schema: SchoolTableSchema
  ): HTMLTableRowElement {
    const headerCells = Array.from(headerRow.children) as HTMLElement[];
    const totalVisibleCols = Math.max(1, headerCells.filter((h) => h.style.display !== 'none').length);
    const extracted = this.extractSingleRowFields(headerRow, sourceTr, actionsColIndex);
    const fields = extracted.fields;

    const detailTr = document.createElement('tr');
    detailTr.setAttribute('data-scs-row-detail', '1');
    detailTr.className = 'bg-slate-50/90 border-b border-indigo-200/80';

    const detailTd = document.createElement('td');
    detailTd.setAttribute('colspan', String(totalVisibleCols));
    detailTd.className = 'p-0';

    const viewportWrap = document.createElement('div');
    viewportWrap.setAttribute('data-scs-detail-viewport', '1');
    viewportWrap.className = 'sticky left-0 box-border p-3 sm:p-4';
    this.detailViewports.add(viewportWrap);
    this.applyDetailViewportWidth(tableEl, viewportWrap);

    const card = document.createElement('div');
    card.className =
      'rounded-2xl bg-gradient-to-b from-white via-white to-indigo-50/35 border border-slate-200/90 shadow-sm p-3.5 sm:p-4 space-y-3';

    const head = document.createElement('div');
    head.className = 'flex items-center justify-between gap-3 flex-wrap pb-2.5 border-b border-slate-100';

    const headLeft = document.createElement('div');
    headLeft.className = 'flex items-center gap-2 min-w-0 flex-wrap';

    const rowLabel = (sourceTr.getAttribute('data-scs-resolved-label') || 'Row Details').trim();
    const resolvedTableTitle = (schema.customTitle || this.tableTitle() || tableId.replace(/_/g, ' ')).trim();
    const titleEl = document.createElement('span');
    titleEl.className = 'text-sm font-black text-slate-900 truncate max-w-[260px] sm:max-w-md';
    titleEl.textContent = rowLabel;
    headLeft.appendChild(titleEl);

    const tableBadge = document.createElement('span');
    tableBadge.className =
      'px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200/80 shrink-0';
    tableBadge.textContent = resolvedTableTitle;
    headLeft.appendChild(tableBadge);

    const countBadge = document.createElement('span');
    countBadge.className = 'text-[11px] font-semibold text-slate-500 tabular-nums shrink-0';
    countBadge.textContent = `${fields.length} Fields`;
    headLeft.appendChild(countBadge);

    head.appendChild(headLeft);

    const headRight = document.createElement('div');
    headRight.className = 'flex items-center gap-2 shrink-0 flex-wrap';

    const printSlipBtn = document.createElement('button');
    printSlipBtn.type = 'button';
    printSlipBtn.className =
      'px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-2xs';
    printSlipBtn.appendChild(this.createToolbarIcon('statement', 'w-3.5 h-3.5'));
    const printTxt = document.createElement('span');
    printTxt.textContent = 'Print / Rasheed';
    printSlipBtn.appendChild(printTxt);
    printSlipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.schemaService.openSingleRecordStatement({
        tableId,
        tableTitle: resolvedTableTitle,
        recordLabel: rowLabel,
        headers: extracted.headers,
        values: extracted.values
      });
    });
    headRight.appendChild(printSlipBtn);

    const hideBtn = document.createElement('button');
    hideBtn.type = 'button';
    hideBtn.className =
      'px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer shrink-0 transition-colors';
    hideBtn.textContent = 'Hide Details';
    hideBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.expandedRowKey = null;
      this.scheduleApply();
    });
    headRight.appendChild(hideBtn);

    head.appendChild(headRight);

    card.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs';

    for (const f of fields) {
      const box = document.createElement('div');
      box.className = f.isCustom
        ? 'p-2.5 rounded-xl bg-indigo-50/45 border border-indigo-200/80 flex flex-col gap-0.5 min-w-0'
        : 'p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/75 flex flex-col gap-0.5 min-w-0';

      const lbl = document.createElement('span');
      lbl.className = 'text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate';
      lbl.textContent = f.label;
      box.appendChild(lbl);

      const val = document.createElement('span');
      val.className = 'font-bold text-slate-800 break-words whitespace-normal leading-snug';
      val.textContent = f.value;
      box.appendChild(val);

      grid.appendChild(box);
    }

    card.appendChild(grid);
    viewportWrap.appendChild(card);
    detailTd.appendChild(viewportWrap);
    detailTr.appendChild(detailTd);
    return detailTr;
  }

  private applyDetailViewportWidth(tableEl: HTMLTableElement, viewportEl: HTMLElement): void {
    const scrollHost = tableEl.parentElement;
    if (scrollHost && scrollHost.clientWidth > 0) {
      const w = Math.max(240, scrollHost.clientWidth - 2);
      viewportEl.style.width = `${w}px`;
      viewportEl.style.maxWidth = `${w}px`;
    } else {
      viewportEl.style.width = '100%';
      viewportEl.style.maxWidth = '100%';
    }
  }

  private syncScrollHostResizeObserver(tableEl: HTMLTableElement): void {
    const scrollHost = tableEl.parentElement;
    if (!scrollHost || typeof ResizeObserver === 'undefined') return;
    if (this.observedScrollHost === scrollHost && this.resizeObserver) return;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.observedScrollHost = scrollHost;
    this.resizeObserver = new ResizeObserver(() => {
      this.detailViewports.forEach((vp) => this.applyDetailViewportWidth(tableEl, vp));
    });
    this.resizeObserver.observe(scrollHost);
  }
}
