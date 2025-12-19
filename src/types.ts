export interface Dietary {
  glutenFree: boolean;
  vegetarian: boolean;
  vegan: boolean;
  noSeafood: boolean;
  spicyLevel: number; // 0-3
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  backgroundImageId: string | null;
  foregroundImageId: string | null;
  dietary: Dietary;
  isAvailable: boolean;
}

export interface MenuCategory {
  id: string;
  title: string;
  items: MenuItem[];
}

export type Order = {
  [itemId: string]: number;
};

// NEW: Event day structure for multi-day catering
export interface EventDay {
  id: string;
  label: string; // "Day 1", "Day 2", etc.
  dayDate: string;
  dropTime: string;
  event: string;
  notes: string;
  order: Order; // Individual order for this day
}

// UPDATED: Removed day-specific fields (moved to EventDay)
export interface CustomerDetails {
  name: string;
  email: string;
  business: string;
  address: string;
  contactNumber: string;
  attendees: number;
  equipmentType: string;
  serviceType: string;
  notes: string;
}

export interface Theme {
  id: string;
  name: string;
  backgroundImage: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

// --- Media Manager Types ---
export interface MediaFile {
  id: string;
  name: string;
  type: 'file';
  mimeType: string;
  parentId: string | null;
}

export interface MediaFolder {
  id: string;
  name: string;
  type: 'folder';
  children: string[];
  parentId: string | null;
}

export type MediaItem = MediaFile | MediaFolder;

// Types for initial nested structure before normalization
export interface InitialMediaFile {
  id: string;
  name: string;
  type: 'file';
  data: string; // Base64 data
  mimeType: string;
}

export interface InitialMediaFolder {
  id: string;
  name: string;
  type: 'folder';
  children: (InitialMediaFolder | InitialMediaFile)[];
}

export type InitialMediaNode = InitialMediaFolder | InitialMediaFile;

// ============================================================================
// Order History Types
// ============================================================================

export type OrderStatus = 'sent' | 'modified' | 'cancelled';

export interface SavedOrder {
  id: string;
  orderNumber: string;
  timestamp: string;
  status: OrderStatus;
  customerDetails: CustomerDetails;
  eventDays: EventDay[];
  totals: {
    subtotal: number;
    serviceFee: number;
    gst: number;
    total: number;
  };
  emailSentTo?: string;
  modifiedFrom?: string;
  notes?: string;
}

