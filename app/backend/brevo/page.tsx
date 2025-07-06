'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'framer-motion';
import BackendLayout from '../components/BackendLayout';
import { 
  EnvelopeIcon, 
  UsersIcon, 
  ChartBarIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface BrevoStats {
  totalCustomers: number;
  totalLeads: number;
  brevoLists: Array<{
    id: number;
    name: string;
    totalSubscribers: number;
    createdAt: string;
  }>;
}

interface ImportResults {
  customersImported: number;
  leadsImported: number;
  errors: string[];
}

interface SetupResults {
  listsCreated: string[];
  listsExisting: string[];
  errors: string[];
}

export default function BrevoManagement() {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<BrevoStats | null>(null);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [setupResults, setSetupResults] = useState<SetupResults | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'import' | 'setup' | 'logs'>('dashboard');

  // Fetch initial data
  useEffect(() => {
    fetchStats();
    checkSetupStatus();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/brevo/import');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/brevo/setup');
      if (response.ok) {
        const data = await response.json();
        setIsConfigured(data.isConfigured);
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
    }
  };

  const handleSetupLists = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/brevo/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup-lists' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSetupResults(data.results);
        setSuccess('Brevo lists setup completed successfully!');
        await checkSetupStatus();
        await fetchStats();
      } else {
        setError(data.error || 'Failed to setup Brevo lists');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (type: 'customers' | 'leads' | 'all') => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/brevo/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setImportResults(data.results);
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} import completed successfully!`);
        await fetchStats();
      } else {
        setError(data.error || 'Failed to import data');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <BackendLayout activePage="brevo">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Brevo Integration Management</h1>
          <p className="text-gray-600">Manage customer email lists and synchronization with Brevo</p>
          
          {/* Status Badge */}
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isConfigured 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isConfigured ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Configured
                </>
              ) : (
                <>
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  Not Configured
                </>
              )}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
              { id: 'setup', name: 'Setup', icon: Cog6ToothIcon },
              { id: 'import', name: 'Import', icon: CloudArrowUpIcon },
              { id: 'logs', name: 'Activity', icon: EyeIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Alert Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-md p-4"
          >
            <div className="flex">
              <XCircleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-md p-4"
          >
            <div className="flex">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UsersIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.totalCustomers || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <EnvelopeIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.totalLeads || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Brevo Lists</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats?.brevoLists?.length || 0}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Brevo Lists Table */}
            {stats?.brevoLists && stats.brevoLists.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Brevo Lists</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            List Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subscribers
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.brevoLists.map((list) => (
                          <tr key={list.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {list.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {list.totalSubscribers}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(list.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Brevo Lists Setup</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Create the required Brevo lists for customer segmentation and email marketing.
                </p>
                
                <button
                  onClick={handleSetupLists}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                  Setup Brevo Lists
                </button>

                {setupResults && (
                  <div className="mt-6 space-y-4">
                    {setupResults.listsCreated.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-600 mb-2">Lists Created:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {setupResults.listsCreated.map((list, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                              {list}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {setupResults.listsExisting.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-600 mb-2">Lists Already Exist:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {setupResults.listsExisting.map((list, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircleIcon className="w-4 h-4 text-blue-500 mr-2" />
                              {list}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {setupResults.errors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-600 mb-2">Errors:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {setupResults.errors.map((error, index) => (
                            <li key={index} className="flex items-center">
                              <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Import Data to Brevo</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Import existing customers and leads to Brevo for email marketing campaigns.
                </p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleImport('customers')}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {loading && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                      Import Customers
                    </button>

                    <button
                      onClick={() => handleImport('leads')}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                      Import Leads
                    </button>

                    <button
                      onClick={() => handleImport('all')}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      {loading && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                      Import All
                    </button>
                  </div>
                </div>

                {importResults && (
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-green-600 mb-2">Import Summary</h4>
                        <p className="text-sm text-gray-600">
                          Customers Imported: <span className="font-semibold">{importResults.customersImported}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Leads Imported: <span className="font-semibold">{importResults.leadsImported}</span>
                        </p>
                      </div>

                      {importResults.errors.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-red-600 mb-2">Errors ({importResults.errors.length})</h4>
                          <div className="max-h-32 overflow-y-auto">
                            {importResults.errors.map((error, index) => (
                              <p key={index} className="text-xs text-gray-600 mb-1">{error}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
              <p className="text-sm text-gray-600 mb-6">
                View recent Brevo integration activity and logs.
              </p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-green-400 bg-green-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        <strong>Auto-sync enabled:</strong> New customers and leads will be automatically synced to Brevo
                      </p>
                      <p className="text-xs text-green-600 mt-1">Integration is working properly</p>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Email segmentation:</strong> Customers are automatically organized into appropriate lists
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Based on customer type and lead status</p>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Data sync:</strong> Customer purchase history and preferences are synchronized
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">For personalized email campaigns</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              fetchStats();
              checkSetupStatus();
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>
      </div>
    </BackendLayout>
  );
} 