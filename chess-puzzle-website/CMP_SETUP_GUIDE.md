# Google Consent Management Platform (CMP) Setup Guide

## Overview
This guide explains how to complete the setup of Google's Funding Choices (CMP) for your chess puzzle website to comply with GDPR requirements and maintain AdSense revenue.

## ✅ What's Already Implemented

1. **CMP Script Integration** - Google Funding Choices script is added to `public/index.html`
2. **Privacy Policy** - Comprehensive GDPR-compliant privacy policy at `/privacy`
3. **Terms of Service** - Complete terms of service at `/terms`
4. **Consent Management Button** - Users can manage preferences via Privacy Policy page

## 🚀 Next Steps: Complete Setup in Google AdSense

### Step 1: Access Google Funding Choices
1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Sign in with your AdSense account
3. Navigate to **Privacy & messaging** → **Funding Choices**

### Step 2: Create Consent Message
1. Click **"Create Message"**
2. Select **"Consent"** as the message type
3. Choose **"Two options: Consent and Manage options"** (Recommended)

### Step 3: Configure Message Settings

#### Basic Settings:
- **Publisher ID**: `pub-1667500375389649` (already in your code)
- **Website URL**: Your domain (e.g., `https://your-chess-website.com`)
- **Message Type**: Consent message
- **Choices**: Consent + Manage options

#### Message Content:
- **Headline**: "We value your privacy"
- **Description**: "We and our partners use technologies like cookies to store and access device information to provide personalized ads and content, ad and content measurement, and audience insights. Click Accept to consent or Manage to review options."
- **Accept Button**: "Accept"
- **Manage Button**: "Manage options"

#### Links:
- **Privacy Policy URL**: `https://your-domain.com/privacy`
- **Terms of Service URL**: `https://your-domain.com/terms`

### Step 4: Target Settings
- **Regions**: Select **EEA, UK, and Switzerland**
- **Devices**: All devices
- **Languages**: English (or add more as needed)

### Step 5: Preview and Publish
1. **Preview** your consent message
2. Test on different devices
3. **Publish** when satisfied

## 🎯 Message Template Options

### Option 1: Two Choices (Recommended)
```
Headline: "We value your privacy"

Description: "We and our partners use cookies and similar technologies to improve your experience, measure site usage, and show personalized ads. You can accept all cookies or manage your preferences."

Buttons: [Accept] [Manage options]
```

### Option 2: Three Choices (More Explicit)
```
Headline: "Cookie Consent"

Description: "We use cookies to enhance your chess puzzle experience and show relevant ads. Please choose your preference below."

Buttons: [Accept] [Reject] [Manage options]
```

## 🔧 Technical Implementation Details

### Already Configured:
- **Publisher ID**: `ca-pub-1667500375389649`
- **CMP Script**: Loaded in HTML head
- **Privacy Policy**: GDPR compliant, accessible at `/privacy`
- **Consent Management**: Button available on privacy page

### Script Location:
```html
<!-- In public/index.html -->
<script async src="https://fundingchoicesmessages.google.com/i/pub-1667500375389649?ers=1" nonce="cSpNwKu-AuCzgKDKAacdDg"></script>
```

## 📊 Benefits of This Setup

### ✅ Compliance:
- GDPR compliant for EEA, UK, Switzerland
- Automatic consent collection
- User control over preferences

### ✅ Revenue Protection:
- Maintains AdSense eligibility
- Personalized ads for consenting users
- Non-personalized ads for non-consenting users

### ✅ User Experience:
- Clean, professional consent interface
- Easy preference management
- Mobile-optimized

## 🧪 Testing Your CMP

### 1. Test Consent Flow:
- Visit your site from EEA location (use VPN)
- Verify consent message appears
- Test both "Accept" and "Manage" options

### 2. Verify AdSense Integration:
- Check ads display correctly after consent
- Verify personalized vs non-personalized ads

### 3. Test Preference Management:
- Visit `/privacy` page
- Click "Manage Cookie Preferences" button
- Verify consent interface reopens

## 🌍 Alternative CMP Options

If you prefer a different CMP:

### 1. **Cookiebot** (Popular choice)
- Free tier available
- Easy integration
- Automatic cookie scanning

### 2. **OneTrust** (Enterprise)
- Comprehensive compliance
- Advanced features
- Higher cost

### 3. **Quantcast Choice** (Free)
- IAB TCF 2.0 compliant
- Free forever plan
- Good for small sites

## 📝 Important Notes

1. **Update Privacy Policy**: Customize email addresses and company details in the privacy policy
2. **Test Thoroughly**: Always test consent flow before going live
3. **Monitor Compliance**: Regularly check that your CMP is working correctly
4. **Keep Updated**: Privacy laws evolve, so stay informed about changes

## 🆘 Troubleshooting

### CMP Not Showing:
- Check browser developer tools for JavaScript errors
- Verify your publisher ID is correct
- Ensure you're testing from an EEA location

### AdSense Issues:
- Wait 24-48 hours after CMP setup
- Check AdSense account for policy violations
- Verify ads.txt file is correctly configured

### Need Help?
- Google AdSense Help Center
- GDPR compliance documentation
- Community forums for specific issues

---

**Status**: ✅ Technical implementation complete
**Next Step**: Configure message in Google AdSense Funding Choices
**Estimated Setup Time**: 15-30 minutes 