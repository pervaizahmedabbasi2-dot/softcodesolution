import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about.component.html',
    styles: []
})
export class AboutComponent {
    stats = [
        { label: 'Project Success', value: '100%', description: 'Guaranteed Delivery' },
        { label: 'Full-Stack Expert', value: '01', description: 'Pervaiz Ahmed Abbasi' }, // Aapka full name yahan field mein aa gaya
        { label: 'Technology Stack', value: 'v1.0.0', description: 'SCS Core Engine' }
    ];
}