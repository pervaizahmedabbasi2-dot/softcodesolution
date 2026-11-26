import { Injectable, signal } from '@angular/core';
import {
  ThermalPaperWidth,
  ThermalPosReceiptData,
  ThermalKotTicketData,
  ShippingWaybillData,
  buildCashDrawerKickBytes,
  buildEscPosKotBytes,
  buildEscPosPosReceiptBytes,
  buildThermalKotHtml,
  buildThermalPosReceiptHtml,
  buildWaybill4x6Html,
  printHtmlInHiddenFrame
} from './thermal-print.util';

@Injectable({
  providedIn: 'root'
})
export class HardwareDeviceService {
  readonly paperWidth = signal<ThermalPaperWidth>('80mm');
  readonly autoPrintEnabled = signal<boolean>(true);
  readonly serialPortConnected = signal<boolean>(false);
  readonly serialStatusLabel = signal<string>('USB Serial Idle (Hidden Frame Ready)');

  private serialPort: any = null;

  get isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  setPaperWidth(width: ThermalPaperWidth): void {
    this.paperWidth.set(width);
  }

  toggleAutoPrint(): void {
    this.autoPrintEnabled.set(!this.autoPrintEnabled());
  }

  async connectSerialPrinter(): Promise<boolean> {
    if (!this.isWebSerialSupported) {
      this.serialStatusLabel.set('Web Serial requires Chrome/Edge desktop; using 80mm driver print.');
      return false;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      if (!port.readable && !port.writable) {
        await port.open({ baudRate: 9600 });
      }
      this.serialPort = port;
      this.serialPortConnected.set(true);
      this.serialStatusLabel.set('USB ESC/POS Thermal Printer + Cash Drawer Connected');
      return true;
    } catch {
      this.serialStatusLabel.set('Serial connect cancelled — driver print active.');
      return false;
    }
  }

  async sendRawBytes(bytes: Uint8Array): Promise<boolean> {
    if (!this.serialPort || !this.serialPort.writable) return false;
    try {
      const writer = this.serialPort.writable.getWriter();
      try {
        await writer.write(bytes);
      } finally {
        writer.releaseLock();
      }
      return true;
    } catch {
      return false;
    }
  }

  async kickCashDrawer(): Promise<{ usedSerial: boolean; message: string }> {
    const kickBytes = buildCashDrawerKickBytes(0);
    const sent = await this.sendRawBytes(kickBytes);
    this.playBeep(880, 75);
    if (sent) {
      return { usedSerial: true, message: 'ESC p Cash Drawer solenoid pulse sent via USB Serial.' };
    }
    return {
      usedSerial: false,
      message: 'ESC p Cash Drawer trigger queued (0x1B 0x70 0x00) — connect USB ESC/POS serial printer for physical RJ11 kick.'
    };
  }

  async printPosReceipt(data: ThermalPosReceiptData, kickDrawer = false): Promise<boolean> {
    if (this.serialPortConnected()) {
      const sent = await this.sendRawBytes(buildEscPosPosReceiptBytes(data, kickDrawer));
      if (sent) return true;
    }
    return printHtmlInHiddenFrame(buildThermalPosReceiptHtml(data, this.paperWidth()));
  }

  async printKotTicket(ticket: ThermalKotTicketData): Promise<boolean> {
    if (this.serialPortConnected()) {
      const sent = await this.sendRawBytes(buildEscPosKotBytes(ticket));
      if (sent) return true;
    }
    return printHtmlInHiddenFrame(buildThermalKotHtml(ticket, this.paperWidth()));
  }

  async printWaybill4x6(waybill: ShippingWaybillData): Promise<boolean> {
    return printHtmlInHiddenFrame(buildWaybill4x6Html(waybill));
  }

  playBeep(freq = 1040, durationMs = 60): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
      setTimeout(() => {
        try { ctx.close(); } catch {}
      }, durationMs + 100);
    } catch {}
  }
}
