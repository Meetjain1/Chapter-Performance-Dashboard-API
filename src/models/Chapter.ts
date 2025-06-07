import mongoose, { Document, Schema } from 'mongoose';

export enum ChapterStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export interface IChapter extends Document {
  chapter: string;
  class: string;
  subject: string;
  unit: string;
  status: ChapterStatus;
  isWeakChapter: boolean;
  yearWiseQuestionCount?: Record<string, number>;
  questionSolved?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedChapterResponse {
  chapters: IChapter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ChapterSchema: Schema = new Schema({
  chapter: {
    type: String,
    required: [true, 'Chapter is required'],
    trim: true
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: Object.values(ChapterStatus),
    default: ChapterStatus.NOT_STARTED,
    trim: true
  },
  isWeakChapter: {
    type: Boolean,
    default: false
  },
  yearWiseQuestionCount: {
    type: Object,
    required: false
  },
  questionSolved: {
    type: Number,
    required: false,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for filtering and performance
ChapterSchema.index({ class: 1 });
ChapterSchema.index({ subject: 1 });
ChapterSchema.index({ unit: 1 });
ChapterSchema.index({ status: 1 });
ChapterSchema.index({ isWeakChapter: 1 });

export default mongoose.model<IChapter>('Chapter', ChapterSchema); 