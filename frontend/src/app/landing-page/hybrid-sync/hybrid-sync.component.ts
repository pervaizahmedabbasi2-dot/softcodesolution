import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-hybrid-sync',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './hybrid-sync.component.html',
    styles: []
})
export class HybridSyncComponent {
    @Input() isOpen: boolean = false;
    @Output() closeEvent = new EventEmitter<void>();

    closeModal() {
        this.closeEvent.emit();
    }
}