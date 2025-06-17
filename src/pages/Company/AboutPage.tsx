import React from 'react';
import { DollarSign, Users, Target, Award } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Cash Flow Manager</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're dedicated to helping businesses take control of their cash flow with powerful, 
            intuitive financial management tools.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <Target className="h-8 w-8 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed">
            To empower businesses of all sizes with the tools and insights they need to make informed 
            financial decisions, optimize cash flow, and achieve sustainable growth. We believe that 
            clear financial visibility is the foundation of business success.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <DollarSign className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Financial Clarity</h3>
            <p className="text-gray-600">
              We provide clear, actionable insights into your cash flow patterns and trends.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">User-Centric Design</h3>
            <p className="text-gray-600">
              Our tools are designed with real business needs in mind, making complex data simple.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Award className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Excellence</h3>
            <p className="text-gray-600">
              We're committed to delivering the highest quality financial management experience.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Team</h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto">
            Our team combines decades of experience in finance, technology, and business operations. 
            We understand the challenges businesses face because we've been there ourselves.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
