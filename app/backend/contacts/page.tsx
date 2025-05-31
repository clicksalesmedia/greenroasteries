'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, TrashIcon, EyeIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import BackendLayout from '../components/BackendLayout';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'NEW' | 'READ' | 'REPLIED' | 'RESOLVED' | 'ARCHIVED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

type ContactStatus = 'NEW' | 'READ' | 'REPLIED' | 'RESOLVED' | 'ARCHIVED';

export default function ContactsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'ALL'>('ALL');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingContact, setDeletingContact] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: '1',
          limit: '50',
          ...(statusFilter !== 'ALL' && { status: statusFilter }),
          ...(searchQuery && { search: searchQuery })
        });

        const response = await fetch(`/api/contacts?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch contacts');
        }
        
        const data = await response.json();
        setContacts(data.contacts || []);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError('Failed to load contacts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, [statusFilter, searchQuery]);
  
  const toggleContactDetails = (contactId: string) => {
    const newSelectedId = selectedContactId === contactId ? null : contactId;
    setSelectedContactId(newSelectedId);
    
    // Mark as read when opening
    if (newSelectedId) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact && contact.status === 'NEW') {
        handleStatusChange(contactId, 'READ');
      }
    }
  };
  
  const handleStatusChange = async (contactId: string, newStatus: ContactStatus) => {
    try {
      setUpdatingStatus(contactId);
      
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update contact status');
      }
      
      // Update the local state with the updated contact
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === contactId ? { ...contact, status: newStatus, updatedAt: new Date().toISOString() } : contact
        )
      );
      
      console.log(`Contact ${contactId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating contact status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update contact status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this contact message? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingContact(contactId);
      
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete contact');
      }
      
      // Remove the contact from local state
      setContacts(prevContacts => prevContacts.filter(contact => contact.id !== contactId));
      
      // Close expanded details if this contact was expanded
      if (selectedContactId === contactId) {
        setSelectedContactId(null);
      }
      
      console.log(`Contact ${contactId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete contact');
    } finally {
      setDeletingContact(null);
    }
  };
  
  const filteredContacts = contacts.filter(contact => {
    // Apply status filter
    if (statusFilter !== 'ALL' && contact.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.subject.toLowerCase().includes(query) ||
        contact.message.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  const getStatusClass = (status: ContactStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'READ':
        return 'bg-yellow-100 text-yellow-800';
      case 'REPLIED':
        return 'bg-purple-100 text-purple-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <BackendLayout activePage="contacts">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">{t('contacts', 'Contact Messages')}</h1>
            <p className="mt-2 text-sm text-gray-700">
              {t('contacts_management_description', 'Manage customer contact messages and inquiries from your website.')}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="bg-red-100 px-2 py-1 text-sm font-medium text-red-800 rounded-md hover:bg-red-200"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          {/* Status filter */}
          <div className="w-full sm:w-52">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('status', 'Status')}
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContactStatus | 'ALL')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            >
              <option value="ALL">{t('all_statuses', 'All Statuses')}</option>
              <option value="NEW">{t('new', 'New')}</option>
              <option value="READ">{t('read', 'Read')}</option>
              <option value="REPLIED">{t('replied', 'Replied')}</option>
              <option value="RESOLVED">{t('resolved', 'Resolved')}</option>
              <option value="ARCHIVED">{t('archived', 'Archived')}</option>
            </select>
          </div>
          
          {/* Search */}
          <div className="w-full">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              {t('search', 'Search')}
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                placeholder={t('search_placeholder', 'Search by name, email, subject, message...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Contacts List */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <ChatBubbleBottomCenterTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">{t('no_contacts_found', 'No contact messages found')}</p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          {t('name_email', 'Name & Email')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('subject', 'Subject')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('date', 'Date')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('status', 'Status')}
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">{t('actions', 'Actions')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredContacts.map((contact) => (
                        <React.Fragment key={contact.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                              <div className="font-medium text-gray-900">{contact.name}</div>
                              <div className="text-gray-500">{contact.email}</div>
                              {contact.phone && (
                                <div className="text-gray-500 text-xs">{contact.phone}</div>
                              )}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              <div className="max-w-xs truncate">{contact.subject}</div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatDate(contact.createdAt)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <select
                                value={contact.status}
                                onChange={(e) => handleStatusChange(contact.id, e.target.value as ContactStatus)}
                                disabled={updatingStatus === contact.id}
                                className={`${getStatusClass(contact.status)} border-0 rounded-full py-1 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50`}
                              >
                                <option value="NEW">{t('new', 'New')}</option>
                                <option value="READ">{t('read', 'Read')}</option>
                                <option value="REPLIED">{t('replied', 'Replied')}</option>
                                <option value="RESOLVED">{t('resolved', 'Resolved')}</option>
                                <option value="ARCHIVED">{t('archived', 'Archived')}</option>
                              </select>
                              {updatingStatus === contact.id && (
                                <div className="mt-1 text-xs text-gray-500">Updating...</div>
                              )}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleContactDetails(contact.id)}
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  {t('view', 'View')}
                                </button>
                                <button
                                  onClick={() => handleDeleteContact(contact.id)}
                                  disabled={deletingContact === contact.id}
                                  className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                                  title={t('delete_contact', 'Delete Contact')}
                                >
                                  {deletingContact === contact.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                                  ) : (
                                    <TrashIcon className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {selectedContactId === contact.id && (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 sm:px-6">
                                <div className="bg-gray-50 p-6 rounded-lg">
                                  <h4 className="text-lg font-medium text-gray-900 mb-4">{t('message_details', 'Message Details')}</h4>
                                  
                                  <div className="space-y-4">
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">{t('message', 'Message')}</h5>
                                      <div className="bg-white p-4 rounded border text-sm text-gray-900 whitespace-pre-wrap">
                                        {contact.message}
                                      </div>
                                    </div>
                                    
                                    {contact.notes && (
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-700 mb-2">{t('admin_notes', 'Admin Notes')}</h5>
                                        <div className="bg-yellow-50 p-4 rounded border text-sm text-gray-900 whitespace-pre-wrap">
                                          {contact.notes}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="flex gap-2 pt-4">
                                      <a
                                        href={`mailto:${contact.email}?subject=Re: ${contact.subject}`}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                      >
                                        {t('reply_via_email', 'Reply via Email')}
                                      </a>
                                      
                                      {contact.phone && (
                                        <a
                                          href={`tel:${contact.phone}`}
                                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                        >
                                          {t('call', 'Call')}
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BackendLayout>
  );
} 