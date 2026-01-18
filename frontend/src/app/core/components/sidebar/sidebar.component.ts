import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export interface UserProfile {
  name: string;
  initials: string;
  role: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  // Navigation items with Structure page for entity relationships
  navItems: NavItem[] = [
    { label: 'Command Center', icon: 'command', route: '/' },
    { label: 'Engagements', icon: 'briefcase', route: '/engagements' },
    { label: 'Structure', icon: 'git-branch', route: '/structure' },
    { label: 'Documents', icon: 'file-text', route: '/documents' },
    { label: 'Dashboard', icon: 'bar-chart-2', route: '/dashboard' },
  ];

  // User profile
  userProfile: UserProfile = {
    name: 'Avengers User',
    initials: 'AV',
    role: 'Consultant',
  };

  showProfileMenu = false;

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }
}
