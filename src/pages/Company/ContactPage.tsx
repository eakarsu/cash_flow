import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Building, Users, Globe } from 'lucide-react';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    setIsSubmitted(true);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Office Address",
      details: [
        "2807 Hampton Woods Dr",
        "Henrico, VA 23233",
        "United States"
      ]
    },
    {
      icon: Phone,
      title: "Phone Numbers",
      details: [
        "804-360-1129"
      ]
    },
    {
      icon: Mail,
      title: "Email Addresses",
      details: [
        "billing@cashflowapp.app",
        "support@cashflowapp.app",
        "sales@cashflowapp.app"
      ]
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: [
        "Monday - Friday: 9:00 AM - 6:00 PM EST",
        "Saturday: 10:00 AM - 4:00 PM EST",
        "Sunday: Closed"
      ]
    }
  ];

  const offices = [
    {
      city: "Henrico",
      address: "2807 Hampton Woods Dr",
      phone: "804-360-1129",
      type: "Headquarters"
    }
  ];


  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8 text-center">
          <Send className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Message Sent!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for reaching out. We'll get back to you within 24 hours.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We'd love to hear from you. Get in touch with our team for sales inquiries, 
            support questions, or partnership opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us about your project, questions, or how we can help..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Send className="h-5 w-5 mr-2" />
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{info.title}</h3>
                      <div className="space-y-1">
                        {info.details.map((detail, detailIndex) => (
                          <p key={detailIndex} className="text-gray-600">{detail}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Office Locations */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Offices</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 text-center">
                <Building className="mx-auto h-8 w-8 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{office.city}</h3>
                <p className="text-sm text-primary-600 mb-3">{office.type}</p>
                <p className="text-gray-600 mb-2">{office.address}</p>
                <p className="text-gray-600">{office.phone}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-primary-600 rounded-lg p-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <Users className="mx-auto h-8 w-8 mb-3" />
              <div className="text-3xl font-bold mb-2">10,000+</div>
              <div className="text-primary-100">Happy Customers</div>
            </div>
            <div>
              <Globe className="mx-auto h-8 w-8 mb-3" />
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-primary-100">Countries Served</div>
            </div>
            <div>
              <Clock className="mx-auto h-8 w-8 mb-3" />
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-primary-100">Support Available</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
