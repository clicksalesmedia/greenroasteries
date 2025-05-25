'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import BackendLayout from '../components/BackendLayout';
import UAEDirhamSymbol from '@/app/components/UAEDirhamSymbol';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface ShippingRule {
  id: string;
  name: string;
  nameAr?: string;
  type: 'FREE' | 'FIXED' | 'PERCENTAGE';
  cost: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  isActive: boolean;
  priority: number;
  description?: string;
  descriptionAr?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ShippingManagement() {
  const { t, language } = useLanguage();
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    type: 'FIXED' as 'FREE' | 'FIXED' | 'PERCENTAGE',
    cost: 0,
    minOrderAmount: '',
    maxOrderAmount: '',
    isActive: true,
    priority: 1,
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
        // Create default shipping rules if none exist
        const defaultRules: ShippingRule[] = [
          {
            id: '1',
            name: 'Free Shipping',
            nameAr: 'شحن مجاني',
            type: 'FREE',
            cost: 0,
            minOrderAmount: 200,
            isActive: true,
            priority: 1,
            description: 'Free shipping for orders over 200 AED',
            descriptionAr: 'شحن مجاني للطلبات التي تزيد عن 200 درهم',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Standard Shipping',
            nameAr: 'شحن عادي',
            type: 'FIXED',
            cost: 25,
            isActive: true,
            priority: 2,
            description: 'Standard shipping rate',
            descriptionAr: 'سعر الشحن العادي',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setShippingRules(defaultRules);
      }
    } catch (error) {
      console.error('Error fetching shipping rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const ruleData = {
        ...formData,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        maxOrderAmount: formData.maxOrderAmount ? parseFloat(formData.maxOrderAmount) : undefined,
        cost: formData.type === 'FREE' ? 0 : formData.cost
      };

      if (editingRule) {
        // Update existing rule
        const response = await fetch(`/api/shipping/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ruleData)
        });
        
        if (response.ok) {
          const updatedRule = await response.json();
          setShippingRules(prev => prev.map(rule => 
            rule.id === editingRule.id ? updatedRule : rule
          ));
        }
      } else {
        // Create new rule
        const response = await fetch('/api/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ruleData)
        });
        
        if (response.ok) {
          const newRule = await response.json();
          setShippingRules(prev => [...prev, newRule]);
        }
      }
      
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving shipping rule:', error);
    }
  };

  const handleEdit = (rule: ShippingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      nameAr: rule.nameAr || '',
      type: rule.type,
      cost: rule.cost,
      minOrderAmount: rule.minOrderAmount?.toString() || '',
      maxOrderAmount: rule.maxOrderAmount?.toString() || '',
      isActive: rule.isActive,
      priority: rule.priority,
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
          setShippingRules(prev => prev.filter(rule => rule.id !== id));
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
        setShippingRules(prev => prev.map(rule => 
          rule.id === id ? { ...rule, isActive: !isActive } : rule
        ));
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
      priority: 1,
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
                    {t('priority', 'Priority')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shippingRules.map((rule) => (
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
                        rule.type === 'FREE' ? 'bg-green-100 text-green-800' :
                        rule.type === 'FIXED' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {rule.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.type === 'FREE' ? (
                        <span className="text-green-600 font-medium">{t('free', 'Free')}</span>
                      ) : rule.type === 'PERCENTAGE' ? (
                        `${rule.cost}%`
                      ) : (
                        formatPrice(rule.cost)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.minOrderAmount && (
                        <div className="flex items-center gap-1">
                          {t('min_order', 'Min order')}: {formatPrice(rule.minOrderAmount)}
                        </div>
                      )}
                      {rule.maxOrderAmount && (
                        <div className="flex items-center gap-1">
                          {t('max_order', 'Max order')}: {formatPrice(rule.maxOrderAmount)}
                        </div>
                      )}
                      {!rule.minOrderAmount && !rule.maxOrderAmount && (
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
                      {rule.priority}
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
                ))}
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
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'FREE' | 'FIXED' | 'PERCENTAGE' })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="FREE">{t('free_shipping', 'Free Shipping')}</option>
                    <option value="FIXED">{t('fixed_rate', 'Fixed Rate')}</option>
                    <option value="PERCENTAGE">{t('percentage_rate', 'Percentage Rate')}</option>
                  </select>
                </div>

                {formData.type !== 'FREE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.type === 'PERCENTAGE' ? t('percentage', 'Percentage (%)') : t('cost_aed', 'Cost (AED)')}
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
                    {t('min_order_amount', 'Minimum Order Amount (AED)')}
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('max_order_amount', 'Maximum Order Amount (AED)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxOrderAmount}
                    onChange={(e) => setFormData({ ...formData, maxOrderAmount: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder={t('optional', 'Optional')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('priority', 'Priority')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('priority_help', 'Lower numbers have higher priority')}
                  </p>
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