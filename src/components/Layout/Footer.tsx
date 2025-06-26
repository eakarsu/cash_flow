import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-primary-400" />
              <span className="ml-2 text-xl font-bold">Cash Flow Manager</span>
            </div>
            <p className="text-gray-300 text-sm">
              Professional cash flow management and forecasting tools for businesses of all sizes.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-300">
                <Phone className="h-4 w-4 mr-2" />
                <span>+1 804-360-1129</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <Mail className="h-4 w-4 mr-2" />
                <span>support@cashflowapp.app</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <MapPin className="h-4 w-4 mr-2" />
                <span>2807 Hampton Woods Dr, Henrico, VA 23233</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white text-sm">Dashboard</Link></li>
              <li><Link to="/transactions" className="text-gray-300 hover:text-white text-sm">Transactions</Link></li>
              <li><Link to="/reports" className="text-gray-300 hover:text-white text-sm">Reports</Link></li>
              <li><Link to="/analytics/forecast" className="text-gray-300 hover:text-white text-sm">Forecasting</Link></li>
              <li><Link to="/features" className="text-gray-300 hover:text-white text-sm">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-300 hover:text-white text-sm">Pricing</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-gray-300 hover:text-white text-sm">Help Center</Link></li>
              <li><Link to="/documentation" className="text-gray-300 hover:text-white text-sm">Documentation</Link></li>
              <li><Link to="/tutorials" className="text-gray-300 hover:text-white text-sm">Video Tutorials</Link></li>
              <li><Link to="/support" className="text-gray-300 hover:text-white text-sm">Contact Support</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-white text-sm">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white text-sm">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-300 text-sm mb-4">
              Subscribe to our newsletter for the latest updates and financial tips.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
              >
                {subscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Social Media & Legal */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-white">Cookie Policy</Link>
              <Link to="/refund-policy" className="hover:text-white">Refund Policy</Link>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-400">
            <p>&copy; 2024 Cash Flow Manager. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
