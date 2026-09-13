export type ApplicationStatus =
  | "Pending"
  | "Verified"
  | "Processing"
  | "Government Review"
  | "Completed"
  | "Rejected"
  | "Cancelled";

export interface Applicant {
  name: string;
  mobile: string;
  email: string;
  dob?: string;
  address?: string;
}

export interface TimelineEvent {
  stage: string;
  label: string;
  description: string;
  date: string | null;
  completed: boolean;
  active: boolean;
}

export interface ApplicationDocument {
  name: string;
  status: "uploaded" | "pending" | "rejected";
  uploadedAt: string | null;
  fileSize?: string;
}

export interface Application {
  id: string;
  service: string;
  category: string;
  appliedDate: string;
  expectedCompletion: string;
  status: ApplicationStatus;
  applicant: Applicant;
  timeline: TimelineEvent[];
  documents: ApplicationDocument[];
  fee: string;
  receiptNo: string;
  govRefNo?: string;
  remarks?: string;
}

export interface TrackRequest {
  applicationId: string;
  mobile: string;
}

export interface TrackResponse {
  found: boolean;
  application?: Application;
  error?: string;
}

// Insurance & Loans
export interface InsuranceProduct {
  id: string;
  title: string;
  category: "insurance" | "loan";
  type: string;
  icon: string;
  description: string;
  minPremium?: string;
  minAmount?: string;
  maxCover?: string;
  tenure?: string;
  interest?: string;
  features: string[];
  badge?: string;
}
