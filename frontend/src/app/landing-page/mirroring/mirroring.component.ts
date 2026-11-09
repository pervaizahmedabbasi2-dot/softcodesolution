import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mirroring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mirroring.component.html',
  styles: []
})
export class MirroringComponent {
  @Input() isOpen: boolean = false; // Footer se signal lega
  @Output() closeEvent = new EventEmitter<void>(); // Band karne ka signal wapas bhejega

  closeModal() {
    this.closeEvent.emit();
  }
}