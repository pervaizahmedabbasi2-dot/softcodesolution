import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Users, UserPlus, Shield, CheckCircle2, AlertTriangle, Trash2, Mail, RefreshCcw, Search, Key, MoreVertical, X } from 'lucide-angular';
import { BackendService, TeamMember } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './teams.component.html'
})
export class DashboardTeamsComponent implements OnInit {
  private backend = inject(BackendService);

  readonly icons = {
    Users,
    UserPlus,
    Shield,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    Mail,
    RefreshCcw,
    Search,
    Key,
    MoreVertical,
    X
  };

  members: TeamMember[] = [];
  filteredMembers: TeamMember[] = [];
  isLoading = false;
  searchQuery = '';
  selectedDepartment = 'all';

  // Modal State
  isInviteOpen = false;
  inviteName = '';
  inviteEmail = '';
  inviteRole = 'Security Analyst';
  inviteDept = 'InfraSec';
  isSubmitting = false;

  async ngOnInit(): Promise<void> {
    await this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    this.isLoading = true;
    try {
      const res = await this.backend.getTeamMembers();
      this.members = res.members || [];
      this.applyFilter();
    } finally {
      this.isLoading = false;
    }
  }

  applyFilter(): void {
    let list = [...this.members];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
    }
    if (this.selectedDepartment !== 'all') {
      list = list.filter(m => m.department.toLowerCase() === this.selectedDepartment.toLowerCase());
    }
    this.filteredMembers = list;
  }

  openInviteModal(): void {
    this.inviteName = '';
    this.inviteEmail = '';
    this.isInviteOpen = true;
  }

  closeInviteModal(): void {
    this.isInviteOpen = false;
  }

  async submitInvite(): Promise<void> {
    if (!this.inviteEmail.trim()) return;
    this.isSubmitting = true;
    try {
      const res = await this.backend.inviteTeamMember({
        name: this.inviteName.trim() || this.inviteEmail.split('@')[0],
        email: this.inviteEmail.trim(),
        role: this.inviteRole,
        department: this.inviteDept
      });
      if (res.ok && res.member) {
        this.members.unshift(res.member);
        this.applyFilter();
        this.closeInviteModal();
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  async removeMember(id: string): Promise<void> {
    if (!confirm('Are you sure you want to revoke this user account access?')) return;
    const ok = await this.backend.removeTeamMember(id);
    if (ok) {
      this.members = this.members.filter(m => m.id !== id);
      this.applyFilter();
    }
  }

  getInitials(name: string): string {
    return (name || 'TM')
      .split(' ')
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
