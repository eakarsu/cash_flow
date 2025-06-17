import React from 'react';
import { BarChart3, TrendingUp, PieChart, Calendar, Upload, Download, Shield, Zap } from 'lucide-react';

const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Get instant insights into your cash flow with interactive charts and visualizations.'
    },
    {
      icon: TrendingUp,
      title: '13-Week Forecast',
      description: 'Plan ahead with accurate cash flow projections and scenario modeling.'
    },
    {
      icon: PieChart,
      title: 'Category Analysis',
      description: 'Break down your inflows and outflows by category to identify trends and opportunities.'
    },
    {
      icon: Calendar,
      title: 'Cash Runway Calculator',
      description: 'Know exactly how long your current cash will last based on your burn rate.'
    },
    {
      icon: Upload,
      title: 'CSV Import',
      description: 'Easily import your existing transaction data from bank statements or accounting software.'
    },
    {
      icon: Download,
      title: 'Export & Reports',
      description: 'Generate professional reports and export data in multiple formats.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your financial data is encrypted and stored securely with bank-level security.'
    },
    {
      icon: Zap,
      title: 'Fast & Intuitive',
      description: 'Lightning-fast performance with an interface designed for efficiency.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to manage, analyze, and optimize your business cash flow in one comprehensive platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <IconComponent className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Take Control of Your Cash Flow?</h2>
          <p className="text-primary-100 mb-6">
            Start managing your business finances with confidence today.
          </p>
          <button className="bg-white text-primary-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-50 transition-colors">
            Get Started Free
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
