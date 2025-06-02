import React, { useState } from 'react';
import './About.css';

const About = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send the data to a backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="about">
      <div className="container">
        <div className="hero-section">
          <h1>About Chess Puzzle Platform</h1>
          <p className="hero-text">
            Master chess tactics through interactive puzzles and personalized training
          </p>
        </div>
        
        <div className="mission-section">
          <h2>Our Mission</h2>
          <p>
            We believe that chess tactical training should be accessible, engaging, and effective. 
            Our platform provides thousands of puzzles sourced from real games, allowing players 
            of all levels to improve their tactical vision and pattern recognition. Whether you're 
            a beginner learning basic forks and pins, or a master honing your calculation skills, 
            we have the right puzzles for you.
          </p>
        </div>
        
        <div className="features-section">
          <h2>What We Offer</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h3>Curated Puzzles</h3>
              <p>Thousands of high-quality puzzles sourced from real games, categorized by theme and difficulty</p>
              <ul>
                <li>Fork, Pin, Skewer tactics</li>
                <li>Discovery and deflection</li>
                <li>Sacrifice combinations</li>
                <li>Endgame puzzles</li>
              </ul>
            </div>
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your improvement with detailed statistics and performance analytics</p>
              <ul>
                <li>Solve rate and accuracy</li>
                <li>Rating progression</li>
                <li>Strengths and weaknesses</li>
                <li>Time management insights</li>
              </ul>
            </div>
            <div className="feature">
              <div className="feature-icon">🎨</div>
              <h3>Custom Creation</h3>
              <p>Create and share your own puzzles with our intuitive puzzle editor</p>
              <ul>
                <li>PGN game import</li>
                <li>Position editor</li>
                <li>Solution validation</li>
                <li>Community sharing</li>
              </ul>
            </div>
            <div className="feature">
              <div className="feature-icon">🏆</div>
              <h3>Adaptive Learning</h3>
              <p>Puzzles that adapt to your skill level for optimal learning progression</p>
              <ul>
                <li>Beginner to master levels</li>
                <li>Personalized recommendations</li>
                <li>Spaced repetition</li>
                <li>Weakness targeting</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h2>Platform Statistics</h2>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Chess Puzzles</div>
            </div>
            <div className="stat">
              <div className="stat-number">50,000+</div>
              <div className="stat-label">Puzzles Solved</div>
            </div>
            <div className="stat">
              <div className="stat-number">2,500+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat">
              <div className="stat-number">8</div>
              <div className="stat-label">Puzzle Themes</div>
            </div>
          </div>
        </div>

        <div className="methodology-section">
          <h2>Our Methodology</h2>
          <div className="methodology-content">
            <div className="method">
              <h3>📚 Evidence-Based Learning</h3>
              <p>
                Our puzzle selection and difficulty progression are based on chess education research 
                and feedback from chess coaches. We focus on the most common tactical patterns that 
                appear in real games.
              </p>
            </div>
            <div className="method">
              <h3>🔄 Spaced Repetition</h3>
              <p>
                Puzzles you struggle with will reappear at optimal intervals to strengthen your 
                pattern recognition and ensure long-term retention of tactical knowledge.
              </p>
            </div>
            <div className="method">
              <h3>🎯 Targeted Practice</h3>
              <p>
                Our algorithm identifies your tactical weaknesses and provides focused practice 
                on those specific patterns to accelerate your improvement.
              </p>
            </div>
          </div>
        </div>
        
        <div className="team-section">
          <h2>Our Team</h2>
          <div className="team-content">
            <p>
              Built by a passionate team of chess enthusiasts, software developers, and educators 
              who understand the importance of tactical training in chess improvement. This is an 
              open-source project designed to democratize chess education and help the chess 
              community grow stronger together.
            </p>
            <div className="contributors">
              <h3>Core Contributors</h3>
              <div className="contributor-list">
                <div className="contributor">
                  <strong>Chess Content Team</strong>
                  <p>National masters and FIDE trainers who curate and verify puzzle quality</p>
                </div>
                <div className="contributor">
                  <strong>Development Team</strong>
                  <p>Full-stack developers passionate about chess and education technology</p>
                </div>
                <div className="contributor">
                  <strong>Community Moderators</strong>
                  <p>Experienced players who help maintain puzzle quality and user experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="technology-section">
          <h2>Technology & Open Source</h2>
          <p>
            This platform is built with modern web technologies to provide a fast, responsive, 
            and engaging chess training experience across all devices.
          </p>
          <div className="tech-stack">
            <div className="tech-item">React.js</div>
            <div className="tech-item">Chess.js</div>
            <div className="tech-item">React Chessboard</div>
            <div className="tech-item">Node.js</div>
            <div className="tech-item">PostgreSQL</div>
          </div>
        </div>
        
        <div className="contact-section">
          <h2>Feedback & Suggestions</h2>
          <p>
            Your feedback helps us improve! While this contact form is currently for demonstration purposes, 
            we encourage you to share your thoughts and suggestions about the platform.
          </p>
          
          {submitted && (
            <div className="success-message">
              Thank you for your feedback! Your input helps us improve the platform.
            </div>
          )}
          
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Feedback:</label>
              <textarea 
                rows="5" 
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Share your thoughts, suggestions, or report any issues..."
                required
              />
            </div>
            <button type="submit" className="submit-btn">Share Feedback</button>
          </form>

          <div className="contact-alternatives">
            <h3>Additional Information</h3>
            <p>
              We're constantly working to improve the platform based on user feedback. 
              Your suggestions and puzzle contributions help make this a better learning 
              experience for the entire chess community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
