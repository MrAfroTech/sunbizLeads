import React from 'react';

const HospitalitySchema = ({ pageType = 'homepage', location = null }) => {
  const getSchemaData = () => {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Seamless Hospitality Technology",
      "description": "Advanced crowd management, revenue maximization, and seasonal scalability solutions for hospitality venues",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free demo available"
      },
      "provider": {
        "@type": "Organization",
        "name": "Seamless",
        "url": "https://seamless.com"
      },
      "keywords": [
        "crowd management",
        "revenue maximization", 
        "seasonal scalability",
        "service standardization",
        "customer retention rates",
        "average order value",
        "hospitality technology",
        "POS integration",
        "restaurant technology",
        "food truck technology",
        "festival management"
      ]
    };

    if (pageType === 'festival') {
      return {
        ...baseSchema,
        "name": "Seamless Festival Crowd Management",
        "description": "Advanced crowd management and seasonal scalability solutions for festivals and events",
        "keywords": [
          ...baseSchema.keywords,
          "festival crowd management",
          "event technology",
          "mobile crowd control",
          "seasonal event scaling"
        ]
      };
    }

    if (pageType === 'restaurant') {
      return {
        ...baseSchema,
        "name": "Seamless Restaurant Service Standardization",
        "description": "Service standardization and customer retention rates for restaurants",
        "keywords": [
          ...baseSchema.keywords,
          "restaurant service standardization",
          "customer retention optimization",
          "average order value enhancement",
          "dining technology"
        ]
      };
    }

    if (pageType === 'food-truck') {
      return {
        ...baseSchema,
        "name": "Seamless Food Truck Revenue Maximization",
        "description": "Revenue maximization and average order value optimization for food trucks",
        "keywords": [
          ...baseSchema.keywords,
          "food truck revenue maximization",
          "mobile food service",
          "average order value optimization",
          "mobile vendor technology"
        ]
      };
    }

    return baseSchema;
  };

  const schemaData = getSchemaData();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData)
      }}
    />
  );
};

export default HospitalitySchema;
