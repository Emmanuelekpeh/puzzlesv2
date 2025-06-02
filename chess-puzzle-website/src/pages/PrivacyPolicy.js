import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy">
      <div className="container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2>1. Information We Collect</h2>
          <p>
            Chess Puzzle Website ("we," "our," or "us") collects information to provide better services to our users. 
            We collect information in the following ways:
          </p>
          
          <h3>1.1 Information You Give Us</h3>
          <ul>
            <li>Puzzle solving progress and statistics</li>
            <li>User preferences and settings</li>
            <li>Contact information when you reach out to us</li>
          </ul>

          <h3>1.2 Information We Get from Your Use of Our Services</h3>
          <ul>
            <li>Device information (browser type, operating system)</li>
            <li>Log information (IP address, date/time of access)</li>
            <li>Cookies and similar technologies</li>
            <li>Local storage data for game progress</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Track your puzzle solving progress</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Communicate with you about updates and features</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>3. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar technologies to enhance your experience on our website:
          </p>
          
          <h3>3.1 Essential Cookies</h3>
          <p>These cookies are necessary for the website to function and cannot be switched off.</p>
          
          <h3>3.2 Analytics Cookies</h3>
          <p>We use Google Analytics to understand how visitors interact with our website.</p>
          
          <h3>3.3 Advertising Cookies</h3>
          <p>
            We use Google AdSense to display advertisements. Google may use cookies to serve ads based on 
            your prior visits to our website or other websites. You can opt out of personalized advertising 
            by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Google Ads Settings</a>.
          </p>
        </section>

        <section>
          <h2>4. Third-Party Services</h2>
          
          <h3>4.1 Google AdSense</h3>
          <p>
            Our website uses Google AdSense to display advertisements. Google's use of advertising cookies 
            enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.
          </p>
          <p>
            For more information about Google's privacy practices, please review the 
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"> Google Privacy Policy</a>.
          </p>

          <h3>4.2 Google Analytics</h3>
          <p>
            We use Google Analytics to analyze website traffic and usage patterns. Google Analytics uses cookies 
            to collect information about your use of our website.
          </p>
        </section>

        <section>
          <h2>5. Data Storage and Security</h2>
          <p>
            Your puzzle progress and preferences are stored locally in your browser's storage. We implement 
            appropriate security measures to protect against unauthorized access, alteration, disclosure, or 
            destruction of your personal information.
          </p>
        </section>

        <section>
          <h2>6. Your Rights (GDPR)</h2>
          <p>If you are in the European Economic Area (EEA), you have the following rights:</p>
          <ul>
            <li><strong>Right to Access:</strong> You can request information about your personal data</li>
            <li><strong>Right to Rectification:</strong> You can request correction of inaccurate data</li>
            <li><strong>Right to Erasure:</strong> You can request deletion of your personal data</li>
            <li><strong>Right to Restrict Processing:</strong> You can request limitation of data processing</li>
            <li><strong>Right to Data Portability:</strong> You can request transfer of your data</li>
            <li><strong>Right to Object:</strong> You can object to data processing</li>
            <li><strong>Right to Withdraw Consent:</strong> You can withdraw consent at any time</li>
          </ul>
          
          <p>
            To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
          </p>
        </section>

        <section>
          <h2>7. Children's Privacy</h2>
          <p>
            Our service is not directed to children under 13. We do not knowingly collect personal information 
            from children under 13. If you become aware that a child has provided us with personal information, 
            please contact us.
          </p>
        </section>

        <section>
          <h2>8. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. These countries 
            may have different data protection laws. We ensure appropriate safeguards are in place to protect your 
            personal information.
          </p>
        </section>

        <section>
          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the 
            new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <ul>
            <li>Email: privacy@chesspuzzles.com</li>
            <li>Through our website contact form</li>
          </ul>
        </section>

        <section className="consent-management">
          <h2>11. Manage Your Consent</h2>
          <p>
            You can manage your cookie and advertising preferences at any time by clicking the button below:
          </p>
          <button 
            className="consent-settings-btn"
            onClick={() => {
              if (window.__gpp) {
                window.__gpp('displayUiForPurposes');
              } else if (window.googlefc) {
                window.googlefc.showRevocationMessage();
              } else {
                alert('Consent management not available. Please clear your cookies to reset preferences.');
              }
            }}
          >
            Manage Cookie Preferences
          </button>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 