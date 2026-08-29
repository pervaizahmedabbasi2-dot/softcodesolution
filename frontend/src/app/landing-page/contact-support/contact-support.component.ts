import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // <-- CommonModule import kiya (NgIf ke liye)
import { RouterModule } from '@angular/router'; // <-- RouterModule import kiya (Back to Home route ke liye)

@Component({
    selector: 'app-contact-support',
    standalone: true, // <-- Ensure karein ye standalone hai
    imports: [
        CommonModule,         // <-- Yahan add kiya taake *ngIf chal sake
        ReactiveFormsModule,  // <-- Yahan add kiya taake [formGroup] aur validators chal sake
        RouterModule          // <-- Yahan add kiya taake routerLink chal sake
    ],
    templateUrl: './contact-support.component.html',
    styleUrls: ['./contact-support.component.css']
})
export class ContactSupportComponent implements OnInit {
    supportForm!: FormGroup;
    isSubmitted: boolean = false;

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.initForm();
    }

    // Initializing Reactive Form with Validations
    initForm(): void {
        this.supportForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            subject: ['saas-rental', [Validators.required]],
            message: ['', [Validators.required, Validators.minLength(10)]]
        });
    }

    // Handle Form Submission
    onSubmit(): void {
        if (this.supportForm.valid) {
            console.log('Sending Support Ticket Data:', this.supportForm.value);
            this.isSubmitted = true;
        } else {
            this.supportForm.markAllAsTouched();
        }
    }

    // Reset Form for New Inquiries
    resetForm(): void {
        this.isSubmitted = false;
        this.supportForm.reset({
            subject: 'saas-rental'
        });
    }
}