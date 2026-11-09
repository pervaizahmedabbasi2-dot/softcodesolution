import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegalComponent } from '../legal/legal.component';
import { MirroringComponent } from '../mirroring/mirroring.component';
import { HybridSyncComponent } from '../hybrid-sync/hybrid-sync.component';
import { TripleBackupComponent } from '../triple-backup/triple-backup.component'; // <--- Naya Import

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    LegalComponent,
    MirroringComponent,
    HybridSyncComponent,
    TripleBackupComponent // <--- Imports mein add kiya
  ],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  // Modal states
  isModalOpen = false;
  isMirroringOpen = false;
  isHybridSyncOpen = false;
  isTripleBackupOpen = false; // <--- Triple Backup ka variable
  activeTab = 'terms';

  // Legal Modal Functions
  openLegalModal(tab: string) {
    this.activeTab = tab;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  // Mirroring Modal Functions
  openMirroringModal() {
    this.isMirroringOpen = true;
  }

  closeMirroringModal() {
    this.isMirroringOpen = false;
  }

  // Hybrid-Sync Modal Functions
  openHybridSync() {
    this.isHybridSyncOpen = true;
  }

  closeHybridSync() {
    this.isHybridSyncOpen = false;
  }

  // Triple Backup Modal Functions
  openTripleBackup() {
    this.isTripleBackupOpen = true;
  }

  closeTripleBackup() {
    this.isTripleBackupOpen = false;
  }
}