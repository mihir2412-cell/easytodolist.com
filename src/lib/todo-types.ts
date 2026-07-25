// Types for the Todo App

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  tags: string[];
  dueDate: string | null;
  reminder: string | null;
  createdAt: number;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface TodoList {
  id: string;
  name: string;
  todos: Todo[];
  categories: Category[];
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', color: '#0070f3' },
  { id: 'personal', name: 'Personal', color: '#7928ca' },
  { id: 'shopping', name: 'Shopping', color: '#f5a623' },
  { id: 'health', name: 'Health', color: '#007f5f' },
  { id: 'learning', name: 'Learning', color: '#ff0080' },
];

export const PRESET_TAGS = ['urgent', 'low-priority', 'meeting', 'follow-up', 'important', 'routine'];

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function getDueDateStatus(dueDate: string | null): 'overdue' | 'today' | 'upcoming' | 'completed' | 'none' {
  if (!dueDate) return 'none';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 7) return 'upcoming';
  return 'completed';
}

export function formatDueDate(dueDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  if (diffDays <= 7) return `In ${diffDays} days`;

  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getShareableUrl(listId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/share/${listId}`;
}