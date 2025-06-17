import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, HelpCircle, Book, Video, MessageCircle } from 'lucide-react';

const HelpPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I import my transaction data?",
      answer: "You can import transaction data by going to Transactions > Import CSV. Make sure your CSV file has columns for date, description, amount, category, and balance. The date should be in YYYY-MM-DD format."
    },
    {
      question: "What file formats are supported for import?",
      answer: "Currently, we support CSV (Comma Separated Values) files. The CSV should have headers and follow our specified format with columns for date, description, amount, category, and balance."
    },
    {
      question: "How is cash runway calculated?",
      answer: "Cash runway is calculated by dividing your current cash balance by your average monthly burn rate (outflows). It shows how many months your current cash will last at the current spending rate."
    },
    {
      question: "Can I export my data?",
      answer: "Yes, you can export your transaction data and reports in various formats including CSV and JSON. Use the Export buttons in the header or on individual pages."
    },
    {
      question: "How accurate are the cash flow forecasts?",
      answer: "Our forecasts are based on historical transaction patterns and trends. They provide estimates that become less accurate over longer time periods. We recommend updating forecasts regularly as new data becomes available."
    },
    {
      question: "Can I categorize my transactions?",
      answer: "Yes, all transactions can be assigned categories. You can use our default categories or create custom ones. Categories help you analyze spending patterns and generate detailed reports."
    },
    {
      question: "Is my financial data secure?",
      answer: "Yes, we use bank-level encryption and security measures to protect your data. All data is encrypted in transit and at rest. We never share your financial information with third parties."
    },
    {
      question: "How do I add a new transaction manually?",
      answer: "Go to Transactions > Add Transaction or click the 'Add Transaction' button on the dashboard. Fill in the required fields including date, description, amount, and category."
    },
    {
      question: "What's the difference between inflows and outflows?",
      answer: "Inflows are positive cash movements (revenue, income) while outflows are negative cash movements (expenses, payments). The system automatically categorizes based on the amount sign."
    },
    {
      question: "Can I edit or delete transactions?",
      answer: "Yes, you can edit or delete transactions from the Transactions page. Click the Edit button to modify details or Delete to remove a transaction permanently."
    }
  ];

  const quickLinks = [
    {
      icon: Book,
      title: "Getting Started Guide",
      description: "Learn the basics of using Cash Flow Manager",
      link: "/documentation"
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Watch step-by-step video guides",
      link: "/tutorials"
    },
    {
      icon: MessageCircle,
      title: "Contact Support",
      description: "Get help from our support team",
      link: "/support"
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <HelpCircle className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions and get help using Cash Flow Manager
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {quickLinks.map((link, index) => {
            const IconComponent = link.icon;
            return (
              <a
                key={index}
                href={link.link}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <IconComponent className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
                <p className="text-gray-600">{link.description}</p>
              </a>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredFAQs.map((faq, index) => (
              <div key={index} className="px-6 py-4">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                  {expandedFAQ === index ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedFAQ === index && (
                  <div className="mt-3 text-gray-600">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-primary-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <a
            href="/support"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
