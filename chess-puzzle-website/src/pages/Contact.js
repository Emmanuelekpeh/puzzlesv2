import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // EmailJS configuration - replace these with your actual values
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'demo_service';
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'demo_template';
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'demo_key';

    // For demo purposes, if no EmailJS credentials are set up
    if (serviceId === 'demo_service' || templateId === 'demo_template' || publicKey === 'demo_key') {
      console.log('Feedback submitted (demo mode):', formData);
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setFormData({ name: '', email: '', message: '' });
      return;
    }

    try {
      // Send email using EmailJS
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_email: 'your-email@example.com', // Replace with your email
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact">
      <div className="container">
        <div className="hero-section">
          <h1>Get in Touch</h1>
          <p className="hero-text">
            Have questions, suggestions, or feedback about our chess puzzle platform? 
            We'd love to hear from you!
          </p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <h2>Contact Information</h2>
            <div className="contact-methods">
              <div className="contact-method">
                <h3>📧 Email</h3>
                <p>Send us a message using the form below and we'll get back to you as soon as possible.</p>
              </div>
              <div className="contact-method">
                <h3>🐛 Bug Reports</h3>
                <p>Found a bug or issue? Please describe it in detail so we can fix it quickly.</p>
              </div>
              <div className="contact-method">
                <h3>💡 Feature Requests</h3>
                <p>Have an idea for improving the platform? We're always looking for ways to enhance the user experience.</p>
              </div>
              <div className="contact-method">
                <h3>🎯 General Feedback</h3>
                <p>Share your thoughts about the puzzles, difficulty levels, or overall experience.</p>
              </div>
            </div>
          </div>

          <div className="contact-form-section">
            <h2>Send us a Message</h2>
            <p>
              Your feedback helps us improve! Share your thoughts, suggestions, or report any issues 
              with the chess puzzle platform.
            </p>
            
            {submitted && (
              <div className="success-message">
                ✅ Thank you for your message! Your feedback helps us improve the platform.
              </div>
            )}
            
            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}
            
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your-email@example.com"
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Message *</label>
                <textarea 
                  rows="6" 
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Share your thoughts, suggestions, or report any issues..."
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        <div className="additional-info">
          <h2>About Our Platform</h2>
          <p>
            Our chess puzzle platform is designed to help players of all levels improve their tactical skills. 
            We're constantly working to enhance the experience based on user feedback and suggestions.
          </p>
          <p>
            Whether you're a beginner learning basic tactics or an advanced player honing your calculation skills, 
            your input helps us create better puzzles and features for the entire chess community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact; 