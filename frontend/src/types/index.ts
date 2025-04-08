// User related types
export interface User {
  uid: string; // Firebase User ID
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null; // Unique username for the user
  photoURL: string | null;
  createdAt?: Date;
  // Add any other custom user properties here
}

// Project user role types
export type ProjectUserRole = 'owner' | 'editor' | 'viewer';

export interface ProjectUser {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: ProjectUserRole;
  addedAt: Date | string | FirebaseTimestamp;
  addedBy: string;
}

// Simplified Firebase Timestamp interface
interface FirebaseTimestamp {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
}

// Chat related types
export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

// Auth related types
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Authentication context type
export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

// Project related types
export interface Project {
  id: string;
  name: string;
  clientId: string;
  address: string;
  city: string;
  type: string;
  startDate: string;
  endDate: string | null;
  description: string;
  status: string;
  assistantId: string;
  threadId: string;
  createdAt: Date;
  updatedAt: Date;
  files: ProjectFile[];
  users: ProjectUser[]; // Project team members with their roles
  ownerId: string; // Project owner's user ID
  tasks?: Task[]; // Project tasks
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  url: string;
  openaiFileId: string;
  uploadedAt: Date;
}

// Assistant Chat related types
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string | Date;
  citations: MessageCitation[];
}

export interface MessageCitation {
  index: number;
  fileId: string;
  quote?: string;
}

// Task related types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | null; // User ID
  assigneeName?: string;
  assigneePhotoURL?: string;
  createdBy: string; // User ID
  createdByName?: string;
  createdAt: Date | string | FirebaseTimestamp;
  updatedAt: Date | string | FirebaseTimestamp;
  dueDate: Date | string | FirebaseTimestamp | null;
  projectId: string;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  createdByPhotoURL?: string;
  createdAt: Date | string | FirebaseTimestamp;
}

// Project invitation types
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  role: ProjectUserRole;
  invitedBy: string;
  invitedByName: string;
  invitedByEmail?: string;
  invitedAt: Date | string | FirebaseTimestamp;
  status: InvitationStatus;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Visualization types
export type VisualizationType = 'pie' | 'bar' | 'line' | 'table';

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface Visualization {
  title: string;
  type: VisualizationType;
  description: string;
  data: ChartData | TableData;
}

export interface SuggestedVisualizationsResponse {
  visualizations: Visualization[];
} 