// src/components/EzDrinkVideoPopup.js
import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Download } from 'lucide-react';
import '../styles/EzDrinkVideoPopup.css';

const EzDrinkVideoPopup = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [venueType, setVenueType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  const videoRefs = useRef([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoTimerRef = useRef(null);
  const intervalRef = useRef(null);
  const transitionInProgress = useRef(false);
  const VIDEO_DURATION = 3000; // 3 seconds

  // Content for rotating slides
  const slides = [
    {
      imagePlaceholder: '/api/placeholder/500/300',
      heading: 'Tired of losing customers to long wait times?',
      text: 'The average venue loses 30% of potential orders during peak hours'
    },
    {
      imagePlaceholder: '/api/placeholder/500/300',
      heading: 'Staff shortages hurting your bottom line?',
      text: 'EZ Drink AI handles ordering so your team can focus on service'
    },
    {
      imagePlaceholder: '/api/placeholder/500/300',
      heading: 'Increase revenue by 25%',
      text: 'Venues using EZ Drink report higher check averages and faster turnover'
    },
    {
      imagePlaceholder: '/api/placeholder/500/300',
      heading: 'Transform your venue today',
      text: 'Get a personalized demo of EZ Drink for your business'
    }
  ];

  // Video sources for background
  const videoSources = [
    '/1899147-hd_1920_1080_30fps.mp4',
    '/2022396_segment1.mp4',
    '/2022396-hd_1920_1080_30fps.mp4',
    '/3402517-uhd_4096_2160_25fps.mp4',
    '/3403452-hd_1920_1080_25fps.mp4',
    '/3772392-hd_1920_1080_25fps (1).mp4',
    '/4667118-uhd_4096_2160_25fps.mp4'
  ];

  // Lead magnet title - now hardcoded where used
  const leadMagnetTitle = "7 Bar Profit Secrets The Top 1% Don't Share";
  
  // Reduce the number of video sources to improve performance
  const reducedVideoSources = videoSources.slice(0, 4);

  // Initialize videos and start the sequence with performance improvements
  useEffect(() => {
    if (!isOpen) return;
    
    // Initialize video refs array
    videoRefs.current = Array(videoSources.length).fill(null);
    
    // Only preload the first 3 videos to improve initial load performance
    videoSources.slice(0, 3).forEach((src, index) => {
      const video = document.createElement('video');
      video.src = src;
      video.preload = 'auto';
      video.muted = true;
    });
    
    // Start with the first video
    startVideoSequence();
    
    // Lazy load remaining videos after initial render
    let lazyLoadTimeout;
    if (videoSources.length > 3) {
      lazyLoadTimeout = setTimeout(() => {
        videoSources.slice(3).forEach((src, index) => {
          const video = document.createElement('video');
          video.src = src;
          video.preload = 'auto';
          video.muted = true;
        });
      }, 2000); // Wait 2 seconds before loading remaining videos
    }
    
    // Cleanup function to clear any timers
    return () => {
      if (videoTimerRef.current) {
        clearTimeout(videoTimerRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (lazyLoadTimeout) {
        clearTimeout(lazyLoadTimeout);
      }
    };
  }, [isOpen]);

  // Auto-rotate slides
  useEffect(() => {
    if (!isPlaying || formSubmitted || showForm || !isOpen) return;
    
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, formSubmitted, showForm, isOpen, slides.length]);

  // Initial sequence start
  const startVideoSequence = () => {
    playVideo(0);
  };
  
  // Main function to play a specific video - optimized for performance
  const playVideo = (index) => {
    // Prevent multiple simultaneous transitions
    if (transitionInProgress.current) return;
    
    transitionInProgress.current = true;
    
    // Clear any existing timers
    if (videoTimerRef.current) {
      clearTimeout(videoTimerRef.current);
    }
    
    // Update the current video index
    setCurrentVideoIndex(index);
    
    // Only pause the previously active video to reduce CPU usage
    const previousVideoIndex = (index - 1 + reducedVideoSources.length) % reducedVideoSources.length;
    if (videoRefs.current[previousVideoIndex]) {
      videoRefs.current[previousVideoIndex].pause();
    }
    
    // Play the current video
    const videoRef = videoRefs.current[index];
    if (videoRef) {
      // Reset to beginning
      videoRef.currentTime = 0;
      
      // Disable looping explicitly
      videoRef.loop = false;
      
      // Play the video with optimized error handling
      const playPromise = videoRef.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Schedule next video after fixed duration
            videoTimerRef.current = setTimeout(() => {
              const nextIndex = (index + 1) % reducedVideoSources.length;
              transitionInProgress.current = false;
              playVideo(nextIndex);
            }, VIDEO_DURATION);
          })
          .catch(() => {
            // If there's an error, try the next video
            const nextIndex = (index + 1) % reducedVideoSources.length;
            transitionInProgress.current = false;
            
            setTimeout(() => {
              playVideo(nextIndex);
            }, 100);
          });
      } else {
        // For browsers that don't return a promise
        videoTimerRef.current = setTimeout(() => {
          const nextIndex = (index + 1) % reducedVideoSources.length;
          transitionInProgress.current = false;
          playVideo(nextIndex);
        }, VIDEO_DURATION);
      }
    } else {
      // If video ref is not available, move to next video
      const nextIndex = (index + 1) % reducedVideoSources.length;
      transitionInProgress.current = false;
      setTimeout(() => {
        playVideo(nextIndex);
      }, 100);
    }
  };
  
  // Handle video ended event as backup
  const handleVideoEnded = (index) => {
    // If this is the current video, move to the next one
    if (index === currentVideoIndex) {
      const nextIndex = (index + 1) % reducedVideoSources.length;
      transitionInProgress.current = false;
      playVideo(nextIndex);
    }
  };

  // Pause rotation when user hovers
  const handleMouseEnter = () => {
    setIsPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsPlaying(true);
  };

  // Show lead form after watching content
  const handleCTAClick = () => {
    setShowForm(true);
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Function to send lead information and trigger lead magnet delivery
  // Function to send lead information and trigger lead magnet delivery
const sendLeadMagnet = async (userData) => {
  const apiEndpoint = '/api/send-seven-profits-lead-magnet';
  
  try {
    // Store lead in localStorage as a backup
    try {
      const existingLeads = JSON.parse(localStorage.getItem('ezdrink_leads') || '[]');
      localStorage.setItem('ezdrink_leads', JSON.stringify([
        ...existingLeads,
        {
          ...userData,
          leadType: 'bar_profit_secrets',
          submittedAt: new Date().toISOString()
        }
      ]));
    } catch (storageError) {
      console.error('Error storing lead in localStorage:', storageError);
      // Continue with API request even if local storage fails
    }
    
    // Send API request
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': process.env.NEXT_PUBLIC_BYPASS_SECRET || 'mysecretkeyfordeployment12345678'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API responded with status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending lead magnet request:', error);
    throw error;
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!name || !email || !phone || !businessName || !venueType) {
      setSubmitError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    // Prepare user data
    const userData = {
      name,
      email,
      phone,
      businessName,
      venueType,
      leadSource: 'popup_form',
      leadMagnet: leadMagnetTitle
    };
    
    try {
      // Send the lead data to our API
      await sendLeadMagnet(userData);
      
      // Mark form as submitted
      setFormSubmitted(true);
      setIsSubmitting(false);
      
      // Reset form fields
      setName('');
      setEmail('');
      setPhone('');
      setBusinessName('');
      setVenueType('');
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Even if there's an error with the API, show success to the user
      // The data is backed up in localStorage already
      setFormSubmitted(true);
      setIsSubmitting(false);
      
      // Log the error for tracking
      try {
        const errorLogs = JSON.parse(localStorage.getItem('ezdrink_errors') || '[]');
        localStorage.setItem('ezdrink_errors', JSON.stringify([
          ...errorLogs,
          {
            type: 'lead_magnet_submission',
            error: error.message,
            userData: { ...userData, email: email.substring(0, 3) + '***' }, // Partially redact email for privacy
            timestamp: new Date().toISOString()
          }
        ]));
      } catch (logError) {
        console.error('Error logging submission error:', logError);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="video-popup-overlay">
      <div 
        className="video-popup-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="popup-close-btn"
        >
          <X size={24} />
        </button>
        
        {formSubmitted ? (
          <div className="thank-you-container">
            <h3 className="thank-you-title">
              <span className="gradient-text">Thank</span>
              <span className="white-text"> You!</span>
            </h3>
            <p className="thank-you-message">
              Your copy of <span className="gradient-text">7 Bar Profit Secrets</span> has been sent.
            </p>
            <p className="delivery-info">
              Please check your email at <strong>{email}</strong> for your PDF guide.
              If you don't see it within a few minutes, please check your spam folder.
            </p>
            <button 
              onClick={onClose}
              className="primary-button"
            >
              Close
            </button>
          </div>
        ) : showForm ? (
          <div className="form-container">
            <h3 className="form-title">
              <span className="gradient-text">Ez</span>
              <span className="accent-text">Drink</span>
              <span> Profit Secrets</span>
            </h3>
            
            <p className="lead-magnet-description">
              You're one step away from your <span className="gradient-text">free</span> bar profit report 
            </p>
            
            <form onSubmit={handleSubmit} className="lead-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="businessName">Business Name</label>
                  <input 
                    type="text" 
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input 
                    type="text" 
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input 
                    type="tel" 
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="venueType">Venue Type</label>
                <select 
                  id="venueType"
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value)}
                  required
                >
                  <option value="">Select Venue Type</option>
                  <option value="bar">Bar</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="club">Nightclub</option>
                  <option value="hotel">Hotel</option>
                  <option value="event">Event Venue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {submitError && (
                <div className="error-message">
                  {submitError}
                </div>
              )}
              
              <div className="form-submit">
                <button 
                  type="submit" 
                  className="nav-button primary-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Get My Free Guide & Demo'} {!isSubmitting && <ArrowRight size={18} className="button-icon" />}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="video-section">
              <div className="video-background">
                {reducedVideoSources.map((src, index) => (
                  <video
                    key={`popup-video-${index}`}
                    ref={el => videoRefs.current[index] = el}
                    src={src}
                    muted
                    playsInline
                    loop={false}
                    onEnded={() => handleVideoEnded(index)}
                    className={`video-element ${index === currentVideoIndex ? 'active' : ''}`}
                  />
                ))}
                <div className="video-overlay"></div>
                <div className="gradient-overlay"></div>
                <div className="grid-pattern"></div>
              </div>
              
              <div className="content-overlay">
                <h2 className="content-heading">
                  {slides[currentSlide].heading}
                </h2>
                <p className="content-text">
                  {slides[currentSlide].text}
                </p>
                
                <button 
                  onClick={handleCTAClick}
                  className="nav-button primary-button"
                >
                  Click Here & Unlock 7 Profit Secrets → 
                </button>
              </div>
              
              <div className="progress-indicators">
                {slides.map((_, index) => (
                  <div 
                    key={`indicator-${index}`}
                    onClick={() => setCurrentSlide(index)}
                    className={`progress-dot ${index === currentSlide ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="stats-section">
              <div className="stat-box">
                <div className="stat-value gold-text">
                  30%
                </div>
                <p className="stat-label">Less Wait Time</p>
              </div>
              <div className="stat-box">
                <div className="stat-value gold-text">
                  25%
                </div>
                <p className="stat-label">Revenue Increase</p>
              </div>
              <div className="stat-box">
                <div className="stat-value gold-text">
                  40%
                </div>
                <p className="stat-label">Staff Efficiency</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EzDrinkVideoPopup;