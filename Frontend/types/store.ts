
// --- Global Data Types ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'instructor' | 'consultant';
  subscriptionTier: 'free' | 'pro' | 'enterprise'; // New field for subscription status
  avatar: string;
  bio?: string;
  title?: string; // Job title
  address?: string; // New field for profile
  skills?: string[]; // New field for profile
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface ConsultantProfile {
  userId: string;
  specialization: string; // e.g., 'Financial', 'Management'
  hourlyRate: number;
  introVideoUrl?: string;
  ratingAverage: number;
  reviewsCount: number;
  isVerified: boolean;
  availableSlots: string[];
}

export interface ConsultationService {
  id: string;
  consultantId: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  status: 'pending' | 'active' | 'draft' | 'rejected'; // Workflow status
  rejectionReason?: string; // Reason if rejected or moved to draft by admin
}

export interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  supportEmail: string;
  allowRegistration: boolean;
}

export interface AIDraft {
  id: string;
  consultantId: string;
  type: 'syllabus' | 'script' | 'quiz' | 'resources';
  title: string;
  content: string;
  tokensUsed?: number;
  createdAt: string;
}

// --- Updated Lesson Interface for Deep AI Content ---
export interface Slide {
  title: string;
  points: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string; // Reason why this answer is correct
  type: 'mcq' | 'true_false';
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'reading';
  isFree?: boolean; // For preview
  videoUrl?: string;

  // AI Generated Content Fields
  objectives?: string[];
  script?: string;       // Video Script
  slides?: Slide[];      // PowerPoint Outline
  quizData?: QuizQuestion[]; // Lesson specific quiz
  trainingScenarios?: TrainingScenario[]; // AI Training Scenarios
  voiceUrl?: string;     // AI Voiceover URL
  imageUrl?: string;     // Lesson Cover Image URL
  content_segments?: LessonSegment[]; // Block-based content segments
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  adminReply?: string;
  targetId?: string; // CourseID or ConsultantID
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  instructor: string;
  instructorId?: string;
  price: number;
  status: 'active' | 'draft' | 'archived';
  image: string;
  promoVideoUrl?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  studentsEnrolled: string[];
  revenue: number;
  progressMap?: Record<string, number>;
  progress?: number; // UI state for specific user
  completed?: boolean; // UI state
  completedAt?: string; // UI state: ISO date string
  enrolledAt?: string; // UI state: ISO date string
  lessons: Lesson[];
  reviews: Review[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  coverImage: string;
  fileUrl?: string;
  previewUrl?: string;
  category: string;
  pages: number;
  publishYear: string;
  status: 'active' | 'draft';
  owners: string[];
  reviews: Review[];
  rating?: number; // UI state
}

export interface Appointment {
  id: number;
  studentId: string;
  studentName: string;
  expertId: string;
  expertName: string;
  title: string;
  date: string; // ISO String
  time: string;
  type: 'video' | 'chat';
  status: 'confirmed' | 'completed' | 'cancelled';
  preferredPlatform: 'zoom' | 'google_meet' | 'teams' | 'discord';
  meetingLink?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  item: string;
  itemType?: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  method: 'Visa' | 'Bank Transfer' | 'Mastercard' | 'ApplePay' | 'System';
}

export interface Notification {
  id: number;
  target: 'admin' | string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  instructor: string;
  issueDate: string;
  serialNumber: string;
}

export interface WithdrawalRequest {
  id: string;
  consultantId: string;
  amount: number;
  currency: string;
  bankName: string;
  bankAccountHolder: string;
  bankIban: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

// ============================================
// AI COURSE CREATOR - Training Bag Types
// ============================================

// Training Bag Structure
export interface TrainingBag {
  id: string;
  uploaderId: string;
  title: string;
  description?: string;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt?: string;
}

// Training Scenario
export interface TrainingScenario {
  id: string;
  title: string;
  context: string;          // Scenario setup
  roleDescription: string;  // Role for trainee
  challenge?: string;       // Specific challenge in the scenario
  solution?: string;        // Ideal solution or expected outcome
  objectives: string[];
  expectedOutcome: string;
  discussionPoints: string[];
}

// Lesson Segment (Granular content unit)
// Lesson Segment (Granular content unit)
export type BlockType = 'text' | 'image' | 'video' | 'audio' | 'quiz' | 'scenario';

export interface LessonSegment {
  id: string;
  order: number;
  type?: BlockType; // New field for block type
  content: string;  // Main content (text or URL)
  metadata?: any;   // Extra data

  // Legacy / Specific fields
  text?: string;
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string;
  videoUrl?: string; // e.g. 8s clip for this segment

  // Status tracking
  audioStatus?: 'pending' | 'generating' | 'completed' | 'failed';
  imageStatus?: 'pending' | 'generating' | 'completed' | 'failed';
  videoStatus?: 'pending' | 'generating' | 'completed' | 'failed';
}

// Enhanced Lesson with all AI content
export interface EnhancedLesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'reading' | 'scenario';

  // Script Content
  script: string;
  scriptSummary?: string;

  // Voice Recording
  voiceUrl?: string;
  voiceDuration?: number;
  voiceStatus?: 'pending' | 'generating' | 'completed' | 'failed';

  // Video/Image Content
  videoUrl?: string;        // 8-second AI video
  videoDuration?: number;
  videoStatus?: 'pending' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;        // Main generated image
  images?: string[];        // Fallback images for longer content

  // Quiz Data
  quizData?: QuizQuestion[];

  // Training Scenarios
  trainingScenarios?: TrainingScenario[];

  // Granular Content Segments
  segments?: LessonSegment[];

  // Generation Status
  isGenerated?: boolean;

  // Overall content generation status (for live updates)
  status?: 'idle' | 'writing' | 'quizzing' | 'scenarios' | 'completed' | 'failed';
  error?: string;
}

// Course Unit (Day-based structure for training courses)
export interface CourseUnit {
  id: string;
  dayNumber: 1 | 2;         // Day 1 or Day 2
  unitNumber: 1 | 2 | 3 | 4; // 4 units total
  thinkingPattern: string;   // The thinking pattern this unit covers
  title: string;
  description?: string;
  lessons: EnhancedLesson[];
}

// Course Generation Job Progress
export interface CourseGenerationJob {
  id: string;
  trainingBagId: string;
  courseId?: string;
  status: 'pending' | 'generating_structure' | 'generating_content' | 'generating_voice' | 'generating_media' | 'completed' | 'failed';
  progressPercent: number;
  currentStep: string;
  totalSteps?: number;
  completedSteps?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

// Media Asset for courses
export interface MediaAsset {
  id: string;
  courseId: string;
  lessonId: string;
  assetType: 'voice' | 'video' | 'image';
  assetUrl: string;
  durationSeconds?: number;
  generatedAt: string;
}

// Full Training Course Structure
export interface TrainingCourse {
  id: string;
  trainingBagId?: string;
  title: string;
  description: string;
  totalDays: number;
  totalUnits: number;
  units: CourseUnit[];
  status: 'draft' | 'generating' | 'review' | 'active' | 'archived';
  generationJobId?: string;
  createdAt: string;
  updatedAt?: string;
}


export interface CourseSettings {
  totalDays: number;
  unitsCount: number;
  lessonsPerUnit: number;
  includeVoice: boolean;
  includeQuizzes: boolean;
  includeImages: boolean;
  includeVideos: boolean;
  includeScripts: boolean;
  includeScenarios: boolean;
}
