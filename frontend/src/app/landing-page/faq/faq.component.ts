import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FAQ {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styles: []
})
export class FaqComponent {

  // Current selected category
  selectedCategory: string = 'Technical';

  // Structured Data (Comprehensive FAQ for SoftCodeSolution)
  faqData: any = {
    'Technical': [
      {
        question: "How is data isolation handled in SoftCodeSolution's multi-tenant architecture?",
        answer: "Our platform utilizes a highly secure multi-tenant database isolation architecture. Each tenant/client has logically separated schemas with dedicated security keys. This ensures zero data leakage, high query performance, and bank-grade data isolation between your different branches or system tenants."
      },
      {
        question: "What technology stack powers the SoftCodeSolution ecosystem?",
        answer: "We employ a modern, ultra-fast tech stack: our backend services are powered by the native high-performance Go (Golang) engine, the desktop framework runs on lightweight Wails, and the frontend web and desktop user interface is built using dynamic, interactive Angular with Tailwind CSS."
      },
      {
        question: "How does the system handle high-concurrency traffic during peak hours?",
        answer: "Thanks to Go’s native goroutines and lightweight concurrency model, our backend can easily process tens of thousands of concurrent requests with minimal memory footprint, ensuring a zero-lag experience for your cashiers and managers."
      }
    ],
    'Hybrid Sync & Hardware': [
      {
        question: "How does the Hybrid-Sync Protocol function during internet outages?",
        answer: "When your internet goes down, the local Wails desktop container seamlessly takes over, caching all transactions in an optimized local offline database. The moment your internet is restored, our bi-directional Hybrid-Sync protocol automatically reconciles the offline data with the cloud server without interrupting active operations."
      },
      {
        question: "What hardware peripherals are natively supported?",
        answer: "We support standard retail hardware out of the box through our proprietary driver abstraction layer. This includes ESC/POS thermal receipt printers (via direct serial/USB/network connections), 1D/2D USB barcode scanners, cash drawers, and specialized biometric/RFID readers for schools and gyms."
      },
      {
        question: "Do we need to install separate drivers or heavy software for printing?",
        answer: "No. Our system features native integration that communicates directly with your thermal printers. We bypass heavy, slow operating system print dialogs to send raw ESC/POS commands, making printing instant and extremely reliable."
      }
    ],
    'Enterprise & Scale': [
      {
        question: "Can we manage multiple international locations and multi-currency billing?",
        answer: "Absolutely. SoftCodeSolution is engineered for global scale. From a single Master Admin Dashboard, you can monitor and manage unlimited branches, assign region-specific currencies, adjust localized tax settings, and track real-time consolidated reports."
      },
      {
        question: "How are software updates and feature rollouts deployed?",
        answer: "We utilize a modern automated deployment pipeline. All cloud updates are pushed with zero downtime. For the desktop application, lightweight updates are automatically fetched and applied in the background whenever the application is launched with an active internet connection."
      },
      {
        question: "Is there a limit on the number of users, products, or transactions we can record?",
        answer: "No. Our database engine is optimized to scale infinitely. Whether you have 500 products or 100,000+ SKUs, and whether you run a few transactions or millions of operations monthly, our system handles it without any performance degradation."
      }
    ],
    'Security & Operations': [
      {
        question: "How secure is our database, and how often are automated backups taken?",
        answer: "Security is our highest priority. All data transmitted between the local client and cloud servers is encrypted using SSL/TLS protocols. Additionally, we run automated, encrypted daily cloud backups so your business critical data can be completely restored instantly in case of physical hardware damage."
      },
      {
        question: "Does the system support Role-Based Access Control (RBAC)?",
        answer: "Yes. You can define highly granular, custom permission roles for your team. For example, you can restrict cashiers from editing pricing or viewing master financial reports, while allowing branch managers and top-tier admins full operational access."
      },
      {
        question: "What custom specialized modules do you offer for different industries?",
        answer: "We provide tailor-made modules for multiple industries including: Student Fee & Grading Systems for Schools/Colleges, Expiry Alerts & Batch Tracking for Pharmacy Medical, and Member Attendance & Subscription tracking for Gym & Fitness centers—all within the same cohesive dashboard ecosystem."
      }
    ]
  };

  getCategories() {
    return Object.keys(this.faqData);
  }

  setCategory(cat: string) {
    this.selectedCategory = cat;
  }
}