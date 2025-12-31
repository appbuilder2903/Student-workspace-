import { UserProfile } from '../types';

/**
 * Simulates the specific "salt" requirement:
 * "before hashing use salting method with add 477fcbnhg at third letter and 6rfjurfh in fifth letter"
 */
export const saltPassword = (password: string): string => {
  if (password.length < 5) return password + "477fcbnhg6rfjurfh"; // Fallback for short passwords
  
  const part1 = password.slice(0, 3);
  const remainder1 = password.slice(3);
  const stage1 = part1 + "477fcbnhg" + remainder1;

  const part2 = stage1.slice(0, 5);
  const remainder2 = stage1.slice(5);
  const finalSalted = part2 + "6rfjurfh" + remainder2;

  return finalSalted;
};

/**
 * Simulates Argon2 hashing. 
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salted = saltPassword(password);
  
  const msgBuffer = new TextEncoder().encode(salted);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `argon2_sim:${hashHex}`;
};

// --- REAL PERSISTENT DATABASE ---

interface UserRecord {
  profile: UserProfile;
  passHash: string;
  usageCount: number;
}

const DB_KEY = 'hossain_azmal_quantum_gpt_users_v1';

// Load real data from LocalStorage
const loadDB = (): Record<string, UserRecord> => {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load user database', error);
    return {};
  }
};

// Initialize DB with real saved data (no mocks)
const USERS_DB: Record<string, UserRecord> = loadDB();

// Helper to save data back to LocalStorage
const saveDB = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(USERS_DB));
  } catch (error) {
    console.error('Failed to save user database - Storage might be full', error);
  }
};

export const registerUser = async (profile: UserProfile, password: string) => {
  const hash = await hashPassword(password);
  const key = profile.id || profile.email;
  
  if (USERS_DB[key]) {
      return false; // User already exists
  }

  USERS_DB[key] = { profile, passHash: hash, usageCount: 0 };
  saveDB(); // Save to real storage
  return true;
};

export const loginUser = async (identifier: string, password: string): Promise<UserProfile | null> => {
  // Check Developer Admin (System Account - Not in DB)
  if (identifier === 'Dev_647') {
    if (password === '647') {
      return {
        name: 'System Developer',
        callName: 'Dev',
        age: 0,
        classGrade: 'Root',
        subjectPreference: 'Database',
        aiGenderPref: 'girl',
        language: 'code',
        email: 'dev@system.internal',
        id: 'Dev_647'
      };
    }
  }

  // Check Master Admin (System Account - Not in DB)
  if (identifier === 'Nuke.nuke') {
    if (password === 'Neo29032012Neo') {
        return {
            name: 'Master Admin',
            callName: 'Neo',
            age: 99,
            classGrade: 'Omni',
            subjectPreference: 'Everything',
            aiGenderPref: 'girl',
            language: 'en',
            email: 'admin@nuke.nuke',
            id: 'Nuke.nuke'
        }
    }
  }

  // Normal User Check (Against Real DB)
  const hash = await hashPassword(password);
  const userRecord = USERS_DB[identifier];

  if (userRecord && userRecord.passHash === hash) {
    return userRecord.profile;
  }
  
  return null;
};

// Track Real Usage
export const incrementUserUsage = (userId: string) => {
  if (USERS_DB[userId]) {
    USERS_DB[userId].usageCount++;
    saveDB(); // Save updated count immediately
  }
};

// Get Real Stats for Developer Dashboard
export const getSystemStats = () => {
  const users = Object.values(USERS_DB);
  const totalUsers = users.length;
  const totalUsage = users.reduce((acc, curr) => acc + curr.usageCount, 0);
  
  // Find top user
  const sortedUsers = [...users].sort((a, b) => b.usageCount - a.usageCount);
  const topUserRecord = sortedUsers[0];

  return {
    totalUsers,
    totalUsage,
    topUser: topUserRecord ? {
      name: topUserRecord.profile.name,
      id: topUserRecord.profile.id,
      usage: topUserRecord.usageCount
    } : null,
    allUsers: sortedUsers.map(u => ({
      name: u.profile.name,
      id: u.profile.id || 'N/A',
      usage: u.usageCount
    }))
  };
};