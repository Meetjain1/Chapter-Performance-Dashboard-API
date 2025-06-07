export interface Chapter {
  _id?: string;
  chapter: string;
  class: string;
  subject: string;
  unit: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  isWeakChapter: boolean;
  yearWiseQuestionCount: {
    [year: string]: number;
  };
  questionSolved: number;
}

export interface PaginatedChapterResponse {
  chapters: Chapter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 