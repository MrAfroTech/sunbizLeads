import React, { useEffect } from 'react';
import '../styles/CalenderBox.css';

const CalenderBox = () => {
    useEffect(() => {
        // Load Calendly widget script
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup script when component unmounts
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <div className="calender-box-container">
            <div className="calender-content">
                <h1>Ready to Scale Your Business?</h1>
                <p>In 30 minutes, we'll identify your biggest growth opportunity and how to capture it</p>
                
                <div className="key-terms">
                    <p>Dynamic Pricing</p>
                    <p>Revenue Automation</p>
                    <p>Competitive Intelligence</p>
                </div>
                
                <div className="calendly-widget-container">
                    <iframe 
                        src="https://calendly.com/staying-ahead-of-the-game/seamless-chat-clone"
                        width="100%" 
                        height="630"
                        frameBorder="0">
                    </iframe>
                </div>
            </div>
        </div>
    );
};

export default CalenderBox;
