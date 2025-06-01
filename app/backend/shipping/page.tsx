'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../components/BackendLayout';
import UAEDirhamSymbol from '@/app/components/UAEDirhamSymbol';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface ShippingRule {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  type: 'STANDARD' | 'EXPRESS' | 'FREE' | 'PICKUP';
  cost: number;
  freeShippingThreshold?: number | null;
  isActive: boolean;
  estimatedDays?: number | null;
  cities: string[];
  createdAt: string;
  updatedAt: string;
}

// Frontend display types for user interface
type FrontendShippingType = 'FREE' | 'FIXED' | 'PERCENTAGE';

// Mapping functions between frontend and database types
const mapDatabaseToFrontend = (rule: ShippingRule): ShippingRule & { displayType: FrontendShippingType } => {
  let displayType: FrontendShippingType = 'FIXED';
  
  if (rule.type === 'FREE' || (rule.freeShippingThreshold && rule.cost === 0)) {
    displayType = 'FREE';
  } else if (rule.type === 'STANDARD' || rule.type === 'EXPRESS' || rule.type === 'PICKUP') {
    displayType = 'FIXED';
  }
  
  return { ...rule, displayType };
};

const mapFrontendToDatabase = (frontendType: FrontendShippingType, cost: number): 'STANDARD' | 'EXPRESS' | 'FREE' | 'PICKUP' => {
  switch (frontendType) {
    case 'FREE':
      return 'FREE';
    case 'FIXED':
    case 'PERCENTAGE':
      return 'STANDARD';
    default:
      return 'STANDARD';
  }
};

export default function ShippingManagement() {
  const { t, language } = useLanguage();
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    type: 'FIXED' as FrontendShippingType,
    cost: 0,
    minOrderAmount: '',
    maxOrderAmount: '',
    isActive: true,
    estimatedDays: '',
    cities: [] as string[],
    description: '',
    descriptionAr: ''
  });

  // Fetch shipping rules
  useEffect(() => {
    fetchShippingRules();
  }, []);

  const fetchShippingRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shipping');
      if (response.ok) {
        const data = await response.json();
        setShippingRules(data);
      } else {
        console.error('Failed to fetch shipping rules');
        setShippingRules([]);
      }
    } catch (error) {
      console.error('Error fetching shipping rules:', error);
      setShippingRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const ruleData = {
        name: formData.name,
        nameAr: formData.nameAr || null,
        description: formData.description || null,
        descriptionAr: formData.descriptionAr || null,
        type: mapFrontendToDatabase(formData.type, formData.cost),
        cost: formData.type === 'FREE' ? 0 : formData.cost,
        freeShippingThreshold: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        isActive: formData.isActive,
        estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : null,
        cities: formData.cities
      };

      if (editingRule) {
        // Update existing rule
        const response = await fetch(`/api/shipping/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...ruleData,
            // Keep backend compatibility
            minOrderAmount: ruleData.freeShippingThreshold
          })
        });
        
        if (response.ok) {
          await fetchShippingRules(); // Refresh the list
        } else {
          throw new Error('Failed to update shipping rule');
        }
      } else {
        // Create new rule
        const response = await fetch('/api/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...ruleData,
            // Keep backend compatibility
            minOrderAmount: ruleData.freeShippingThreshold
          })
        });
        
        if (response.ok) {
          await fetchShippingRules(); // Refresh the list
        } else {
          throw new Error('Failed to create shipping rule');
        }
      }
      
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving shipping rule:', error);
    }
  };

  const handleEdit = (rule: ShippingRule) => {
    const mappedRule = mapDatabaseToFrontend(rule);
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      nameAr: rule.nameAr || '',
      type: mappedRule.displayType,
      cost: rule.cost,
      minOrderAmount: rule.freeShippingThreshold?.toString() || '',
      maxOrderAmount: '',
      isActive: rule.isActive,
      estimatedDays: rule.estimatedDays?.toString() || '',
      cities: rule.cities || [],
      description: rule.description || '',
      descriptionAr: rule.descriptionAr || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirm_delete', 'Are you sure you want to delete this shipping rule?'))) {
      try {
        const response = await fetch(`/api/shipping/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await fetchShippingRules(); // Refresh the list
        } else {
          throw new Error('Failed to delete shipping rule');
        }
      } catch (error) {
        console.error('Error deleting shipping rule:', error);
      }
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/shipping/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });
      
      if (response.ok) {
        await fetchShippingRules(); // Refresh the list
      } else {
        throw new Error('Failed to toggle shipping rule');
      }
    } catch (error) {
      console.error('Error toggling shipping rule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      type: 'FIXED',
      cost: 0,
      minOrderAmount: '',
      maxOrderAmount: '',
      isActive: true,
      estimatedDays: '',
      cities: [],
      description: '',
      descriptionAr: ''
    });
    setEditingRule(null);
  };

  const formatPrice = (price: number) => (
    <span className="flex items-center gap-1">
      {price.toFixed(2)}
      <UAEDirhamSymbol size={12} />
    </span>
  );

  const getDisplayType = (rule: ShippingRule) => {
    const mapped = mapDatabaseToFrontend(rule);
    return mapped.displayType;
  };

  return (
    <BackendLayout activePage="shipping">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('shipping_management', 'Shipping Management')}</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            {t('add_shipping_rule', 'Add Shipping Rule')}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">{t('loading', 'Loading...')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('name', 'Name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('type', 'Type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('cost', 'Cost')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('conditions', 'Conditions')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status', 'Status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('estimated_days', 'Estimated Days')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shippingRules.map((rule) => {
                  const displayType = getDisplayType(rule);
                  return (
                    <tr key={rule.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {language === 'ar' && rule.nameAr ? rule.nameAr : rule.name}
                          </div>
                          {rule.description && (
                            <div className="text-sm text-gray-500">
                              {language === 'ar' && rule.descriptionAr ? rule.descriptionAr : rule.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          displayType === 'FREE' ? 'bg-green-100 text-green-800' :
                          displayType === 'FIXED' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {displayType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rule.type === 'FREE' || (rule.freeShippingThreshold && rule.cost === 0) ? (
                          <span className="text-green-600 font-medium">{t('free', 'Free')}</span>
                        ) : (
                          formatPrice(rule.cost)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rule.freeShippingThreshold && (
                          <div className="flex items-center gap-1">
                            {t('min_order', 'Min order')}: {formatPrice(rule.freeShippingThreshold)}
                          </div>
                        )}
                        {rule.cities.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {t('cities', 'Cities')}: {rule.cities.join(', ')}
                          </div>
                        )}
                        {!rule.freeShippingThreshold && rule.cities.length === 0 && (
                          <span className="text-gray-400">{t('no_conditions', 'No conditions')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(rule.id, rule.isActive)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rule.isActive ? t('active', 'Active') : t('inactive', 'Inactive')}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rule.estimatedDays ? `${rule.estimatedDays} ${t('days', 'days')}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(rule)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for adding/editing shipping rules */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingRule ? t('edit_shipping_rule', 'Edit Shipping Rule') : t('add_shipping_rule', 'Add Shipping Rule')}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name_english', 'Name (English)')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name_arabic', 'Name (Arabic)')}
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('shipping_type', 'Shipping Type')}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as FrontendShippingType })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="FREE">{t('free_shipping', 'Free Shipping')}</option>
                    <option value="FIXED">{t('fixed_rate', 'Fixed Rate')}</option>
                  </select>
                </div>

                {formData.type !== 'FREE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('cost_aed', 'Cost (AED)')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('free_shipping_threshold', 'Free Shipping Threshold (AED)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder={t('optional', 'Optional')}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('free_shipping_help', 'Orders above this amount get free shipping')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('estimated_delivery_days', 'Estimated Delivery Days')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimatedDays}
                    onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder={t('optional', 'Optional')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('description_english', 'Description (English)')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('description_arabic', 'Description (Arabic)')}
                  </label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                    dir="rtl"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    {t('active', 'Active')}
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    {editingRule ? t('update', 'Update') : t('create', 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </BackendLayout>
  );
} 