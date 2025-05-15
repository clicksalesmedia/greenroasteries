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

export default function BackendDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const authCheckDone = useRef(false);
  const { t, language } = useLanguage();
  
  const currentDate = new Date();
  const productCount = 125;
  
  // Dashboard statistics state
  const [stats, setStats] = useState({
    todayOrders: 12,
    totalProducts: productCount,
    activePromotions: 3,
    totalRevenue: 12500,
    totalCustomers: 89,
    pendingOrders: 7
  });
  
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
            
            // Once authenticated, generate dummy data for charts
            generateChartData();
          } else {
            console.log('No authenticated user found, redirecting to login');
            // Use direct navigation to prevent loops
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
  
  // Generate dummy chart data for demonstration
  const generateChartData = () => {
    // Generate labels for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
    });
    
    // Generate labels for months
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' });
    });
    
    // Sales data for the last 7 days
    setSalesData({
      labels: last7Days,
      datasets: [
        {
          label: t('revenue', 'Revenue'),
          data: [1200, 1900, 1500, 2500, 1800, 2800, 2200],
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.3,
        },
        {
          label: t('orders', 'Orders'),
          data: [8, 12, 9, 14, 10, 15, 12],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.3,
        }
      ]
    });
    
    // Top 5 product performance
    setProductPerformance({
      labels: ['Arabica', 'Espresso Blend', 'Ethiopian', 'Colombian', 'Organic Decaf'],
      datasets: [
        {
          label: t('sales_amount', 'Sales Amount'),
          data: [4200, 3800, 3200, 2700, 2200],
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
    
    // Customer growth by month
    setCustomerGrowth({
      labels: last6Months,
      datasets: [
        {
          label: t('new_customers', 'New Customers'),
          data: [12, 19, 15, 25, 22, 30],
          backgroundColor: 'rgba(75, 192, 192, 0.7)'
        }
      ]
    });
  };
  
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
        text: t('sales_trend', 'Sales Trend'),
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
        text: t('top_products', 'Top Products'),
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
        text: t('customer_growth', 'Customer Growth'),
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };
  
  // Generate data for order status doughnut chart
  const orderStatusData = {
    labels: [
      t('new', 'New'),
      t('processing', 'Processing'),
      t('shipped', 'Shipped'),
      t('delivered', 'Delivered'),
      t('cancelled', 'Cancelled')
    ],
    datasets: [
      {
        data: [7, 5, 8, 12, 3],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
      }
    ]
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
      
      <div className="mb-4 text-gray-600">
        {formatDate(currentDate, language)}
      </div>
      
      {/* KPI Cards - Now with more statistics */}
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
          <p className="text-sm text-amber-600 mt-1">{t('total_revenue', 'Revenue')}: ${formatNumber(stats.totalRevenue, language)}</p>
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
              <Doughnut data={orderStatusData} />
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
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#ORD-2451</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Ahmed Hassan</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date().toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$85.00</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {t('delivered', 'Delivered')}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#ORD-2450</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sarah Johnson</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(Date.now() - 86400000).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$122.50</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {t('processing', 'Processing')}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#ORD-2449</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mohammed Ali</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(Date.now() - 172800000).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$210.75</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {t('shipped', 'Shipped')}
                  </span>
                </td>
              </tr>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sales', 'Sales')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Arabica Premium</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Coffee Beans</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$28.50</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">32</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">145</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Espresso Blend</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Coffee Beans</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$25.00</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">45</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">112</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Ethiopian Special</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Coffee Beans</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$32.75</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">98</td>
              </tr>
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
