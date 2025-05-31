'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { formatDate, formatNumber } from '@/app/utils/i18n';
import BackendLayout from './components/BackendLayout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  todayOrders: number;
  totalProducts: number;
  activePromotions: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
}

interface Order {
  id: string;
  customerName?: string;
  customerEmail?: string;
  total: number;
  status: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  category: { name: string; nameAr?: string } | string;
  price: number;
  stockQuantity: number;
  sales?: number;
}

export default function BackendDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const authCheckDone = useRef(false);
  const { t, language } = useLanguage();
  
  const currentDate = new Date();
  
  // Dashboard statistics state
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    totalProducts: 0,
    activePromotions: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0
  });
  
  // Data state for real data
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  
  // Chart data state
  const [salesData, setSalesData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }[];
  }>({
    labels: [],
    datasets: []
  });
  
  const [productPerformance, setProductPerformance] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderWidth: number;
    }[];
  }>({
    labels: [],
    datasets: []
  });
  
  const [customerGrowth, setCustomerGrowth] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  }>({
    labels: [],
    datasets: []
  });

  const [orderStatusData, setOrderStatusData] = useState<{
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
    }[];
  }>({
    labels: [],
    datasets: []
  });

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const [ordersRes, productsRes, customersRes, paymentsRes, promotionsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/customers'),
        fetch('/api/payments?action=stats', { method: 'PATCH' }),
        fetch('/api/promotions')
      ]);

      const [orders, products, customers, paymentsData, promotions] = await Promise.all([
        ordersRes.ok ? ordersRes.json() : { orders: [] },
        productsRes.ok ? productsRes.json() : [],
        customersRes.ok ? customersRes.json() : { customers: [] },
        paymentsRes.ok ? paymentsRes.json() : { stats: { totalRevenue: 0 } },
        promotionsRes.ok ? promotionsRes.json() : []
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.orders?.filter((order: Order) => 
        order.createdAt.startsWith(today)
      ).length || 0;

      const pendingOrders = orders.orders?.filter((order: Order) => 
        ['NEW', 'PROCESSING'].includes(order.status)
      ).length || 0;

      const activePromotions = Array.isArray(promotions) 
        ? promotions.filter((promo: any) => 
            promo.isActive && new Date(promo.endDate) > new Date()
          ).length
        : 0;

      setStats({
        todayOrders,
        totalProducts: Array.isArray(products) ? products.length : 0,
        activePromotions,
        totalRevenue: paymentsData.stats?.totalRevenue || 0,
        totalCustomers: customers.customers?.length || 0,
        pendingOrders
      });

      // Set recent orders (last 5)
      if (orders.orders) {
        setRecentOrders(orders.orders.slice(0, 5));
      }

      // Set popular products (first 5 products)
      if (Array.isArray(products)) {
        setPopularProducts(products.slice(0, 5));
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Generate chart data from real data
  const generateChartData = async () => {
    try {
      // Fetch orders for chart data
      const ordersRes = await fetch('/api/orders?limit=100');
      const ordersData = await ordersRes.json();
      const orders = ordersData.orders || [];

      // Generate labels for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          label: date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }),
          date: date.toISOString().split('T')[0]
        };
      });

      // Calculate daily sales data
      const dailySales = last7Days.map(day => {
        const dayOrders = orders.filter((order: Order) => 
          order.createdAt.startsWith(day.date)
        );
        return {
          revenue: dayOrders.reduce((sum: number, order: Order) => sum + order.total, 0),
          orderCount: dayOrders.length
        };
      });

      // Sales data for the last 7 days
      setSalesData({
        labels: last7Days.map(day => day.label),
        datasets: [
          {
            label: t('revenue', 'Revenue (AED)'),
            data: dailySales.map(day => day.revenue),
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            tension: 0.3,
          },
          {
            label: t('orders', 'Orders'),
            data: dailySales.map(day => day.orderCount),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.3,
          }
        ]
      });

      // Product performance - fetch products with order items
      const productsRes = await fetch('/api/products');
      if (productsRes.ok) {
        const products = await productsRes.json();
        const topProducts = products.slice(0, 5);
        
        setProductPerformance({
          labels: topProducts.map((product: Product) => 
            (language === 'ar' && product.nameAr) ? product.nameAr : product.name
          ),
          datasets: [
            {
              label: t('product_price', 'Product Price (AED)'),
              data: topProducts.map((product: Product) => product.price),
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
              ],
              borderWidth: 1,
            }
          ]
        });
      }

      // Customer growth by month (last 6 months)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return {
          label: date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' }),
          year: date.getFullYear(),
          month: date.getMonth()
        };
      });

      const customersRes = await fetch('/api/customers');
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        const customers = customersData.customers || [];
        
        const monthlyCustomers = last6Months.map(month => {
          return customers.filter((customer: any) => {
            const customerDate = new Date(customer.createdAt);
            return customerDate.getFullYear() === month.year && 
                   customerDate.getMonth() === month.month;
          }).length;
        });

        setCustomerGrowth({
          labels: last6Months.map(month => month.label),
          datasets: [
            {
              label: t('new_customers', 'New Customers'),
              data: monthlyCustomers,
              backgroundColor: 'rgba(75, 192, 192, 0.7)'
            }
          ]
        });
      }

      // Order status distribution
      const statusCounts = orders.reduce((acc: any, order: Order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const statusLabels = Object.keys(statusCounts);
      const statusData = Object.values(statusCounts) as number[];

      setOrderStatusData({
        labels: statusLabels.map(status => t(status.toLowerCase(), status)),
        datasets: [
          {
            data: statusData,
            backgroundColor: [
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 99, 132, 0.7)',
            ],
          }
        ]
      });

    } catch (error) {
      console.error('Error generating chart data:', error);
    }
  };

  // Check current maintenance mode status
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const res = await fetch('/api/maintenance');
        const data = await res.json();
        setMaintenanceMode(data.maintenanceMode);
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      }
    };

    checkMaintenanceMode();
  }, []);

  // Toggle maintenance mode
  const toggleMaintenanceMode = async () => {
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !maintenanceMode }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(data.maintenanceMode);
      }
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
    }
  };

  useEffect(() => {
    // Check authentication status - but only once
    const checkAuth = async () => {
      if (authCheckDone.current) return;
      authCheckDone.current = true;
      
      try {
        console.log('Checking authentication status...');
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Session response:', data);
          
          if (data.user) {
            console.log('User is authenticated:', data.user);
            setIsAuthenticated(true);
            
            // Fetch real data instead of generating dummy data
            await Promise.all([
              fetchDashboardStats(),
              generateChartData()
            ]);
          } else {
            console.log('No authenticated user found, redirecting to login');
            document.location.href = '/backend/login';
            return;
          }
        } else {
          console.log('Session API error, redirecting to login');
          document.location.href = '/backend/login';
          return;
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setError('Authentication check failed');
        document.location.href = '/backend/login';
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: t('sales_trend', 'Sales Trend (Last 7 Days)'),
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: t('top_products', 'Product Prices'),
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  const customerOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: t('customer_growth', 'Customer Growth (Last 6 Months)'),
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} AED`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">{t('loading_dashboard', 'Loading dashboard...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.href = '/backend/login'} 
            className="mt-4 bg-green-700 text-white px-4 py-2 rounded"
          >
            {t('return_to_login', 'Return to Login')}
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const dashboardContent = (
    <>
      <h1 className="text-2xl font-bold mb-6">{t('dashboard_overview', 'Dashboard Overview')}</h1>
      
      {/* Maintenance Mode Toggle */}
      <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('maintenance_mode', 'Maintenance Mode')}</h3>
            <p className="text-sm text-gray-600">{t('maintenance_description', 'Toggle maintenance mode to show a coming soon page to non-admin users')}</p>
          </div>
          <button
            onClick={toggleMaintenanceMode}
            className={`px-4 py-2 rounded-md font-medium ${
              maintenanceMode 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {maintenanceMode ? t('maintenance_enabled', 'Enabled') : t('maintenance_disabled', 'Disabled')}
          </button>
        </div>
      </div>
      
      <div className="mb-4 text-gray-600">
        {formatDate(currentDate, language)}
      </div>
      
      {/* KPI Cards - Now with real statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800">{t('todays_orders', 'Today\'s Orders')}</h3>
          <p className="text-3xl font-bold mt-2">{stats.todayOrders}</p>
          <p className="text-sm text-green-600 mt-1">{t('pending_orders', 'Pending')}: {stats.pendingOrders}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800">{t('total_products', 'Total Products')}</h3>
          <p className="text-3xl font-bold mt-2">{formatNumber(stats.totalProducts, language)}</p>
          <p className="text-sm text-blue-600 mt-1">{t('total_customers', 'Total Customers')}: {stats.totalCustomers}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h3 className="text-lg font-semibold text-amber-800">{t('active_promotions', 'Active Promotions')}</h3>
          <p className="text-3xl font-bold mt-2">{stats.activePromotions}</p>
          <p className="text-sm text-amber-600 mt-1">{t('total_revenue', 'Revenue')}: {formatCurrency(stats.totalRevenue)}</p>
        </div>
      </div>
      
      {/* Sales Trend Chart */}
      <div className="mb-8 bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">{t('sales_trends', 'Sales Trends')}</h3>
        <div className="w-full h-[400px] my-4">
          <Line options={lineOptions} data={salesData} />
        </div>
      </div>
      
      {/* Two Column Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">{t('product_performance', 'Product Performance')}</h3>
          <div className="w-full h-72">
            <Bar options={barOptions} data={productPerformance} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">{t('order_status', 'Order Status')}</h3>
          <div className="w-full h-72 flex items-center justify-center">
            <div className="w-full max-w-md mx-auto">
              {orderStatusData.labels.length > 0 ? (
                <Doughnut data={orderStatusData} />
              ) : (
                <div className="text-center text-gray-500">No order data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Customer Growth Chart */}
      <div className="mb-8 bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">{t('customer_growth', 'Customer Growth')}</h3>
        <div className="w-full h-[400px] my-4">
          <Bar options={customerOptions} data={customerGrowth} />
        </div>
      </div>
      
      {/* Recent Orders Table */}
      <div className="bg-white p-4 rounded-lg border mb-8">
        <h3 className="text-lg font-semibold mb-4">{t('recent_orders', 'Recent Orders')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('order_id', 'Order ID')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customer', 'Customer')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('date', 'Date')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('total', 'Total')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status', 'Status')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.length > 0 ? recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.customerName || order.customerEmail || 'Unknown Customer'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {t(order.status.toLowerCase(), order.status)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 text-right">
            <button 
              onClick={() => router.push('/backend/orders')}
              className="text-sm font-medium text-green-600 hover:text-green-900"
            >
              {t('view_all_orders', 'View All Orders')} →
            </button>
          </div>
        </div>
      </div>
      
      {/* Popular Products Table */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">{t('popular_products', 'Popular Products')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product_name', 'Product Name')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('category', 'Category')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('price', 'Price')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('in_stock', 'In Stock')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {popularProducts.length > 0 ? popularProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(language === 'ar' && product.nameAr) ? product.nameAr : product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof product.category === 'string' 
                      ? product.category 
                      : (language === 'ar' && product.category.nameAr) 
                        ? product.category.nameAr 
                        : product.category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stockQuantity || 'N/A'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 text-right">
            <button 
              onClick={() => router.push('/backend/products')}
              className="text-sm font-medium text-green-600 hover:text-green-900"
            >
              {t('view_all_products', 'View All Products')} →
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <BackendLayout activePage="dashboard">
      <div data-testid="dashboard-content">
        {dashboardContent}
      </div>
    </BackendLayout>
  );
}
