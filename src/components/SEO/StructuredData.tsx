import React from 'react';

export const generateLocalBusinessSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Cash Flow Manager",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "description": "Professional cash flow management software for businesses. Track transactions, forecast cash flow, and generate detailed financial reports.",
    "url": "https://cashflowapp.app",
    "author": {
      "@type": "Organization",
      "name": "Cash Flow Manager",
      "url": "https://cashflowapp.app",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-804-360-1129",
        "contactType": "customer service",
        "email": "support@cashflowapp.app",
        "availableLanguage": "English"
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "2807 Hampton Woods Dr",
        "addressLocality": "Henrico",
        "addressRegion": "VA",
        "postalCode": "23233",
        "addressCountry": "US"
      }
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free cash flow management software"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Transaction Tracking",
      "Cash Flow Forecasting",
      "Financial Reports",
      "AI-Powered Insights",
      "Multi-Currency Support",
      "Data Import/Export"
    ]
  };
};

export const generateBreadcrumbSchema = (items: Array<{name: string, url: string}>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

export const generateFAQSchema = (faqs: Array<{question: string, answer: string}>) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

export const generateReviewSchema = (reviews: Array<{
  author: string,
  rating: number,
  reviewBody: string,
  datePublished: string
}>) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Cash Flow Manager",
    "review": reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5"
      },
      "reviewBody": review.reviewBody,
      "datePublished": review.datePublished
    }))
  };
};

const StructuredData: React.FC = () => {
  return null; // This component only provides utility functions
};

export default StructuredData;
