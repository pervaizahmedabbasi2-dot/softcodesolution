import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Testimonial {
  name: string;
  role: string;
  initial: string;
  feedback: string;
  stars: number;
  colorClass: string;
}

@Component({
  selector: 'app-testimonial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonial.component.html',
  styles: []
})
export class TestimonialComponent implements OnInit {

  testimonials: Testimonial[] = [
    {
      name: 'Academic Director',
      role: 'School & College Management',
      initial: 'S',
      feedback: "SoftCodeSolution's management system has completely automated our fee collection and student records. The speed of the Go backend ensures that generating reports for 2,000+ students takes only seconds. Best-in-class performance!",
      stars: 5,
      colorClass: 'bg-blue-600 text-white'
    },
    {
      name: 'Chief Pharmacist',
      role: 'Pharmacy & Medical Solutions',
      initial: 'P',
      feedback: "Inventory management and expiry alerts were our biggest headache. SCS provided a seamless solution with direct thermal printer integration. The Angular 21+ interface is incredibly smooth for our staff.",
      stars: 5,
      colorClass: 'bg-slate-900 text-white'
    },
    {
      name: 'Gym Fitness Owner',
      role: 'Gym & Fitness Club',
      initial: 'G',
      feedback: "Managing memberships and attendance has never been easier. The hardware integration for biometric access through Wails is flawless. Our members love the fast check-in experience!",
      stars: 5,
      colorClass: 'bg-blue-100 text-blue-700'
    }
  ];

  constructor() { }

  ngOnInit(): void { }

  getStars(count: number): number[] {
    return Array(count).fill(0);
  }
}