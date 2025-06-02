import React from 'react';
import './TermsOfService.css';

const TermsOfService = () => {
  return (
    <div className="terms-of-service">
      <div className="container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Chess Puzzle Website ("the Service"), you accept and agree to be bound by 
            the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            Chess Puzzle Website provides an online platform for solving chess puzzles, tracking progress, 
            and improving chess skills. The service is provided free of charge and is supported by advertisements.
          </p>
        </section>

        <section>
          <h2>3. User Accounts and Responsibilities</h2>
          <h3>3.1 Account Creation</h3>
          <p>
            While registration is not required to use basic features, some functionality may require account creation.
          </p>
          
          <h3>3.2 User Conduct</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any unlawful purpose or in violation of any applicable laws</li>
            <li>Attempt to gain unauthorized access to the service or its systems</li>
            <li>Interfere with or disrupt the service or servers</li>
            <li>Upload or transmit viruses or malicious code</li>
            <li>Impersonate any person or entity</li>
          </ul>
        </section>

        <section>
          <h2>4. Intellectual Property</h2>
          <h3>4.1 Our Content</h3>
          <p>
            The service and its original content, features, and functionality are owned by Chess Puzzle Website 
            and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
          
          <h3>4.2 Chess Puzzles</h3>
          <p>
            Chess puzzles may be sourced from various databases including Lichess. We respect the intellectual 
            property rights of others and expect users to do the same.
          </p>
        </section>

        <section>
          <h2>5. Privacy and Data</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
            to understand our practices regarding your personal information.
          </p>
        </section>

        <section>
          <h2>6. Advertising</h2>
          <p>
            The Service displays advertisements provided by third parties, including Google AdSense. 
            We are not responsible for the content of these advertisements. Clicking on advertisements 
            may redirect you to third-party websites.
          </p>
        </section>

        <section>
          <h2>7. Disclaimer of Warranties</h2>
          <p>
            The Service is provided on an "as is" and "as available" basis. We make no representations or warranties 
            of any kind, express or implied, as to the operation of the Service or the information, content, materials, 
            or products included on the Service.
          </p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            In no event shall Chess Puzzle Website, its affiliates, or their respective directors, officers, employees, 
            or agents be liable for any indirect, incidental, special, consequential, or punitive damages arising from 
            your use of the Service.
          </p>
        </section>

        <section>
          <h2>9. Service Availability</h2>
          <p>
            We strive to maintain service availability but do not guarantee uninterrupted access. The Service may be 
            temporarily unavailable for maintenance, updates, or due to technical issues beyond our control.
          </p>
        </section>

        <section>
          <h2>10. User Generated Content</h2>
          <p>
            If you submit any content to the Service (such as puzzle solutions or comments), you grant us a 
            non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content in connection with the Service.
          </p>
        </section>

        <section>
          <h2>11. Third-Party Services</h2>
          <p>
            The Service may contain links to third-party websites or services. We are not responsible for the content, 
            privacy policies, or practices of third-party websites or services.
          </p>
        </section>

        <section>
          <h2>12. Termination</h2>
          <p>
            We may terminate or suspend your access to the Service immediately, without prior notice or liability, 
            for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section>
          <h2>13. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, 
            we will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>
        </section>

        <section>
          <h2>14. Governing Law</h2>
          <p>
            These Terms shall be interpreted and governed by the laws of [Your Jurisdiction], without regard to 
            its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2>15. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us:</p>
          <ul>
            <li>Email: legal@chesspuzzles.com</li>
            <li>Through our website contact form</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService; 