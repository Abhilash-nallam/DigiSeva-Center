You are a Senior React + TypeScript + TailwindCSS + UI/UX Engineer.

IMPORTANT
Do NOT rewrite my project.
Do NOT remove existing functionality.
Keep all service data.
Keep the existing design system.
Improve only the UI, UX, navigation and architecture.

========================================================
NEW MAIN NAVIGATION
========================================================

At the TOP CENTER of the navbar create TWO floating segmented buttons.

--------------------------------------------------------

[ DigiSeva ]   [ Insurance & Loans ]

--------------------------------------------------------

Default selected:

DigiSeva

Active button should have:

• Blue gradient
• White text
• Rounded pill
• Shadow
• Smooth animation

Inactive button:

White background
Blue border

When clicking

Insurance & Loans

Navigate to a completely separate page.

Route:

/insurance

The DigiSeva homepage remains

/

Both pages should share the same navbar and footer.

========================================================
DIGISEVA PAGE
========================================================

Keep existing layout.

Implement the following improvements.

========================================================
1. SERVICE QUICK FILTERS
========================================================

Above services create filter pills.

All

Identity

Certificates

Transport

Education

Finance

Agriculture

Health

Business

Employment

Insurance

Loans

Filtering must happen instantly without page reload.

========================================================
5. SMART SEARCH
========================================================

Upgrade search.

Typing

pan

shows

PAN Card

PAN Correction

PAN Reprint

Typing

lost pan

suggests

PAN Reprint

Typing

income

shows Income Certificate

Typing

driving

shows DL Renewal

Use fuzzy searching.

Show dropdown suggestions.

Keyboard navigation.

Highlight matching text.

========================================================
7. APPLICATION PROGRESS
========================================================

Replace simple status text.

Create professional timeline.

Submitted

↓

Documents Verified

↓

Processing

↓

Government Approval

↓

Completed

Each step contains

icon

date

description

color

Current stage animated.

========================================================
11. TESTIMONIALS
========================================================

Create premium testimonial section.

Auto sliding cards.

Example

★★★★★

Applied for PAN Card.

Very smooth process.

— Ravi
Hyderabad

Add at least six testimonials.

========================================================
12. TRACK APPLICATION
========================================================

Create fully working public tracking system.

NO LOGIN REQUIRED.

User enters

Application ID

AND

Registered Mobile Number

Then display

Applicant Name

Applied Service

Application Date

Current Status

Expected Completion Date

Timeline

Uploaded Documents

Receipt Download

Print Application

Refresh Status

Show beautiful status cards.

Statuses

Pending

Verified

Processing

Government Review

Completed

Rejected

Cancelled

Use local mock API architecture.

IMPORTANT

Design it exactly as if it will later connect to a real backend.

Create proper interfaces.

Application

Applicant

Status

Timeline

Receipt

Document

Use mock JSON now.

Later I will replace with API.

========================================================
13. INSURANCE & LOANS PAGE
========================================================

Create separate route

/insurance

Hero

Insurance & Loans

Protect Your Family.
Secure Your Future.

Search Bar

Categories

Health

Life

Term

Car

Bike

Travel

Business

Shop

Home

Crop

Personal Accident

Loan Categories

Personal Loan

Home Loan

Business Loan

Education Loan

Car Loan

Bike Loan

Gold Loan

Loan Against Property

Cards should look premium.

Each card contains

Icon

Short Description

Apply Button

Request Callback

Powered by

Turtlemint

badge

Create comparison table.

Why Choose Us.

Testimonials.

FAQ.

========================================================
RESPONSIVE DESIGN
========================================================

Everything must be perfect.

Desktop

Laptop

Tablet

Mobile

Bottom navigation on mobile.

Sticky CTA.

Touch friendly.

========================================================
PHASE 12 PREPARATION
========================================================

Build architecture for future live tracking.

Create folders

services/

api/

hooks/

types/

mock/

Create reusable API functions.

Example

getApplication()

getTimeline()

getDocuments()

getReceipt()

updateStatus()

Use mock JSON data.

Do NOT hardcode inside components.

Make it extremely easy to connect Node.js + Express + MongoDB later.

========================================================
ANIMATIONS
========================================================

Use Framer Motion.

Smooth fade

Slide

Card lift

Hover scale

Page transition

Loading skeletons

Animated timeline

========================================================
DESIGN
========================================================

Blue

#2563EB

Green

#10B981

Orange

#F59E0B

Background

#F8FAFC

Rounded

16px

Premium shadows

Glassmorphism where suitable

========================================================
PERFORMANCE
========================================================

Lazy loading

Code splitting

Memoization

Reusable components

No duplicated code

SEO friendly

Accessible

========================================================
DO NOT
========================================================

Do not break existing code.

Do not remove services.

Do not remove search.

Do not remove tracking.

Only improve.

Create production-quality code.

The final website should feel like a premium government services portal comparable to DigiLocker, Passport Seva, CSC Digital Seva, or commercial fintech platforms.