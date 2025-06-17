import React, { useState } from 'react';
import { Play, Clock, Users, Star, Search, Filter } from 'lucide-react';

const TutorialsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const tutorials = [
    {
      id: 1,
      title: "Getting Started with Cash Flow Manager",
      description: "Learn the basics of setting up your account and importing your first transactions",
      duration: "8:45",
      difficulty: "Beginner",
      category: "getting-started",
      views: 1250,
      rating: 4.8,
      thumbnail: "https://via.placeholder.com/320x180/3b82f6/ffffff?text=Getting+Started"
    },
    {
      id: 2,
      title: "Importing Transaction Data from CSV",
      description: "Step-by-step guide to importing your bank statements and transaction history",
      duration: "6:30",
      difficulty: "Beginner",
      category: "data-import",
      views: 980,
      rating: 4.9,
      thumbnail: "https://via.placeholder.com/320x180/10b981/ffffff?text=CSV+Import"
    },
    {
      id: 3,
      title: "Understanding Cash Flow Analytics",
      description: "Deep dive into the analytics dashboard and how to interpret your cash flow data",
      duration: "12:15",
      difficulty: "Intermediate",
      category: "analytics",
      views: 756,
      rating: 4.7,
      thumbnail: "https://via.placeholder.com/320x180/8b5cf6/ffffff?text=Analytics"
    },
    {
      id: 4,
      title: "Creating and Managing Categories",
      description: "Organize your transactions with custom categories for better insights",
      duration: "5:20",
      difficulty: "Beginner",
      category: "organization",
      views: 642,
      rating: 4.6,
      thumbnail: "https://via.placeholder.com/320x180/f59e0b/ffffff?text=Categories"
    },
    {
      id: 5,
      title: "13-Week Cash Flow Forecasting",
      description: "Learn how to use our forecasting tools to plan your financial future",
      duration: "15:30",
      difficulty: "Advanced",
      category: "forecasting",
      views: 523,
      rating: 4.9,
      thumbnail: "https://via.placeholder.com/320x180/ef4444/ffffff?text=Forecasting"
    },
    {
      id: 6,
      title: "Generating Financial Reports",
      description: "Create comprehensive reports for stakeholders and financial analysis",
      duration: "9:45",
      difficulty: "Intermediate",
      category: "reporting",
      views: 445,
      rating: 4.5,
      thumbnail: "https://via.placeholder.com/320x180/06b6d4/ffffff?text=Reports"
    },
    {
      id: 7,
      title: "Cash Runway Analysis",
      description: "Understand your burn rate and how long your cash will last",
      duration: "7:20",
      difficulty: "Intermediate",
      category: "analytics",
      views: 389,
      rating: 4.8,
      thumbnail: "https://via.placeholder.com/320x180/84cc16/ffffff?text=Runway"
    },
    {
      id: 8,
      title: "Advanced Export Options",
      description: "Export your data in various formats for external analysis",
      duration: "4:15",
      difficulty: "Beginner",
      category: "data-export",
      views: 298,
      rating: 4.4,
      thumbnail: "https://via.placeholder.com/320x180/f97316/ffffff?text=Export"
    }
  ];

  const categories = [
    { id: 'all', name: 'All Tutorials' },
    { id: 'getting-started', name: 'Getting Started' },
    { id: 'data-import', name: 'Data Import' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'forecasting', name: 'Forecasting' },
    { id: 'reporting', name: 'Reporting' },
    { id: 'organization', name: 'Organization' },
    { id: 'data-export', name: 'Data Export' }
  ];

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Play className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Video Tutorials</h1>
          <p className="text-xl text-gray-600">
            Learn how to master Cash Flow Manager with our comprehensive video guides
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        {/* Tutorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTutorials.map((tutorial) => (
            <div key={tutorial.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                <img
                  src={tutorial.thumbnail}
                  alt={tutorial.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-12 w-12 text-white" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  {tutorial.duration}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tutorial.difficulty)}`}>
                    {tutorial.difficulty}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    {tutorial.rating}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tutorial.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{tutorial.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {tutorial.views.toLocaleString()} views
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {tutorial.duration}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Learning Paths */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Learning Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Beginner Path</h3>
              <p className="text-gray-600 mb-4">Perfect for users new to cash flow management</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Getting Started with Cash Flow Manager</li>
                <li>• Importing Transaction Data from CSV</li>
                <li>• Creating and Managing Categories</li>
                <li>• Basic Analytics Overview</li>
              </ul>
              <button className="mt-4 text-primary-600 hover:text-primary-700 font-medium">
                Start Learning Path →
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Path</h3>
              <p className="text-gray-600 mb-4">For users ready to master advanced features</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Advanced Analytics and Insights</li>
                <li>• 13-Week Cash Flow Forecasting</li>
                <li>• Custom Report Generation</li>
                <li>• API Integration and Automation</li>
              </ul>
              <button className="mt-4 text-primary-600 hover:text-primary-700 font-medium">
                Start Learning Path →
              </button>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-primary-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Personalized Help?</h2>
          <p className="text-gray-600 mb-6">
            Our support team offers one-on-one training sessions and custom tutorials for your specific needs.
          </p>
          <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
            Schedule Training Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialsPage;
