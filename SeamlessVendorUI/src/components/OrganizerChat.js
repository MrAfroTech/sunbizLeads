import React, { useEffect } from 'react';
import '../styles/CalenderBox.css';

const OrganizerChat = () => {
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
                <h1>Ready to Eliminate Vendor Complaints?</h1>
                <p>In 30 minutes, we'll solve your biggest event headaches and boost vendor satisfaction</p>
                
                <div className="key-terms">
                    <p>Multi-Vendor Ordering</p>
                    <p>Queue Management</p>
                    <p>Customer Experience</p>
                </div>
                
                <div className="calendly-widget-container">
                    <iframe 
                        src="https://calendly.com/staying-ahead-of-the-game/affiliate-chat-clone"
                        width="100%" 
                        height="630"
                        frameBorder="0">
                    </iframe>
                </div>
            </div>
        </div>
    );
};

export default OrganizerChat;

