import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Mail, Phone } from 'lucide-angular';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-contacts-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './contacts-widget.component.html',
  styleUrl: './contacts-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsWidgetComponent {
  readonly icons = {
    mail: Mail,
    phone: Phone,
  };

  readonly contacts: Contact[] = [
    {
      id: '1',
      firstName: 'Sophie',
      lastName: 'Martin',
      role: 'Tax Partner',
      email: 'sophie.martin@ey.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    },
    {
      id: '2',
      firstName: 'Thomas',
      lastName: 'Dubois',
      role: 'Senior Manager',
      email: 'thomas.dubois@ey.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    },
    {
      id: '3',
      firstName: 'Emma',
      lastName: 'Bernard',
      role: 'Tax Consultant',
      email: 'emma.bernard@ey.com',
      avatarUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    },
  ];

  onContactEmail(contact: Contact): void {
    window.location.href = `mailto:${contact.email}`;
  }
}
