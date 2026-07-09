import React, { useEffect } from 'react';
import '../styles/ContentPage.css';

const OurTeam = () => {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // Fade in animation for elements
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 100 + (index * 150));
    });
  }, []);

  const teamMembers = [
    {
      name: 'Maurice Sanders',
      title: 'Founder & CVO',
      photo: '/maurice-sanders.png',
      bio: "With a bachelor's degree in computer science from Northern Illinois University and a serial entrepreneur, Maurice brings his previous success from real estate, trucking and software development into thought leadership in the hospitality industry. He's passionate about maximizing the guest and host experience when it comes to leisure activities. His insight is shattering the existing norms of the industry that waters down the guest experience, hurts the staff experience, and minimizes margins for owners. He's felt the pain points and has intimate knowledge of the antiquated systems that are preventing hospitality from entering the 21st century."
    },
    {
      name: 'Ryan Hodge',
      title: 'CTO',
      photo: '/ryan-hodge.jpeg',
      bio: "A software engineer with a bachelor's degree in Computer Science from the University of Central Florida and a professional background defined by solving complex technical problems. With a strong foundation in full-stack development, specializing in the C#/.NET ecosystem, he has been a driving force in teams ranging from small software shops to massive corporate enterprises. Currently based in Tampa, Florida, Ryan combines deep technical expertise with sharp communication skills honed through frequent Toastmasters participation and extensive client-facing experience. His dedication to building strong collaborative relationships is rivaled only by his desire to lead development teams toward building high-impact, high-performance applications."
    }
  ];

  return (
    <div className="content-page">
      <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <section className="content-section fade-in">
          <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>Our Team</h2>
          <p className="intro-text" style={{ textAlign: 'center', marginBottom: '40px' }}>
            Meet the leaders building the future of hospitality technology
          </p>
          
          <div 
            className="team-grid"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '30px',
              marginTop: '20px'
            }}
          >
            {teamMembers.map((member, index) => (
              <div 
                key={index}
                className="fade-in"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '30px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <img 
                  src={member.photo} 
                  alt={member.name}
                  style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginBottom: '20px',
                    border: '3px solid rgba(224, 184, 65, 0.3)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.target.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.style.cssText = `
                      width: 200px;
                      height: 200px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, rgba(224, 184, 65, 0.2), rgba(212, 175, 55, 0.1));
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      margin-bottom: 20px;
                      border: 3px solid rgba(224, 184, 65, 0.3);
                      color: #1a1410;
                      font-size: 48px;
                      font-weight: 700;
                    `;
                    placeholder.textContent = member.name.split(' ').map(n => n[0]).join('');
                    e.target.parentNode.insertBefore(placeholder, e.target);
                  }}
                />
                <h3 style={{ 
                  color: '#1a1410', 
                  fontWeight: '700',
                  marginBottom: '10px',
                  fontSize: '24px'
                }}>
                  {member.name}
                </h3>
                <p style={{ 
                  color: '#e0b841',
                  fontWeight: '600',
                  marginBottom: '20px',
                  fontSize: '18px'
                }}>
                  {member.title}
                </p>
                <p style={{ 
                  color: 'rgba(26, 20, 16, 0.9)',
                  lineHeight: '1.8',
                  fontSize: '16px',
                  margin: 0,
                  textAlign: 'left'
                }}>
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OurTeam;
