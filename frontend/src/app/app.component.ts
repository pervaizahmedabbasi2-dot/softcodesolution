import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DomTranslatorService } from './services/dom-translator.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  constructor() {
    inject(DomTranslatorService).init();
  }
}