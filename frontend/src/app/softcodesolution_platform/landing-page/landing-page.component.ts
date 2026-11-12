import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from './hero/hero.component';
import { SolutionsComponent } from './solutions/solutions.component';
import { StoreComponent } from './store/store.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { TechnologyComponent } from './technology/technology.component';
import { TestimonialComponent } from './testimonial/testimonial.component';
import { FaqComponent } from './faq/faq.component';
import { AboutComponent } from './about/about.component';
import { FooterComponent } from './footer/footer.component';
import { ContactSupportComponent } from './contact-support/contact-support.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    SolutionsComponent,
    StoreComponent,
    HowItWorksComponent,
    TechnologyComponent,
    TestimonialComponent,
    FaqComponent,
    AboutComponent,
    FooterComponent,
    ContactSupportComponent
  ],
  template: `
    <div id="hero-section">
      <app-hero></app-hero>
    </div>

    <app-solutions></app-solutions>

    <app-technology></app-technology>

    <app-how-it-works></app-how-it-works>

    <app-store></app-store>

    <app-testimonial></app-testimonial>

    <app-faq></app-faq>

    <div id="contact-support-section">
      <app-contact-support></app-contact-support>
    </div>

    <app-about></app-about>

    <app-footer></app-footer>
  `
})
export class LandingPageComponent { 





}