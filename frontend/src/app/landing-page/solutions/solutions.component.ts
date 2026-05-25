import { Component } from '@angular/core'; // <--- CORE hona chahiye
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-solutions',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './solutions.component.html',
    styleUrls: []
})
export class SolutionsComponent { }