DIGISEVA — VERSION 12
FULL PRODUCTION WEBSITE + ADMIN PLATFORM
5 PHASES / 26 SECTIONS

You are working on the existing DigiSeva project.

IMPORTANT:
This is NOT a request to create another visual prototype.
This is a request to transform the existing DigiSeva project into a complete, production-oriented digital services platform.

FIRST inspect the entire existing project and understand the current code, UI, components, service data, application flow, tracking system, mock API, store, AdminDashboard, styles and routing.

CURRENT IMPORTANT FILES INCLUDE:
- src/app/App.tsx
- src/admin/AdminDashboard.tsx
- src/services/api.ts
- src/data/store.ts
- src/mock/applications.ts
- src/types/index.ts
- src/imports/pasted_text/digiseva-prototype-enhancement.md
- existing UI components and styles

DO NOT throw away the existing design.
DO NOT rebuild the website from scratch.
DO NOT create a second Admin Dashboard.
DO NOT create a second application database/store.
DO NOT create another duplicate demo.

Preserve the strong existing visual identity and improve it systematically.

==================================================
GLOBAL PRODUCT DIRECTION
==================================================

DigiSeva is an independent digital assistance platform for helping customers access and complete online government-service applications.

The public website should feel:
- trustworthy
- modern
- simple
- fast
- professional
- India-focused
- accessible
- mobile-first
- transparent about fees
- easy for first-time users

IMPORTANT BRANDING RULE:

REMOVE all misleading government identity from the existing UI.

REMOVE:
- "Secure · Official Government Portal · India"
- "Official Government Portal"
- "Verified" government-style badge
- "Govt Compliant"
- "Official gateway"
- "Digital India initiative"
- "Ministry of Electronics & IT · Government of India"
- any wording that makes DigiSeva appear to be an actual government department or official government portal

DO NOT create a large disclaimer banner.

Do not replace misleading government wording with another misleading claim.

Use neutral branding such as:
"Secure Digital Services Platform · India"

Government department names may be shown when describing the service itself, but DigiSeva must never be presented as that department.

Where appropriate, provide the actual official government portal as an external reference link.

==================================================
PHASE 1 — FOUNDATION + PUBLIC WEBSITE
==================================================

SECTION 1 — DESIGN SYSTEM

Preserve the existing DigiSeva visual identity.

Improve:
- typography hierarchy
- spacing
- responsive layouts
- buttons
- cards
- form controls
- badges
- modals
- tables
- empty states
- loading states
- error states
- success states

Use a consistent design system throughout customer and admin interfaces.

Customer:
clean, welcoming, simple.

Admin:
professional SaaS/dashboard interface.

Do not over-animate.

Do not make the interface look like a government website.

==================================================

SECTION 2 — PUBLIC NAVIGATION

Keep the current primary navigation concept but improve it.

Desktop:

DigiSeva logo
Home
Services
Track
Insurance & Loans
Help
Profile / Account where appropriate

Mobile:

Use the existing mobile bottom navigation.

Recommended:
Home
Services
Track
Help
Account

Do not put Admin Dashboard in the main customer navigation.

Admin Access belongs discreetly in the footer.

==================================================

SECTION 3 — HOMEPAGE

Build the complete production homepage.

Hero:

Government services made simple.

Subheading should communicate:
- apply online
- get assistance
- upload documents
- track applications

Primary CTA:
"Explore Services"

Secondary CTA:
"Track Application"

Hero should not contain fake government claims.

Create sections:

1. Hero
2. Search services
3. Popular services
4. Browse by category
5. How DigiSeva works
6. Transparent pricing
7. Application tracking
8. Why use DigiSeva
9. Help / FAQ
10. Footer

Use real configurable service data.

Do not display fabricated citizen numbers, ratings, uptime or government-affiliation statistics.

==================================================

SECTION 4 — SERVICE CATALOG

Create a complete service browsing experience.

Categories can include:

Identity
Certificates
Transport
Education
Business
Tax
Property
Utilities
Welfare
Other Services

Service cards should display:

Service name
Short description
Estimated government fee
DigiSeva service fee
Estimated total
Processing information
Required documents
"View Details"

Support:
- search
- category filter
- popular services
- featured services
- recently viewed where useful

Search must support common terms and abbreviations.

Examples:
PAN → PAN Card
Voter → Voter ID
DL → Driving Licence
RC → Vehicle Registration
PF → EPF

==================================================

SECTION 5 — SERVICE DETAIL EXPERIENCE

Every service needs a dedicated details page.

Example:

/services/pan-card

Display:

Service name
Description
Eligibility
Required documents
Government fee
DigiSeva service fee
Total estimated amount
Processing information
Application steps
Official department
Official government portal
Start Application

IMPORTANT:

Government Fee and DigiSeva Service Fee must ALWAYS be visually separated.

Example:

Government Fee             ₹107
DigiSeva Service Fee        ₹50
--------------------------------
Estimated Total            ₹157

DO NOT add GST or invented charges.

Fees must come from the service data layer.

==================================================
PHASE 2 — CUSTOMER APPLICATION SYSTEM
==================================================

SECTION 6 — APPLICATION START

When user clicks "Start Application":

Create a real application draft.

Do not simply navigate through fake screens.

Create a typed application object containing:

applicationId
serviceId
customer
formData
documents
payment
status
statusHistory
createdAt
updatedAt
lastCheckedAt

Application ID must eventually be generated server-side.

Development fallback may use an adapter, but never generate fake IDs directly inside the UI component.

==================================================

SECTION 7 — CUSTOMER DETAILS

Create dynamic application forms.

Fields should depend on the selected service.

Common fields:

Full Name
Mobile
Email
Date of Birth
Gender
Address
State
District
Pincode

Service-specific fields should be configurable.

Add strong validation.

Show:
- required fields
- helpful descriptions
- inline errors
- invalid format messages
- save draft
- continue

Do not ask for unnecessary information.

==================================================

SECTION 8 — DOCUMENT UPLOAD

Create a professional document-upload experience.

Show required documents dynamically based on selected service.

Example:

Aadhaar
PAN
Photograph
Signature
Address Proof
Supporting Document

Each document should have:

Document name
Required/optional
Upload button
File name
File size
Upload progress
Preview
Replace
Remove
Validation status

Validate:
- extension
- MIME type
- size
- required documents

Architecture must support private object storage.

Never make customer documents publicly accessible.

==================================================

SECTION 9 — APPLICATION REVIEW

Before submission show a complete review page.

Sections:

Customer Details
Service Details
Documents
Payment Summary

Allow:
Edit customer details
Replace documents
Return to previous steps

Payment summary:

Government Fee
DigiSeva Service Fee
Total

No GST.

No hidden charges.

Make the review screen extremely clear because this is the final confirmation before submission.

==================================================

SECTION 10 — PAYMENT + SUBMISSION

Support exactly two payment paths.

OPTION A — PAY NOW

Show:

QR code
UPI ID
Amount
Payment instructions
Transaction/reference ID
Payment screenshot upload

OPTION B — PAY LATER

Allow submission without immediate payment.

Display:

Payment Pending

Do NOT integrate:
Razorpay
Stripe
PayU
PhonePe API
Google Pay API
Cashfree
other payment gateways

The QR code must come from Admin Payment Settings.

After successful submission:

Show:

Application Submitted

Application ID:
DS-2026-000XXX

Service:
PAN Card

Payment:
Payment Verified / Payment Pending / Pay Later

Next step:
Documents Under Review

Provide:
Track Application
Download / Save Application Receipt

==================================================
PHASE 3 — TRACKING + ADMIN PLATFORM
==================================================

SECTION 11 — CUSTOMER TRACKING

Create a polished tracking page.

Route:

/track

Customer enters:

Application ID
Mobile Number

Both must be required.

Do not expose an application merely by knowing the Application ID.

Display:

Application ID
Service
Submitted Date
Payment Status
Current Status
Progress Timeline
Customer-visible messages
Last Status Update
Last Checked

Keep:

Last checked

separate from:

Last status update

Example:

Last checked:
02 Sep 2026 · 03:12 PM

Last status update:
02 Sep 2026 · 02:48 PM

==================================================

SECTION 12 — APPLICATION STATUS SYSTEM

Create a complete status workflow.

Primary stages:

Application Submitted
Documents Under Review
Documents Verified
Payment Pending
Payment Verified
Application Processing
Additional Information Required
Submitted to Department
Completed

Additional states:

Rejected
Cancelled
On Hold

Customer sees a visual timeline.

Example:

✓ Application Submitted
✓ Documents Verified
✓ Payment Verified
● Application Processing
○ Submitted to Department
○ Completed

Admin controls the status.

Customer sees the latest status automatically.

==================================================

SECTION 13 — ADDITIONAL DOCUMENT REQUEST

Admin can request additional documents.

Example:

ACTION REQUIRED

"Please upload a clearer address proof."

Customer tracking page should display:

Action Required

with:

Upload Document

After upload:
- admin receives updated document
- customer sees upload status
- history is updated

==================================================

SECTION 14 — ADMIN PORTAL SHELL

Create ONE real Admin Dashboard.

Do NOT create a second demo dashboard.

Route structure:

/admin/login
/admin/verify
/admin
/admin/applications
/admin/applications/:id
/admin/documents
/admin/payments
/admin/services
/admin/customers
/admin/settings
/admin/audit
/admin/security

Admin layout:

Left sidebar
Top bar
Search
Notifications
Admin profile
Main content
Responsive mobile sidebar

Navigation:

Dashboard
Applications
Documents
Payments
Services
Customers
QR / Payment Settings
Notifications
Audit Logs
Security
Settings
Logout

Customer website and Admin website should look like two parts of one product, but the Admin UI must have its own professional SaaS visual language.

==================================================

SECTION 15 — ADMIN DASHBOARD OVERVIEW

Create real dashboard cards:

Total Applications
Pending Applications
Documents Pending Review
Payments Pending
Processing
Completed
Rejected
Pay Later

Add:

Application trend chart
Status distribution
Payment overview
Recent applications

Recent application table:

Application ID
Customer
Service
Submitted
Payment
Status
Last Updated
Action

All dashboard numbers must come from the same application source used by customer tracking.

No separate demo dataset.

==================================================

SECTION 16 — ADMIN APPLICATION MANAGEMENT

Admin application page must support:

Search
Filter by service
Filter by status
Filter by payment
Filter by date
Sort
Pagination

Application details:

Customer
Service
Form data
Documents
Payment
Status
Timeline
Admin notes
Customer messages
Audit history

Actions:

Verify documents
Reject documents
Request re-upload
Verify payment
Reject payment
Change status
Add admin note
Send customer message
Mark completed
Cancel
Put on hold

Every important action must update the real application record.

==================================================
PHASE 4 — ADMIN OPERATIONS + DATA ARCHITECTURE
==================================================

SECTION 17 — DOCUMENT MANAGEMENT

Admin document center:

Document
Application
Customer
Document Type
Uploaded
Status
Actions

Statuses:

Uploaded
Under Review
Verified
Rejected
Re-upload Required

Admin can:

Preview
Download
Verify
Reject
Request replacement

Use secure/private storage architecture.

Never expose predictable public document URLs.

==================================================

SECTION 18 — SERVICE MANAGEMENT

Admin Service Manager.

Table:

Service
Category
Government Fee
DigiSeva Fee
Processing Time
Status
Featured
Actions

Admin can:

Add
Edit
Enable
Disable
Delete safely
Change government fee
Change DigiSeva fee
Change processing time
Change required documents
Change description
Change category
Mark featured

Customer website must automatically use updated service data.

No hardcoded duplicate fee values in React components.

==================================================

SECTION 19 — PAYMENT + QR MANAGEMENT

Admin Payment Settings.

Fields:

QR code upload
UPI ID
Payment instructions
Active/inactive

Actions:

Upload QR
Replace QR
Remove QR
Update UPI
Update instructions
Enable/disable QR payment

Customer payment screen must always use the currently active configuration.

Payment states:

Pending
Payment Submitted
Payment Verified
Payment Rejected
Pay Later

Payment record should support:

amount
UPI reference
screenshot
submittedAt
status
verifiedBy
verifiedAt
rejectionReason

==================================================

SECTION 20 — CUSTOMER + COMMUNICATION SYSTEM

Create customer management.

Admin can view:

Customer name
Mobile
Email
Applications
Last activity
Application status

Do not expose unnecessary personal information.

Separate:

INTERNAL ADMIN NOTE

from:

CUSTOMER MESSAGE

Internal note:
Only admins see it.

Customer message:
Customer can see it.

Example:

Internal:
"Address proof appears unclear."

Customer:
"Please upload a clearer address proof."

Never expose internal notes to customers.

Create notification architecture for:

Application submitted
Payment submitted
Payment verified
Payment rejected
Document rejected
Additional document required
Status changed
Application completed

Prepare architecture for future:
SMS
Email
WhatsApp
In-app notifications

Do not require all external integrations now.

==================================================

SECTION 21 — UNIFIED DATA/API ARCHITECTURE

This is one of the MOST IMPORTANT sections.

The current project has duplicate data sources.

DO NOT keep:

mock/applications.ts

as the customer production data source while:

data/store.ts

acts as a separate Admin database.

There must be ONE source of truth.

Target architecture:

Customer UI
      ↓
API / Data Layer
      ↓
Database
      ↑
API / Data Layer
      ↑
Admin UI

Both customer tracking and Admin Dashboard must use the same application records.

Create clear service interfaces:

createApplication()
getApplication()
getApplications()
updateApplication()
uploadApplicationDocument()
getApplicationDocuments()
updatePayment()
updateApplicationStatus()
addAdminNote()
sendCustomerMessage()
getApplicationHistory()

Services:

getServices()
getService()
createService()
updateService()
disableService()

Payment:

getPaymentSettings()
updatePaymentSettings()

Keep mock adapters isolated.

If backend infrastructure is not available inside Figma Make, create a clean repository/API abstraction that can be connected to a real backend without rewriting the UI.

DO NOT pretend that an in-memory mock store is production infrastructure.

==================================================
PHASE 5 — SECURITY + PRODUCTION QUALITY
==================================================

SECTION 22 — ADMIN AUTHENTICATION + 2FA

Completely remove prototype authentication.

REMOVE:

hardcoded admin username/password
frontend password comparison
"any 6 digit number"
prototype OTP
prototype credentials
authentication stored only in sessionStorage

Create architecture for:

Admin Login
↓
Password verification
↓
Secure session
↓
TOTP verification
↓
Admin Dashboard

Requirements:

Password hashing
Secure sessions
Session expiration
Protected routes
Logout
Rate limiting
Brute-force protection
Secure cookies where applicable
No passwords in frontend
No credentials in source code
No secrets committed to GitHub
No sensitive secrets exposed to browser

TOTP-compatible architecture.

Never store OTP values.

Do not hardcode a real production secret.

==================================================

SECTION 23 — SECURITY + PRIVACY

Apply security throughout.

Frontend:

Validation
Sanitization
File validation
File size limits
Allowed MIME types
No credentials
No API secrets
No sensitive information in localStorage

Backend architecture:

Authentication middleware
Authorization middleware
Input validation
Rate limiting
Secure headers
CORS
Password hashing
Secure sessions/tokens
Error handling
Parameterized database queries
XSS protection
CSRF protection where applicable

Documents:

Private storage
Access control
Safe filenames
MIME validation
Size restrictions

Privacy:

Minimize personal data shown in public tracking.
Do not expose Aadhaar/PAN or sensitive document information unnecessarily.
Mask sensitive values where appropriate.

==================================================

SECTION 24 — AUDIT LOG + ERROR HANDLING

Create a real audit system.

Record:

Admin login
Application opened
Document viewed
Document verified
Document rejected
Payment verified
Payment rejected
Status changed
Customer message sent
Service edited
Fee changed
QR changed
Settings changed

Audit record:

Actor
Action
Application
Timestamp
Previous value
New value
Details

Create professional error handling.

Examples:

Network error
Upload failure
Invalid application ID
Wrong mobile number
Expired session
Unauthorized admin
Payment reference invalid
Document rejected
Service unavailable

Never show technical stack traces to customers.

Use helpful messages.

==================================================

SECTION 25 — MOBILE + ACCESSIBILITY + SEO

MOBILE:

Customer website:
mobile-first

Admin:
responsive desktop/tablet/mobile

Ensure:

forms don't break
keyboard doesn't cover fields
file uploads work
QR is readable
bottom navigation doesn't overlap content
tables become cards or horizontal-scroll intelligently
dialogs work on small screens

ACCESSIBILITY:

Keyboard navigation
Focus states
ARIA labels where required
Readable contrast
Large touch targets
Form error announcements
Semantic HTML

SEO:

Remove production noindex restriction.

Create:

proper title
meta description
canonical URL
Open Graph metadata
favicon
robots.txt
sitemap.xml
service-specific SEO metadata
structured data where appropriate

SEO-friendly URLs:

/services/pan-card
/services/voter-id
/services/driving-licence
/services/passport

==================================================

SECTION 26 — FINAL PRODUCTION POLISH + QUALITY CONTROL
==================================================

Perform a complete product-quality pass.

PUBLIC WEBSITE:

Check:
Home
Services
Search
Service details
Application flow
Document upload
Review
Payment
Success
Tracking
Help
Footer
Mobile navigation

ADMIN:

Check:
Login
2FA architecture
Dashboard
Applications
Application details
Documents
Payments
Services
Customers
Messages
QR settings
Audit
Security
Settings
Logout

DATA:

There must NOT be two independent application datasets.

CUSTOMER and ADMIN must operate on the same application model.

Remove obvious demo data from the public production experience.

Development seed/demo data must be isolated from production adapters.

VISUAL:

Do not over-redesign.

Preserve the current DigiSeva identity.

Fix:
spacing
alignment
mobile responsiveness
empty states
loading states
error states
hover states
button consistency
table consistency
form consistency
modal consistency

PERFORMANCE:

Avoid unnecessary re-renders.
Lazy-load large admin sections where useful.
Optimize images.
Avoid giant duplicated data structures.
Keep service data centralized.

CODE QUALITY:

Use TypeScript types.
Avoid `any` where practical.
Create reusable components.
Separate UI from data/business logic.
Separate mock adapters from production adapters.
Use clear naming.
Remove dead code.
Remove duplicate code.
Remove obsolete prototype authentication.
Remove duplicate application stores.

==================================================
CRITICAL RULES
==================================================

RULE 1:
Do NOT rebuild from scratch.

RULE 2:
Do NOT create another AdminDashboard.

RULE 3:
Upgrade the existing AdminDashboard into the real admin application.

RULE 4:
Do NOT maintain two separate application datasets.

RULE 5:
Customer tracking and Admin must use the same source of truth.

RULE 6:
Do NOT hardcode production admin credentials.

RULE 7:
Do NOT implement fake OTP verification.

RULE 8:
Do NOT expose customer documents publicly.

RULE 9:
Do NOT add GST or invented charges.

RULE 10:
Do NOT integrate a real payment gateway yet.

RULE 11:
Keep QR/UPI payment architecture.

RULE 12:
Do NOT use "Official Government Portal" or other misleading government affiliation.

RULE 13:
Do not display fabricated citizen counts, ratings, uptime or government-compliance claims.

RULE 14:
Do not remove useful existing functionality merely for visual redesign.

RULE 15:
Do not remove existing useful footer links such as LocalShare if present.

RULE 16:
Do not create fake production security. Clearly separate frontend prototype capabilities from backend infrastructure requirements.

==================================================
FINAL IMPLEMENTATION REPORT
==================================================

After making the changes, provide a clear report containing:

1. Files inspected
2. Files changed
3. Components reused
4. Components created
5. Components removed
6. Data architecture changes
7. Customer flow changes
8. Admin flow changes
9. Authentication changes
10. Document architecture
11. Payment architecture
12. Status architecture
13. API/data layer
14. Security improvements
15. SEO improvements
16. Mobile improvements
17. Remaining backend requirements
18. Remaining production infrastructure requirements
19. Anything still mocked
20. Any known limitations

MOST IMPORTANT FINAL REQUIREMENT:

The final result must feel like ONE complete DigiSeva product:

                    DIGISEVA
                       |
          +------------+------------+
          |                         |
     CUSTOMER PORTAL           ADMIN PORTAL
          |                         |
          +------------+------------+
                       |
                   REAL API
                       |
                   DATABASE
                       |
              PRIVATE STORAGE
                       |
             PAYMENT / NOTIFICATIONS

Do not create disconnected demos.

Build the foundation so that the same application created by a customer can be opened by Admin, processed by Admin, updated by Admin, and tracked by that same customer.

The goal is not "a beautiful prototype".

The goal is:

A polished, coherent, production-oriented DigiSeva platform that is ready to connect to real backend infrastructure.