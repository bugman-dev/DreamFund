export type NoticeTone = 'success' | 'error' | 'warning' | 'info';

export type AppNotice = {
  tone: NoticeTone;
  title: string;
  body?: string;
};
