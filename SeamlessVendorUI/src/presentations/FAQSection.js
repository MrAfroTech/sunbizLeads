import React, { useState } from 'react';
import '../styles/FAQSection.css';

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How long is the webinar?",
      answer: "The webinar is exactly 12 minutes long - designed to be concise and actionable. We respect your time and focus on the most important information you need to transform your order management."
    },
    {
      id: 2,
      question: "Is this really free?",
      answer: "Yes, absolutely free! No hidden costs, no credit card required, no strings attached. We believe in providing value first and letting you decide if our solution is right for your business."
    },
    {
      id: 3,
      question: "What if I can't attend live?",
      answer: "No problem! We'll send you a recording of the webinar within 24 hours, so you can watch it at your convenience. You'll also receive all the same resources and next steps."
    },
    {
      id: 4,
      question: "Do I need any special equipment?",
      answer: "Just a computer, tablet, or smartphone with internet access. The webinar will be streamed through a simple web link - no downloads or special software required."
    },
    {
      id: 5,
      question: "Is this only for food trucks?",
      answer: "Not at all! This webinar is designed for any food service business that handles orders - food trucks, restaurants, catering companies, food stands, and more. The principles apply to any volume-based food service operation."
    },
    {
      id: 6,
      question: "What if I'm already using a POS system?",
      answer: "Perfect! Our solution integrates with most existing POS systems. We'll show you how to enhance what you already have rather than replace it. You keep your current setup and add our smart queuing on top."
    },
    {
      id: 7,
      question: "How quickly can I implement this?",
      answer: "Most vendors can be up and running within 24-48 hours. The setup is designed to be simple and non-disruptive to your current operations. We provide full onboarding support to ensure a smooth transition."
    },
    {
      id: 8,
      question: "What if I'm not satisfied?",
      answer: "We offer a 30-day money-back guarantee. If you don't feel more confident handling volume after using our system for 30 days, we'll refund your investment completely. No questions asked."
    },
    {
      id: 9,
      question: "Can I ask questions during the webinar?",
      answer: "Yes! We'll have a Q&A session at the end of the webinar where you can ask specific questions about your situation. We also provide our contact information for follow-up questions."
    },
    {
      id: 10,
      question: "What happens after I register?",
      answer: "You'll receive an immediate confirmation email with webinar details and a calendar invite. We'll also send you a reminder 24 hours before the webinar and another 30 minutes before it starts."
    }
  ];

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <section className="faq-section">
      <div className="section-content">
        <h2 className="section-title">
          <span className="gradient-text">Frequently Asked Questions</span>
        </h2>
        
        <div className="faq-container">
          {faqs.map((faq) => (
            <div key={faq.id} className="faq-item">
              <button
                className={`faq-question ${openFAQ === faq.id ? 'active' : ''}`}
                onClick={() => toggleFAQ(faq.id)}
              >
                <span className="question-text">{faq.question}</span>
                <span className="toggle-icon">
                  {openFAQ === faq.id ? '−' : '+'}
                </span>
              </button>
              
              <div className={`faq-answer ${openFAQ === faq.id ? 'open' : ''}`}>
                <div className="answer-content">
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="faq-cta">
          <p>Still have questions? We're here to help!</p>
          <button className="primary-button">
            Contact Us
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
