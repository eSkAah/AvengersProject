import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Mail, Phone, Building2, User } from 'lucide-angular';
import { MOCK_ENTITY_DETAILS } from '../../../../core/mocks/entity-detail.mock';

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatar?: string;
  isPrimary?: boolean;
}

@Component({
  selector: 'app-entity-contacts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="entity-contacts">
      <div class="contacts-grid">
        @for (contact of contacts(); track contact.id) {
          <div class="contact-card" [class.contact-card--primary]="contact.isPrimary">
            @if (contact.isPrimary) {
              <span class="primary-badge">Primary Contact</span>
            }

            <div class="contact-avatar">
              @if (contact.avatar) {
                <img [src]="contact.avatar" [alt]="contact.name" />
              } @else {
                <lucide-icon [img]="User" [size]="24"></lucide-icon>
              }
            </div>

            <div class="contact-info">
              <h3 class="contact-name">{{ contact.name }}</h3>
              <p class="contact-role">{{ contact.role }}</p>
            </div>

            <div class="contact-details">
              <a [href]="'mailto:' + contact.email" class="contact-link">
                <lucide-icon [img]="Mail" [size]="16"></lucide-icon>
                {{ contact.email }}
              </a>
              @if (contact.phone) {
                <a [href]="'tel:' + contact.phone" class="contact-link">
                  <lucide-icon [img]="Phone" [size]="16"></lucide-icon>
                  {{ contact.phone }}
                </a>
              }
            </div>
          </div>
        }
      </div>

      @if (contacts().length === 0) {
        <div class="empty-state">
          <lucide-icon [img]="Building2" [size]="48" class="empty-icon"></lucide-icon>
          <p class="empty-text">No contacts available</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      // =============================================================================
      // Entity Contacts Component - EY Design System
      // =============================================================================

      .entity-contacts {
        padding: 0;
      }

      .contacts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
      }

      .contact-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px;
        background: white;
        border: 1px solid #e5e5e5;
        border-radius: 12px;
        text-align: center;
        transition: all 200ms ease-out;

        &:hover {
          border-color: #d4d4d4;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        &--primary {
          border-color: #ffe600;
          background: linear-gradient(180deg, rgba(255, 230, 0, 0.05) 0%, white 100%);
        }
      }

      .primary-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 600;
        color: #2e2e38;
        background: #ffe600;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .contact-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        margin-bottom: 16px;
        background: #f5f5f5;
        border-radius: 50%;
        color: #a3a3a3;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .contact-info {
        margin-bottom: 16px;
      }

      .contact-name {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #2e2e38;
        line-height: 1.4;
      }

      .contact-role {
        margin: 4px 0 0;
        font-size: 14px;
        color: #6b7280;
      }

      .contact-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }

      .contact-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 12px;
        font-size: 13px;
        color: #6b7280;
        text-decoration: none;
        background: #fafafa;
        border: 1px solid #e5e5e5;
        border-radius: 6px;
        transition: all 200ms ease-out;

        &:hover {
          color: #2e2e38;
          background: #f5f5f5;
          border-color: #d4d4d4;
        }

        lucide-icon {
          flex-shrink: 0;
          color: #a3a3a3;
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 32px;
        text-align: center;

        .empty-icon {
          color: #d4d4d4;
          margin-bottom: 16px;
        }

        .empty-text {
          font-size: 14px;
          color: #a3a3a3;
          margin: 0;
        }
      }
    `,
  ],
})
export class EntityContactsComponent {
  // Icons
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Building2 = Building2;
  readonly User = User;

  // Inputs
  entityId = input.required<string>();

  // Get contacts from mock data
  contacts = computed<Contact[]>(() => {
    const entityDetail = MOCK_ENTITY_DETAILS[this.entityId()];
    if (!entityDetail) return [];

    const emailDomain = entityDetail.name.toLowerCase().replace(/\s+/g, '-');

    // Generate mock contacts based on entity
    return [
      {
        id: '1',
        name: 'Jean-Pierre Martin',
        role: 'Financial Director',
        email: `finance@${emailDomain}.com`,
        phone: '+33 1 42 68 53 00',
        isPrimary: true,
      },
      {
        id: '2',
        name: 'Marie Dubois',
        role: 'Accounting Manager',
        email: `accounting@${emailDomain}.com`,
        phone: '+33 1 42 68 53 01',
      },
      {
        id: '3',
        name: 'Thomas Bernard',
        role: 'Tax Specialist',
        email: `tax@${emailDomain}.com`,
      },
    ];
  });
}
