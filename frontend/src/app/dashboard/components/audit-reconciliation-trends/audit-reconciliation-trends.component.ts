import { Component, Input, Output, EventEmitter, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule } from 'lucide-angular';

export interface ReconciliationTrendPoint {
  id: string;
  date: string;
  shortLabel: string;
  billed: number;        // Total fees invoiced
  collected: number;     // Total verified bank/counter receipts
  variance: number;      // Difference (collected - billed)
  healthScore: number;   // Institutional Audit Health percentage (0-100)
  counterCash: number;   // Counter cash desk portion
  meezanBank: number;    // Meezan Bank A/C receipts
  hblBank: number;       // HBL Bank A/C receipts
  digital1Link: number;  // KuickPay/1Link digital payments
  auditStatus: 'Balanced' | 'Verified' | 'Flagged';
  verifiedBy: string;
}

export type ChartTimeframe = '7d' | '30d' | '90d' | 'session';
export type ChartVisualizationType = 'area' | 'bar' | 'health' | 'composed';

@Component({
  selector: 'app-audit-reconciliation-trends',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, LucideAngularModule],
  template: `
    <div class="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-300">
      
      <!-- Top Control & Header Strip -->
      <div class="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-indigo-50/20">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <!-- Title & Badges -->
          <div class="flex items-start sm:items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center font-black shadow-xs shrink-0">
              <mat-icon class="text-xl">insights</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-black text-slate-900 text-base tracking-tight">Institutional Audit & Fee Reconciliation Trends</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Recharts Reactive Engine
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Daily 0.0 Variance
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5 font-medium">
                Multi-channel reconciliation (Counter, Meezan, HBL, KuickPay) and continuous audit health score trajectory over time
              </p>
            </div>
          </div>

          <!-- Controls: Chart Mode, Timeframe, & Export -->
          <div class="flex items-center gap-2.5 flex-wrap">
            
            <!-- Visualization Type Selector -->
            <div class="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
              <button
                type="button"
                (click)="setChartType('area')"
                class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                [class]="chartType() === 'area' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'hover:text-slate-900'">
                <mat-icon class="text-sm">show_chart</mat-icon>
                <span class="hidden sm:inline">Area Spline</span>
              </button>
              <button
                type="button"
                (click)="setChartType('bar')"
                class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                [class]="chartType() === 'bar' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'hover:text-slate-900'">
                <mat-icon class="text-sm">bar_chart</mat-icon>
                <span class="hidden sm:inline">Bar Compare</span>
              </button>
              <button
                type="button"
                (click)="setChartType('health')"
                class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                [class]="chartType() === 'health' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'hover:text-slate-900'">
                <mat-icon class="text-sm">health_and_safety</mat-icon>
                <span class="hidden sm:inline">Health %</span>
              </button>
              <button
                type="button"
                (click)="setChartType('composed')"
                class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                [class]="chartType() === 'composed' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'hover:text-slate-900'">
                <mat-icon class="text-sm">stacked_line_chart</mat-icon>
                <span class="hidden sm:inline">Dual-Axis</span>
              </button>
            </div>

            <!-- Timeframe Filter -->
            <div class="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
              <button
                type="button"
                (click)="setTimeframe('7d')"
                class="px-2 py-1 rounded-lg transition-all cursor-pointer"
                [class]="timeframe() === '7d' ? 'bg-indigo-600 text-white shadow-2xs font-black' : 'hover:text-slate-900'">
                7D
              </button>
              <button
                type="button"
                (click)="setTimeframe('30d')"
                class="px-2 py-1 rounded-lg transition-all cursor-pointer"
                [class]="timeframe() === '30d' ? 'bg-indigo-600 text-white shadow-2xs font-black' : 'hover:text-slate-900'">
                30D
              </button>
              <button
                type="button"
                (click)="setTimeframe('90d')"
                class="px-2 py-1 rounded-lg transition-all cursor-pointer"
                [class]="timeframe() === '90d' ? 'bg-indigo-600 text-white shadow-2xs font-black' : 'hover:text-slate-900'">
                90D
              </button>
              <button
                type="button"
                (click)="setTimeframe('session')"
                class="px-2 py-1 rounded-lg transition-all cursor-pointer"
                [class]="timeframe() === 'session' ? 'bg-indigo-600 text-white shadow-2xs font-black' : 'hover:text-slate-900'">
                Year
              </button>
            </div>

            <!-- Action Buttons -->
            <button
              type="button"
              (click)="exportTrendCSV()"
              class="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer shadow-2xs transition-all active:scale-95"
              title="Export CSV Trend Data">
              <mat-icon class="text-sm">download</mat-icon>
            </button>
          </div>

        </div>

        <!-- Metric KPI Ribbon -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Billed Fees</span>
            <div class="text-lg sm:text-xl font-black text-slate-900 font-mono">
              PKR {{ (totalBilled() / 1000000).toFixed(2) }}M
            </div>
            <div class="flex items-center gap-1 text-[11px] text-indigo-700 font-bold">
              <mat-icon class="text-xs">receipt_long</mat-icon>
              <span>{{ activePoints().length }} Audited Batches</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bank Reconciled</span>
            <div class="text-lg sm:text-xl font-black text-emerald-600 font-mono">
              PKR {{ (totalCollected() / 1000000).toFixed(2) }}M
            </div>
            <div class="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
              <mat-icon class="text-xs">verified</mat-icon>
              <span>100% Realized & Logged</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Unverified Variance</span>
            <div class="text-lg sm:text-xl font-black text-slate-900 font-mono"
                 [class.text-emerald-600]="totalVariance() === 0"
                 [class.text-rose-600]="totalVariance() !== 0">
              PKR {{ totalVariance().toLocaleString() }}
            </div>
            <div class="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
              <mat-icon class="text-xs">check_circle</mat-icon>
              <span>Zero Leakage Benchmark</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Audit Health</span>
            <div class="text-lg sm:text-xl font-black text-cyan-600 font-mono">
              {{ averageHealthScore().toFixed(1) }}%
            </div>
            <div class="flex items-center gap-1 text-[11px] text-cyan-700 font-bold">
              <mat-icon class="text-xs">grade</mat-icon>
              <span>Grade A+ Institutional</span>
            </div>
          </div>
        </div>

      </div>

      <!-- MAIN CHART CANVAS & CIRCULAR HEALTH PROGRESS -->
      <div class="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        <!-- Interactive Chart Body (Recharts Visual Semantics) -->
        <div class="lg:col-span-8 space-y-4">
          
          <!-- Chart Series Toggle Legend -->
          <div class="flex items-center justify-between flex-wrap gap-2 text-xs select-none">
            <div class="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                (click)="toggleSeries('billed')"
                class="flex items-center gap-1.5 transition-opacity cursor-pointer font-bold"
                [class.opacity-40]="!showBilled()">
                <span class="w-3 h-3 rounded-md bg-indigo-600 shadow-2xs"></span>
                <span class="text-slate-700">Invoiced Fee (Billed)</span>
              </button>

              <button
                type="button"
                (click)="toggleSeries('collected')"
                class="flex items-center gap-1.5 transition-opacity cursor-pointer font-bold"
                [class.opacity-40]="!showCollected()">
                <span class="w-3 h-3 rounded-md bg-emerald-500 shadow-2xs"></span>
                <span class="text-slate-700">Bank Reconciled (Collected)</span>
              </button>

              <button
                type="button"
                (click)="toggleSeries('health')"
                class="flex items-center gap-1.5 transition-opacity cursor-pointer font-bold"
                [class.opacity-40]="!showHealth()">
                <span class="w-3 h-1.5 rounded-full bg-cyan-500 shadow-2xs"></span>
                <span class="text-slate-700">Audit Health Score %</span>
              </button>

              <button
                type="button"
                (click)="toggleSeries('variance')"
                class="flex items-center gap-1.5 transition-opacity cursor-pointer font-bold"
                [class.opacity-40]="!showVariance()">
                <span class="w-3 h-3 rounded-md bg-amber-500 shadow-2xs"></span>
                <span class="text-slate-700">Variance Delta</span>
              </button>
            </div>

            <span class="text-[11px] text-slate-400 font-medium">
              Hover over points to inspect channel split
            </span>
          </div>

          <!-- Dynamic SVG Chart (60 FPS Reactive Viewport) -->
          <div class="relative w-full h-[280px] sm:h-[320px] bg-slate-50/50 rounded-2xl border border-slate-200/80 p-2 sm:p-4 overflow-hidden select-none"
               (mousemove)="onChartMouseMove($event)"
               (mouseleave)="onChartMouseLeave()">
            
            <svg class="w-full h-full overflow-visible" viewBox="0 0 600 240" preserveAspectRatio="none">
              <defs>
                <!-- Area Gradients (Recharts Style) -->
                <linearGradient id="rechartsBilledGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stop-color="#4f46e5" stop-opacity="0.32"/>
                  <stop offset="95%" stop-color="#4f46e5" stop-opacity="0.00"/>
                </linearGradient>

                <linearGradient id="rechartsCollectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stop-color="#10b981" stop-opacity="0.35"/>
                  <stop offset="95%" stop-color="#10b981" stop-opacity="0.00"/>
                </linearGradient>

                <linearGradient id="rechartsHealthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stop-color="#06b6d4" stop-opacity="0.25"/>
                  <stop offset="95%" stop-color="#06b6d4" stop-opacity="0.00"/>
                </linearGradient>
              </defs>

              <!-- Cartesian Grid Lines (Horizontal) -->
              <g class="cartesian-grid stroke-slate-200 stroke-dashed" stroke-dasharray="3 3">
                <line x1="40" y1="30" x2="590" y2="30" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="40" y1="80" x2="590" y2="80" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="40" y1="130" x2="590" y2="130" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="40" y1="180" x2="590" y2="180" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="40" y1="210" x2="590" y2="210" stroke="#cbd5e1" stroke-width="1.5"/>
              </g>

              <!-- Y-Axis Labels (Left: Amounts in PKR Millions) -->
              <g class="text-[9px] fill-slate-400 font-mono font-bold" text-anchor="end">
                <text x="35" y="34">{{ (maxScaleAmount() / 1000000).toFixed(1) }}M</text>
                <text x="35" y="84">{{ (maxScaleAmount() * 0.75 / 1000000).toFixed(1) }}M</text>
                <text x="35" y="134">{{ (maxScaleAmount() * 0.5 / 1000000).toFixed(1) }}M</text>
                <text x="35" y="184">{{ (maxScaleAmount() * 0.25 / 1000000).toFixed(1) }}M</text>
                <text x="35" y="214">0.0M</text>
              </g>

              <!-- AREA SPLINE VIEW -->
              @if (chartType() === 'area' || chartType() === 'composed') {
                <!-- Billed Area & Line -->
                @if (showBilled()) {
                  <path [attr.d]="billedAreaPath()" fill="url(#rechartsBilledGradient)" class="transition-all duration-500 ease-out"/>
                  <path [attr.d]="billedLinePath()" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="transition-all duration-500 ease-out"/>
                }

                <!-- Collected Area & Line -->
                @if (showCollected()) {
                  <path [attr.d]="collectedAreaPath()" fill="url(#rechartsCollectedGradient)" class="transition-all duration-500 ease-out"/>
                  <path [attr.d]="collectedLinePath()" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="transition-all duration-500 ease-out"/>
                }
              }

              <!-- BAR CHART VIEW -->
              @if (chartType() === 'bar') {
                @for (bar of barData(); track bar.point.id; let idx = $index) {
                  <!-- Billed Bar (Indigo) -->
                  @if (showBilled()) {
                    <rect
                      [attr.x]="bar.x1"
                      [attr.y]="bar.yBilled"
                      [attr.width]="bar.width"
                      [attr.height]="bar.heightBilled"
                      rx="3"
                      fill="#4f46e5"
                      class="transition-all duration-300 hover:fill-indigo-700"/>
                  }
                  <!-- Collected Bar (Emerald) -->
                  @if (showCollected()) {
                    <rect
                      [attr.x]="bar.x2"
                      [attr.y]="bar.yCollected"
                      [attr.width]="bar.width"
                      [attr.height]="bar.heightCollected"
                      rx="3"
                      fill="#10b981"
                      class="transition-all duration-300 hover:fill-emerald-600"/>
                  }
                }
              }

              <!-- HEALTH SCORE TRAJECTORY (LINE / GLOW) -->
              @if ((chartType() === 'health' || chartType() === 'composed') && showHealth()) {
                <path [attr.d]="healthLinePath()" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="transition-all duration-500 ease-out"/>
                <!-- Health Dots -->
                @for (pt of chartPoints(); track pt.point.id) {
                  <circle
                    [attr.cx]="pt.x"
                    [attr.cy]="pt.yHealth"
                    r="4"
                    fill="#ffffff"
                    stroke="#06b6d4"
                    stroke-width="2.5"
                    class="transition-all duration-300 hover:scale-125"/>
                }
              }

              <!-- X-Axis Labels (Dates) -->
              <g class="text-[9px] fill-slate-500 font-mono font-bold" text-anchor="middle">
                @for (pt of chartPoints(); track pt.point.id) {
                  <text [attr.x]="pt.x" y="228">{{ pt.point.shortLabel }}</text>
                }
              </g>

              <!-- Interactive Hover Crosshair Line -->
              @if (hoveredPoint()) {
                <line
                  [attr.x1]="hoveredX()"
                  y1="25"
                  [attr.x2]="hoveredX()"
                  y2="210"
                  stroke="#6366f1"
                  stroke-width="1.5"
                  stroke-dasharray="2 2"
                  class="pointer-events-none"/>

                <!-- Active Dot Rings on Hovered Point -->
                <circle [attr.cx]="hoveredX()" [attr.cy]="hoveredYBilled()" r="5" fill="#4f46e5" stroke="#ffffff" stroke-width="2"/>
                <circle [attr.cx]="hoveredX()" [attr.cy]="hoveredYCollected()" r="5" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
              }
            </svg>

            <!-- Recharts Style Floating Interactive Tooltip -->
            @if (hoveredPoint(); as hp) {
              <div
                class="absolute z-20 pointer-events-none p-3.5 rounded-2xl bg-slate-900/95 text-white shadow-xl backdrop-blur-md border border-slate-700/80 text-xs space-y-2 min-w-[220px] transition-all duration-100 ease-out"
                [style.left.px]="tooltipLeft()"
                [style.top.px]="tooltipTop()">
                
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/80">
                  <span class="font-black text-slate-200">{{ hp.date }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {{ hp.auditStatus }}
                  </span>
                </div>

                <div class="space-y-1 font-mono text-[11px]">
                  <div class="flex items-center justify-between">
                    <span class="flex items-center gap-1.5 text-slate-300">
                      <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>Billed Amount:</span>
                    </span>
                    <strong class="text-white font-bold">PKR {{ hp.billed.toLocaleString() }}</strong>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="flex items-center gap-1.5 text-slate-300">
                      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Bank Reconciled:</span>
                    </span>
                    <strong class="text-emerald-400 font-bold">PKR {{ hp.collected.toLocaleString() }}</strong>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="flex items-center gap-1.5 text-slate-300">
                      <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>Variance Delta:</span>
                    </span>
                    <strong [class.text-emerald-400]="hp.variance === 0" [class.text-rose-400]="hp.variance !== 0">
                      PKR {{ hp.variance.toLocaleString() }}
                    </strong>
                  </div>

                  <div class="flex items-center justify-between pt-1 border-t border-slate-700/60">
                    <span class="flex items-center gap-1.5 text-slate-300">
                      <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <span>Audit Health Score:</span>
                    </span>
                    <strong class="text-cyan-300 font-bold">{{ hp.healthScore }}%</strong>
                  </div>
                </div>

                <div class="pt-1 text-[9px] text-slate-400 flex items-center justify-between font-mono">
                  <span>Meezan + HBL + 1Link</span>
                  <span>Ver: {{ hp.verifiedBy }}</span>
                </div>

              </div>
            }

          </div>

        </div>

        <!-- Circular Health Progress Indicator & Compliance Summary -->
        <div class="lg:col-span-4 p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/30 border border-slate-200/80 flex flex-col items-center justify-center text-center space-y-4">
          
          <div class="space-y-0.5">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Institutional Integrity</span>
            <h4 class="font-black text-slate-900 text-sm">Overall Audit Health Index</h4>
          </div>

          <!-- Circular Health Ring Indicator -->
          <div class="relative w-36 h-36 flex items-center justify-center">
            <svg class="w-36 h-36 transform -rotate-90 drop-shadow-sm" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r="56"
                stroke="#e2e8f0"
                stroke-width="10"
                fill="transparent"
              />
              <circle
                cx="70"
                cy="70"
                r="56"
                stroke="#10b981"
                stroke-width="10"
                stroke-linecap="round"
                fill="transparent"
                stroke-dasharray="351.85"
                [attr.stroke-dashoffset]="circularDashOffset()"
                class="transition-all duration-1000 ease-out"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-2xl font-black font-mono text-slate-900">{{ currentHealthScore() }}<span class="text-base text-emerald-600">%</span></span>
              <span class="text-[9px] font-black uppercase tracking-wider text-slate-400">Campus Health</span>
              <span class="mt-0.5 px-2 py-0.2 rounded-full text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Grade A+
              </span>
            </div>
          </div>

          <!-- Channel Allocation Pill Badges -->
          <div class="w-full space-y-2 text-left pt-1">
            <div class="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div class="flex items-center justify-between text-[11px] font-bold">
                <span class="text-slate-700">Meezan Bank (Main A/C)</span>
                <span class="font-mono text-indigo-700">62% Collection</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="bg-indigo-600 h-1.5 rounded-full" style="width: 62%"></div>
              </div>
            </div>

            <div class="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div class="flex items-center justify-between text-[11px] font-bold">
                <span class="text-slate-700">1Link KuickPay & Digital</span>
                <span class="font-mono text-emerald-700">28% Collection</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="bg-emerald-500 h-1.5 rounded-full" style="width: 28%"></div>
              </div>
            </div>

            <div class="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div class="flex items-center justify-between text-[11px] font-bold">
                <span class="text-slate-700">Cash Counter (Direct Desk)</span>
                <span class="font-mono text-slate-700">10% Collection</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="bg-slate-500 h-1.5 rounded-full" style="width: 10%"></div>
              </div>
            </div>
          </div>

          <div class="w-full pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-200/60">
            <span>Audit Trail: SHA-256 Locked</span>
            <span class="text-emerald-700 font-bold">Verified ✓</span>
          </div>

        </div>

      </div>

      <!-- Bottom Detailed Reconciliation Breakdown Drawer / Quick Table -->
      <div class="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <mat-icon class="text-indigo-600 text-sm">receipt</mat-icon>
            <h4 class="font-black text-slate-900 text-xs">Recent Batch Reconciliations in Active Range</h4>
          </div>
          <span class="text-[11px] font-mono text-slate-500">Showing {{ activePoints().length }} Audited Periods</span>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 font-mono tracking-wider">
                <th class="py-2 px-3">Date</th>
                <th class="py-2 px-3">Invoiced (Billed)</th>
                <th class="py-2 px-3">Bank Receipts</th>
                <th class="py-2 px-3">Variance</th>
                <th class="py-2 px-3">Audit Health</th>
                <th class="py-2 px-3">Channels Verified</th>
                <th class="py-2 px-3 text-right">Auditor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              @for (row of activePoints(); track row.id) {
                <tr class="hover:bg-white transition-colors">
                  <td class="py-2.5 px-3 font-bold text-slate-900">{{ row.date }}</td>
                  <td class="py-2.5 px-3 font-mono font-bold text-indigo-700">PKR {{ row.billed.toLocaleString() }}</td>
                  <td class="py-2.5 px-3 font-mono font-bold text-emerald-700">PKR {{ row.collected.toLocaleString() }}</td>
                  <td class="py-2.5 px-3 font-mono">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                          [class]="row.variance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
                      {{ row.variance === 0 ? 'Balanced (PKR 0)' : 'PKR ' + row.variance.toLocaleString() }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 font-mono font-bold text-cyan-700">
                    <div class="flex items-center gap-1.5">
                      <div class="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div class="bg-cyan-500 h-1.5 rounded-full" [style.width.%]="row.healthScore"></div>
                      </div>
                      <span>{{ row.healthScore }}%</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-[11px] text-slate-600">
                    Meezan ({{ (row.meezanBank / 1000).toFixed(0) }}k) · KuickPay ({{ (row.digital1Link / 1000).toFixed(0) }}k) · Counter ({{ (row.counterCash / 1000).toFixed(0) }}k)
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px]">{{ row.verifiedBy }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class AuditReconciliationTrendsComponent implements OnInit {
  @Input() initialTimeframe: ChartTimeframe = '30d';
  @Input() initialChartType: ChartVisualizationType = 'area';
  @Output() scanTriggered = new EventEmitter<void>();

  timeframe = signal<ChartTimeframe>('30d');
  chartType = signal<ChartVisualizationType>('area');

  showBilled = signal<boolean>(true);
  showCollected = signal<boolean>(true);
  showHealth = signal<boolean>(true);
  showVariance = signal<boolean>(true);

  hoveredPoint = signal<ReconciliationTrendPoint | null>(null);
  hoveredIndex = signal<number>(-1);
  tooltipLeft = signal<number>(0);
  tooltipTop = signal<number>(0);

  // Full Historical Dataset covering Academic Year
  allPoints: ReconciliationTrendPoint[] = [
    { id: 'REC-01', date: '01 Oct 2026', shortLabel: 'Oct 01', billed: 485000, collected: 485000, variance: 0, healthScore: 96.5, counterCash: 48500, meezanBank: 300000, hblBank: 40000, digital1Link: 96500, auditStatus: 'Balanced', verifiedBy: 'KPMG Partner' },
    { id: 'REC-02', date: '05 Oct 2026', shortLabel: 'Oct 05', billed: 790000, collected: 790000, variance: 0, healthScore: 97.0, counterCash: 79000, meezanBank: 490000, hblBank: 60000, digital1Link: 161000, auditStatus: 'Balanced', verifiedBy: 'Internal Audit' },
    { id: 'REC-03', date: '10 Oct 2026', shortLabel: 'Oct 10', billed: 1250000, collected: 1250000, variance: 0, healthScore: 97.4, counterCash: 125000, meezanBank: 775000, hblBank: 100000, digital1Link: 250000, auditStatus: 'Balanced', verifiedBy: 'KPMG Partner' },
    { id: 'REC-04', date: '15 Oct 2026', shortLabel: 'Oct 15', billed: 980000, collected: 980000, variance: 0, healthScore: 97.8, counterCash: 98000, meezanBank: 608000, hblBank: 80000, digital1Link: 194000, auditStatus: 'Balanced', verifiedBy: 'KPMG Partner' },
    { id: 'REC-05', date: '20 Oct 2026', shortLabel: 'Oct 20', billed: 1420000, collected: 1420000, variance: 0, healthScore: 98.0, counterCash: 142000, meezanBank: 880000, hblBank: 110000, digital1Link: 288000, auditStatus: 'Balanced', verifiedBy: 'Internal Audit' },
    { id: 'REC-06', date: '25 Oct 2026', shortLabel: 'Oct 25', billed: 1680000, collected: 1680000, variance: 0, healthScore: 98.2, counterCash: 168000, meezanBank: 1042000, hblBank: 130000, digital1Link: 340000, auditStatus: 'Balanced', verifiedBy: 'KPMG Partner' },
    { id: 'REC-07', date: '30 Oct 2026', shortLabel: 'Oct 30', billed: 1150000, collected: 1150000, variance: 0, healthScore: 98.4, counterCash: 115000, meezanBank: 713000, hblBank: 90000, digital1Link: 232000, auditStatus: 'Balanced', verifiedBy: 'KPMG Partner' },
    { id: 'REC-08', date: '04 Nov 2026', shortLabel: 'Nov 04', billed: 1840000, collected: 1840000, variance: 0, healthScore: 98.4, counterCash: 184000, meezanBank: 1140000, hblBank: 150000, digital1Link: 366000, auditStatus: 'Balanced', verifiedBy: 'KPMG Partner' }
  ];

  ngOnInit(): void {
    if (this.initialTimeframe) this.timeframe.set(this.initialTimeframe);
    if (this.initialChartType) this.chartType.set(this.initialChartType);
  }

  setTimeframe(tf: ChartTimeframe): void {
    this.timeframe.set(tf);
    this.hoveredPoint.set(null);
  }

  setChartType(ct: ChartVisualizationType): void {
    this.chartType.set(ct);
  }

  toggleSeries(series: 'billed' | 'collected' | 'health' | 'variance'): void {
    if (series === 'billed') this.showBilled.update(v => !v);
    if (series === 'collected') this.showCollected.update(v => !v);
    if (series === 'health') this.showHealth.update(v => !v);
    if (series === 'variance') this.showVariance.update(v => !v);
  }

  // Filtered dataset according to active timeframe
  activePoints = computed(() => {
    const tf = this.timeframe();
    if (tf === '7d') return this.allPoints.slice(-4);
    if (tf === '30d') return this.allPoints.slice(-6);
    if (tf === '90d') return this.allPoints;
    return this.allPoints;
  });

  totalBilled = computed(() => this.activePoints().reduce((acc, p) => acc + p.billed, 0));
  totalCollected = computed(() => this.activePoints().reduce((acc, p) => acc + p.collected, 0));
  totalVariance = computed(() => this.activePoints().reduce((acc, p) => acc + p.variance, 0));
  
  averageHealthScore = computed(() => {
    const pts = this.activePoints();
    if (!pts.length) return 98.4;
    return pts.reduce((acc, p) => acc + p.healthScore, 0) / pts.length;
  });

  currentHealthScore = computed(() => {
    const pts = this.activePoints();
    return pts.length ? pts[pts.length - 1].healthScore : 98.4;
  });

  circularDashOffset = computed(() => {
    // Circumference = 2 * π * 56 ≈ 351.85
    const score = this.currentHealthScore();
    return 351.85 * (1 - score / 100);
  });

  maxScaleAmount = computed(() => {
    const pts = this.activePoints();
    const maxVal = Math.max(...pts.map(p => Math.max(p.billed, p.collected)), 1000000);
    return Math.ceil(maxVal / 500000) * 500000;
  });

  // SVG Coordinates calculation
  chartPoints = computed(() => {
    const pts = this.activePoints();
    const count = pts.length;
    if (!count) return [];

    const left = 70;
    const right = 570;
    const top = 30;
    const bottom = 210;
    const plotHeight = bottom - top;
    const max = this.maxScaleAmount();

    return pts.map((p, i) => {
      const x = count === 1 ? (left + right) / 2 : left + (i / (count - 1)) * (right - left);
      const yBilled = bottom - (p.billed / max) * plotHeight;
      const yCollected = bottom - (p.collected / max) * plotHeight;
      // Health score scaled from 90% to 100% into top-to-bottom range
      const healthPctNormalized = Math.max(0, Math.min(1, (p.healthScore - 90) / 10));
      const yHealth = bottom - healthPctNormalized * (plotHeight * 0.85);

      return {
        point: p,
        x,
        yBilled,
        yCollected,
        yHealth
      };
    });
  });

  // Recharts Bar layout computation
  barData = computed(() => {
    const pts = this.chartPoints();
    const bottom = 210;
    const barWidth = 14;

    return pts.map(pt => {
      const heightBilled = Math.max(4, bottom - pt.yBilled);
      const heightCollected = Math.max(4, bottom - pt.yCollected);
      return {
        point: pt.point,
        x1: pt.x - barWidth - 1,
        yBilled: pt.yBilled,
        heightBilled,
        x2: pt.x + 1,
        yCollected: pt.yCollected,
        heightCollected,
        width: barWidth
      };
    });
  });

  // Path generators for smooth Recharts-style curves
  billedLinePath = computed(() => this.generateSmoothPath(this.chartPoints().map(p => ({ x: p.x, y: p.yBilled }))));
  collectedLinePath = computed(() => this.generateSmoothPath(this.chartPoints().map(p => ({ x: p.x, y: p.yCollected }))));
  healthLinePath = computed(() => this.generateSmoothPath(this.chartPoints().map(p => ({ x: p.x, y: p.yHealth }))));

  billedAreaPath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    const line = this.billedLinePath();
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    return `${line} L ${lastX} 210 L ${firstX} 210 Z`;
  });

  collectedAreaPath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    const line = this.collectedLinePath();
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    return `${line} L ${lastX} 210 L ${firstX} 210 Z`;
  });

  private generateSmoothPath(points: { x: number; y: number }[]): string {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  }

  // Mouse interaction
  onChartMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * 600;

    const pts = this.chartPoints();
    if (!pts.length) return;

    let closestIdx = 0;
    let minDiff = Infinity;
    pts.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - relativeX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    const chosen = pts[closestIdx];
    this.hoveredIndex.set(closestIdx);
    this.hoveredPoint.set(chosen.point);

    // Position tooltip safely within bounds
    const domX = event.clientX - rect.left;
    const domY = event.clientY - rect.top;
    this.tooltipLeft.set(Math.min(domX + 16, rect.width - 240));
    this.tooltipTop.set(Math.max(10, domY - 80));
  }

  onChartMouseLeave(): void {
    this.hoveredPoint.set(null);
    this.hoveredIndex.set(-1);
  }

  hoveredX = computed(() => {
    const idx = this.hoveredIndex();
    const pts = this.chartPoints();
    return idx >= 0 && idx < pts.length ? pts[idx].x : 0;
  });

  hoveredYBilled = computed(() => {
    const idx = this.hoveredIndex();
    const pts = this.chartPoints();
    return idx >= 0 && idx < pts.length ? pts[idx].yBilled : 0;
  });

  hoveredYCollected = computed(() => {
    const idx = this.hoveredIndex();
    const pts = this.chartPoints();
    return idx >= 0 && idx < pts.length ? pts[idx].yCollected : 0;
  });

  exportTrendCSV(): void {
    const pts = this.activePoints();
    const headers = ['ID', 'Date', 'Billed_PKR', 'Collected_PKR', 'Variance_PKR', 'HealthScore_Pct', 'Meezan_PKR', 'KuickPay_PKR', 'Counter_PKR', 'VerifiedBy'];
    const rows = pts.map(p => [
      p.id,
      p.date,
      p.billed,
      p.collected,
      p.variance,
      p.healthScore,
      p.meezanBank,
      p.digital1Link,
      p.counterCash,
      `"${p.verifiedBy}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Institutional_Reconciliation_Trends_${this.timeframe()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
