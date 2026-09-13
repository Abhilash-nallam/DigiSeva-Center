# DigiSeva Prototype — Production-Ready Improvement & Admin Dashboard Implementation Prompt

You are working on the existing **DigiSeva Government Services Website** project that I have provided.

Your task is to **modify and improve the existing prototype**, NOT rebuild the website from scratch.

The current UI/design is already good. Preserve the existing visual identity, layouts, responsiveness, animations, service cards, navigation, and overall user experience wherever possible. Make only the changes required to implement the following functionality properly.

---

# 1. PRIMARY OBJECTIVE

Transform the current DigiSeva prototype into a functional service-assistance platform with:

* Government service listings
* Service detail pages
* Transparent service pricing
* Customer application submission
* Document collection
* Application tracking
* Admin-controlled application status
* Admin-controlled service fees
* Admin-controlled QR payment information
* Pay-now / Pay-later flow
* Admin document management
* Admin application management
* Admin payment verification
* Secure admin authentication
* Better SEO
* Better security
* Better project structure
* Mobile responsiveness
* Proper government-service disclaimer

Do NOT implement a real payment gateway yet.

For this prototype, payment will be handled using an **admin-configured QR code**.

A proper payment gateway can be integrated later.

---

# 2. VERY IMPORTANT — PRESERVE EXISTING PROJECT

Before changing anything:

1. Inspect the entire existing project.
2. Understand the current architecture.
3. Identify:

   * React/TypeScript structure
   * Existing components
   * Existing service data
   * Existing API layer
   * Existing forms
   * Existing routing
   * Existing styles
   * Existing mock API
   * Existing authentication logic
4. Do not unnecessarily replace working components.
5. Reuse existing components wherever practical.
6. Refactor only where necessary.

The goal is:

> Existing DigiSeva UI + stronger architecture + functional prototype backend/admin system.

---

# 3. SERVICE DATA MANAGEMENT

Move service information into a centralized service-data structure if it is currently embedded inside large components.

Each service should support:

```text
id
title
slug
category
description
shortDescription
icon
requiredDocuments
governmentFee
digiSevaServiceFee
processingTime
eligibility
steps
officialPortal
officialDepartment
status
featured
```

The admin dashboard must be able to modify service information.

At minimum, admin should be able to:

* Add service
* Edit service
* Disable service
* Enable service
* Delete service where safe
* Change government fee
* Change DigiSeva service fee
* Change processing information
* Change required documents
* Change description
* Change category
* Mark service as featured

Do not hardcode fees in the frontend after this implementation.

The frontend should retrieve service information from the backend/data layer.

---

# 4. IMPORTANT PAYMENT RULE

DO NOT INCLUDE GST IN THE PAYMENT BREAKDOWN.

The system must NOT display:

```text
GST
Tax
GST amount
```

unless this is specifically added as a future feature.

For now the payment breakdown should contain only:

```text
Government Fee
DigiSeva Service Fee
Total Amount
```

Example:

```text
Government Fee        ₹107
DigiSeva Service Fee   ₹50
---------------------------
Total                 ₹157
```

The system must calculate:

```text
totalAmount =
governmentFee + digiSevaServiceFee
```

Do not invent additional charges.

---

# 5. SERVICE DETAIL PAGE

Create/improve a dedicated service details page.

Example:

## PAN Card

Display:

* Service name
* Description
* Eligibility
* Required documents
* Government fee
* DigiSeva service fee
* Total estimated amount
* Expected processing information
* Application steps
* Official government department
* Official portal link
* Start Application button

Payment information must clearly distinguish:

> Government Fee

from:

> DigiSeva Service Fee

Never make the user think DigiSeva is the government department.

---

# 6. GOVERNMENT DISCLAIMER

Add a clear disclaimer throughout appropriate areas of the website.

Use wording similar to:

> DigiSeva is an independent online assistance platform and is not a government website, government department, or government agency. We assist customers with online applications and related digital services. Government fees, processing times, eligibility requirements, and application decisions are determined by the respective government departments.

Also add an appropriate footer disclaimer.

Do not falsely represent DigiSeva as an official government portal.

---

# 7. CUSTOMER APPLICATION SYSTEM

Implement a proper multi-step application flow.

Suggested structure:

## Step 1 — Customer Details

Collect:

* Full name
* Mobile number
* Email
* Date of birth where required
* Address where required
* Service-specific information

## Step 2 — Required Documents

Display the required documents dynamically according to the selected service.

Allow customer to upload required documents.

Examples:

* Aadhaar
* PAN
* Photograph
* Signature
* Address proof
* Supporting documents

Do not ask for unnecessary documents.

## Step 3 — Review

Show:

* Customer details
* Selected service
* Uploaded documents
* Government fee
* DigiSeva service fee
* Total

Allow editing before submission.

## Step 4 — Payment

Provide two options:

### Option A — Pay Now

Show:

* Admin-configured QR code
* Amount to pay
* Payment instructions
* Transaction/reference ID field
* Upload payment screenshot/proof

### Option B — Pay Later

Allow customer to submit the application without immediate payment.

Show:

> Payment Pending

The admin can later update payment status.

---

# 8. QR PAYMENT SYSTEM

Do NOT integrate Razorpay, Stripe, PayU, PhonePe API, Google Pay API, etc. yet.

For this prototype:

Admin should be able to upload/change:

* QR code image
* UPI ID
* Payment instructions

Example:

```text
Scan QR Code

Amount: ₹157

UPI ID:
example@upi

After payment, enter your transaction/reference ID.
```

The QR code displayed to customers must come from the admin configuration.

Do not hardcode the QR image permanently into the frontend.

---

# 9. PAYMENT STATUS

Every application should have a payment state.

Possible states:

```text
Pending
Payment Submitted
Payment Verified
Payment Rejected
Pay Later
```

Admin can change the payment status.

Customer should be able to see their payment status from the tracking page.

---

# 10. APPLICATION STATUS TRACKING

Create a customer-friendly application tracking system.

Every application should receive a unique application ID.

Example:

```text
DS-2026-000123
```

Customer can enter:

```text
Application ID
+
Mobile Number
```

to track their application.

Do not expose an application merely by knowing the application ID.

---

# 11. APPLICATION STATUS STAGES

Create a clear status workflow.

Recommended stages:

```text
Application Submitted
        ↓
Documents Under Review
        ↓
Documents Verified
        ↓
Payment Pending / Payment Verified
        ↓
Application Processing
        ↓
Additional Information Required
        ↓
Submitted to Department
        ↓
Completed
```

Also support:

```text
Rejected
Cancelled
On Hold
```

Admin must be able to change the status.

Customer should see a visual timeline/progress tracker.

Example:

```text
✓ Application Submitted
✓ Documents Verified
✓ Payment Verified
● Application Processing
○ Completed
```

---

# 12. ADMIN DASHBOARD

Create a completely separate and professional Admin Dashboard.

This should NOT look like the normal customer website.

It should feel like a secure management system.

Admin dashboard sections:

```text
Dashboard
Applications
Documents
Services
Payments
QR Payment Settings
Customers
Status Management
Website Settings
Activity Logs
Security
Logout
```

---

# 13. ADMIN DASHBOARD — OVERVIEW

Dashboard should show statistics such as:

```text
Total Applications
Pending Applications
Documents Pending Review
Payments Pending
Applications Processing
Completed Applications
Rejected Applications
Pay Later Applications
```

Use clean cards/charts where appropriate.

Add recent applications table:

```text
Application ID
Customer
Service
Date
Payment
Status
Action
```

---

# 14. ADMIN APPLICATION MANAGEMENT

Admin should be able to:

* View applications
* Search applications
* Filter by service
* Filter by status
* Filter by payment status
* Filter by date
* Open application details
* View customer information
* View submitted documents
* Download documents
* Preview documents where possible
* Change application status
* Add internal/admin notes
* Request additional documents
* Verify/reject payment
* Mark application as completed
* Cancel application

All actions should be recorded where practical.

---

# 15. DOCUMENT MANAGEMENT

Create a secure document-management area.

Admin should be able to:

* View uploaded documents
* Preview documents
* Download documents
* See which application they belong to
* See document type
* See upload date
* See verification status
* Mark document as verified
* Mark document as rejected
* Request re-upload

Document states:

```text
Uploaded
Under Review
Verified
Rejected
Re-upload Required
```

Do NOT expose uploaded documents through publicly guessable URLs.

Use secure/private storage architecture.

For prototype development, the storage layer can initially be abstracted, but design the system so secure storage can be connected later.

---

# 16. ADMIN SERVICE MANAGEMENT

Admin dashboard should include:

## Service Manager

Table:

```text
Service
Category
Government Fee
DigiSeva Fee
Status
Featured
Actions
```

Admin can:

```text
Add
Edit
Enable
Disable
Delete
```

Editing a service should update the customer-facing website automatically.

Do not require editing source code just to change a service fee.

---

# 17. ADMIN QR MANAGEMENT

Create:

## Payment Settings

Admin can:

* Upload QR code
* Replace QR code
* Remove QR code
* Enter UPI ID
* Edit payment instructions
* Enable/disable QR payment

Customer payment page should automatically use the currently active configuration.

---

# 18. ADMIN AUTHENTICATION

This is extremely important.

The admin panel must NOT be publicly accessible without authentication.

Do NOT implement a simple frontend-only:

```text
if(password === "admin123")
```

authentication system.

Use proper authentication architecture.

At minimum:

```text
Admin Login
↓
Authentication
↓
Session/token
↓
Protected Admin Routes
↓
Admin Dashboard
```

Requirements:

* Strong password
* Password hashing
* Secure authentication
* Session expiration
* Protected routes
* Logout
* Brute-force protection/rate limiting
* Secure cookies where applicable
* No admin password in frontend source code
* No admin credentials in GitHub
* No sensitive credentials in `.env` committed to repository

---

# 19. AUTHENTICATOR / 2FA

The admin panel should support an authenticator-based second factor.

Preferred architecture:

```text
Username/email
+
Password
+
Authenticator OTP
```

Use TOTP-compatible authenticator applications.

Examples:

* Google Authenticator
* Microsoft Authenticator
* Authy-compatible TOTP applications

For the prototype, implement the architecture cleanly so production 2FA can be enabled securely.

Never store the OTP itself.

Store only the appropriate encrypted/secured secret required for TOTP.

---

# 20. ADMIN PANEL ACCESS LOCATION

The admin login should NOT be advertised prominently in the main navigation.

Add a small footer section such as:

```text
© 2026 DigiSeva

Privacy | Terms | Disclaimer | Contact

Admin Access
```

The `Admin Access` link should open the protected admin login page.

Do NOT place:

```text
Admin Dashboard
```

in the main customer navigation.

The footer access is intentional.

However, hiding the link is NOT considered security. The admin routes must still be properly protected.

---

# 21. ADMIN ROUTES

Use protected routes similar to:

```text
/admin/login
/admin/verify
/admin
/admin/applications
/admin/applications/:id
/admin/documents
/admin/services
/admin/payments
/admin/settings
/admin/security
```

Unauthenticated users attempting to access `/admin/*` should be redirected to the admin login page.

---

# 22. CUSTOMER TRACKING

Add:

```text
Track Application
```

to the customer website.

Allow:

```text
Application ID
Mobile Number
```

Then display:

```text
Application
Service
Submitted Date
Payment Status
Current Status
Timeline
Admin Message
```

Do not expose unnecessary personal information.

---

# 23. ADDITIONAL DOCUMENT REQUEST

Admin should be able to request additional documents.

Example:

```text
Additional document required:

Please upload a clear address proof.
```

Customer should see:

```text
Action Required
```

and be able to upload the requested document.

This should update the admin dashboard.

---

# 24. ADMIN NOTES VS CUSTOMER MESSAGES

Separate internal notes from customer-visible messages.

Example:

### Internal Admin Note

> Customer document appears unclear.

Only admins can see this.

### Customer Message

> Please upload a clearer copy of your address proof.

Customer can see this.

Never expose internal admin notes to customers.

---

# 25. APPLICATION HISTORY / AUDIT LOG

Maintain a history of important application actions.

Example:

```text
10:31 AM — Application submitted
11:02 AM — Document uploaded
11:25 AM — Document verified
12:10 PM — Payment submitted
12:20 PM — Payment verified
02:30 PM — Status changed to Processing
```

For admin actions also record:

```text
Admin
Action
Date/time
Application
Previous value
New value
```

This will make the system much easier to manage safely.

---

# 26. SECURITY REQUIREMENTS

Implement basic security throughout the prototype.

Frontend:

* Form validation
* File validation
* File-size limits
* Allowed MIME types
* Sanitized user input
* No sensitive data in localStorage
* No credentials in frontend
* No API secrets in frontend

Backend:

* Authentication middleware
* Authorization middleware
* Input validation
* Rate limiting
* Secure headers
* CORS configuration
* Password hashing
* Secure sessions/tokens
* Error handling
* Database parameterization
* Protection against SQL injection
* Protection against XSS
* Protection against CSRF where applicable

Documents:

* Private storage
* Access control
* Safe file names
* MIME validation
* File size restrictions

---

# 27. SEO IMPROVEMENTS

The current project contains:

```html
<meta name="robots" content="noindex, nofollow">
```

If this is the production/public version, remove the noindex restriction.

Add:

* Proper title
* Meta description
* Canonical URL
* Open Graph metadata
* Social sharing metadata
* robots.txt
* sitemap.xml
* Favicon
* Service-specific metadata
* Structured data where appropriate

Use SEO-friendly service URLs such as:

```text
/services/pan-card
/services/voter-id
/services/driving-licence
/services/passport
```

---

# 28. SEARCH IMPROVEMENT

Keep the existing search system but improve it with synonyms.

Examples:

```text
PAN → PAN Card
Voter → Voter ID
DL → Driving Licence
RC → Vehicle Registration
EC → Encumbrance Certificate
PF → EPF
```

Search should support:

* Service title
* Description
* Tags
* Category
* Keywords
* Common abbreviations

---

# 29. MOBILE RESPONSIVENESS

The customer website and admin dashboard must work properly on:

* Mobile
* Tablet
* Laptop
* Desktop

Pay particular attention to:

* Application forms
* Document upload
* QR payment page
* Tracking page
* Admin tables
* Admin sidebar
* Application details
* Modal dialogs

Admin tables should become horizontally scrollable or responsive cards on small screens.

---

# 30. PROJECT STRUCTURE

Refactor the current oversized files where appropriate.

Preferred architecture:

```text
src/
├── app/
├── components/
├── pages/
│   ├── Home
│   ├── Services
│   ├── ServiceDetails
│   ├── Apply
│   ├── Track
│   └── Admin
│
├── admin/
│   ├── Dashboard
│   ├── Applications
│   ├── Documents
│   ├── Services
│   ├── Payments
│   ├── Settings
│   └── Security
│
├── data/
├── services/
├── hooks/
├── types/
├── utils/
└── styles/
```

Do not blindly follow this structure if the existing architecture has a better equivalent. The important goal is maintainability.

---

# 31. API / DATA LAYER

The existing project currently uses mock data/API behavior.

Do not leave critical functionality as fake frontend-only state.

Create a clean API/data abstraction for:

```text
Authentication
Services
Applications
Documents
Payments
QR Settings
Application Status
Admin Settings
Audit Logs
```

For prototype development, a local/mock backend is acceptable if necessary, but the architecture must make it easy to replace with a real backend.

Recommended future stack:

```text
Frontend:
React + TypeScript

Backend:
Node.js + Express

Database:
MySQL

Document Storage:
Private cloud/object storage

Authentication:
Secure session/JWT + TOTP 2FA
```

---

# 32. DO NOT IMPLEMENT REAL PAYMENT GATEWAY YET

Explicitly do NOT integrate:

* Razorpay
* Stripe
* PayU
* Cashfree
* PhonePe payment API
* Google Pay API
* Any other payment gateway

Only implement:

```text
QR payment
+
Payment reference ID
+
Payment screenshot
+
Admin verification
+
Pay Later
```

The architecture should allow a payment gateway to be added later without rebuilding the application system.

---

# 33. CUSTOMER PAYMENT FLOW

Implement this exact prototype flow:

```text
Customer selects service
        ↓
Application form
        ↓
Document upload
        ↓
Review
        ↓
Payment choice
        ↓
 ┌───────────────┐
 │               │
Pay Now       Pay Later
 │               │
QR Code       Payment Pending
 │               │
Reference ID     │
Screenshot       │
 │               │
 └───────┬───────┘
         ↓
Application Submitted
         ↓
Application ID generated
         ↓
Track Application
```

---

# 34. ADMIN APPLICATION FLOW

Admin workflow:

```text
New Application
        ↓
Review Details
        ↓
Review Documents
        ↓
Verify / Reject Documents
        ↓
Verify Payment
        ↓
Process Application
        ↓
Update Status
        ↓
Request Additional Documents if needed
        ↓
Complete Application
```

---

# 35. USER-FACING STATUS MESSAGES

Keep messages simple.

Examples:

```text
Application submitted successfully.

Your Application ID is:
DS-2026-000123
```

Payment:

```text
Payment is pending verification.
```

Additional documents:

```text
Action required:
Please upload the requested document.
```

Completed:

```text
Your application has been completed.
```

---

# 36. ERROR HANDLING

Do not allow silent failures.

Display useful messages for:

* Invalid form data
* Failed upload
* Unsupported file
* File too large
* Application submission failure
* Invalid tracking information
* Authentication failure
* Expired session
* Unauthorized access
* Server errors

Do not expose technical stack traces to customers.

---

# 37. PRIVACY

Add a Privacy Policy page appropriate for a service platform handling customer information.

Explain:

* What information is collected
* Why it is collected
* How documents are used
* Who can access information
* Data retention
* Customer rights
* Contact information

Do not make unrealistic privacy/security claims.

---

# 38. TERMS AND DISCLAIMER

Create:

```text
Privacy Policy
Terms & Conditions
Disclaimer
Refund/Cancellation Policy
```

Use clear language.

Do not claim DigiSeva is an official government entity.

---

# 39. DO NOT OVERDESIGN

Important:

Do NOT completely redesign the existing website.

Do NOT replace the current UI just for the sake of changing it.

Keep:

* Existing colors
* Existing branding
* Existing cards
* Existing navigation style
* Existing responsive behavior
* Existing animations where useful

Improve usability and consistency only where required.

---

# 40. IMPLEMENTATION PRIORITY

Execute in this order:

### Phase 1 — Foundation

1. Inspect existing code
2. Fix project/build issues
3. Refactor service data
4. Fix SEO
5. Add disclaimer
6. Create service detail pages

### Phase 2 — Customer System

7. Application form
8. Document upload
9. Application ID
10. Application tracking
11. Status timeline
12. Payment choice
13. QR payment
14. Pay Later

### Phase 3 — Admin System

15. Admin authentication
16. Admin 2FA architecture
17. Admin dashboard
18. Application management
19. Document management
20. Payment verification
21. Status management
22. Service management
23. QR management
24. Customer-visible messages
25. Audit logs

### Phase 4 — Security & Quality

26. Authorization
27. Input validation
28. File security
29. Session security
30. Rate limiting
31. Error handling
32. Mobile testing
33. Build testing
34. SEO verification
35. Final cleanup

---

# 41. TESTING REQUIREMENTS

Before considering the implementation complete, test these scenarios:

### Customer

* Browse services
* Search service
* Open service details
* Start application
* Upload documents
* Review application
* Choose Pay Now
* See QR
* Submit payment reference
* Choose Pay Later
* Receive application ID
* Track application
* See status updates
* Upload additional requested document

### Admin

* Login
* Failed login
* 2FA flow
* Logout
* Access protected route without login
* View dashboard
* View applications
* Open application
* Download/preview documents
* Verify/reject documents
* Change status
* Verify/reject payment
* Add customer-visible message
* Add internal note
* Change service fee
* Add service
* Disable service
* Change QR
* Update payment instructions
* View audit history

---

# 42. IMPORTANT DATA RULES

Never expose:

* Admin passwords
* Authentication secrets
* TOTP secrets
* API keys
* Database credentials
* Private document storage credentials

Do not commit `.env` files containing secrets.

Create/update:

```text
.env.example
```

with placeholder values only.

---

# 43. FINAL QUALITY STANDARD

The final result should feel like:

> A professional digital-service management platform, not merely a static government-services website.

The customer side should be:

* Simple
* Trustworthy
* Fast
* Mobile-friendly
* Easy for non-technical users

The admin side should be:

* Powerful
* Secure
* Data-driven
* Easy to operate
* Clearly separated from the customer interface

---

# 44. FINAL INSTRUCTION TO THE CODING AGENT

Start by auditing the existing uploaded DigiSeva project.

Before making major changes, identify:

1. Current architecture
2. Current service data structure
3. Current mock API
4. Existing routes
5. Existing application flow
6. Existing authentication, if any
7. Existing dependencies
8. Existing build problems

Then implement the above requirements incrementally.

For every major change:

* Reuse existing code where possible.
* Avoid unnecessary dependency additions.
* Keep TypeScript types strict.
* Keep the UI responsive.
* Do not introduce fake functionality that appears real to customers.
* Clearly distinguish prototype/mock infrastructure from production integrations.
* Do not implement GST in the payment breakdown.
* Do not implement a real payment gateway yet.
* Do not expose sensitive customer documents publicly.
* Do not use frontend-only admin authentication.
* Do not hardcode service fees in multiple places.

At the end, provide:

### A. What was implemented

A concise feature list.

### B. Files changed

List important files and what changed.

### C. Database/API requirements

List the backend/database structures required.

### D. Security considerations

List security measures implemented and anything that must still be configured for production.

### E. Remaining work

Clearly identify features intentionally left for the next phase, especially:

* Real payment gateway
* Production cloud document storage
* Production database deployment
* Email/SMS/WhatsApp notifications
* Advanced role-based admin access
* Production monitoring/backups

Do not claim anything is production-secure unless it actually is.

The goal of this task is to create a **strong, functional DigiSeva prototype foundation that can later be converted into a production system without redesigning the entire application.**
