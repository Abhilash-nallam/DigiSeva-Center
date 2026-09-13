import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, Menu, X, Shield, FileText, Car, Vote, CreditCard, Home,
  Briefcase, Globe, Phone, Mail, MapPin, CheckCircle, Clock, ArrowRight,
  Download, Upload, HelpCircle, Star, Users, TrendingUp, Zap, ChevronDown,
  AlertCircle, Check, RefreshCw, Building, Stethoscope, GraduationCap,
  Wallet, Baby, Train, Wifi, Droplets, Flame, ShieldCheck, BookOpen, Scale,
  Leaf, Building2, Receipt, PiggyBank, HeartPulse, Microscope, Factory,
  Ship, BadgeCheck, ChevronUp, MessageCircle, Sparkles, LayoutGrid, House,
  Printer, ChevronLeft, ChevronRight as ChevRt, Truck, XCircle, Ban,
} from "lucide-react";
import { getApplication } from "../services/api";
import type { Application } from "../types";
import { AdminDashboard } from "../admin/AdminDashboard";
import { getAdminConfig, createApplication, getServiceFeeOverride, getManagedServices, registerServiceCatalog } from "../data/store";
import { createServiceKnowledge, orchestrate } from "../ai/aiOrchestrator";
import { matchServices } from "../ai/serviceMatcher";
import type { AIAction, ConversationContext } from "../ai/types";

// ── All Services ──────────────────────────────────────────────────────────────
const ALL_SERVICES = [
  { id: "pan", icon: CreditCard, title: "PAN Card", badge: "Income Tax", category: "identity", group: "Identity & KYC", desc: "Apply, update or reprint your Permanent Account Number card.", color: "bg-blue-50 text-blue-600", fee: "₹107", digiSevaFee: "₹50", time: "15 days", popular: true, tags: ["pan", "permanent account", "tax id", "nsdl", "reprint"], docs: ["Aadhaar Card", "Passport Photo", "Address Proof", "Signature Scan"], steps: [{ label: "Personal Details", desc: "Name, DOB, father/mother name as in Aadhaar" }, { label: "Upload Documents", desc: "Photo, signature, proof of identity & address" }, { label: "Review & Confirm", desc: "Verify all details before payment" }, { label: "Payment", desc: "Scan QR or pay via UPI" }] },
  { id: "aadhaar", icon: Shield, title: "Aadhaar Update", badge: "UIDAI", category: "identity", group: "Identity & KYC", desc: "Update address, mobile number or download e-Aadhaar.", color: "bg-indigo-50 text-indigo-600", fee: "₹50", digiSevaFee: "₹30", time: "90 days", popular: true, tags: ["aadhaar", "uid", "biometric", "address update", "uidai"], docs: ["Registered Mobile", "Address Proof"], steps: [{ label: "Personal Details", desc: "Select field to update" }, { label: "Upload Documents", desc: "Supporting documents" }, { label: "Review & Confirm", desc: "Review changes" }, { label: "Payment", desc: "Pay via QR or UPI" }] },
  { id: "voter", icon: Vote, title: "Voter ID / e-EPIC", badge: "ECI", category: "identity", group: "Identity & KYC", desc: "Register as voter, update details or download e-EPIC.", color: "bg-green-50 text-green-600", fee: "Free", digiSevaFee: "₹30", time: "30 days", popular: true, tags: ["voter", "epic", "election", "eci", "voter card"], docs: ["Passport Photo", "Age Proof", "Address Proof"], steps: [{ label: "Personal Details", desc: "Name, DOB, constituency" }, { label: "Upload Documents", desc: "Photo, age and address proof" }, { label: "Review & Confirm", desc: "Verify form details" }, { label: "Payment", desc: "DigiSeva service fee" }] },
  { id: "passport", icon: Globe, title: "Passport", badge: "MEA", category: "identity", group: "Identity & KYC", desc: "New passport, renewal, Tatkal or police clearance certificate.", color: "bg-purple-50 text-purple-600", fee: "₹1,500", digiSevaFee: "₹150", time: "3–7 weeks", popular: true, tags: ["passport", "travel", "mea", "tatkal", "pcc", "renewal"], docs: ["Aadhaar", "Birth Certificate", "Address Proof"], steps: [{ label: "Personal Details", desc: "Passport type, applicant info" }, { label: "Upload Documents", desc: "Aadhaar, birth cert, address proof" }, { label: "Book Appointment", desc: "Select PSK near you" }, { label: "Payment", desc: "Government fee + DigiSeva fee" }] },
  { id: "driving", icon: Car, title: "Driving Licence", badge: "Transport", category: "identity", group: "Identity & KYC", desc: "Fresh DL, renewal, duplicate or change of address.", color: "bg-orange-50 text-orange-600", fee: "₹200–500", digiSevaFee: "₹75", time: "30 days", popular: true, tags: ["driving licence", "dl", "rto", "sarathi", "driving renewal", "dl renewal", "lost driving"], docs: ["Form 4", "Age Proof", "Medical Certificate"], steps: [{ label: "Personal Details", desc: "Applicant and vehicle class details" }, { label: "Upload Documents", desc: "Age proof, address, medical form" }, { label: "Book RTO Slot", desc: "Select test date and RTO" }, { label: "Payment", desc: "Fee varies by state" }] },
  { id: "birth", icon: Baby, title: "Birth Certificate", badge: "Civil", category: "identity", group: "Identity & KYC", desc: "Apply or download a digitally signed birth certificate.", color: "bg-pink-50 text-pink-600", fee: "₹20–100", time: "1–7 days", popular: true, tags: ["birth", "certificate", "civil", "newborn", "baby"], docs: ["Hospital Discharge", "Parents' Aadhaar"], steps: [{ label: "Personal Details", desc: "Child's name, DOB, place of birth" }, { label: "Upload Documents", desc: "Hospital discharge, parents' ID" }, { label: "Review & Confirm", desc: "Verify entered details" }, { label: "Payment", desc: "State-specific fee" }] },
  { id: "death", icon: FileText, title: "Death Certificate", badge: "Civil", category: "identity", group: "Identity & KYC", desc: "Register a death and obtain a certified death certificate.", color: "bg-slate-50 text-slate-600", fee: "₹20–50", time: "3–5 days", popular: false, tags: ["death", "certificate", "civil"], docs: ["Hospital Death Summary", "Aadhaar of Deceased"], steps: [{ label: "Personal Details", desc: "Deceased person's details" }, { label: "Upload Documents", desc: "Death summary, ID proof" }, { label: "Review & Confirm", desc: "Verify details" }, { label: "Payment", desc: "Nominal fee" }] },
  { id: "marriage", icon: BadgeCheck, title: "Marriage Certificate", badge: "Civil", category: "identity", group: "Identity & KYC", desc: "Register marriage and obtain certified certificate online.", color: "bg-rose-50 text-rose-600", fee: "₹100–200", time: "15 days", popular: false, tags: ["marriage", "certificate", "wedding", "civil", "wedlock"], docs: ["Marriage Invitation", "Both Aadhaar", "Witness ID"], steps: [{ label: "Personal Details", desc: "Both spouses' details" }, { label: "Upload Documents", desc: "Photos, proof, witness docs" }, { label: "Book Date", desc: "Appointment with registrar" }, { label: "Payment", desc: "Registration fee" }] },
  { id: "land", icon: Home, title: "Land Records / ROR", badge: "Revenue", category: "land", group: "Land & Property", desc: "View Khatauni, Khasra, mutation status and revenue records.", color: "bg-amber-50 text-amber-600", fee: "Free / ₹50", time: "Instant", popular: false, tags: ["land", "khasra", "khatauni", "ror", "mutation", "record of rights"], docs: ["Khasra Number", "Owner Name"], steps: [{ label: "Select Location", desc: "State, district, tehsil, village" }, { label: "Enter Details", desc: "Survey/Khasra number" }, { label: "View Records", desc: "Land ownership details" }, { label: "Download", desc: "Certified copy if needed" }] },
  { id: "mutation", icon: Building, title: "Property Mutation", badge: "Revenue", category: "land", group: "Land & Property", desc: "Transfer property title after sale, gift or inheritance.", color: "bg-yellow-50 text-yellow-600", fee: "₹500–2,000", time: "30–60 days", popular: false, tags: ["mutation", "property", "transfer", "sale deed"], docs: ["Sale Deed", "Aadhaar", "NOC"], steps: [{ label: "Personal Details", desc: "Buyer/seller information" }, { label: "Upload Documents", desc: "Sale deed, Aadhaar, NOC" }, { label: "Review & Confirm", desc: "Verify details" }, { label: "Payment", desc: "Mutation fee" }] },
  { id: "encumbrance", icon: Scale, title: "Encumbrance Certificate", badge: "Registration", category: "land", group: "Land & Property", desc: "Proof of free title/ownership of a property over a period.", color: "bg-lime-50 text-lime-600", fee: "₹200–500", time: "3–7 days", popular: false, tags: ["encumbrance", "ec", "property", "ownership"], docs: ["Property Details", "Survey Number"], steps: [{ label: "Personal Details", desc: "Owner and property info" }, { label: "Enter Details", desc: "Survey number, years required" }, { label: "Review", desc: "Verify request" }, { label: "Payment", desc: "Online fee" }] },
  { id: "buildingplan", icon: Building2, title: "Building Plan Approval", badge: "Urban Dev", category: "land", group: "Land & Property", desc: "Apply for building construction or renovation plan approval.", color: "bg-cyan-50 text-cyan-600", fee: "₹2,000+", time: "30 days", popular: false, tags: ["building", "plan", "approval", "construction", "urban"], docs: ["Site Plan", "NOC", "Land Documents"], steps: [{ label: "Personal Details", desc: "Owner and building details" }, { label: "Upload Plans", desc: "Architectural drawings, NOC" }, { label: "Review", desc: "Technical scrutiny" }, { label: "Payment", desc: "Area-based fee" }] },
  { id: "gst", icon: Briefcase, title: "GST Registration", badge: "GST", category: "finance", group: "Tax & Finance", desc: "New GST registration, returns filing and compliance.", color: "bg-teal-50 text-teal-600", fee: "Free", time: "3–7 days", popular: false, tags: ["gst", "tax", "business", "registration", "gstin"], docs: ["PAN Card", "Aadhaar", "Bank Statement"], steps: [{ label: "Business Details", desc: "Business type, NIC code, turnover" }, { label: "Upload Documents", desc: "PAN, Aadhaar, bank statement" }, { label: "Review & Confirm", desc: "Verify application" }, { label: "Submit", desc: "Free — no fee" }] },
  { id: "itr", icon: Receipt, title: "Income Tax Return", badge: "Income Tax", category: "finance", group: "Tax & Finance", desc: "File ITR-1 to ITR-7 online with pre-filled data.", color: "bg-emerald-50 text-emerald-600", fee: "Free", time: "Instant", popular: false, tags: ["income tax", "itr", "tax return", "refund", "form 16", "income"], docs: ["Form 16", "Bank Statements", "PAN"], steps: [{ label: "Personal Details", desc: "PAN, AY, ITR form selection" }, { label: "Income Details", desc: "Salary, other income, deductions" }, { label: "Review & Confirm", desc: "Verify tax computation" }, { label: "E-Verify", desc: "Aadhaar OTP or DSC" }] },
  { id: "tds", icon: Wallet, title: "TDS / TCS Services", badge: "Income Tax", category: "finance", group: "Tax & Finance", desc: "TDS return filing, correction, Form 26AS download.", color: "bg-green-50 text-green-600", fee: "Free", time: "Instant", popular: false, tags: ["tds", "tcs", "tax", "deduction", "26as"], docs: ["PAN", "Challan Details"], steps: [{ label: "Deductor Details", desc: "TAN, business details" }, { label: "Upload Statement", desc: ".fvu file via NSDL RPU" }, { label: "Review", desc: "Verify deductee details" }, { label: "Submit", desc: "Acknowledgement generated" }] },
  { id: "epfo", icon: PiggyBank, title: "EPF / PF Services", badge: "EPFO", category: "finance", group: "Tax & Finance", desc: "PF withdrawal, transfer, UAN activation and passbook.", color: "bg-violet-50 text-violet-600", fee: "Free", time: "15–30 days", popular: false, tags: ["epf", "pf", "provident fund", "uan", "withdrawal"], docs: ["UAN", "Aadhaar", "Bank Account"], steps: [{ label: "Personal Details", desc: "UAN, member name" }, { label: "Bank Details", desc: "Account for credit" }, { label: "Review", desc: "Verify claim details" }, { label: "Submit", desc: "Free service" }] },
  { id: "nps", icon: TrendingUp, title: "NPS Registration", badge: "PFRDA", category: "finance", group: "Tax & Finance", desc: "Open National Pension System account for retirement savings.", color: "bg-sky-50 text-sky-600", fee: "₹125", time: "3 days", popular: false, tags: ["nps", "pension", "retirement", "pran"], docs: ["PAN", "Aadhaar", "Bank Details", "Photo"], steps: [{ label: "Personal Details", desc: "Name, DOB, nominee" }, { label: "KYC Documents", desc: "Aadhaar-based or physical KYC" }, { label: "Review", desc: "Verify PRAN details" }, { label: "Payment ₹125", desc: "Initial contribution ₹500" }] },
  { id: "ayushman", icon: HeartPulse, title: "Ayushman Bharat", badge: "Health", category: "health", group: "Health & Insurance", desc: "PM-JAY health cover of ₹5 lakh per family per year.", color: "bg-red-50 text-red-600", fee: "Free", time: "Instant", popular: false, tags: ["ayushman", "pmjay", "health", "insurance", "hospital"], docs: ["Aadhaar", "Ration Card", "SECC Data"], steps: [{ label: "Check Eligibility", desc: "Verify via Aadhaar / ration card" }, { label: "Upload Documents", desc: "Aadhaar, ration card" }, { label: "Review", desc: "Verify eligibility" }, { label: "Get Card", desc: "Visit empanelled hospital" }] },
  { id: "esi", icon: Stethoscope, title: "ESIC Registration", badge: "ESIC", category: "health", group: "Health & Insurance", desc: "Employee state insurance for medical and sickness benefits.", color: "bg-rose-50 text-rose-600", fee: "Free", time: "7 days", popular: false, tags: ["esic", "esi", "employee", "insurance", "medical"], docs: ["Employee List", "Bank Details"], steps: [{ label: "Employer Details", desc: "Establishment details" }, { label: "Employee List", desc: "Staff details for IP generation" }, { label: "Review", desc: "Verify data" }, { label: "Submit", desc: "Free registration" }] },
  { id: "janani", icon: Baby, title: "Janani Suraksha", badge: "Health", category: "health", group: "Health & Insurance", desc: "Cash assistance for institutional delivery for BPL mothers.", color: "bg-pink-50 text-pink-600", fee: "Free", time: "Same day", popular: false, tags: ["janani", "delivery", "maternal", "health", "bpl"], docs: ["Aadhaar", "BPL Card", "Bank Account"], steps: [{ label: "Personal Details", desc: "Mother's details, delivery info" }, { label: "Upload Documents", desc: "Aadhaar, BPL card, bank proof" }, { label: "Review", desc: "ASHA verifies details" }, { label: "DBT Transfer", desc: "Cash credited to bank" }] },
  { id: "pmssby", icon: ShieldCheck, title: "PMSBY / PMJJBY", badge: "Insurance", category: "health", group: "Health & Insurance", desc: "Government accident insurance ₹2 lakh at ₹20/year premium.", color: "bg-orange-50 text-orange-600", fee: "₹20/year", time: "Instant", popular: false, tags: ["pmsby", "pmjjby", "accident", "insurance", "government"], docs: ["Aadhaar", "Bank Account"], steps: [{ label: "Personal Details", desc: "Name, Aadhaar, bank account" }, { label: "Upload Documents", desc: "Aadhaar, bank passbook" }, { label: "Review", desc: "Verify enrolment" }, { label: "Payment ₹20", desc: "Annual premium" }] },
  { id: "scholarship", icon: GraduationCap, title: "National Scholarship", badge: "Education", category: "education", group: "Education & Skill", desc: "Pre/Post matric scholarships for SC/ST/OBC/Minority students.", color: "bg-purple-50 text-purple-600", fee: "Free", time: "3–6 months", popular: false, tags: ["scholarship", "education", "student", "minority", "sc st obc"], docs: ["Aadhaar", "Caste Certificate", "Mark Sheet"], steps: [{ label: "Student Details", desc: "Name, course, institution" }, { label: "Upload Documents", desc: "Caste cert, marks, bank details" }, { label: "Review", desc: "Institute verification" }, { label: "Submit", desc: "Free application" }] },
  { id: "digilocker", icon: BookOpen, title: "DigiLocker", badge: "MeitY", category: "education", group: "Education & Skill", desc: "Store and share government-issued documents digitally.", color: "bg-blue-50 text-blue-600", fee: "Free", time: "Instant", popular: false, tags: ["digilocker", "documents", "digital", "aadhaar"], docs: ["Aadhaar / Mobile"], steps: [{ label: "Account Setup", desc: "Aadhaar-based registration" }, { label: "Upload / Fetch", desc: "Pull from issuing departments" }, { label: "Review", desc: "Verify documents" }, { label: "Submit", desc: "Free service" }] },
  { id: "pmkvy", icon: Briefcase, title: "PMKVY Skill Training", badge: "MSDE", category: "education", group: "Education & Skill", desc: "Free skill development training with certificate and stipend.", color: "bg-teal-50 text-teal-600", fee: "Free", time: "3–6 months", popular: false, tags: ["pmkvy", "skill", "training", "certificate", "employment"], docs: ["Aadhaar", "Bank Account"], steps: [{ label: "Personal Details", desc: "Name, preferred course" }, { label: "Upload Documents", desc: "Aadhaar, education certificate" }, { label: "Select Centre", desc: "Training centre near you" }, { label: "Enrol", desc: "Free enrolment" }] },
  { id: "pmkisan", icon: Leaf, title: "PM-KISAN", badge: "Agriculture", category: "agriculture", group: "Agriculture", desc: "₹6,000/year income support in 3 instalments to farmers.", color: "bg-green-50 text-green-600", fee: "Free", time: "4 months", popular: false, tags: ["pmkisan", "farmer", "kisan", "agriculture", "income"], docs: ["Aadhaar", "Land Records", "Bank Account"], steps: [{ label: "Farmer Details", desc: "Name, land details" }, { label: "Upload Documents", desc: "Aadhaar, land records" }, { label: "Review", desc: "State verification" }, { label: "Submit", desc: "Free registration" }] },
  { id: "kcc", icon: CreditCard, title: "Kisan Credit Card", badge: "Agriculture", category: "agriculture", group: "Agriculture", desc: "Flexible credit for agricultural needs at subsidised interest.", color: "bg-lime-50 text-lime-600", fee: "Free", time: "14 days", popular: false, tags: ["kcc", "kisan", "credit", "farmer", "loan"], docs: ["Land Records", "Aadhaar"], steps: [{ label: "Farmer Details", desc: "Name, land holding" }, { label: "Upload Documents", desc: "Land records, Aadhaar, photo" }, { label: "Credit Assessment", desc: "Bank assessment" }, { label: "Submit", desc: "Free processing" }] },
  { id: "pmfby", icon: Leaf, title: "PM Fasal Bima", badge: "Agriculture", category: "agriculture", group: "Agriculture", desc: "Crop insurance scheme for natural calamity losses.", color: "bg-emerald-50 text-emerald-600", fee: "1.5–5%", time: "Before sowing", popular: false, tags: ["pmfby", "fasal bima", "crop", "insurance", "farmer"], docs: ["Land Records", "Bank Account", "Sowing Certificate"], steps: [{ label: "Farmer Details", desc: "Name, crop type, area" }, { label: "Upload Documents", desc: "Land records, bank details" }, { label: "Review", desc: "Verify enrolment" }, { label: "Payment", desc: "1.5–5% premium" }] },
  { id: "electricity", icon: Zap, title: "Electricity Connection", badge: "Power", category: "utility", group: "Utilities", desc: "New connection, bill payment, meter complaint and grievance.", color: "bg-yellow-50 text-yellow-600", fee: "Varies", time: "7–30 days", popular: false, tags: ["electricity", "power", "connection", "discom", "bill"], docs: ["Aadhaar", "Address Proof", "Ownership Proof"], steps: [{ label: "Personal Details", desc: "Applicant, premises details" }, { label: "Upload Documents", desc: "Aadhaar, address, ownership" }, { label: "Survey", desc: "DISCOM site survey" }, { label: "Payment", desc: "Connection deposit" }] },
  { id: "water", icon: Droplets, title: "Water Connection", badge: "Jal Board", category: "utility", group: "Utilities", desc: "New water connection, pipe repair or sewage connection.", color: "bg-cyan-50 text-cyan-600", fee: "₹2,000+", time: "15–30 days", popular: false, tags: ["water", "connection", "sewage", "jal board"], docs: ["Address Proof", "Ownership"], steps: [{ label: "Personal Details", desc: "Address, usage type" }, { label: "Upload Documents", desc: "Address proof, ownership" }, { label: "Inspection", desc: "Site inspection" }, { label: "Payment", desc: "Connection fee" }] },
  { id: "lpg", icon: Flame, title: "LPG / PMUY Connection", badge: "Petroleum", category: "utility", group: "Utilities", desc: "New LPG connection, Ujjwala scheme or subsidy transfer.", color: "bg-orange-50 text-orange-600", fee: "Free (PMUY)", time: "7 days", popular: false, tags: ["lpg", "gas", "ujjwala", "pmuy", "subsidy"], docs: ["Aadhaar", "BPL Card", "Bank Account"], steps: [{ label: "Personal Details", desc: "Name, address, distributor" }, { label: "Upload Documents", desc: "Aadhaar, BPL card, bank" }, { label: "Review", desc: "Verify details" }, { label: "Submit", desc: "Free under PMUY" }] },
  { id: "broadband", icon: Wifi, title: "BharatNet Broadband", badge: "DoT", category: "utility", group: "Utilities", desc: "High-speed optical fibre broadband in rural gram panchayats.", color: "bg-blue-50 text-blue-600", fee: "₹150+/month", time: "7–15 days", popular: false, tags: ["broadband", "internet", "bharatnet", "fibre", "rural"], docs: ["Aadhaar", "Address Proof"], steps: [{ label: "Personal Details", desc: "Name, GP address" }, { label: "Upload Documents", desc: "Aadhaar, address proof" }, { label: "Installation", desc: "Technician visit" }, { label: "Activation", desc: "Monthly plan fee" }] },
  { id: "fasttag", icon: Car, title: "FASTag Registration", badge: "NHAI", category: "transport", group: "Transport", desc: "RFID-based toll payment tag for hassle-free highway travel.", color: "bg-green-50 text-green-600", fee: "₹200+", time: "Instant", popular: false, tags: ["fasttag", "toll", "nhai", "rfid", "highway"], docs: ["RC Book", "Aadhaar", "Vehicle Photo"], steps: [{ label: "Vehicle Details", desc: "RC number, vehicle class" }, { label: "Upload Documents", desc: "RC, Aadhaar, front photo" }, { label: "Bank Linking", desc: "Link bank / wallet" }, { label: "Payment ₹200", desc: "Tag + security deposit" }] },
  { id: "vahan", icon: Truck, title: "Vehicle Registration", badge: "Transport", category: "transport", group: "Transport", desc: "New vehicle registration, RC transfer, hypothecation removal.", color: "bg-amber-50 text-amber-600", fee: "Varies", time: "7 days", popular: false, tags: ["vahan", "vehicle", "registration", "rc", "rto"], docs: ["Form 20", "Insurance", "PUC Certificate"], steps: [{ label: "Vehicle Details", desc: "Make, model, chassis number" }, { label: "Upload Documents", desc: "Insurance, PUC, Form 20" }, { label: "Review", desc: "RTO inspection" }, { label: "Payment", desc: "Registration + road tax" }] },
  { id: "rc_transfer", icon: Car, title: "RC Transfer", badge: "Transport", category: "transport", group: "Transport", desc: "Transfer vehicle ownership after sale or inheritance.", color: "bg-rose-50 text-rose-600", fee: "₹300–500", time: "30 days", popular: false, tags: ["rc", "transfer", "vehicle", "sale", "ownership"], docs: ["Form 29 & 30", "Old RC", "Insurance", "NOC"], steps: [{ label: "Personal Details", desc: "Buyer and seller details" }, { label: "Upload Documents", desc: "Form 29/30, RC, NOC" }, { label: "Review", desc: "Verify ownership" }, { label: "Payment", desc: "Transfer fee + tax" }] },
  { id: "sarathi", icon: Train, title: "SARATHI Services", badge: "Transport", category: "transport", group: "Transport", desc: "LL, DL, conductor licence, PSV badge on Sarathi portal.", color: "bg-blue-50 text-blue-600", fee: "₹150–300", time: "14 days", popular: false, tags: ["sarathi", "learner", "licence", "conductor", "psv"], docs: ["Age Proof", "Address Proof", "Medical Form"], steps: [{ label: "Personal Details", desc: "Applicant info, vehicle class" }, { label: "Upload Documents", desc: "Age, address, medical" }, { label: "Book Test Slot", desc: "RTO written + driving test" }, { label: "Payment", desc: "Licence fee" }] },
  { id: "pmay", icon: Home, title: "PM Awas Yojana", badge: "Housing", category: "welfare", group: "Welfare & Benefits", desc: "Subsidised home loan or grant for EWS/LIG/MIG categories.", color: "bg-amber-50 text-amber-600", fee: "Free", time: "6–12 months", popular: false, tags: ["pmay", "housing", "home loan", "ews", "lig"], docs: ["Aadhaar", "Income Certificate", "Land Documents"], steps: [{ label: "Personal Details", desc: "Income slab, family details" }, { label: "Upload Documents", desc: "Aadhaar, income cert, land" }, { label: "Review", desc: "Bank / authority review" }, { label: "Submit", desc: "Free application" }] },
  { id: "ration", icon: Leaf, title: "Ration Card", badge: "Food", category: "welfare", group: "Welfare & Benefits", desc: "New ration card, update or add family members online.", color: "bg-green-50 text-green-600", fee: "₹10–50", time: "30 days", popular: false, tags: ["ration", "card", "food", "pds", "bpl"], docs: ["Aadhaar", "Income Proof", "Residence Proof"], steps: [{ label: "Personal Details", desc: "Family head, members" }, { label: "Upload Documents", desc: "Aadhaar, income, residence" }, { label: "Review", desc: "Field verification" }, { label: "Payment", desc: "Nominal fee" }] },
  { id: "oldage", icon: Users, title: "Old Age Pension", badge: "Welfare", category: "welfare", group: "Welfare & Benefits", desc: "₹200–500/month pension for destitute elderly (60+).", color: "bg-slate-50 text-slate-600", fee: "Free", time: "2–3 months", popular: false, tags: ["pension", "old age", "elderly", "welfare", "ignoaps"], docs: ["Age Proof", "BPL Card", "Bank Account"], steps: [{ label: "Personal Details", desc: "Name, age, BPL status" }, { label: "Upload Documents", desc: "Age proof, BPL card, bank" }, { label: "Review", desc: "Welfare officer verification" }, { label: "Submit", desc: "Free application" }] },
  { id: "disability", icon: HeartPulse, title: "Disability Certificate", badge: "Social", category: "welfare", group: "Welfare & Benefits", desc: "UDID card for persons with 40%+ disability for benefits.", color: "bg-blue-50 text-blue-600", fee: "Free", time: "30 days", popular: false, tags: ["disability", "udid", "handicap", "certificate"], docs: ["Medical Certificate", "Aadhaar", "Passport Photo"], steps: [{ label: "Personal Details", desc: "Name, disability type" }, { label: "Upload Documents", desc: "Medical cert, Aadhaar, photo" }, { label: "Medical Board", desc: "Board assessment" }, { label: "Submit", desc: "Free — UDID issued" }] },
  { id: "udyam", icon: Factory, title: "Udyam Registration", badge: "MSME", category: "business", group: "Business & Commerce", desc: "Register micro, small or medium enterprise for benefits.", color: "bg-orange-50 text-orange-600", fee: "Free", time: "Instant", popular: false, tags: ["udyam", "msme", "business", "enterprise", "startup"], docs: ["Aadhaar", "PAN", "GSTIN"], steps: [{ label: "Business Details", desc: "NIC code, investment, turnover" }, { label: "Upload Documents", desc: "Aadhaar, PAN, GSTIN" }, { label: "Review", desc: "Self-declaration" }, { label: "Submit", desc: "Free — instant UDYAM No." }] },
  { id: "trade", icon: Receipt, title: "Trade Licence", badge: "Municipal", category: "business", group: "Business & Commerce", desc: "Municipal trade licence for shops, establishments and factories.", color: "bg-teal-50 text-teal-600", fee: "₹500–5,000", time: "15–30 days", popular: false, tags: ["trade", "licence", "shop", "municipal", "business"], docs: ["Business Address Proof", "Owner Aadhaar"], steps: [{ label: "Business Details", desc: "Trade type, premises" }, { label: "Upload Documents", desc: "Address, owner ID" }, { label: "Inspection", desc: "Municipal inspection" }, { label: "Payment", desc: "Slab-based fee" }] },
  { id: "fssai", icon: Microscope, title: "FSSAI Food Licence", badge: "Food Safety", category: "business", group: "Business & Commerce", desc: "Food safety licence for restaurants, manufacturers, retailers.", color: "bg-yellow-50 text-yellow-600", fee: "₹100–7,500", time: "7–30 days", popular: false, tags: ["fssai", "food", "restaurant", "safety", "licence"], docs: ["Business Proof", "Owner ID", "Layout Plan"], steps: [{ label: "Business Details", desc: "Food category, premises" }, { label: "Upload Documents", desc: "ID, layout, equipment" }, { label: "Review", desc: "Authority review" }, { label: "Payment", desc: "Category-based fee" }] },
  { id: "shops", icon: Building, title: "Shops & Establishment", badge: "Labour", category: "business", group: "Business & Commerce", desc: "Mandatory registration for shops, offices and establishments.", color: "bg-purple-50 text-purple-600", fee: "₹125–1,000", time: "7 days", popular: false, tags: ["shops", "establishment", "labour", "registration", "office"], docs: ["Business Address", "Owner Aadhaar", "PAN"], steps: [{ label: "Employer Details", desc: "Business and owner info" }, { label: "Upload Documents", desc: "Address, Aadhaar, PAN" }, { label: "Review", desc: "Labour dept review" }, { label: "Payment", desc: "Employee-count based fee" }] },
  { id: "rtps", icon: FileText, title: "Caste / Income Certificate", badge: "Revenue", category: "certificates", group: "Other Services", desc: "Apply for income, caste, domicile and other revenue certificates.", color: "bg-indigo-50 text-indigo-600", fee: "₹20–100", time: "7–15 days", popular: false, tags: ["caste", "income certificate", "domicile", "revenue", "income"], docs: ["Aadhaar", "Address Proof", "Income Proof"], steps: [{ label: "Personal Details", desc: "Certificate type, applicant info" }, { label: "Upload Documents", desc: "Aadhaar, address, income proof" }, { label: "Review", desc: "Revenue officer review" }, { label: "Payment", desc: "Nominal fee" }] },
  { id: "fire", icon: Flame, title: "Fire NOC", badge: "Fire Dept", category: "certificates", group: "Other Services", desc: "No Objection Certificate from fire department for buildings.", color: "bg-red-50 text-red-600", fee: "₹500–10,000", time: "15–30 days", popular: false, tags: ["fire", "noc", "safety", "certificate", "building"], docs: ["Building Plan", "Ownership Proof"], steps: [{ label: "Building Details", desc: "Address, floor count, usage" }, { label: "Upload Documents", desc: "Plans, ownership, equipment list" }, { label: "Inspection", desc: "Fire officer visit" }, { label: "Payment", desc: "Area-based fee" }] },
  { id: "police", icon: ShieldCheck, title: "Police Clearance", badge: "Police", category: "certificates", group: "Other Services", desc: "PCC for overseas employment, visa or immigration purposes.", color: "bg-slate-50 text-slate-600", fee: "₹500", time: "15 days", popular: false, tags: ["police", "clearance", "pcc", "visa", "passport"], docs: ["Aadhaar", "Passport", "Address Proof"], steps: [{ label: "Personal Details", desc: "Name, address, purpose" }, { label: "Upload Documents", desc: "Aadhaar, passport, address" }, { label: "Police Verification", desc: "Local station verification" }, { label: "Payment ₹500", desc: "Online fee" }] },
  { id: "rti", icon: Scale, title: "RTI Application", badge: "DoP&T", category: "certificates", group: "Other Services", desc: "File Right to Information applications to central ministries.", color: "bg-blue-50 text-blue-600", fee: "₹10", time: "30 days", popular: false, tags: ["rti", "right to information", "transparency", "government"], docs: ["Aadhaar / Any ID"], steps: [{ label: "Application Details", desc: "Ministry, information sought" }, { label: "Upload Documents", desc: "ID proof" }, { label: "Review", desc: "Verify application" }, { label: "Payment ₹10", desc: "Online payment" }] },
  { id: "shipping", icon: Ship, title: "Coastal / Shipping Permit", badge: "Shipping", category: "certificates", group: "Other Services", desc: "Coastal vessel permits, port clearance and NOC.", color: "bg-sky-50 text-sky-600", fee: "Varies", time: "7–15 days", popular: false, tags: ["shipping", "coastal", "permit", "port", "vessel"], docs: ["Vessel Registration", "Owner ID", "Route Plan"], steps: [{ label: "Vessel Details", desc: "IMO number, cargo type" }, { label: "Upload Documents", desc: "Registration, ID, route plan" }, { label: "Port NOC", desc: "Port authority clearance" }, { label: "Payment", desc: "Permit fee" }] },
];

const AI_SERVICES = createServiceKnowledge(ALL_SERVICES);
registerServiceCatalog(ALL_SERVICES);

const CATEGORIES_META = [
  { key: "citizen", label: "Citizen Services", icon: Building, color: "bg-slate-50 text-slate-600 border-slate-100" },
  { key: "identity", label: "Identity & KYC", icon: Shield, color: "bg-blue-50 text-blue-600 border-blue-100" },
  { key: "certificates", label: "Certificates", icon: FileText, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  { key: "land", label: "Land & Property", icon: Home, color: "bg-amber-50 text-amber-600 border-amber-100" },
  { key: "finance", label: "Finance & Tax", icon: Receipt, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { key: "health", label: "Health", icon: HeartPulse, color: "bg-red-50 text-red-600 border-red-100" },
  { key: "education", label: "Education & Skill", icon: GraduationCap, color: "bg-purple-50 text-purple-600 border-purple-100" },
  { key: "agriculture", label: "Agriculture", icon: Leaf, color: "bg-green-50 text-green-600 border-green-100" },
  { key: "utility", label: "Utilities", icon: Zap, color: "bg-yellow-50 text-yellow-600 border-yellow-100" },
  { key: "transport", label: "Transport", icon: Car, color: "bg-orange-50 text-orange-600 border-orange-100" },
  { key: "welfare", label: "Welfare", icon: Users, color: "bg-teal-50 text-teal-600 border-teal-100" },
  { key: "business", label: "Business", icon: Briefcase, color: "bg-violet-50 text-violet-600 border-violet-100" },
];

const TESTIMONIALS = [
  { name: "Ravi Kumar", city: "Hyderabad", rating: 5, service: "PAN Card", text: "Applied for PAN Card and got it within 2 weeks! The step-by-step guide was crystal clear. No agent, no hassle." },
  { name: "Priya Sharma", city: "New Delhi", rating: 5, service: "Passport Renewal", text: "Renewed my passport in 3 weeks without stepping out. The document checklist saved me so much time. Absolutely brilliant!" },
  { name: "Mohammed Ali", city: "Mumbai", rating: 5, service: "Driving Licence", text: "DL renewal done without visiting the RTO even once. The status updates via SMS kept me informed at every stage." },
  { name: "Sunita Devi", city: "Bengaluru", rating: 4, service: "Aadhaar Update", text: "Updated my address on Aadhaar within the expected time. The interface is clean and very easy to use." },
  { name: "Arjun Patel", city: "Ahmedabad", rating: 5, service: "GST Registration", text: "Registered my business for GST in under a week. The document upload was smooth and I got GSTIN almost instantly!" },
  { name: "Lakshmi Reddy", city: "Chennai", rating: 5, service: "Ayushman Bharat", text: "Got our entire family enrolled in PM-JAY. Now we have ₹5 lakh health cover. DigiSeva made it super simple." },
  { name: "Deepak Singh", city: "Jaipur", rating: 5, service: "Income Tax Return", text: "Filed my ITR in under 30 minutes with pre-filled data. The platform is as good as a CA, honestly." },
  { name: "Meena Krishnan", city: "Pune", rating: 5, service: "Birth Certificate", text: "Applied for my daughter's birth certificate from the hospital itself. Received the digital copy within 2 days!" },
];

const FAQS = [
  { q: "How long does processing take?", a: "Processing times vary by service. PAN card takes 15 working days, while e-PAN is instant. Passport (normal) takes 3–7 weeks. Most certificates are issued within 7–15 working days." },
  { q: "What is the refund policy?", a: "Government fees are generally non-refundable once the application is submitted. Service charges may be refunded within 7 days if the application is cancelled before processing begins." },
  { q: "Which documents are required?", a: "Aadhaar card, Passport photo, Address proof (utility bill/bank passbook), and any service-specific documents. Refer to the checklist on each service page for exact requirements." },
  { q: "How do I pay?", a: "Choose Pay Now to use the DigiSeva QR/UPI instructions shown during payment, or choose Pay Later when available. Payment status is verified by the DigiSeva team." },
  { q: "How do I track my application?", a: "Enter your Application ID and registered mobile number on the Track Application page to view the latest application status." },
  { q: "What if my application is rejected?", a: "You will receive a detailed reason via SMS and email. Most rejections can be corrected and re-submitted within 30 days without paying the government fee again." },
];

const INSURANCE_CATEGORIES = [
  { id: "health-ins", icon: HeartPulse, title: "Health Insurance", desc: "Cover hospitalisation, surgery & critical illness for your family.", premium: "From ₹3,500/yr", cover: "Up to ₹50L", color: "bg-red-50 text-red-600" },
  { id: "life-ins", icon: ShieldCheck, title: "Life Insurance", desc: "Financial security for your loved ones in your absence.", premium: "From ₹2,000/yr", cover: "Up to ₹5 Cr", color: "bg-blue-50 text-blue-600" },
  { id: "term-ins", icon: Users, title: "Term Insurance", desc: "Pure protection plan — maximum cover at minimum cost.", premium: "From ₹800/yr", cover: "Up to ₹2 Cr", color: "bg-indigo-50 text-indigo-600" },
  { id: "car-ins", icon: Car, title: "Car Insurance", desc: "Comprehensive & third-party motor insurance for your car.", premium: "From ₹2,500/yr", cover: "IDV-based", color: "bg-orange-50 text-orange-600" },
  { id: "bike-ins", icon: Car, title: "Bike Insurance", desc: "Mandatory third-party + own damage cover for two-wheelers.", premium: "From ₹714/yr", cover: "IDV-based", color: "bg-amber-50 text-amber-600" },
  { id: "travel-ins", icon: Globe, title: "Travel Insurance", desc: "Trip cancellation, medical emergency & baggage cover abroad.", premium: "From ₹350/trip", cover: "Up to $1L", color: "bg-sky-50 text-sky-600" },
  { id: "home-ins", icon: Home, title: "Home Insurance", desc: "Protect your home & contents from fire, flood & burglary.", premium: "From ₹1,200/yr", cover: "Up to ₹1 Cr", color: "bg-teal-50 text-teal-600" },
  { id: "crop-ins", icon: Leaf, title: "Crop Insurance", desc: "PM Fasal Bima Yojana for farmers against crop loss.", premium: "1.5–5%", cover: "Based on area", color: "bg-green-50 text-green-600" },
  { id: "accident-ins", icon: AlertCircle, title: "Personal Accident", desc: "Lump-sum payout on accidental death or permanent disability.", premium: "From ₹800/yr", cover: "Up to ₹25L", color: "bg-rose-50 text-rose-600" },
  { id: "biz-ins", icon: Briefcase, title: "Business Insurance", desc: "Fire, burglary, machinery & workmen compensation policy.", premium: "Custom quote", cover: "Custom", color: "bg-violet-50 text-violet-600" },
];

const LOAN_CATEGORIES = [
  { id: "personal-loan", icon: Wallet, title: "Personal Loan", desc: "Instant funds for any personal need, no collateral required.", amount: "Up to ₹40L", rate: "From 9.9% p.a.", tenure: "Up to 5 yrs", color: "bg-purple-50 text-purple-600" },
  { id: "home-loan", icon: Home, title: "Home Loan", desc: "Buy, construct or renovate your dream home at lowest rates.", amount: "Up to ₹5 Cr", rate: "From 8.5% p.a.", tenure: "Up to 30 yrs", color: "bg-blue-50 text-blue-600" },
  { id: "biz-loan", icon: Briefcase, title: "Business Loan", desc: "Grow your business with unsecured working capital loans.", amount: "Up to ₹2 Cr", rate: "From 11% p.a.", tenure: "Up to 5 yrs", color: "bg-orange-50 text-orange-600" },
  { id: "edu-loan", icon: GraduationCap, title: "Education Loan", desc: "Finance higher education in India or abroad with ease.", amount: "Up to ₹75L", rate: "From 8.15% p.a.", tenure: "Up to 15 yrs", color: "bg-indigo-50 text-indigo-600" },
  { id: "car-loan", icon: Car, title: "Car Loan", desc: "Drive home your dream car with quick approval and low EMIs.", amount: "Up to ₹1 Cr", rate: "From 7.25% p.a.", tenure: "Up to 7 yrs", color: "bg-red-50 text-red-600" },
  { id: "gold-loan", icon: Star, title: "Gold Loan", desc: "Instant cash against your gold jewellery at best LTV ratio.", amount: "Up to ₹1.5 Cr", rate: "From 7% p.a.", tenure: "Up to 3 yrs", color: "bg-amber-50 text-amber-600" },
  { id: "lap", icon: Building2, title: "Loan Against Property", desc: "Unlock the value of your property with LAP at low rates.", amount: "Up to ₹5 Cr", rate: "From 9% p.a.", tenure: "Up to 20 yrs", color: "bg-teal-50 text-teal-600" },
  { id: "bike-loan", icon: Car, title: "Bike Loan", desc: "Two-wheeler financing for new & pre-owned bikes.", amount: "Up to ₹5L", rate: "From 9.7% p.a.", tenure: "Up to 5 yrs", color: "bg-emerald-50 text-emerald-600" },
];

const INSURANCE_FAQS = [
  { q: "What is the claim settlement process?", a: "Raise a claim via the portal, submit required documents, and the insurer reviews within 15–30 days. Cashless claims at network hospitals are settled directly." },
  { q: "Can I buy insurance without an agent?", a: "Insurance options are presented for comparison and enquiry. Availability, eligibility, pricing and issuance depend on the applicable licensed insurer or intermediary." },
  { q: "How do I compare loan interest rates?", a: "Use our comparison table to view rates from 20+ banks and NBFCs side-by-side. Filter by amount, tenure, and eligibility for best results." },
  { q: "Is my financial data safe?", a: "DigiSeva is designed to minimise unnecessary exposure of customer information. Production encryption, access control and retention policies are enforced by the backend infrastructure." },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  "Pending": { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  "Verified": { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  "Processing": { color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  "Government Review": { color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  "Completed": { color: "text-green-700", bg: "bg-green-50 border-green-200" },
  "Rejected": { color: "text-red-700", bg: "bg-red-50 border-red-200" },
  "Cancelled": { color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fuzzyScore(q: string, target: string): number {
  const ql = q.toLowerCase().trim();
  const tl = target.toLowerCase();
  if (tl.includes(ql)) return 2;
  if (ql.length < 2) return 0;
  let qi = 0;
  for (let i = 0; i < tl.length && qi < ql.length; i++) {
    if (tl[i] === ql[qi]) qi++;
  }
  return qi === ql.length ? 1 : 0;
}

function getSearchSuggestions(q: string) {
  if (!q.trim() || q.length < 2) return [];
  return ALL_SERVICES
    .map((s) => ({
      svc: s,
      score: Math.max(fuzzyScore(q, s.title) * 3, ...s.tags.map((t) => fuzzyScore(q, t) * 2), fuzzyScore(q, s.desc)),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.svc);
}

function getAssistantSuggestions(q: string) {
  const normalized = q.toLowerCase().replace(/[^a-z0-9\s/-]/g, " ").replace(/\s+/g, " ").trim();
  const aliases: Array<[string[], string]> = [
    [["dl renewal", "driving licence renewal", "driving license renewal", "learner licence", "driving licence"], "driving"],
    [["new bike rc", "new car rc", "vehicle rc", "vehicle registration", "new vehicle"], "vahan"],
    [["rc renewal", "rc transfer", "vehicle ownership", "rc"], "rc_transfer"],
    [["job certificate", "salary certificate", "income certificate"], "rtps"],
    [["pan card", "permanent account", "tax id", "pan"], "pan"],
    [["voter id", "voter card", "epic"], "voter"],
    [["birth certificate", "newborn", "birth"], "birth"],
    [["passport", "tatkal passport", "pcc"], "passport"],
    [["aadhaar", "aadhar", "uidai", "uid"], "aadhaar"],
    [["caste certificate", "domicile", "ews", "income cert"], "rtps"],
    [["ration card", "food card", "pds"], "ration"],
    [["pension", "senior citizen", "old age"], "oldage"],
    [["scholarship", "student scholarship"], "scholarship"],
    [["gst", "gstin"], "gst"],
    [["trade license", "trade licence", "shop license"], "trade"],
    [["fssai", "food licence", "food license"], "fssai"],
    [["msme", "udyam", "business registration"], "udyam"],
    [["ayushman", "pmjay", "health card"], "ayushman"],
    [["pm kisan", "pmkisan", "farmer support"], "pmkisan"],
    [["electricity", "power connection", "electric bill"], "electricity"],
    [["gas connection", "lpg", "ujjwala"], "lpg"],
    [["water connection", "water bill"], "water"],
  ];
  const alias = aliases.find(([terms]) => terms.some((term) => normalized.includes(term)));
  if (alias) {
    const service = ALL_SERVICES.find((item) => item.id === alias[1]);
    return service ? [service] : [];
  }
  const questionWords = new Set(["what", "which", "how", "can", "for", "the", "documents", "document", "proof", "required", "steps", "step", "apply", "application", "fee", "fees", "timeline", "time", "please", "need", "want", "i", "my", "is", "are"]);
  const words = normalized.split(" ").filter((word) => word.length >= 3 && !questionWords.has(word));
  const matches = words.flatMap((word) => getSearchSuggestions(word));
  return Array.from(new Map(matches.map((service) => [service.id, service])).values()).slice(0, 6);
}

function getAssistantReply(question: string, matches: typeof ALL_SERVICES, context: { state: string; applicantType: string; serviceId: string | null }): string {
  const normalized = question.toLowerCase().trim().replace(/[!?.,]+$/g, "");
  if (/^(ok|okay|thanks|thank you|yes|no|hi|hello|hey|namaste|great|fine)$/.test(normalized)) {
    if (/thanks|thank you|great|fine/.test(normalized)) return "You are welcome. Ask me about a DigiSeva service whenever you are ready.";
    return "Sure. Tell me what you want to apply for, update or track, and I will guide you.";
  }
  if (/^(who are you|what can you do|help)$/.test(normalized)) return "HELP CENTER\n\nApplications: find a service and start an application.\nTracking: check an application with Application ID + registered mobile.\nPayments: use QR / UPI or Pay Later.\nDocuments: see the service checklist.\nInsurance and loans: compare options; the provider decides.\nCertificates, utilities and business services: ask by name.";
  if (/(aadhaar number|pan number|otp|password|pin|cvv|bank account number)/.test(normalized)) return "Please do not share Aadhaar, PAN, OTP, password, PIN, CVV or bank credentials in chat. Enter sensitive information only inside the secure DigiSeva application form.";
  if (/(track|status|reference number|application id|pending|rejected|completed|processing)/.test(normalized)) return "TRACKING\n\nPlease open Track Application and enter:\n- Application ID\n- Registered mobile number\n\nDigiSeva will verify both details. Never share Aadhaar in chat. If verification fails, the application could not be verified.";
  if (/(payment|paid|upi|qr|pay later|transaction|refund)/.test(normalized)) return "PAYMENT\n\n- Pay using the DigiSeva QR / UPI instructions.\n- Enter the UPI Transaction ID / Reference.\n- Upload the payment screenshot if requested.\n- DigiSeva verifies payment before processing.\n- Pay Later keeps the application payment pending; processing starts after verification.\n\nDo not share OTP, PIN or bank passwords in chat.";
  if (/(rejected|wrong document|stuck|complaint|issue|problem)/.test(normalized)) return "SUPPORT\n\nFirst check the rejection reason or missing document in your application status. Correct the issue and follow the re-upload or resubmission instruction. For payment disputes, a stuck application or an issue not covered there, contact DigiSeva support with your Application ID and registered mobile number.";
  const first = matches[0] ?? (context.serviceId ? ALL_SERVICES.find((service) => service.id === context.serviceId) : undefined);
  if (!first) return "I need the service name or goal to guide you. For example: PAN card, passport renewal, DL renewal, income certificate, PM-KISAN or electricity connection.";
  const asksDocuments = /document|proof|papers|photo|signature|pdf|upload/.test(normalized);
  const asksSteps = /step|apply|application|process|procedure|how/.test(normalized);
  const asksEligibility = /eligible|eligibility|qualify|qualification|age|student|farmer|senior|widow|sc|st|bc|ews/.test(normalized);
  const asksFee = /fee|cost|price|charge|amount|premium|rate/.test(normalized);
  const asksTime = /time|timeline|long|days|weeks|when/.test(normalized);
  const governmentFee = first.fee === "Free" ? "₹0 (Free)" : first.fee;
  const serviceFee = (first as any).digiSevaFee ?? "Shown during application";
  const total = first.fee === "Free" ? serviceFee : `${first.fee} + ${serviceFee}`;
  const detail = asksDocuments ? `- ${first.docs.join("\n- ")}` : asksSteps ? first.steps.map((step, index) => `${index + 1}. ${step.label}: ${step.desc}`).join("\n") : asksEligibility ? `- The catalog cannot confirm your personal eligibility.\n- Eligibility may depend on ${context.state || "your state"}, applicant type and current authority rules.` : asksFee ? `Government Fee: ${governmentFee}\nDigiSeva Service Fee: ${serviceFee}\nTotal: ${total}` : asksTime ? `${first.time} (estimate; the authority or state may vary this).` : `${first.desc}`;
  return `SERVICE\n${first.title}\n\nELIGIBILITY\n- Confirm the current rule with the relevant ${first.badge} authority.\n${asksEligibility ? detail : "- Tell me your state or applicant type if eligibility needs checking."}\n\nFEES\nGovernment Fee: ${governmentFee}\nDigiSeva Service Fee: ${serviceFee}\nTotal: ${total}\n\nDOCUMENTS REQUIRED\n- ${first.docs.join("\n- ")}\n\nPROCESSING TIME\n${first.time} (estimate; state and department variation may apply)\n\nSTEPS\n${first.steps.map((step, index) => `${index + 1}. ${step.label}`).join("\n")}\n\nNEXT ACTION\n${asksDocuments || asksSteps || asksEligibility || asksFee || asksTime ? `Open ${first.title} details and start the application when your documents are ready.` : `Tell me whether you need documents, fees, eligibility, steps or application help for ${first.title}.`}`;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200/60 text-foreground font-bold rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Pill({ children, color = "bg-muted text-muted-foreground" }: { children: React.ReactNode; color?: string }) {
  return <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${color}`}>{children}</span>;
}

function StarRow({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} className={i < n ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
    </div>
  );
}

function TestimonialSlider() {
  const [idx, setIdx] = useState(0);
  const total = TESTIMONIALS.length;
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 4500);
    return () => clearInterval(t);
  }, [total]);
  const visible = [0, 1, 2].map((off) => TESTIMONIALS[(idx + off) % total]);
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 min-h-[160px]">
        {visible.map((t, i) => (
          <div key={`${idx}-${i}`} className="bg-white border border-border rounded-2xl p-6 shadow-sm" style={{ animation: "fadeSlideIn 0.4s ease" }}>
            <StarRow n={t.rating} />
            <p className="text-foreground text-sm leading-relaxed my-4 italic">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">{t.name[0]}</div>
              <div>
                <p className="font-bold text-foreground text-sm">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{t.city} · {t.service}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 mt-6">
        <button onClick={() => setIdx((i) => (i - 1 + total) % total)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-all"><ChevronLeft size={14} /></button>
        <div className="flex gap-1.5">
          {TESTIMONIALS.map((_, i) => <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-primary w-5" : "bg-border w-1.5"}`} />)}
        </div>
        <button onClick={() => setIdx((i) => (i + 1) % total)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-all"><ChevRt size={14} /></button>
      </div>
    </div>
  );
}

function TrackTimeline({ steps }: { steps: Application["timeline"] }) {
  return (
    <div>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isRejected = step.label.toLowerCase().includes("reject");
        return (
          <div key={step.stage + i} className="flex gap-3">
            <div className="flex flex-col items-center">
              {step.completed
                ? <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isRejected ? "bg-red-500" : "bg-secondary"}`}><Check size={12} className="text-white" /></div>
                : step.active
                ? <div className="w-7 h-7 rounded-full border-2 border-primary bg-primary/10 flex-shrink-0 animate-pulse" />
                : <div className="w-7 h-7 rounded-full border-2 border-border bg-white flex-shrink-0" />}
              {!isLast && <div className={`w-0.5 flex-1 my-1 rounded-full min-h-[20px] ${step.completed ? "bg-secondary/40" : "bg-border"}`} />}
            </div>
            <div className="pb-5 min-w-0">
              <p className={`text-sm font-bold leading-snug ${step.completed || step.active ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
              {step.date && <p className="text-[11px] text-primary/70 font-semibold mt-1">{step.date}</p>}
              {step.active && !step.date && <p className="text-[11px] text-primary font-bold mt-1 animate-pulse">● In Progress</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Insurance & Loans Page ────────────────────────────────────────────────────
function InsurancePage({ onApply }: { onApply: (id: string) => void }) {
  const [insQuery, setInsQuery] = useState("");
  const [insTab, setInsTab] = useState<"insurance" | "loan">("insurance");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredIns = INSURANCE_CATEGORIES.filter((c) =>
    !insQuery || c.title.toLowerCase().includes(insQuery.toLowerCase()) || c.desc.toLowerCase().includes(insQuery.toLowerCase())
  );
  const filteredLoans = LOAN_CATEGORIES.filter((c) =>
    !insQuery || c.title.toLowerCase().includes(insQuery.toLowerCase()) || c.desc.toLowerCase().includes(insQuery.toLowerCase())
  );

  return (
    <div>
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #065f46 0%, #10B981 60%, #34d399 100%)" }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #FFFFFF, transparent)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-full mb-5 border border-white/25 backdrop-blur-sm">
              <ShieldCheck size={12} className="text-amber-300" />Insurance partner information shown when verified
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Insurance & Loans</h1>
            <p className="text-white/75 text-xl font-semibold mb-2">Protect Your Family. Secure Your Future.</p>
            <p className="text-white/50 text-sm mb-8 leading-relaxed">Compare available insurance and lending options with clear, partner-dependent pricing.</p>
            <div className="relative max-w-lg">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Search insurance or loan products..." value={insQuery} onChange={(e) => setInsQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm text-foreground focus:outline-none shadow-2xl" />
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-6 items-center">
            {[["Insurance", "Options"], ["Lending", "Options"], ["Compare", "Plans"], ["Guided", "Process"]].map(([v, l]) => (
              <div key={l} className="flex items-center gap-2 text-white">
                <span className="font-bold text-lg">{v}</span><span className="text-white/40 text-xs">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex gap-2 mb-8">
          {(["insurance", "loan"] as const).map((tab) => (
            <button key={tab} onClick={() => setInsTab(tab)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${insTab === tab ? "bg-secondary text-white shadow-md" : "border border-border text-foreground hover:border-secondary/40 hover:text-secondary"}`}>
              {tab === "insurance" ? "Insurance Plans" : "Loan Products"}
            </button>
          ))}
        </div>

        {insTab === "insurance" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
            {filteredIns.map((ins) => {
              const Icon = ins.icon;
              return (
                <div key={ins.id} className="group bg-white border border-border rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${ins.color} group-hover:scale-110 transition-transform`}><Icon size={21} /></div>
                  <div className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
                    <ShieldCheck size={9} />Partner information
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-1">{ins.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-3">{ins.desc}</p>
                  <div className="text-xs text-muted-foreground mb-4 space-y-1">
                    <div className="flex items-center gap-1"><CreditCard size={10} />{ins.premium}</div>
                    <div className="flex items-center gap-1"><ShieldCheck size={10} />{ins.cover} cover</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled className="flex-1 bg-muted text-muted-foreground text-xs font-bold py-2 rounded-xl cursor-not-allowed">Partner enquiry required</button>
                    <button className="px-3 py-2 border border-border rounded-xl text-xs text-muted-foreground hover:bg-muted transition-all"><Phone size={11} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {insTab === "loan" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
            {filteredLoans.map((loan) => {
              const Icon = loan.icon;
              return (
                <div key={loan.id} className="group bg-white border border-border rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${loan.color} group-hover:scale-110 transition-transform`}><Icon size={21} /></div>
                  <div className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
                    <ShieldCheck size={9} />Partner information
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-1">{loan.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-3">{loan.desc}</p>
                  <div className="text-xs text-muted-foreground mb-4 space-y-1">
                    <div className="flex items-center gap-1"><Wallet size={10} />{loan.amount}</div>
                    <div className="flex items-center gap-1"><TrendingUp size={10} />{loan.rate}</div>
                    <div className="flex items-center gap-1"><Clock size={10} />{loan.tenure}</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled className="flex-1 bg-muted text-muted-foreground text-xs font-bold py-2 rounded-xl cursor-not-allowed">Partner enquiry required</button>
                    <button className="px-3 py-2 border border-border rounded-xl text-xs text-muted-foreground hover:bg-muted transition-all"><Phone size={11} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Comparison Table */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-5" style={{ fontFamily: "'Sora', sans-serif" }}>Compare Health Insurance Plans</h2>
          <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
            <table className="w-full text-sm bg-white min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Plan", "Coverage", "Premium", "Claim Settlement", "Hospitals", "Max Age"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-black text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { plan: "Star Health Basic", cov: "₹5L", prem: "₹3,500/yr", claim: "95%", hosp: "12,000+", age: "65", best: false },
                  { plan: "Niva Bupa Premium", cov: "₹15L", prem: "₹8,200/yr", claim: "97%", hosp: "8,500+", age: "70", best: false },
                  { plan: "HDFC Ergo Optima", cov: "₹25L", prem: "₹12,000/yr", claim: "98%", hosp: "13,000+", age: "75", best: true },
                  { plan: "ICICI Lombard Elite", cov: "₹50L", prem: "₹18,500/yr", claim: "99%", hosp: "9,700+", age: "70", best: false },
                ].map((row) => (
                  <tr key={row.plan} className={`hover:bg-muted/20 transition-colors ${row.best ? "bg-secondary/[0.03]" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        {row.best && <span className="text-[9px] bg-secondary text-white font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">BEST</span>}
                        {row.plan}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">{row.cov}</td>
                    <td className="px-4 py-3 text-foreground">{row.prem}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${parseFloat(row.claim) >= 98 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{row.claim}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{row.hosp}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.age} yrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-5" style={{ fontFamily: "'Sora', sans-serif" }}>Why DigiSeva Insurance?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[{ icon: ShieldCheck, l: "Verified Partners", c: "text-blue-600 bg-blue-50" }, { icon: Zap, l: "Guided Process", c: "text-amber-600 bg-amber-50" }, { icon: TrendingUp, l: "Compare Options", c: "text-green-600 bg-green-50" }, { icon: Phone, l: "Support", c: "text-red-600 bg-red-50" }, { icon: CreditCard, l: "No Hidden Fees", c: "text-purple-600 bg-purple-50" }, { icon: HelpCircle, l: "Guided Process", c: "text-orange-600 bg-orange-50" }].map(({ icon: Icon, l, c }) => (
              <div key={l} className="bg-white border border-border rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${c}`}><Icon size={18} /></div>
                <p className="text-xs font-bold text-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-5" style={{ fontFamily: "'Sora', sans-serif" }}>Frequently Asked Questions</h2>
          <div className="space-y-3 max-w-3xl">
            {INSURANCE_FAQS.map((faq, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden">
                <button className="w-full flex items-start justify-between px-5 py-4 text-left font-semibold text-foreground text-sm hover:bg-muted/20 transition-colors gap-3"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <ChevronDown size={15} className={`flex-shrink-0 text-muted-foreground mt-0.5 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
type Page = "home" | "services" | "track" | "apply" | "insurance";
type AssistantMessage = { role: "user" | "assistant"; text: string; actions?: AIAction[] };

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof ALL_SERVICES>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [suggIdx, setSuggIdx] = useState(-1);
  const [catFilter, setCatFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applyStep, setApplyStep] = useState(0);
  const [applySuccess, setApplySuccess] = useState(false);
  const [payMethod, setPayMethod] = useState("");
  const [payOption, setPayOption] = useState<"" | "now" | "later">("");
  const [payRef, setPayRef] = useState("");
  const [applicantForm, setApplicantForm] = useState<Record<string, string>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File>>({});
  const [uploadError, setUploadError] = useState("");
  const [createdAppId, setCreatedAppId] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [trackId, setTrackId] = useState("");
  const [trackMobile, setTrackMobile] = useState("");
  const [trackResult, setTrackResult] = useState<Application | null | "error">(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    { role: "assistant", text: "Namaste! I can help you find a service, check documents, fees, timelines and application steps." },
  ]);
  const [assistantContext, setAssistantContext] = useState({ state: "", applicantType: "", serviceId: null as string | null });
  const refNum = "Pending backend reference";

  const topRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (suggRef.current && !suggRef.current.contains(e.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowSugg(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleQueryChange = useCallback((val: string) => {
    setQuery(val);
    setSuggIdx(-1);
    const s = getSearchSuggestions(val);
    setSuggestions(s);
    setShowSugg(val.length >= 2 && s.length > 0);
  }, []);

  function handleSearchKey(e: React.KeyboardEvent) {
    if (!showSugg) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSuggIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSuggIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (suggIdx >= 0 && suggestions[suggIdx]) goApply(suggestions[suggIdx].id);
      else goServices();
      setShowSugg(false);
    }
    else if (e.key === "Escape") setShowSugg(false);
  }

  const customerServices = getManagedServices().filter((record) => record.enabled).map((record) => ({ ...record.service, icon: ALL_SERVICES.find((service) => service.id === record.service.id)?.icon ?? Building }));
  const allFiltered = customerServices.filter((s) => {
    const q = query.toLowerCase();
    const catOk = catFilter === "all" || s.category === catFilter;
    const qOk = !q || s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
      || s.tags.some((t) => t.includes(q)) || s.badge.toLowerCase().includes(q);
    return catOk && qOk;
  });
  const visibleServices = showAll || query ? allFiltered : allFiltered.slice(0, 8);
  const selected = customerServices.find((s) => s.id === selectedId) ?? null;
  const selectedOverride = selected ? getServiceFeeOverride(selected.id) : null;
  const selectedGovernmentFee = selected ? (selectedOverride?.governmentFee ?? (selected.fee === "Free" ? "₹0" : selected.fee)) : "";
  const selectedDigiSevaFee = selected ? (selectedOverride?.digiSevaFee ?? (selected as any).digiSevaFee ?? "₹50") : "";
  const assistantResults = assistantQuery.trim()
    ? matchServices(assistantQuery, AI_SERVICES).slice(0, 3).map((match) => ALL_SERVICES.find((service) => service.id === match.service.id)).filter(Boolean)
    : [];

  function askAssistant() {
    const question = assistantQuery.trim();
    if (!question) return;
    const response = orchestrate(question, AI_SERVICES, { ...assistantContext, serviceId: assistantContext.serviceId ?? undefined });
    setAssistantContext(response.context as ConversationContext);
    setAssistantMessages((messages) => [...messages, { role: "user", text: question }, { role: "assistant", text: response.answer, actions: response.actions }]);
    setAssistantQuery("");
  }

  function handleAssistantAction(action: AIAction) {
    if (!action.available) return;
    if (action.type === "START_APPLICATION" && action.serviceId) goApply(action.serviceId);
    if (action.type === "TRACK_APPLICATION") goTrack();
  }

  function scrollTop() { setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }

  function computeTotal(govFee: string, dsiFee: string): string {
    if (!govFee || govFee === "Free" || govFee === "₹0") return dsiFee;
    if (govFee.includes("–") || govFee.toLowerCase().includes("varies") || govFee.includes("+")) return `${govFee} + ${dsiFee}`;
    const g = parseInt(govFee.replace(/[₹,]/g, ""), 10);
    const d = parseInt(dsiFee.replace(/[₹,]/g, ""), 10);
    if (isNaN(g) || isNaN(d)) return `${govFee} + ${dsiFee}`;
    return `₹${(g + d).toLocaleString("en-IN")}`;
  }

  function goApply(id: string) {
    if (!getManagedServices().some((record) => record.service.id === id && record.enabled)) {
      setPage("services");
      return;
    }
    setSelectedId(id); setApplyStep(0); setApplySuccess(false); setPayMethod(""); setPayOption(""); setPayRef(""); setApplicantForm({}); setUploadedDocuments({}); setUploadError(""); setCreatedAppId("");
    setPage("apply"); scrollTop();
  }

  function goServices(cat?: string) {
    setPage("services");
    if (cat) setCatFilter(cat);
    setQuery(""); setShowAll(false); setShowSugg(false);
    setTimeout(() => servicesRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function goTrack() {
    setPage("track"); setTrackResult(null);
    setTimeout(() => trackRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleTrack() {
    if (!trackId.trim() || !trackMobile.trim()) { setTrackResult("error"); return; }
    setTrackLoading(true); setTrackResult(null);
    const res = await getApplication({ applicationId: trackId.trim(), mobile: trackMobile.trim() });
    setTrackLoading(false);
    setTrackResult(res.found && res.application ? res.application : "error");
  }

  const APPLY_STEPS = ["Personal Details", "Upload Documents", "Review & Confirm", "Payment"];

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  if (showAdmin) return <AdminDashboard onExit={() => setShowAdmin(false)} />;

  // ── APPLY PAGE ──────────────────────────────────────────────────────────────
  if (page === "apply" && selected) {
    return (
      <div ref={topRef} className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
        <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button onClick={() => setPage("home")} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center"><Shield size={13} className="text-white" /></div>
              <span className="font-bold text-primary text-base" style={{ fontFamily: "'Sora', sans-serif" }}>DigiSeva</span>
            </button>
            <button onClick={() => setPage("home")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium"><X size={15} />Exit</button>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${selected.color}`}><selected.icon size={22} /></div>
            <div>
              <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>{selected.title}</h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground"><Clock size={11} />{selected.time} · <CreditCard size={11} />{selected.fee}</div>
            </div>
          </div>

          {!applySuccess ? (
            <>
              <div className="flex items-center justify-between mb-8">
                {APPLY_STEPS.map((label, i) => (
                  <div key={label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < applyStep ? "bg-secondary text-white" : i === applyStep ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground"}`}>
                        {i < applyStep ? <Check size={14} /> : i + 1}
                      </div>
                      <span className={`text-[10px] font-semibold mt-1 text-center w-16 leading-tight hidden sm:block ${i === applyStep ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                    </div>
                    {i < APPLY_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${i < applyStep ? "bg-secondary" : "bg-muted"}`} />}
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-5">
                <h2 className="font-bold text-foreground mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>{APPLY_STEPS[applyStep]}</h2>
                <p className="text-muted-foreground text-sm mb-6">{selected.steps[applyStep]?.desc}</p>

                {applyStep === 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["Full Name", "Date of Birth", "Mobile Number", "Email Address", "Father's / Spouse Name", "Gender"].map((f) => (
                      <div key={f}>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">{f}</label>
                        <input type={f === "Date of Birth" ? "date" : f === "Email Address" ? "email" : f === "Mobile Number" ? "tel" : "text"}
                          placeholder={f === "Date of Birth" ? "" : `Enter ${f.toLowerCase()}`}
                          value={applicantForm[f] ?? ""}
                          onChange={(e) => setApplicantForm((prev) => ({ ...prev, [f]: e.target.value }))}
                          autoComplete={f === "Full Name" ? "name" : f === "Email Address" ? "email" : f === "Mobile Number" ? "tel" : "off"}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
                      </div>
                    ))}
                  </div>
                )}

                {applyStep === 1 && (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800 font-medium flex items-start gap-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />Upload clear colour scans, max 5 MB each.
                    </div>
                    {uploadError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium flex items-start gap-2"><AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{uploadError}</div>}
                    {selected.docs.map((doc) => (
                      <div key={doc} className="flex items-center justify-between bg-muted/30 border border-dashed border-border rounded-xl p-4 hover:border-primary/40 group transition-all">
                        <div className="flex items-center gap-3 min-w-0"><FileText size={15} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" /><span className="font-semibold text-sm truncate">{doc}</span></div>
                        <label className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex-shrink-0"><Upload size={11} />{uploadedDocuments[doc] ? "Replace" : "Upload"}<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setUploadError(""); if (file.size > 5 * 1024 * 1024) { setUploadError(`${doc} must be 5 MB or smaller.`); return; } if (!/(image\/(png|jpeg|webp)|application\/pdf)/.test(file.type)) { setUploadError(`${doc} must be a PDF, PNG, JPEG or WebP file.`); return; } setUploadedDocuments((current) => ({ ...current, [doc]: file })); }} /></label>
                        {uploadedDocuments[doc] && <CheckCircle size={15} className="text-green-600 flex-shrink-0" aria-label={`${doc} uploaded`} />}
                      </div>
                    ))}
                  </div>
                )}

                {applyStep === 2 && (
                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-xl divide-y divide-border overflow-hidden">
                      {[["Service", selected.title], ["Processing Time", selected.time], ["Fee", selected.fee], ["Documents", `${selected.docs.length} attached`]].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="text-muted-foreground">{k}</span><span className="font-semibold">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 font-medium flex items-center gap-2">
                      <CheckCircle size={14} />All details look correct. Proceed to payment.
                    </div>
                  </div>
                )}

                {applyStep === 3 && (
                  <div className="space-y-4">
                    {/* Fee breakdown — Government Fee + DigiSeva Service Fee only (NO GST) */}
                    <div className="bg-muted/30 rounded-xl divide-y divide-border overflow-hidden mb-2">
                      {[
                        ["Government Fee", selectedGovernmentFee],
                        ["DigiSeva Service Fee", selectedDigiSevaFee],
                        ["Total Amount", computeTotal(selectedGovernmentFee, selectedDigiSevaFee)],
                      ].map(([k, v], i) => (
                        <div key={k} className={`flex items-center justify-between px-4 py-3 text-sm ${i === 2 ? "bg-primary/5" : ""}`}>
                          <span className={i === 2 ? "text-primary font-bold" : "text-muted-foreground"}>{k}</span>
                          <span className={`font-bold ${i === 2 ? "text-primary text-base" : "text-foreground"}`}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pay Now / Pay Later choice */}
                    {payOption === "" && (
                      <div>
                        <p className="text-sm font-bold text-foreground mb-3">Choose payment option:</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => setPayOption("now")} className="border-2 border-border rounded-2xl p-4 text-left hover:border-primary hover:bg-primary/5 transition-all group">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><CreditCard size={15} /></div>
                            <p className="font-bold text-foreground text-sm">Pay Now</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Scan QR or pay via UPI</p>
                          </button>
                          <button onClick={() => setPayOption("later")} className="border-2 border-border rounded-2xl p-4 text-left hover:border-amber-400 hover:bg-amber-50/60 transition-all group">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Clock size={15} /></div>
                            <p className="font-bold text-foreground text-sm">Pay Later</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Application saved pending</p>
                          </button>
                        </div>
                      </div>
                    )}

                    {payOption === "now" && (() => {
                      const cfg = getAdminConfig();
                      const total = computeTotal(selectedGovernmentFee, selectedDigiSevaFee);
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setPayOption("")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"><ChevronLeft size={12} />Change</button>
                            <span className="text-xs font-bold text-foreground">Pay via QR / UPI</span>
                          </div>
                          <div className="bg-white border border-border rounded-2xl p-5 flex flex-col items-center gap-3">
                            <div className="w-44 h-44 rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center">
                              {cfg.qrDataUrl ? (
                                <img src={cfg.qrDataUrl} alt="Payment QR" className="w-full h-full object-contain rounded-xl" />
                              ) : (
                                <>
                                  <div className="text-3xl mb-1">📱</div>
                                  <p className="text-[11px] font-bold text-muted-foreground">QR Code</p>
                                  <p className="text-[10px] text-muted-foreground/50">Configured by admin</p>
                                </>
                              )}
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-foreground">{cfg.upiId}</p>
                              <p className="text-xs text-muted-foreground">{cfg.accountName}</p>
                              <p className="text-sm font-black text-primary mt-1">Amount: {total}</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[11px] text-amber-800 text-center max-w-xs">
                              {cfg.paymentInstructions}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">UPI Transaction ID / Reference</label>
                            <input type="text" placeholder="e.g. UPI123456789012" value={payRef} onChange={(e) => setPayRef(e.target.value)}
                              className="w-full bg-muted/30 border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 font-mono" />
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide mt-4">Payment Screenshot (optional)</label>
                            <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary" />
                            <p className="text-[11px] text-muted-foreground mt-1.5">Payment proof will be securely stored when the document API is connected.</p>
                          </div>
                        </div>
                      );
                    })()}

                    {payOption === "later" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPayOption("")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"><ChevronLeft size={12} />Change</button>
                          <span className="text-xs font-bold text-foreground">Pay Later selected</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-900 text-sm">Application submitted as Payment Pending</p>
                              <p className="text-amber-800 text-xs mt-1 leading-relaxed">You can complete payment later via the Track Application page using your Application ID. Processing begins only after payment is verified.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => applyStep === 0 ? setPage("home") : setApplyStep((s) => s - 1)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-all">
                  {applyStep === 0 ? "← Cancel" : "← Back"}
                </button>
                {applyStep < APPLY_STEPS.length - 1
                  ? <button onClick={() => {
                      if (applyStep === 0) {
                        const required = ["Full Name", "Mobile Number", "Email Address"];
                        if (required.some((field) => !applicantForm[field]?.trim())) {
                          window.alert("Please complete your name, mobile number and email address.");
                          return;
                        }
                      }
                      if (applyStep === 1 && selected.docs.some((doc) => !uploadedDocuments[doc])) {
                        setUploadError("Please upload every required document before continuing.");
                        return;
                      }
                      setApplyStep((s) => s + 1);
                    }} className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm">Continue <ArrowRight size={14} /></button>
                  : <button onClick={() => {
                      if (!import.meta.env.DEV || !selected) return;
                      const gov = selectedGovernmentFee;
                      const digi = selectedDigiSevaFee;
                      const created = createApplication({
                        serviceId: selected.id, serviceName: selected.title, category: selected.category,
                        customerName: applicantForm["Full Name"]?.trim() || "Customer",
                        customerMobile: applicantForm["Mobile Number"]?.trim() || "",
                        customerEmail: applicantForm["Email Address"]?.trim() || "",
                        dob: applicantForm["Date of Birth"] || undefined,
                        address: applicantForm["Address"] || undefined,
                        governmentFee: gov, digiSevaFee: digi, totalAmount: computeTotal(gov, digi),
                        paymentOption: payOption === "now" ? "pay_now" : "pay_later",
                        paymentStatus: payOption === "now" ? "Payment Submitted" : "Pay Later",
                        paymentRef: payRef.trim() || undefined,
                        documents: selected.docs.map((name, i) => ({ id: `pending-${i}`, name, status: "under_review" as const, uploadedAt: "" })),
                        adminNotes: "",
                      });
                      setCreatedAppId(created.id);
                      setApplySuccess(true);
                    }} disabled={!import.meta.env.DEV || payOption === "" || (payOption === "now" && !payRef.trim())} className="flex items-center gap-2 bg-secondary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-secondary/90 transition-all shadow-sm disabled:opacity-40">{import.meta.env.DEV ? (payOption === "later" ? "Submit Application" : "Submit Payment") : "Backend Submission Required"} <ArrowRight size={14} /></button>}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200"><CheckCircle size={40} className="text-green-500" /></div>
              <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Application Submitted!</h2>
              <p className="text-muted-foreground mb-6">Development submission preview. The production backend will issue the confirmed application reference.</p>
              <div className="bg-white border border-border rounded-2xl p-5 mb-6 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Reference Number</p>
                <p className="font-mono font-black text-primary text-xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{createdAppId || refNum}</p>
                <p className="text-xs text-muted-foreground mt-1">The confirmed reference will be supplied by the backend and your configured notification infrastructure.</p>
              </div>
              <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground mb-6 flex items-center gap-2 justify-center">
                <Clock size={14} />Estimated completion: {selected.time}
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => { setTrackId(createdAppId); setTrackMobile(applicantForm["Mobile Number"] || ""); goTrack(); }} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"><Clock size={14} />Track Status</button>
                <button onClick={() => window.print()} className="flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-all"><Download size={14} />Print / Save Receipt</button>
                <button onClick={() => setPage("home")} className="flex items-center gap-2 text-muted-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-muted transition-all"><House size={14} />Back to Home</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MAIN LAYOUT ─────────────────────────────────────────────────────────────
  return (
    <div ref={topRef} className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Gov strip */}
      <div className="bg-primary text-white text-[11px] py-1.5 px-4 sm:px-6 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium opacity-90"><ShieldCheck size={10} />Secure Digital Services Platform · India</span>
        <div className="hidden sm:flex items-center gap-3 opacity-70">
          <span>Helpline: 1800-111-555</span><span className="opacity-40">|</span>
          <button className="hover:opacity-100">हिंदी</button><span className="opacity-40">|</span>
          <button className="hover:opacity-100">தமிழ்</button>
        </div>
      </div>

      {/* Navbar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          {/* Logo */}
          <button onClick={() => { setPage("home"); scrollTop(); }} className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30"><Shield size={17} className="text-white" /></div>
            <span className="text-xl font-bold text-primary hidden sm:block" style={{ fontFamily: "'Sora', sans-serif" }}>DigiSeva</span>
          </button>

          {/* Segmented buttons — center */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border shadow-inner">
              <button onClick={() => { setPage("home"); scrollTop(); }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap ${page !== "insurance" ? "bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-md shadow-blue-500/25" : "text-foreground/60 hover:text-primary"}`}>
                DigiSeva
              </button>
              <button onClick={() => { setPage("insurance"); scrollTop(); }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap ${page === "insurance" ? "bg-gradient-to-r from-emerald-700 to-emerald-500 text-white shadow-md shadow-emerald-500/25" : "text-foreground/60 hover:text-secondary"}`}>
                Insurance & Loans
              </button>
            </div>
          </div>

          {/* Right nav */}
          <div className="flex items-center gap-1 flex-shrink-0 relative">
            <div className="hidden md:flex items-center gap-1">
              {[{ label: "Home", fn: () => { setPage("home"); scrollTop(); } }, { label: "Services", fn: () => goServices() }, { label: "Track", fn: goTrack }].map(({ label, fn }) => (
                <button key={label} onClick={fn} className="px-3 py-2 rounded-xl text-xs font-semibold text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all whitespace-nowrap">{label}</button>
              ))}
            </div>
            <button onClick={() => setAssistantOpen((open) => !open)} className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-2 rounded-xl text-xs font-bold hover:bg-amber-300 transition-all" title="Ask DigiSeva" aria-label="Ask DigiSeva"><Sparkles size={14} /> <span className="hidden sm:inline">Ask DigiSeva</span></button>
            {assistantOpen && (
              <div className="absolute right-0 top-12 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl p-4 text-foreground shadow-2xl border border-border" style={{ animation: "fadeSlideIn 0.2s ease" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div><p className="font-bold text-sm">DigiSeva Help</p><p className="text-xs text-muted-foreground mt-0.5">Ask about documents, fees, eligibility or steps.</p></div>
                  <button onClick={() => setAssistantOpen(false)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close DigiSeva help"><X size={15} /></button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 mb-3 pr-1" aria-live="polite">
                  {assistantMessages.map((message, index) => <div key={`${message.role}-${index}`} className={`whitespace-pre-line rounded-xl px-3 py-2 text-xs leading-relaxed ${message.role === "user" ? "ml-8 bg-primary text-white" : "mr-4 bg-muted/60 text-foreground"}`}><div>{message.text}</div>{message.actions && message.actions.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{message.actions.filter((action) => action.type === "START_APPLICATION" || action.type === "TRACK_APPLICATION").map((action) => <button key={action.type} onClick={() => handleAssistantAction(action)} className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-primary border border-primary/10 hover:bg-primary/5">{action.label}</button>)}</div>}</div>)}
                </div>
                <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20">
                  <MessageCircle size={15} className="text-primary flex-shrink-0" />
                  <input type="text" autoFocus value={assistantQuery} onChange={(e) => setAssistantQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askAssistant()} placeholder="Try: documents for passport" className="flex-1 text-sm focus:outline-none" />
                  <button onClick={askAssistant} disabled={!assistantQuery.trim()} className="text-primary disabled:opacity-30" aria-label="Send question"><ArrowRight size={15} /></button>
                </div>
                {assistantQuery.trim() && assistantResults.length > 0 && <div className="mt-3 space-y-1.5">{assistantResults.map((svc) => <button key={svc.id} onClick={() => goApply(svc.id)} className="w-full text-left rounded-lg px-2.5 py-2 text-xs hover:bg-primary/5"><span className="font-bold">{svc.title}</span><span className="text-muted-foreground"> · {svc.fee} · {svc.time}</span></button>)}</div>}
              </div>
            )}
            <button className="md:hidden p-2 rounded-xl hover:bg-muted ml-1" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
            {[{ label: "Home", fn: () => { setPage("home"); scrollTop(); } }, { label: "Services", fn: () => goServices() }, { label: "Track Application", fn: goTrack }].map(({ label, fn }) => (
              <button key={label} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-primary rounded-xl transition-all"
                onClick={() => { fn(); setMenuOpen(false); }}>{label}</button>
            ))}
          </div>
        )}
      </nav>


      {/* Insurance page */}
      {page === "insurance" && <InsurancePage onApply={(id) => { setSelectedId(id); setApplyStep(0); setApplySuccess(false); setPayMethod(""); setPayOption(""); setPayRef(""); setPage("apply"); scrollTop(); }} />}

      {/* Home */}
      {page === "home" && (
        <>
          {/* Hero */}
          <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)" }}>
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #FFFFFF, transparent)" }} />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #10B981, transparent)" }} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-full mb-6 border border-white/20 backdrop-blur-sm">
                  <Sparkles size={12} className="text-accent" />One digital service platform · Clear guidance and tracking
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.1] tracking-tight mb-5" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Government Services<br /><span style={{ color: "#F59E0B" }}>Made Simple</span>
                </h1>
                <p className="text-white/70 text-base sm:text-lg mb-8 leading-relaxed">
                  Apply for PAN, Passport, Driving Licence, Certificates and 60+ Government Services Online. No queues, no middlemen.
                </p>

                {/* Smart Search */}
                <div className="relative max-w-lg mb-6">
                  <div className="flex items-center bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                    <Search size={17} className="ml-4 text-muted-foreground flex-shrink-0" />
                    <input ref={searchInputRef} type="text" placeholder="Search any government service..."
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSugg(true)}
                      onKeyDown={handleSearchKey}
                      className="flex-1 px-3 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none bg-transparent" />
                    {query && <button onClick={() => { setQuery(""); setSuggestions([]); setShowSugg(false); }} className="mr-2 p-1 text-muted-foreground hover:text-foreground"><X size={14} /></button>}
                    <button onClick={goServices} className="m-1.5 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all flex-shrink-0">Search</button>
                  </div>

                  {showSugg && suggestions.length > 0 && (
                    <div ref={suggRef} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-border overflow-hidden z-50" style={{ animation: "fadeSlideIn 0.15s ease" }}>
                      {suggestions.map((svc, i) => {
                        const Icon = svc.icon;
                        return (
                          <button key={svc.id} className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors ${i === suggIdx ? "bg-primary/5" : ""}`}
                            onClick={() => { goApply(svc.id); setShowSugg(false); }}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${svc.color}`}><Icon size={14} /></div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-foreground"><HighlightText text={svc.title} query={query} /></p>
                              <p className="text-xs text-muted-foreground truncate">{svc.badge} · {svc.fee} · {svc.time}</p>
                            </div>
                            <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
                          </button>
                        );
                      })}
                      <button className="w-full px-4 py-2.5 text-xs text-primary font-bold text-center border-t border-border hover:bg-muted/20 transition-colors" onClick={() => { goServices(); setShowSugg(false); }}>
                        View all results for &ldquo;{query}&rdquo; →
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => goServices()} className="flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-full text-sm font-bold hover:bg-white/90 transition-all shadow-lg shadow-black/10">Apply Now <ArrowRight size={14} /></button>
                  <button onClick={goTrack} className="flex items-center gap-2 bg-white/15 border border-white/25 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-white/20 transition-all backdrop-blur-sm">Track Application <Clock size={14} /></button>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/10 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[{ v: String(ALL_SERVICES.length), l: "Services", icon: Zap }, { v: "Transparent", l: "Fees", icon: CreditCard }, { v: "Secure", l: "Tracking", icon: MapPin }, { v: "Guided", l: "Process", icon: TrendingUp }].map(({ v, l, icon: Icon }) => (
                  <div key={l} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0"><Icon size={15} className="text-accent" /></div>
                    <div><div className="text-white font-bold text-xl leading-none">{v}</div><div className="text-white/45 text-xs mt-0.5">{l}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Popular Services */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Popular Services</h2>
                <p className="text-muted-foreground text-sm mt-1">Most frequently used government services</p>
              </div>
              <button onClick={() => goServices()} className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">View all <ArrowRight size={14} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {customerServices.filter((s) => s.popular).map((svc) => {
                const Icon = svc.icon;
                return (
                  <div key={svc.id} className="group bg-white rounded-2xl border border-border p-5 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => goApply(svc.id)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${svc.color} flex-shrink-0 group-hover:scale-110 transition-transform`}><Icon size={21} /></div>
                      <Pill>{svc.badge}</Pill>
                    </div>
                    <h3 className="font-bold text-foreground text-base mb-1">{svc.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-4 line-clamp-2">{svc.desc}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={10} />{svc.time}</span>
                        <span className="flex items-center gap-1"><CreditCard size={10} />{svc.fee}</span>
                      </div>
                      <button className="flex items-center gap-1 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">Apply <ArrowRight size={10} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Browse Categories */}
          <section className="bg-muted/50 border-y border-border py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Browse by Category</h2>
                <p className="text-muted-foreground text-sm">Find services organized by department</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {CATEGORIES_META.map(({ key, label, icon: Icon, color }) => {
                  const count = customerServices.filter((s) => s.category === key).length;
                  return (
                    <button key={key} onClick={() => goServices(key)} className={`group flex flex-col items-center gap-2.5 bg-white border rounded-2xl p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center ${color}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}><Icon size={21} /></div>
                      <div>
                        <p className="text-[12px] font-bold text-foreground leading-tight">{label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{count} services</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Why Choose DigiSeva?</h2>
              <p className="text-muted-foreground text-sm">Designed to make government service applications easier for everyone.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[{ icon: ShieldCheck, label: "Secure Design", desc: "Protected workflows", c: "text-blue-600 bg-blue-50" }, { icon: FileText, label: "All-in-One", desc: `${ALL_SERVICES.length}+ services`, c: "text-green-600 bg-green-50" }, { icon: Zap, label: "Fast Processing", desc: "Priority guidance", c: "text-amber-600 bg-amber-50" }, { icon: HelpCircle, label: "Step-by-Step", desc: "Clear instructions", c: "text-purple-600 bg-purple-50" }, { icon: Clock, label: "Status Tracking", desc: "Latest status", c: "text-red-600 bg-red-50" }, { icon: CreditCard, label: "Transparent Fees", desc: "No hidden charges", c: "text-orange-600 bg-orange-50" }].map(({ icon: Icon, label, desc, c }) => (
                <div key={label} className="flex flex-col items-center text-center bg-white border border-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${c}`}><Icon size={20} /></div>
                  <p className="font-bold text-foreground text-sm">{label}</p>
                  <p className="text-muted-foreground text-[11px] mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden">
                  <button className="w-full flex items-start justify-between px-5 py-4 text-left font-semibold text-foreground text-sm hover:bg-muted/20 transition-colors gap-3"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    <ChevronDown size={15} className={`flex-shrink-0 text-muted-foreground mt-0.5 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">{faq.a}</div>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Services page */}
      {page === "services" && (
        <section ref={servicesRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>All Services</h2>
              <p className="text-muted-foreground text-sm mt-1">{query ? `${allFiltered.length} results for "${query}"` : `${ALL_SERVICES.length} services`}</p>
            </div>
          </div>

          <div className="relative mb-5">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input type="text" placeholder="Search services..." value={query}
              onChange={(e) => { handleQueryChange(e.target.value); setShowAll(true); }}
              className="w-full pl-11 pr-10 py-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {query && <button onClick={() => { setQuery(""); setSuggestions([]); setShowAll(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={14} /></button>}
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {[{ key: "all", label: "All" }, ...CATEGORIES_META].map((c) => (
              <button key={c.key} onClick={() => { setCatFilter(c.key); setShowAll(false); setSelectedId(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold border transition-all ${catFilter === c.key ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-foreground/70 border-border hover:border-primary/40 hover:text-primary"}`}>
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleServices.map((svc) => {
              const Icon = svc.icon;
              const isActive = selectedId === svc.id;
              return (
                <div key={svc.id} className={`group bg-white border rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ${isActive ? "border-primary ring-2 ring-primary/15 shadow-lg" : "border-border hover:border-primary/30"}`}
                  onClick={() => { setSelectedId(isActive ? null : svc.id); if (!isActive) setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80); }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${svc.color} group-hover:scale-110 transition-transform`}><Icon size={17} /></div>
                    <Pill>{svc.badge}</Pill>
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-1 leading-snug">{svc.title}</h3>
                  <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2 mb-3">{svc.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock size={10} />{svc.time}</span>
                    <span className={`text-[11px] font-bold ${isActive ? "text-accent" : "text-primary"}`}>{isActive ? "▾ Details" : "Apply →"}</span>
                  </div>
                </div>
              );
            })}
            {visibleServices.length === 0 && (
              <div className="col-span-4 text-center py-16">
                <Search size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="font-bold text-foreground">No services found</p>
                <button className="mt-3 text-primary text-sm font-bold underline" onClick={() => { setQuery(""); setCatFilter("all"); }}>Reset filters</button>
              </div>
            )}
          </div>

          {!query && allFiltered.length > 8 && (
            <div className="flex flex-col items-center mt-8 gap-2">
              {!showAll && <p className="text-sm text-muted-foreground">Showing 8 of {allFiltered.length} services</p>}
              <button onClick={() => setShowAll((v) => !v)} className="flex items-center gap-2 bg-white border border-border text-foreground font-bold text-sm px-6 py-3 rounded-xl hover:border-primary hover:text-primary hover:shadow-md transition-all">
                {showAll ? <><ChevronUp size={15} />Show less</> : <><ChevronDown size={15} />View all {allFiltered.length} services</>}
              </button>
            </div>
          )}

          {selected && (
            <div ref={detailRef} className="mt-6 bg-white border border-primary/15 rounded-2xl shadow-xl overflow-hidden" style={{ animation: "fadeSlideIn 0.25s ease" }}>
              <div className="bg-gradient-to-r from-primary/5 to-transparent px-5 sm:px-7 py-5 flex items-start justify-between border-b border-border gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selected.color} flex-shrink-0`}><selected.icon size={24} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>{selected.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={10} />{selected.time}</span>
                      <span className="flex items-center gap-1"><CreditCard size={10} />{selected.fee}</span>
                      <span className="flex items-center gap-1 text-secondary font-semibold"><CheckCircle size={10} />Online Available</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground flex-shrink-0"><X size={15} /></button>
              </div>
              <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Process Steps</h4>
                  <div className="space-y-4">
                    {selected.steps.map((step, i) => (
                      <div key={step.label} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</div>
                          {i < selected.steps.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                        </div>
                        <div className="pb-1">
                          <p className="font-bold text-foreground text-sm">{step.label}</p>
                          <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Required Documents</h4>
                    <div className="space-y-2">
                      {selected.docs.map((doc) => (
                        <div key={doc} className="flex items-center gap-2 text-sm"><CheckCircle size={13} className="text-secondary flex-shrink-0" /><span>{doc}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={() => goApply(selected.id)} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"><Upload size={13} />Apply Now</button>
                    <button onClick={goTrack} className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-secondary/90 transition-all"><Clock size={13} />Track Status</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Track page */}
      {page === "track" && (
        <section ref={trackRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>Track Your Application</h2>
            <p className="text-muted-foreground">Check your latest application status securely</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #1E40AF, #2563EB)" }}>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-5"><Clock size={22} className="text-accent" /></div>
              <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>Enter Details</h3>
              <p className="text-white/50 text-xs mb-6 leading-relaxed">Enter your Application ID and registered mobile number to fetch the latest status.</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-white/50 mb-1.5 uppercase tracking-widest">Application / Reference ID *</label>
                  <input type="text" placeholder="e.g. PAN2026ABC12345" value={trackId}
                    onChange={(e) => { setTrackId(e.target.value); setTrackResult(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-white/50 mb-1.5 uppercase tracking-widest">Registered Mobile Number *</label>
                  <input type="tel" placeholder="10-digit mobile number" value={trackMobile}
                    onChange={(e) => { setTrackMobile(e.target.value); setTrackResult(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/25 text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <button onClick={handleTrack} disabled={!trackId.trim() || !trackMobile.trim() || trackLoading}
                  className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-lg shadow-amber-500/20">
                  {trackLoading ? <><RefreshCw size={14} className="animate-spin" />Checking…</> : <><Search size={14} />Track Status</>}
                </button>
              </div>
            </div>
            <div className="lg:col-span-3 min-w-0">
              {trackResult === "error" && (
                <div className="flex-1 flex flex-col items-center justify-center bg-white border border-border rounded-2xl p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4"><AlertCircle size={24} className="text-red-500" /></div>
                  <p className="font-bold text-foreground">Application not found</p>
                  <p className="text-muted-foreground text-sm mt-1 mb-4">No record matches the entered details. Check the ID or mobile number.</p>
                </div>
              )}
              {trackResult && trackResult !== "error" && (
                <div className="flex-1 bg-white border border-border rounded-2xl shadow-sm overflow-hidden" style={{ animation: "fadeSlideIn 0.25s ease" }}>
                  <div className={`px-5 py-3 border-b border-border flex items-center justify-between gap-3 border ${STATUS_CONFIG[trackResult.status]?.bg ?? "bg-muted"}`}>
                    <span className={`text-sm font-bold ${STATUS_CONFIG[trackResult.status]?.color ?? "text-foreground"}`}>{trackResult.status}</span>
                    <span className="text-[10px] font-mono text-muted-foreground hidden sm:block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{trackResult.id}</span>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                      {[["Applicant", trackResult.applicant.name], ["Service", trackResult.service], ["Applied On", trackResult.appliedDate], ["Expected By", trackResult.expectedCompletion], ["Fee Paid", trackResult.fee], ["Receipt No.", trackResult.receiptNo]].map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">{k}</p>
                          <p className="font-semibold text-foreground text-xs leading-snug">{v}</p>
                        </div>
                      ))}
                    </div>
                    {trackResult.status === "Rejected" && trackResult.remarks && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-800 flex items-start gap-2">
                        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /><span>{trackResult.remarks}</span>
                      </div>
                    )}
                    <div className="mb-5">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Application Timeline</h4>
                      <TrackTimeline steps={trackResult.timeline} />
                    </div>
                    <div className="mb-5">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Uploaded Documents</h4>
                      <div className="space-y-2">
                        {trackResult.documents.map((doc) => (
                          <div key={doc.name} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs ${doc.status === "uploaded" ? "bg-green-50 border-green-200" : doc.status === "rejected" ? "bg-red-50 border-red-200" : "bg-muted/30 border-border"}`}>
                            <div className="flex items-center gap-2">
                              <FileText size={12} className={doc.status === "uploaded" ? "text-green-600" : doc.status === "rejected" ? "text-red-600" : "text-muted-foreground"} />
                              <span className="font-semibold text-foreground">{doc.name}</span>
                              {doc.fileSize && <span className="text-muted-foreground hidden sm:inline">({doc.fileSize})</span>}
                            </div>
                            <span className={`font-bold capitalize ${doc.status === "uploaded" ? "text-green-700" : doc.status === "rejected" ? "text-red-700" : "text-amber-700"}`}>{doc.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                      <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all"><Download size={11} />Print / Save Receipt</button>
                      <button onClick={() => window.print()} className="flex items-center gap-1.5 border border-border text-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-muted transition-all"><Printer size={11} />Print</button>
                      <button onClick={handleTrack} className="flex items-center gap-1.5 border border-border text-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-muted transition-all"><RefreshCw size={11} />Refresh</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-950 text-white/60 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center"><Shield size={14} className="text-white" /></div>
                <span className="font-bold text-white text-base" style={{ fontFamily: "'Sora', sans-serif" }}>DigiSeva</span>
              </div>
              <p className="text-xs leading-relaxed opacity-50 mb-4">A digital service assistance platform for simpler applications, document guidance and status tracking.</p>
            </div>
            {[{ title: "Quick Links", links: ["Home", "Services", "Track Application"] }, { title: "Government Services", links: ["PAN Card", "Aadhaar", "Passport", "Voter ID", "Driving Licence"] }, { title: "Support", links: ["Help Centre", "FAQs"] }].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white font-bold text-[12px] mb-3 uppercase tracking-widest">{title}</h4>
                <ul className="space-y-2">{links.map((link) => <li key={link}><button onClick={() => { if (link === "Home") { setPage("home"); scrollTop(); } else if (link === "Services") goServices(); else if (link === "Track Application") goTrack(); else { setPage("home"); setTimeout(() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" }), 60); } }} className="text-[12px] opacity-50 hover:opacity-100 transition-opacity text-left">{link}</button></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] opacity-35">
            <p>© 2026 DigiSeva · All rights reserved.</p>
            <div className="flex gap-4 flex-wrap justify-center items-center">
              <span>Privacy-first design</span>
              <span>Accessible interface</span>
              <button onClick={() => setShowAdmin(true)} className="opacity-40 hover:opacity-80 transition-opacity text-[10px]">Admin</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <div aria-label="mobile-navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-2xl">
        <div className="grid grid-cols-5">
          {[
            { icon: House, label: "Home", active: page === "home", fn: () => { setPage("home"); scrollTop(); } },
            { icon: LayoutGrid, label: "Services", active: page === "services", fn: () => goServices() },
            { icon: Clock, label: "Track", active: page === "track", fn: goTrack },
            { icon: ShieldCheck, label: "Insurance", active: page === "insurance", fn: () => { setPage("insurance"); scrollTop(); } },
            { icon: HelpCircle, label: "Help", active: false, fn: () => { setPage("home"); setTimeout(() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" }), 60); } },
          ].map(({ icon: Icon, label, active, fn }) => (
            <button key={label} onClick={fn} className={`flex flex-col items-center gap-1 py-3 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              <Icon size={19} />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating buttons */}
      <div className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 flex flex-col gap-3 z-40">
        <a href="https://wa.me/911800111555" className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-600 hover:scale-110 transition-all" title="WhatsApp Support"><MessageCircle size={20} /></a>
        <a href="tel:1800111555" className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-110 transition-all" title="Call Support"><Phone size={18} /></a>
        {showTop && <button onClick={() => topRef.current?.scrollIntoView({ behavior: "smooth" })} className="w-12 h-12 rounded-full bg-foreground text-white flex items-center justify-center shadow-lg hover:bg-foreground/80 hover:scale-110 transition-all" title="Back to top"><ChevronUp size={18} /></button>}
      </div>

      <div className="md:hidden h-16" />
    </div>
  );
}
