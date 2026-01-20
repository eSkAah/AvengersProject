import { Component, ChangeDetectionStrategy, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Home, Briefcase, FolderOpen, GitBranch, BarChart2, Bell, ChevronDown, User, Settings, LogOut, Menu, X } from 'lucide-angular';
import { NotificationService } from '../../services/notification.service';

interface NavItem {
  label: string;
  icon: any;
  route: string;
  exact: boolean;
}

interface Notification {
  id: string;
  type: 'RISK_ESCALATION' | 'DEADLINE_APPROACHING' | 'DOCUMENT_UPLOADED';
  title: string;
  message: string;
  engagement_id?: string;
  dismissed: boolean;
  created_at: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  // Icons
  readonly icons = {
    home: Home,
    briefcase: Briefcase,
    folder: FolderOpen,
    gitBranch: GitBranch,
    barChart: BarChart2,
    bell: Bell,
    chevronDown: ChevronDown,
    user: User,
    settings: Settings,
    logOut: LogOut,
    menu: Menu,
    x: X
  };

  // State
  companyName = signal<string>('Real Estate Fund');
  companyLogo = signal<string | null>(null);
  userMenuOpen = signal<boolean>(false);
  notificationsOpen = signal<boolean>(false);
  mobileMenuOpen = signal<boolean>(false);

  // Navigation items
  navItems: NavItem[] = [
    { label: 'Home', icon: this.icons.home, route: '/app', exact: true },
    { label: 'Engagements', icon: this.icons.briefcase, route: '/app/engagements', exact: false },
    { label: 'Doclib', icon: this.icons.folder, route: '/app/documents', exact: false },
    { label: 'Structure', icon: this.icons.gitBranch, route: '/app/structure', exact: false },
    { label: 'Insights', icon: this.icons.barChart, route: '/app/insights', exact: false },
  ];

  // User info
  userName = signal<string>('John Doe');
  userInitials = computed(() => {
    const name = this.userName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  // Notifications
  notifications = signal<Notification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.dismissed).length);

  constructor() {
    this.loadNotifications();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Close user menu if click outside
    if (this.userMenuOpen() && !target.closest('.user-menu-container')) {
      this.userMenuOpen.set(false);
    }

    // Close notifications if click outside
    if (this.notificationsOpen() && !target.closest('.notifications-container')) {
      this.notificationsOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.userMenuOpen.set(false);
    this.notificationsOpen.set(false);
    this.mobileMenuOpen.set(false);
  }

  getCompanyInitials(): string {
    const name = this.companyName();
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  toggleUserMenu() {
    this.userMenuOpen.update(v => !v);
    this.notificationsOpen.set(false);
  }

  toggleNotifications() {
    this.notificationsOpen.update(v => !v);
    this.userMenuOpen.set(false);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  async loadNotifications() {
    try {
      const response = await this.notificationService.getNotifications();
      this.notifications.set(response.slice(0, 5));
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  }

  async dismissNotification(id: string, event: Event) {
    event.stopPropagation();
    try {
      await this.notificationService.dismissNotification(id);
      this.notifications.update(list => list.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to dismiss notification', error);
    }
  }

  async dismissAllNotifications() {
    try {
      await this.notificationService.dismissAllNotifications();
      this.notifications.set([]);
      this.notificationsOpen.set(false);
    } catch (error) {
      console.error('Failed to dismiss all notifications', error);
    }
  }

  onNotificationClick(notification: Notification) {
    this.notificationsOpen.set(false);
    if (notification.engagement_id) {
      this.router.navigate(['/app/engagements', notification.engagement_id]);
    }
  }

  getNotificationIcon(type: string): any {
    switch (type) {
      case 'RISK_ESCALATION':
        return 'alert-triangle';
      case 'DEADLINE_APPROACHING':
        return 'clock';
      case 'DOCUMENT_UPLOADED':
        return 'file-plus';
      default:
        return 'bell';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'RISK_ESCALATION':
        return 'text-error';
      case 'DEADLINE_APPROACHING':
        return 'text-warning';
      case 'DOCUMENT_UPLOADED':
        return 'text-info';
      default:
        return 'text-neutral-600';
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  }

  logout() {
    this.userMenuOpen.set(false);
    this.router.navigate(['/']);
  }
}
