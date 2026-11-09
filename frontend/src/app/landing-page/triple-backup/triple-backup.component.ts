import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-triple-backup',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './triple-backup.component.html',
})
export class TripleBackupComponent {
    @Input() isOpen: boolean = false;
    @Output() closeEvent = new EventEmitter<void>();

    closeModal() {
        this.closeEvent.emit();
    }
}