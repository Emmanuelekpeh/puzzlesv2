# EmailJS Setup Guide for Feedback Form

## Overview
This guide explains how to set up EmailJS to make the feedback form in your About page fully functional. EmailJS allows you to send emails directly from your frontend without needing a backend server.

## 🚀 Quick Setup (5-10 minutes)

### Step 1: Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Click **"Get Started Free"**
3. Sign up with your email address
4. Verify your email address

### Step 2: Add Email Service
1. In the EmailJS dashboard, go to **"Email Services"**
2. Click **"Add New Service"**
3. Choose your email provider:
   - **Gmail** (recommended for personal use)
   - **Outlook/Hotmail**
   - **Yahoo**
   - **Or any other provider**
4. Follow the setup instructions for your chosen provider
5. **Save** and note down your **Service ID**

### Step 3: Create Email Template
1. Go to **"Email Templates"** in the dashboard
2. Click **"Create New Template"**
3. Use this template content:

**Subject:** `New Feedback from Chess Puzzle Website`

**Body:**
```
Hello,

You have received new feedback from your Chess Puzzle Website:

From: {{from_name}} ({{from_email}})
Message: {{message}}

---
Sent via Chess Puzzle Website Feedback Form
```

4. **Save** the template and note down your **Template ID**

### Step 4: Get Public Key
1. Go to **"Account"** → **"General"**
2. Find your **"Public Key"**
3. Copy this key

### Step 5: Configure Your App

#### Option A: Environment Variables (Recommended)
Create a `.env.local` file in your project root:

```env
REACT_APP_EMAILJS_SERVICE_ID=your_service_id_here
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id_here
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key_here
```

#### Option B: Direct Configuration
Update `src/pages/About.js` line 28-30:

```javascript
const serviceId = 'your_service_id_here';
const templateId = 'your_template_id_here';
const publicKey = 'your_public_key_here';
```

### Step 6: Update Email Address
In `src/pages/About.js` line 40, change:
```javascript
to_email: 'your-email@example.com', // Replace with your email
```
to your actual email address where you want to receive feedback.

### Step 7: Deploy and Test
1. **Commit and push** your changes
2. **Deploy** to Vercel (automatic)
3. **Test** the feedback form on your live site

## 🧪 Testing

### Test Locally:
```bash
npm start
```
Go to `/about` and submit the feedback form.

### Test Live:
Visit your deployed site and submit feedback.

## 📧 Email Template Variables

The following variables are automatically filled in your email template:

- `{{from_name}}` - User's name from the form
- `{{from_email}}` - User's email from the form  
- `{{message}}` - User's message from the form
- `{{to_email}}` - Your email (where feedback is sent)

## 🎯 Current Features

✅ **Form Validation** - Required fields
✅ **Loading States** - "Sending..." button
✅ **Success Messages** - Confirmation after sending
✅ **Error Handling** - Shows errors if sending fails
✅ **Demo Mode** - Works without EmailJS setup (logs to console)
✅ **Responsive Design** - Works on all devices

## 💰 EmailJS Pricing

- **Free Tier**: 200 emails/month
- **Personal**: $15/month for 1,000 emails
- **Professional**: $35/month for 5,000 emails

For most websites, the free tier is sufficient.

## 🔧 Troubleshooting

### Form shows "Demo Mode" message:
- Check that your environment variables are set correctly
- Restart your development server after adding .env.local
- Verify your Service ID, Template ID, and Public Key

### Emails not being sent:
- Check your EmailJS dashboard for error logs
- Verify your email service is properly connected
- Check spam folder for test emails
- Ensure template variables match your form

### "Failed to send feedback" error:
- Check browser console for detailed error messages
- Verify your Public Key is correct
- Check if you've exceeded EmailJS rate limits

## 🚀 Advanced Configuration

### Custom Success Message:
Update line 46 in `About.js`:
```javascript
setSubmitted('Custom success message here');
```

### Add More Form Fields:
1. Add fields to `formData` state
2. Add corresponding template variables
3. Update the EmailJS template

### Rate Limiting:
Add client-side rate limiting to prevent spam:
```javascript
const [lastSubmit, setLastSubmit] = useState(0);

// In handleSubmit, before sending:
const now = Date.now();
if (now - lastSubmit < 60000) { // 1 minute cooldown
  setError('Please wait before sending another message.');
  return;
}
setLastSubmit(now);
```

## 📝 Security Notes

- Never expose your EmailJS Private Key in frontend code
- Public Key is safe to use in frontend applications
- Consider adding a CAPTCHA for production sites
- Monitor your EmailJS usage to prevent abuse

---

**Status**: ✅ Code implementation complete
**Next Step**: Set up EmailJS account and add credentials
**Estimated Setup Time**: 5-10 minutes 