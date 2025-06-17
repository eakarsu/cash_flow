import React, { useState } from 'react';
import { Book, ChevronRight, Download, Search, FileText, BarChart3, Upload, Settings } from 'lucide-react';

const DocumentationPage: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Book,
      content: {
        title: 'Getting Started with Cash Flow Manager',
        sections: [
          {
            title: 'Welcome to Cash Flow Manager',
            content: 'Cash Flow Manager is a comprehensive financial management tool designed to help businesses monitor, analyze, and forecast their cash flow with precision. This guide will help you get started quickly and efficiently.'
          },
          {
            title: 'First Steps',
            content: '1. **Import Your Data**: Start by importing your existing transaction data using our CSV import feature.\n2. **Review Dashboard**: Familiarize yourself with the main dashboard and key metrics.\n3. **Set Up Categories**: Organize your transactions with meaningful categories.\n4. **Explore Analytics**: Use our analytics tools to gain insights into your cash flow patterns.'
          },
          {
            title: 'Navigation Overview',
            content: 'The main navigation includes:\n- **Dashboard**: Overview of your financial health\n- **Analytics**: Detailed analysis tools and forecasting\n- **Transactions**: Manage and view all transactions\n- **Reports**: Generate comprehensive financial reports'
          }
        ]
      }
    },
    {
      id: 'transactions',
      title: 'Transaction Management',
      icon: FileText,
      content: {
        title: 'Managing Transactions',
        sections: [
          {
            title: 'Adding Transactions',
            content: 'You can add transactions manually by clicking "Add Transaction" from the dashboard or transactions page. Fill in the required fields:\n- **Date**: Transaction date (YYYY-MM-DD format)\n- **Description**: Clear description of the transaction\n- **Amount**: Positive for inflows, negative for outflows\n- **Category**: Select or create a category\n- **Balance**: Account balance after transaction'
          },
          {
            title: 'Importing from CSV',
            content: 'To import bulk transaction data:\n1. Prepare your CSV file with columns: Date, Description, Amount, Category, Balance\n2. Go to Transactions > Import CSV\n3. Select your file and upload\n4. Review imported transactions for accuracy'
          },
          {
            title: 'Editing and Deleting',
            content: 'From the transactions list, you can:\n- **Edit**: Click the edit button to modify transaction details\n- **Delete**: Remove transactions permanently (use with caution)\n- **Search**: Use the search function to find specific transactions'
          }
        ]
      }
    },
    {
      id: 'analytics',
      title: 'Analytics & Forecasting',
      icon: BarChart3,
      content: {
        title: 'Analytics and Forecasting',
        sections: [
          {
            title: 'Cash Flow Analytics',
            content: 'Our analytics suite provides:\n- **Inflow Analysis**: Track revenue sources and patterns\n- **Outflow Analysis**: Monitor expenses by category\n- **Trend Analysis**: Identify seasonal patterns and growth trends\n- **Category Breakdown**: Understand spending distribution'
          },
          {
            title: '13-Week Forecast',
            content: 'The cash flow forecast projects your financial position for the next 13 weeks based on:\n- Historical transaction patterns\n- Seasonal adjustments\n- Growth trends\n- Multiple scenarios (optimistic, realistic, pessimistic)'
          },
          {
            title: 'Cash Runway',
            content: 'Cash runway shows how long your current cash will last:\n- Calculated using current balance and burn rate\n- Based on average monthly outflows\n- Includes scenario planning\n- Provides early warning alerts'
          }
        ]
      }
    },
    {
      id: 'reports',
      title: 'Reports & Export',
      icon: Download,
      content: {
        title: 'Reports and Data Export',
        sections: [
          {
            title: 'Financial Reports',
            content: 'Generate comprehensive reports including:\n- **Summary Reports**: High-level financial overview\n- **Detailed Reports**: Transaction-level analysis\n- **Category Reports**: Spending by category\n- **Period Reports**: Monthly, quarterly, or yearly summaries'
          },
          {
            title: 'Export Options',
            content: 'Export your data in multiple formats:\n- **CSV**: For spreadsheet analysis\n- **JSON**: For data integration\n- **PDF**: For presentation and sharing\n- **Custom Reports**: Tailored to your needs'
          },
          {
            title: 'Scheduling Reports',
            content: 'Set up automated report generation:\n- Daily, weekly, or monthly schedules\n- Email delivery options\n- Custom report templates\n- Stakeholder distribution lists'
          }
        ]
      }
    },
    {
      id: 'settings',
      title: 'Settings & Configuration',
      icon: Settings,
      content: {
        title: 'Settings and Configuration',
        sections: [
          {
            title: 'Account Settings',
            content: 'Manage your account preferences:\n- **Profile Information**: Update personal details\n- **Notification Preferences**: Configure alerts and emails\n- **Security Settings**: Password and authentication\n- **Data Preferences**: Currency and date formats'
          },
          {
            title: 'Categories Management',
            content: 'Organize your transactions with categories:\n- Create custom categories\n- Set default categories for imports\n- Merge or split categories\n- Archive unused categories'
          },
          {
            title: 'Integration Settings',
            content: 'Connect with external systems:\n- Bank account connections\n- Accounting software integration\n- API access configuration\n- Webhook setup for real-time updates'
          }
        ]
      }
    }
  ];

  const selectedContent = sections.find(s => s.id === selectedSection)?.content;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Documentation</h1>
          <p className="text-gray-600">Complete user guide and API documentation for Cash Flow Manager</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documentation</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        selectedSection === section.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className="h-4 w-4 mr-3" />
                      {section.title}
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">{selectedContent?.title}</h2>
              </div>
              <div className="px-6 py-6">
                {selectedContent?.sections.map((section, index) => (
                  <div key={index} className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h3>
                    <div className="prose prose-gray max-w-none">
                      {section.content.split('\n').map((paragraph, pIndex) => {
                        if (paragraph.startsWith('- **') || paragraph.startsWith('1. **') || paragraph.startsWith('2. **') || paragraph.startsWith('3. **') || paragraph.startsWith('4. **')) {
                          const parts = paragraph.split('**');
                          return (
                            <p key={pIndex} className="mb-2">
                              <strong>{parts[1]}</strong>{parts[2]}
                            </p>
                          );
                        }
                        return paragraph && <p key={pIndex} className="mb-4 text-gray-600">{paragraph}</p>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <Upload className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API Documentation</h3>
            <p className="text-gray-600 mb-4">Integrate Cash Flow Manager with your existing systems</p>
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              View API Docs →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <Download className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Download PDF Guide</h3>
            <p className="text-gray-600 mb-4">Get the complete user manual as a PDF</p>
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              Download PDF →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <FileText className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Release Notes</h3>
            <p className="text-gray-600 mb-4">Stay updated with the latest features and improvements</p>
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              View Updates →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
