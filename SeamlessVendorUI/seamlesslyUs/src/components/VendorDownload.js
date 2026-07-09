import React, { useEffect, useState } from 'react';
import '../styles/VendorDownload.css';

const VendorDownload = () => {

    useEffect(() => {
        // Set page title
        document.title = "Seamless | Views, Vendors, Venues & Vibes";
        
        // Track page view
        if (window.gtag) {
            window.gtag('event', 'page_view', {
                page_title: 'Vendor Money Secrets',
                page_location: window.location.href,
                content_group1: 'Vendor Download',
                content_group2: 'Display'
            });
        }
    }, []);

    const guideContent = {
        title: "🏪 Vendor Money Secrets",
        subtitle: "8 Simple Tips That Make Sense for Your Business",
        insights: [
            {
                number: 1,
                icon: "⏰",
                title: "The 8-Minute Rule: Why Customers Walk Away",
                content: "Customers abandon vendor lines after just 8 minutes of waiting. QR code ordering drops wait times under 6 minutes and keeps customers engaged while they wait."
            },
            {
                number: 2,
                icon: "📱",
                title: "Works With Your Current Register",
                content: "Integrates with Clover, Square, Shopify, and Stripe right now. Toast, Aloha, and TouchBistro coming soon. Just print QR codes on your stand, tables, or handouts. Zero new equipment needed."
            },
            {
                number: 3,
                icon: "💰",
                title: "Add $50-150 Daily to Your Sales",
                content: "Small vendors report $50-150 daily increases from faster service. That's $350-1,050 extra per week at festivals and events."
            },
            {
                number: 4,
                icon: "🌡️",
                title: "Beat the Heat and Long Lines",
                content: "Families get tired waiting in hot sun at festivals. By the time they reach your stand, they're frustrated. QR ordering lets them order while staying in shade, keeping them happy and buying."
            },
            {
                number: 5,
                icon: "📍",
                title: "Location Matters Less With Technology",
                content: "Successful vendors from California to New York are winning with QR ordering. Customers can find and order from you anywhere at the event, not just when they walk past your stand."
            },
            {
                number: 6,
                icon: "⚡",
                title: "Stop Overwhelming Your Staff",
                content: "During rush periods, your team gets swamped taking orders and payments. QR ordering handles the order-taking automatically, so staff can focus on making great food faster."
            },
            {
                number: 7,
                icon: "🚀",
                title: "Get Paid Instantly",
                content: "Customers pay through the app before pickup. No more cash handling delays or card processing slowdowns during busy times. Money hits your account immediately."
            },
            {
                number: 8,
                icon: "📊",
                title: "Know What Sells Best",
                content: "See which items sell most, busiest hours, and customer preferences. Use this data to stock better and price smarter for maximum profit."
            }
        ]
    };



    const handleTryFreeClick = () => {
        window.open('/directsignup', '_blank');
        if (window.gtag) {
            window.gtag('event', 'try_free_click', {
                event_category: 'Signup',
                event_label: 'Vendor Download Try Free',
                content_group1: 'Vendor Download',
                content_group2: 'Conversion'
            });
        }
    };



    return (
        <>
            <div className="vendor-download-container">
                <div className="vendor-download-content">
                    <div className="form-title">{guideContent.title}</div>
                    <div className="form-subtitle">{guideContent.subtitle}</div>
                    
                    <div className="guide-content">
                        {guideContent.insights.map((insight, index) => (
                            <div key={index} className="insight-item">
                                <div className="insight-header">
                                    <span className="insight-number">{insight.number}</span>
                                    <span className="insight-icon">{insight.icon}</span>
                                    <h3 className="insight-title">{insight.title}</h3>
                                </div>
                                <p className="insight-content">{insight.content}</p>
                            </div>
                        ))}
                    </div>

                    <div className="next-step">
                        <h3>🚀 Ready to Turn These Secrets Into Real Results?</h3>
                        <p>Join thousands of vendors already using our platform to increase sales by $50-150 daily</p>
                        
                        <button className="show-pricing-btn" onClick={() => window.open('/directsignup', '_blank')}>
                            Try for Free
                        </button>

                        <div className="guarantee">
                            <p>Cancel At Any Time!</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VendorDownload;