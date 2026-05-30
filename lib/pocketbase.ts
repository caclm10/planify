import PocketBase from 'pocketbase';

// Singleton instance for the client side
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Optional: you can auto-cancellation off if preferred
pb.autoCancellation(false);

// Helper for type-safe collections (optional, we can use simple strings for now)
export const COLLECTIONS = {
  USERS: 'users',
  PROJECTS: 'projects',
  MILESTONES: 'milestones',
  TASKS: 'tasks',
  RESOURCES: 'resources',
  TICKETS: 'tickets',
  TICKET_COMMENTS: 'ticket_comments',
};
