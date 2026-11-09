import { Component, Input, Output, EventEmitter, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule } from 'lucide-angular';

export interface MonthlyCollectionData {
  id: string;
  month: string;           // e.g. "May 2026", "Jun 2026"
  shortMonth: string;      // "May", "Jun"
  billedAmount: number;    // Invoiced target in PKR
  collectedAmount: number; // Actual realized bank receipts in PKR
  variance: number;        // Variance (Collected - Billed)
  efficiencyRate: number;  // (Collected / Billed) * 100
  meezanShare: number;     // Meezan Bank collection
  hblShare: number;        // HBL Bank collection
  digitalKuickPay: number; // 1Link / KuickPay collection
  counterCash: number;     // Physical cash desk collection
  status: 'Balanced' | 'Surplus' | 'Recovered';
}

export interface AuditGrowthDataPoint {
  id: string;
  period: string;          // e.g. "Q1 2026", "Month 1"
  dateLabel: string;       // "Jul 26", "Aug 26"
  healthScore: number;     // 0 - 100%
  enrolledStudents: number;// Total active student census
  verifiedCivilDocs: number;// % of students with verified NADRA B-Form
  examSecurityLocks: number;// % of marksheets sealed with SHA-256
  statutoryCompliance: number;// % of regulatory criteria verified
  auditMilestone: string;  // Significant audit event
}

export type AnalyticsTimeRange = '6m' | '12m' | '2y';
export type GrowthMetricType = 'health' | 'enrollment' | 'examSecurity' | 'civilDocs';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      
      <!-- Top Executive Overview & Filter Banner -->
      <div class="apple-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          
          <div class="flex items-start sm:items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center font-black shadow-xs shrink-0">
              <mat-icon class="text-2xl">analytics</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg font-black text-slate-900 tracking-tight">Institutional Analytics & Audit Growth Intelligence</h2>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  D3.js Mathematical Scale Engine
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  98.4% Health Index
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1 font-medium">
                Longitudinal growth trajectory, multi-channel fee reconciliation performance, and statutory compliance benchmarking
              </p>
            </div>
          </div>

          <!-- Global Controls & Period Filter -->
          <div class="flex items-center gap-2.5 flex-wrap">
            <div class="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
              <button
                type="button"
                (click)="setTimeRange('6m')"
                class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                [class]="timeRange() === '6m' ? 'bg-indigo-600 text-white font-black shadow-2xs' : 'hover:text-slate-900'">
                Last 6 Months
              </button>
              <button
                type="button"
                (click)="setTimeRange('12m')"
                class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                [class]="timeRange() === '12m' ? 'bg-indigo-600 text-white font-black shadow-2xs' : 'hover:text-slate-900'">
                Academic Year 2026–27
              </button>
              <button
                type="button"
                (click)="setTimeRange('2y')"
                class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                [class]="timeRange() === '2y' ? 'bg-indigo-600 text-white font-black shadow-2xs' : 'hover:text-slate-900'">
                2-Year Historical
              </button>
            </div>

            <button
              type="button"
              (click)="exportAnalyticsSummary()"
              class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95">
              <mat-icon class="text-sm">file_download</mat-icon>
              <span>Export Analytics (CSV)</span>
            </button>
          </div>

        </div>

        <!-- 4-Metric Institutional Performance Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          <div class="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Cumulative Billed</span>
              <mat-icon class="text-xs text-indigo-600">receipt</mat-icon>
            </div>
            <div class="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              PKR {{ (cumulativeBilled() / 1000000).toFixed(2) }}M
            </div>
            <div class="text-[11px] text-slate-500">
              Across {{ activeMonthlyData().length }} Fiscal Months
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Realized Collections</span>
              <mat-icon class="text-xs text-emerald-600">account_balance</mat-icon>
            </div>
            <div class="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
              PKR {{ (cumulativeCollected() / 1000000).toFixed(2) }}M
            </div>
            <div class="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <span>{{ averageEfficiencyRate().toFixed(1) }}% Efficiency</span>
              <span class="text-slate-400">·</span>
              <span class="text-slate-500">100% Realized</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Audit Growth Delta</span>
              <mat-icon class="text-xs text-cyan-600">trending_up</mat-icon>
            </div>
            <div class="text-xl sm:text-2xl font-black text-cyan-700 font-mono">
              +{{ healthScoreGain().toFixed(1) }}%
            </div>
            <div class="text-[11px] text-cyan-700 font-bold">
              Current Rating: {{ latestHealthScore() }}% (Grade A+)
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Reconciliation Variance</span>
              <mat-icon class="text-xs text-emerald-600">verified</mat-icon>
            </div>
            <div class="text-xl sm:text-2xl font-black text-slate-900 font-mono"
                 [class.text-emerald-600]="cumulativeVariance() === 0">
              PKR {{ cumulativeVariance().toLocaleString() }}
            </div>
            <div class="text-[11px] text-emerald-700 font-bold">
              100% Balanced · Zero Unreconciled
            </div>
          </div>
        </div>

      </div>

      <!-- MAIN CHARTS GRID: D3 LINE CHART & D3 MONTHLY BAR CHART -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- ======================================================== -->
        <!-- CHART 1: D3-BASED LINE CHART FOR INSTITUTIONAL GROWTH -->
        <!-- ======================================================== -->
        <div class="lg:col-span-7 apple-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-black">
                  <mat-icon class="text-base">show_chart</mat-icon>
                </div>
                <div>
                  <h3 class="font-black text-slate-900 text-sm">D3.js Institutional Growth & Health Trajectory</h3>
                  <p class="text-[11px] text-slate-500">Continuous spline interpolation with D3 monotone curve math</p>
                </div>
              </div>
            </div>

            <!-- Growth Dimension Filter -->
            <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] font-bold text-slate-600 border border-slate-200">
              <button
                type="button"
                (click)="setGrowthMetric('health')"
                class="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                [class]="activeGrowthMetric() === 'health' ? 'bg-white text-cyan-800 font-black shadow-2xs' : 'hover:text-slate-900'">
                Health %
              </button>
              <button
                type="button"
                (click)="setGrowthMetric('enrollment')"
                class="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                [class]="activeGrowthMetric() === 'enrollment' ? 'bg-white text-cyan-800 font-black shadow-2xs' : 'hover:text-slate-900'">
                Census
              </button>
              <button
                type="button"
                (click)="setGrowthMetric('examSecurity')"
                class="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                [class]="activeGrowthMetric() === 'examSecurity' ? 'bg-white text-cyan-800 font-black shadow-2xs' : 'hover:text-slate-900'">
                Exam Locks
              </button>
            </div>
          </div>

          <!-- D3 Interactive Line SVG Viewport -->
          <div
            class="relative w-full h-[280px] sm:h-[310px] bg-gradient-to-b from-slate-50/50 to-white rounded-2xl border border-slate-200/80 p-3 select-none overflow-hidden"
            (mousemove)="onLineChartMouseMove($event)"
            (mouseleave)="onLineChartMouseLeave()">
            
            <svg class="w-full h-full overflow-visible" viewBox="0 0 600 240" preserveAspectRatio="none">
              <defs>
                <linearGradient id="d3GrowthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.00"/>
                </linearGradient>

                <linearGradient id="d3LineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#0284c7"/>
                  <stop offset="100%" stop-color="#06b6d4"/>
                </linearGradient>
              </defs>

              <!-- D3 Grid Lines (Horizontal) -->
              <g class="d3-grid-lines stroke-slate-200 stroke-dashed" stroke-dasharray="3 3">
                <line x1="45" y1="30" x2="585" y2="30" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="45" y1="75" x2="585" y2="75" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="45" y1="120" x2="585" y2="120" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="45" y1="165" x2="585" y2="165" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="45" y1="210" x2="585" y2="210" stroke="#cbd5e1" stroke-width="1.5"/>
              </g>

              <!-- Target Benchmark Line (98% FBISE/Cambridge Standard) -->
              <line x1="45" y1="52" x2="585" y2="52" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4 4"/>
              <text x="580" y="47" text-anchor="end" class="text-[8px] fill-emerald-600 font-mono font-black uppercase">
                Accreditation Benchmark (98.0%)
              </text>

              <!-- D3 Y-Axis Ticks & Labels -->
              <g class="text-[9px] fill-slate-400 font-mono font-bold" text-anchor="end">
                <text x="40" y="34">{{ lineYAxisLabels()[0] }}</text>
                <text x="40" y="79">{{ lineYAxisLabels()[1] }}</text>
                <text x="40" y="124">{{ lineYAxisLabels()[2] }}</text>
                <text x="40" y="169">{{ lineYAxisLabels()[3] }}</text>
                <text x="40" y="214">{{ lineYAxisLabels()[4] }}</text>
              </g>

              <!-- D3 Area Gradient Fill -->
              <path [attr.d]="d3AreaPath()" fill="url(#d3GrowthGradient)" class="transition-all duration-700 ease-out"/>

              <!-- D3 Smooth Spline Curve -->
              <path
                [attr.d]="d3LinePath()"
                fill="none"
                stroke="url(#d3LineGradient)"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="transition-all duration-700 ease-out"/>

              <!-- Data Node Points -->
              @for (pt of d3LinePlotPoints(); track pt.data.id) {
                <circle
                  [attr.cx]="pt.x"
                  [attr.cy]="pt.y"
                  r="4.5"
                  fill="#ffffff"
                  stroke="#0284c7"
                  stroke-width="2.5"
                  class="transition-transform duration-300 hover:scale-125"/>
              }

              <!-- X-Axis Labels (Date/Period) -->
              <g class="text-[9px] fill-slate-500 font-mono font-bold" text-anchor="middle">
                @for (pt of d3LinePlotPoints(); track pt.data.id) {
                  <text [attr.x]="pt.x" y="228">{{ pt.data.dateLabel }}</text>
                }
              </g>

              <!-- Interactive Cursor Tracker Crosshair -->
              @if (hoveredLinePoint()) {
                <line
                  [attr.x1]="hoveredLineX()"
                  y1="25"
                  [attr.x2]="hoveredLineX()"
                  y2="210"
                  stroke="#0284c7"
                  stroke-width="1.5"
                  stroke-dasharray="2 2"
                  class="pointer-events-none"/>

                <circle
                  [attr.cx]="hoveredLineX()"
                  [attr.cy]="hoveredLineY()"
                  r="6"
                  fill="#0284c7"
                  stroke="#ffffff"
                  stroke-width="2.5"
                  class="pointer-events-none"/>
              }
            </svg>

            <!-- Floating D3 Line Tooltip -->
            @if (hoveredLinePoint(); as hp) {
              <div
                class="absolute z-20 pointer-events-none p-3 rounded-2xl bg-slate-900/95 text-white shadow-xl backdrop-blur-md border border-slate-700/80 text-xs space-y-1.5 min-w-[210px] transition-all duration-75"
                [style.left.px]="lineTooltipLeft()"
                [style.top.px]="lineTooltipTop()">
                
                <div class="flex items-center justify-between pb-1 border-b border-slate-700/80">
                  <span class="font-black text-slate-200">{{ hp.dateLabel }} ({{ hp.period }})</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-cyan-500/20 text-cyan-400">
                    {{ hp.auditMilestone }}
                  </span>
                </div>

                <div class="space-y-1 font-mono text-[11px]">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-300">Audit Health Score:</span>
                    <strong class="text-cyan-300 font-black">{{ hp.healthScore }}%</strong>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-300">Active Student Census:</span>
                    <strong class="text-white">{{ hp.enrolledStudents }} Enrolled</strong>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-300">NADRA B-Form Verified:</span>
                    <strong class="text-emerald-400">{{ hp.verifiedCivilDocs }}%</strong>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-300">SHA-256 Tamper Locks:</span>
                    <strong class="text-indigo-300">{{ hp.examSecurityLocks }}% Sealed</strong>
                  </div>
                </div>

              </div>
            }

          </div>

          <!-- Bottom Legend & Reference Note -->
          <div class="flex items-center justify-between text-xs text-slate-500 pt-1 flex-wrap gap-2">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1.5 font-bold">
                <span class="w-3 h-1 rounded-full bg-cyan-600"></span>
                <span>Calculated Trajectory</span>
              </span>
              <span class="flex items-center gap-1.5 font-bold text-emerald-700">
                <span class="w-3 h-0.5 border-t border-dashed border-emerald-600"></span>
                <span>98.0% Regulatory Baseline</span>
              </span>
            </div>
            <span class="font-mono text-[11px]">D3 Catmull-Rom Centripetal Spline</span>
          </div>

        </div>

        <!-- ======================================================== -->
        <!-- CHART 2: D3-BASED BAR CHART FOR MONTHLY FEE COLLECTION -->
        <!-- ======================================================== -->
        <div class="lg:col-span-5 apple-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                <mat-icon class="text-base">bar_chart</mat-icon>
              </div>
              <div>
                <h3 class="font-black text-slate-900 text-sm">Monthly Fee Performance</h3>
                <p class="text-[11px] text-slate-500">Invoiced Billed vs Bank Realized</p>
              </div>
            </div>

            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
              100% Balanced
            </span>
          </div>

          <!-- D3 Interactive Bar SVG Viewport -->
          <div
            class="relative w-full h-[280px] sm:h-[310px] bg-gradient-to-b from-slate-50/50 to-white rounded-2xl border border-slate-200/80 p-3 select-none overflow-hidden"
            (mousemove)="onBarChartMouseMove($event)"
            (mouseleave)="onBarChartMouseLeave()">
            
            <svg class="w-full h-full overflow-visible" viewBox="0 0 450 240" preserveAspectRatio="none">
              <!-- Horizontal Grid Lines -->
              <g class="stroke-slate-200 stroke-dashed" stroke-dasharray="3 3">
                <line x1="35" y1="30" x2="440" y2="30" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="35" y1="75" x2="440" y2="75" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="35" y1="120" x2="440" y2="120" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="35" y1="165" x2="440" y2="165" stroke="#e2e8f0" stroke-width="1"/>
                <line x1="35" y1="210" x2="440" y2="210" stroke="#cbd5e1" stroke-width="1.5"/>
              </g>

              <!-- Y-Axis Amount Ticks -->
              <g class="text-[8.5px] fill-slate-400 font-mono font-bold" text-anchor="end">
                <text x="30" y="34">{{ (maxBarAmount() / 1000000).toFixed(1) }}M</text>
                <text x="30" y="79">{{ (maxBarAmount() * 0.75 / 1000000).toFixed(1) }}M</text>
                <text x="30" y="124">{{ (maxBarAmount() * 0.5 / 1000000).toFixed(1) }}M</text>
                <text x="30" y="169">{{ (maxBarAmount() * 0.25 / 1000000).toFixed(1) }}M</text>
                <text x="30" y="214">0.0M</text>
              </g>

              <!-- Grouped Bars: Billed (Slate-Indigo) & Collected (Emerald) -->
              @for (bar of d3BarLayout(); track bar.item.id; let idx = $index) {
                <!-- Billed Target Bar -->
                <rect
                  [attr.x]="bar.x1"
                  [attr.y]="bar.yBilled"
                  [attr.width]="bar.width"
                  [attr.height]="bar.heightBilled"
                  rx="3"
                  fill="#6366f1"
                  class="transition-all duration-300 hover:fill-indigo-600"/>

                <!-- Realized Collection Bar -->
                <rect
                  [attr.x]="bar.x2"
                  [attr.y]="bar.yCollected"
                  [attr.width]="bar.width"
                  [attr.height]="bar.heightCollected"
                  rx="3"
                  fill="#10b981"
                  class="transition-all duration-300 hover:fill-emerald-600"/>
              }

              <!-- X-Axis Labels (Months) -->
              <g class="text-[9px] fill-slate-500 font-mono font-bold" text-anchor="middle">
                @for (bar of d3BarLayout(); track bar.item.id) {
                  <text [attr.x]="bar.centerX" y="228">{{ bar.item.shortMonth }}</text>
                }
              </g>
            </svg>

            <!-- Floating D3 Bar Tooltip -->
            @if (hoveredBarPoint(); as bp) {
              <div
                class="absolute z-20 pointer-events-none p-3 rounded-2xl bg-slate-900/95 text-white shadow-xl backdrop-blur-md border border-slate-700/80 text-xs space-y-1.5 min-w-[200px] transition-all duration-75"
                [style.left.px]="barTooltipLeft()"
                [style.top.px]="barTooltipTop()">
                
                <div class="flex items-center justify-between pb-1 border-b border-slate-700/80">
                  <span class="font-black text-slate-200">{{ bp.month }}</span>
                  <span class="px-2 py-0.2 rounded text-[9px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-400">
                    {{ bp.efficiencyRate.toFixed(1) }}% Cleared
                  </span>
                </div>

                <div class="space-y-1 font-mono text-[11px]">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-300">Billed Target:</span>
                    <strong class="text-indigo-300">PKR {{ bp.billedAmount.toLocaleString() }}</strong>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-300">Realized Collections:</span>
                    <strong class="text-emerald-400 font-bold">PKR {{ bp.collectedAmount.toLocaleString() }}</strong>
                  </div>
                  <div class="flex items-center justify-between pt-0.5 border-t border-slate-700/60 text-[10px]">
                    <span class="text-slate-400">Meezan: {{ (bp.meezanShare / 1000).toFixed(0) }}k</span>
                    <span class="text-slate-400">KuickPay: {{ (bp.digitalKuickPay / 1000).toFixed(0) }}k</span>
                  </div>
                </div>

              </div>
            }

          </div>

          <!-- Bar Chart Legend -->
          <div class="flex items-center justify-between text-xs text-slate-600 pt-1">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1.5 font-bold">
                <span class="w-3 h-3 rounded bg-indigo-600"></span>
                <span>Invoiced Target</span>
              </span>
              <span class="flex items-center gap-1.5 font-bold">
                <span class="w-3 h-3 rounded bg-emerald-500"></span>
                <span>Bank Cleared</span>
              </span>
            </div>
            <span class="font-mono font-bold text-emerald-700 text-[11px]">Variance: PKR 0.00</span>
          </div>

        </div>

      </div>

      <!-- DETAILED RECONCILIATION & AUDIT PERFORMANCE LEDGER -->
      <div class="apple-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-black text-slate-900 text-sm flex items-center gap-2">
              <mat-icon class="text-indigo-600">table_rows</mat-icon>
              Monthly Financial Reconciliation & Audit Health Ledger
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Dual-register balance verification with Meezan Bank, HBL, and KuickPay gateways</p>
          </div>
          <span class="text-xs font-mono font-bold text-slate-500">
            Active Dataset: {{ activeMonthlyData().length }} Monthly Statements
          </span>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 font-mono tracking-wider bg-slate-50/60">
                <th class="py-2.5 px-3">Billing Month</th>
                <th class="py-2.5 px-3">Invoiced Target (PKR)</th>
                <th class="py-2.5 px-3">Bank Receipts (PKR)</th>
                <th class="py-2.5 px-3">Collection %</th>
                <th class="py-2.5 px-3">Meezan Bank</th>
                <th class="py-2.5 px-3">HBL Bank</th>
                <th class="py-2.5 px-3">KuickPay Digital</th>
                <th class="py-2.5 px-3">Cash Counter</th>
                <th class="py-2.5 px-3 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              @for (row of activeMonthlyData(); track row.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-3 font-bold text-slate-900">{{ row.month }}</td>
                  <td class="py-3 px-3 font-mono font-bold text-indigo-700">PKR {{ row.billedAmount.toLocaleString() }}</td>
                  <td class="py-3 px-3 font-mono font-bold text-emerald-700">PKR {{ row.collectedAmount.toLocaleString() }}</td>
                  <td class="py-3 px-3 font-mono font-bold text-slate-700">
                    <div class="flex items-center gap-1.5">
                      <div class="w-10 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div class="bg-emerald-500 h-1.5 rounded-full" [style.width.%]="row.efficiencyRate"></div>
                      </div>
                      <span>{{ row.efficiencyRate.toFixed(1) }}%</span>
                    </div>
                  </td>
                  <td class="py-3 px-3 font-mono text-slate-600">PKR {{ row.meezanShare.toLocaleString() }}</td>
                  <td class="py-3 px-3 font-mono text-slate-600">PKR {{ row.hblShare.toLocaleString() }}</td>
                  <td class="py-3 px-3 font-mono text-slate-600">PKR {{ row.digitalKuickPay.toLocaleString() }}</td>
                  <td class="py-3 px-3 font-mono text-slate-600">PKR {{ row.counterCash.toLocaleString() }}</td>
                  <td class="py-3 px-3 text-right">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ {{ row.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class AnalyticsDashboardComponent implements OnInit {
  @Input() initialRange: AnalyticsTimeRange = '12m';
  @Output() auditScanRequested = new EventEmitter<void>();

  timeRange = signal<AnalyticsTimeRange>('12m');
  activeGrowthMetric = signal<GrowthMetricType>('health');

  hoveredLinePoint = signal<AuditGrowthDataPoint | null>(null);
  hoveredLineIndex = signal<number>(-1);
  lineTooltipLeft = signal<number>(0);
  lineTooltipTop = signal<number>(0);

  hoveredBarPoint = signal<MonthlyCollectionData | null>(null);
  hoveredBarIndex = signal<number>(-1);
  barTooltipLeft = signal<number>(0);
  barTooltipTop = signal<number>(0);

  // Full monthly fee performance dataset across academic fiscal year
  monthlyPerformanceRecords: MonthlyCollectionData[] = [
    { id: 'M-01', month: 'July 2026', shortMonth: 'Jul', billedAmount: 2150000, collectedAmount: 2150000, variance: 0, efficiencyRate: 100, meezanShare: 1333000, hblShare: 215000, digitalKuickPay: 430000, counterCash: 172000, status: 'Balanced' },
    { id: 'M-02', month: 'August 2026', shortMonth: 'Aug', billedAmount: 2380000, collectedAmount: 2380000, variance: 0, efficiencyRate: 100, meezanShare: 1475600, hblShare: 238000, digitalKuickPay: 476000, counterCash: 190400, status: 'Balanced' },
    { id: 'M-03', month: 'September 2026', shortMonth: 'Sep', billedAmount: 2420000, collectedAmount: 2420000, variance: 0, efficiencyRate: 100, meezanShare: 1500400, hblShare: 242000, digitalKuickPay: 484000, counterCash: 193600, status: 'Balanced' },
    { id: 'M-04', month: 'October 2026', shortMonth: 'Oct', billedAmount: 2560000, collectedAmount: 2560000, variance: 0, efficiencyRate: 100, meezanShare: 1587200, hblShare: 256000, digitalKuickPay: 512000, counterCash: 204800, status: 'Balanced' },
    { id: 'M-05', month: 'November 2026', shortMonth: 'Nov', billedAmount: 2490000, collectedAmount: 2490000, variance: 0, efficiencyRate: 100, meezanShare: 1543800, hblShare: 249000, digitalKuickPay: 498000, counterCash: 199200, status: 'Balanced' },
    { id: 'M-06', month: 'December 2026', shortMonth: 'Dec', billedAmount: 2620000, collectedAmount: 2620000, variance: 0, efficiencyRate: 100, meezanShare: 1624400, hblShare: 262000, digitalKuickPay: 524000, counterCash: 209600, status: 'Balanced' },
    { id: 'M-07', month: 'January 2027', shortMonth: 'Jan', billedAmount: 2710000, collectedAmount: 2710000, variance: 0, efficiencyRate: 100, meezanShare: 1680200, hblShare: 271000, digitalKuickPay: 542000, counterCash: 216800, status: 'Balanced' },
    { id: 'M-08', month: 'February 2027', shortMonth: 'Feb', billedAmount: 2680000, collectedAmount: 2680000, variance: 0, efficiencyRate: 100, meezanShare: 1661600, hblShare: 268000, digitalKuickPay: 536000, counterCash: 214400, status: 'Balanced' }
  ];

  // Longitudinal audit growth trajectory records
  auditGrowthRecords: AuditGrowthDataPoint[] = [
    { id: 'AG-01', period: 'Jul 2026', dateLabel: 'Jul 26', healthScore: 94.2, enrolledStudents: 1120, verifiedCivilDocs: 92.5, examSecurityLocks: 95.0, statutoryCompliance: 96.0, auditMilestone: 'Session Opening Audit' },
    { id: 'AG-02', period: 'Aug 2026', dateLabel: 'Aug 26', healthScore: 95.6, enrolledStudents: 1165, verifiedCivilDocs: 94.8, examSecurityLocks: 96.5, statutoryCompliance: 98.0, auditMilestone: 'Admissions Document Scan' },
    { id: 'AG-03', period: 'Sep 2026', dateLabel: 'Sep 26', healthScore: 96.8, enrolledStudents: 1205, verifiedCivilDocs: 96.2, examSecurityLocks: 98.0, statutoryCompliance: 98.5, auditMilestone: 'Board Code Renewal' },
    { id: 'AG-04', period: 'Oct 2026', dateLabel: 'Oct 26', healthScore: 97.4, enrolledStudents: 1228, verifiedCivilDocs: 97.5, examSecurityLocks: 99.0, statutoryCompliance: 99.0, auditMilestone: 'Midterm Moderation Lock' },
    { id: 'AG-05', period: 'Nov 2026', dateLabel: 'Nov 26', healthScore: 98.0, enrolledStudents: 1235, verifiedCivilDocs: 98.2, examSecurityLocks: 100.0, statutoryCompliance: 100.0, auditMilestone: 'Fire & Fleet Fitness Check' },
    { id: 'AG-06', period: 'Dec 2026', dateLabel: 'Dec 26', healthScore: 98.2, enrolledStudents: 1238, verifiedCivilDocs: 98.6, examSecurityLocks: 100.0, statutoryCompliance: 100.0, auditMilestone: 'Tax Exemption Re-Seal' },
    { id: 'AG-07', period: 'Jan 2027', dateLabel: 'Jan 27', healthScore: 98.4, enrolledStudents: 1240, verifiedCivilDocs: 98.9, examSecurityLocks: 100.0, statutoryCompliance: 100.0, auditMilestone: 'Terminal Audit Certification' }
  ];

  ngOnInit(): void {
    if (this.initialRange) this.timeRange.set(this.initialRange);
  }

  setTimeRange(range: AnalyticsTimeRange): void {
    this.timeRange.set(range);
    this.hoveredLinePoint.set(null);
    this.hoveredBarPoint.set(null);
  }

  setGrowthMetric(metric: GrowthMetricType): void {
    this.activeGrowthMetric.set(metric);
  }

  // Active Monthly dataset based on range filter
  activeMonthlyData = computed(() => {
    const r = this.timeRange();
    if (r === '6m') return this.monthlyPerformanceRecords.slice(-6);
    return this.monthlyPerformanceRecords;
  });

  // Active Growth dataset based on range filter
  activeGrowthData = computed(() => {
    const r = this.timeRange();
    if (r === '6m') return this.auditGrowthRecords.slice(-5);
    return this.auditGrowthRecords;
  });

  // Summary computed metrics
  cumulativeBilled = computed(() => this.activeMonthlyData().reduce((acc, m) => acc + m.billedAmount, 0));
  cumulativeCollected = computed(() => this.activeMonthlyData().reduce((acc, m) => acc + m.collectedAmount, 0));
  cumulativeVariance = computed(() => this.activeMonthlyData().reduce((acc, m) => acc + m.variance, 0));

  averageEfficiencyRate = computed(() => {
    const data = this.activeMonthlyData();
    if (!data.length) return 100;
    return data.reduce((acc, m) => acc + m.efficiencyRate, 0) / data.length;
  });

  latestHealthScore = computed(() => {
    const data = this.activeGrowthData();
    return data.length ? data[data.length - 1].healthScore : 98.4;
  });

  healthScoreGain = computed(() => {
    const data = this.activeGrowthData();
    if (data.length < 2) return 0;
    return data[data.length - 1].healthScore - data[0].healthScore;
  });

  // ========================================================
  // D3-BASED LINE CHART CALCULATIONS
  // ========================================================
  lineYAxisLabels = computed(() => {
    const metric = this.activeGrowthMetric();
    if (metric === 'enrollment') {
      return ['1,300', '1,250', '1,200', '1,150', '1,100'];
    }
    return ['100%', '98%', '96%', '94%', '92%'];
  });

  d3LinePlotPoints = computed(() => {
    const data = this.activeGrowthData();
    const count = data.length;
    if (!count) return [];

    const left = 55;
    const right = 575;
    const top = 30;
    const bottom = 210;
    const height = bottom - top;
    const metric = this.activeGrowthMetric();

    return data.map((d, i) => {
      const x = count === 1 ? (left + right) / 2 : left + (i / (count - 1)) * (right - left);
      let val = d.healthScore;
      let minVal = 92;
      let maxVal = 100;

      if (metric === 'enrollment') {
        val = d.enrolledStudents;
        minVal = 1100;
        maxVal = 1300;
      } else if (metric === 'examSecurity') {
        val = d.examSecurityLocks;
        minVal = 92;
        maxVal = 100;
      } else if (metric === 'civilDocs') {
        val = d.verifiedCivilDocs;
        minVal = 90;
        maxVal = 100;
      }

      const normalized = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
      const y = bottom - normalized * height;

      return {
        data: d,
        x,
        y
      };
    });
  });

  // D3 Monotone Cubic Spline Algorithm (Catmull-Rom to Bezier transformation)
  d3LinePath = computed(() => {
    const pts = this.d3LinePlotPoints();
    if (!pts.length) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  });

  d3AreaPath = computed(() => {
    const pts = this.d3LinePlotPoints();
    if (!pts.length) return '';
    const line = this.d3LinePath();
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    return `${line} L ${lastX} 210 L ${firstX} 210 Z`;
  });

  onLineChartMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * 600;

    const pts = this.d3LinePlotPoints();
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
    this.hoveredLineIndex.set(closestIdx);
    this.hoveredLinePoint.set(chosen.data);

    const domX = event.clientX - rect.left;
    const domY = event.clientY - rect.top;
    this.lineTooltipLeft.set(Math.min(domX + 16, rect.width - 230));
    this.lineTooltipTop.set(Math.max(10, domY - 75));
  }

  onLineChartMouseLeave(): void {
    this.hoveredLinePoint.set(null);
    this.hoveredLineIndex.set(-1);
  }

  hoveredLineX = computed(() => {
    const idx = this.hoveredLineIndex();
    const pts = this.d3LinePlotPoints();
    return idx >= 0 && idx < pts.length ? pts[idx].x : 0;
  });

  hoveredLineY = computed(() => {
    const idx = this.hoveredLineIndex();
    const pts = this.d3LinePlotPoints();
    return idx >= 0 && idx < pts.length ? pts[idx].y : 0;
  });

  // ========================================================
  // D3-BASED BAR CHART CALCULATIONS
  // ========================================================
  maxBarAmount = computed(() => {
    const data = this.activeMonthlyData();
    const maxVal = Math.max(...data.map(d => Math.max(d.billedAmount, d.collectedAmount)), 1000000);
    return Math.ceil(maxVal / 500000) * 500000;
  });

  d3BarLayout = computed(() => {
    const data = this.activeMonthlyData();
    const count = data.length;
    if (!count) return [];

    const left = 45;
    const right = 435;
    const top = 30;
    const bottom = 210;
    const plotHeight = bottom - top;
    const max = this.maxBarAmount();
    const step = (right - left) / count;
    const barWidth = Math.max(8, Math.min(16, step * 0.35));

    return data.map((item, i) => {
      const centerX = left + i * step + step / 2;
      const heightBilled = Math.max(4, (item.billedAmount / max) * plotHeight);
      const heightCollected = Math.max(4, (item.collectedAmount / max) * plotHeight);
      const yBilled = bottom - heightBilled;
      const yCollected = bottom - heightCollected;

      return {
        item,
        centerX,
        x1: centerX - barWidth - 1,
        x2: centerX + 1,
        yBilled,
        yCollected,
        heightBilled,
        heightCollected,
        width: barWidth
      };
    });
  });

  onBarChartMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * 450;

    const bars = this.d3BarLayout();
    if (!bars.length) return;

    let closestIdx = 0;
    let minDiff = Infinity;
    bars.forEach((b, idx) => {
      const diff = Math.abs(b.centerX - relativeX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    const chosen = bars[closestIdx];
    this.hoveredBarIndex.set(closestIdx);
    this.hoveredBarPoint.set(chosen.item);

    const domX = event.clientX - rect.left;
    const domY = event.clientY - rect.top;
    this.barTooltipLeft.set(Math.min(domX + 16, rect.width - 220));
    this.barTooltipTop.set(Math.max(10, domY - 70));
  }

  onBarChartMouseLeave(): void {
    this.hoveredBarPoint.set(null);
    this.hoveredBarIndex.set(-1);
  }

  exportAnalyticsSummary(): void {
    const data = this.activeMonthlyData();
    const headers = ['Month', 'Billed_PKR', 'Collected_PKR', 'Variance_PKR', 'Collection_Efficiency_Pct', 'Meezan_PKR', 'HBL_PKR', 'KuickPay_PKR', 'Counter_PKR', 'Audit_Status'];
    const rows = data.map(m => [
      `"${m.month}"`,
      m.billedAmount,
      m.collectedAmount,
      m.variance,
      m.efficiencyRate.toFixed(2),
      m.meezanShare,
      m.hblShare,
      m.digitalKuickPay,
      m.counterCash,
      `"${m.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Institutional_Analytics_Fee_Reconciliation_${this.timeRange()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
