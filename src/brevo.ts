/**
 * Brevo CRM: create contact, check duplicate by email/phone, add to list.
 */
import * as Brevo from '@getbrevo/brevo';
import { config } from './config';

const apiInstance = new Brevo.ContactsApi();
apiInstance.setApiKey(Brevo.ContactsApiApiKeys.apiKey, config.brevo.apiKey);

export interface BrevoContactInput {
  email: string;
  phone?: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  attributes?: Record<string, string>;
}

export interface SyncResult {
  success: boolean;
  duplicate: boolean;
  brevoContactId?: number;
  error?: string;
}

export async function findContactByEmail(email: string): Promise<{ id: number } | null> {
  try {
    const res = await apiInstance.getContactInfo(email);
    const id = (res as { body?: { id?: number } }).body?.id;
    return id != null ? { id } : null;
  } catch {
    return null;
  }
}

export async function createContact(input: BrevoContactInput): Promise<SyncResult> {
  try {
    const existing = await findContactByEmail(input.email);
    if (existing) {
      return { success: false, duplicate: true, brevoContactId: existing.id };
    }

    const createContact = new Brevo.CreateContact();
    createContact.email = input.email;
    createContact.listIds = [config.brevo.listId];
    createContact.attributes = {
      ...(input.firstName && { FIRSTNAME: input.firstName }),
      ...(input.lastName && { LASTNAME: input.lastName }),
      ...(input.company && { COMPANY: input.company }),
      ...(input.address && { ADDRESS: input.address }),
      ...(input.phone && { SMS: input.phone }),
      ...(input.attributes || {}),
    };

    const res = await apiInstance.createContact(createContact);
    const id = (res as { body?: { id?: number } }).body?.id;
    return { success: true, duplicate: false, brevoContactId: id };
  } catch (e: unknown) {
    const err = e as { response?: { body?: { message?: string } } };
    return {
      success: false,
      duplicate: false,
      error: err.response?.body?.message || String(e),
    };
  }
}
