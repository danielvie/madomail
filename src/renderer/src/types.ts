export type EmailMsg = {
  id: string;
  threadId: string;
  snippet: string;
  body: string;
  from: string;
  subject: string;
  date: string;
};

export type MarkAction = 'archive' | 'trash';
export type ViewMode = 'emails' | 'marked';

export type MarkedItem = {
  id: string;
  from: string;
  action: MarkAction;
};

export type SortKey = 'date' | 'from' | 'subject';
