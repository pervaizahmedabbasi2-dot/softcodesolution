import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule, LayoutDashboard, User, Image, Layers, Briefcase,
  Cpu, Users, Files, HelpCircle, Folder, CreditCard, BookOpen,
  Plus, Palette, Building2, Key, WalletCards, ShieldCheck,
  Network, BarChart3, Globe, RefreshCcw, Mail, Settings, MenuSquare, MessageSquare,
  LogOut
} from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  userName = 'Pervaiz Ahmed Abbasi';
  userRole = 'CLIENT';
  isSidebarOpen = true;
  activeView: string = 'home';
  openDropdowns: { [key: string]: boolean } = {};
  isThemeMenuOpen = false;

  customTheme = {
    sidebar: '#1e40af',
    header: '#ffffff',
    footer: '#ffffff',
    background: '#f8fafc'
  };

  colorOptions = [
    { name: 'Royal Blue', code: '#1e40af' },
    { name: 'Dark Slate', code: '#0f172a' },
    { name: 'Emerald', code: '#059669' },
    { name: 'Rose', code: '#e11d48' },
    { name: 'Indigo', code: '#4f46e5' },
    { name: 'White', code: '#ffffff' }
  ];

  categories = [
    { id: 'rbac', label: 'RBAC (Roles)', icon: ShieldCheck, list: 'Manage Roles', add: 'Permissions' },
    { id: 'api-gate', label: 'API Gateway', icon: Network, list: 'Endpoints', add: 'Security Layer' },
    { id: 'analytics', label: 'Analytics & Logs', icon: BarChart3, list: 'Usage Stats', add: 'Audit Logs' },
    { id: 'frontend', label: 'Frontend Site', icon: Globe, list: 'Marketplace', add: 'Site Pages' },
    { id: 'updater', label: 'Auto Update', icon: RefreshCcw, list: 'Version Control', add: 'Plugins' },
    { id: 'tenants', label: 'Tenant System', icon: Building2, list: 'Multi Company', add: 'Company Create' },
    { id: 'license', label: 'License System', icon: Key, list: 'Software Key', add: 'Device Binding' },
    { id: 'payments-sys', label: 'Payment System', icon: WalletCards, list: 'Billing', add: 'Plans' },
    { id: 'admins', label: 'Admins', icon: User, list: 'List Admins', add: 'Add New' },
    { id: 'services', label: 'Services', icon: Layers, list: 'List Services', add: 'Add New' },
    { id: 'teams', label: 'Teams', icon: Users, list: 'List Teams', add: 'Add New' },
    { id: 'blogs', label: 'Blogs', icon: BookOpen, list: 'List Blogs', add: 'Add New' },
    { id: 'settings', label: 'Settings', icon: Settings, list: 'General', add: 'Security' }
  ];

  readonly icons = { LayoutDashboard, Plus, Palette, LogOut, Users, CreditCard };

  constructor(private router: Router) { }

  ngOnInit() {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      this.userRole = savedRole;
    }
  }

  logout() {
    localStorage.removeItem('userRole');
    this.router.navigate(['/']);
  }

  toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; }
  toggleDropdown(id: string) { this.openDropdowns[id] = !this.openDropdowns[id]; }
  toggleThemeMenu() { this.isThemeMenuOpen = !this.isThemeMenuOpen; }
  updateColor(part: string, color: string) { (this.customTheme as any)[part] = color; }

  navigateTo(view: string) {
    this.activeView = view;
    this.isThemeMenuOpen = false;
  }
}