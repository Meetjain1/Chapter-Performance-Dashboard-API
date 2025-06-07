import { Request, Response } from 'express';
import Chapter, { ChapterStatus, PaginatedChapterResponse } from '../models/Chapter';
import { cacheKey, getCache, setCache, invalidateCache } from '../services/redisService';
import fs from 'fs';
import path from 'path';
import { PaginatedChapterResponse as PaginatedChapterResponseType } from '../types/chapter';

// Extended Request type to include file
interface FileRequest extends Request {
  file?: Express.Multer.File;
}

export const getAllChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, class: className, subject, unit, status, isWeakChapter } = req.query;

    // Build filter object
    const filter: any = {};
    if (className) filter.class = className;
    if (subject) filter.subject = subject;
    if (unit) filter.unit = unit;
    if (status) filter.status = status;
    if (isWeakChapter !== undefined) filter.isWeakChapter = isWeakChapter === 'true';

    // Create cache key based on query parameters
    const cacheKeyStr = JSON.stringify({ ...req.query });

    // Try to get from cache
    const cachedData = await getCache(cacheKeyStr);
    if (cachedData) {
      res.json(cachedData);
      return;
    }

    // Pagination
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [chapters, total] = await Promise.all([
      Chapter.find(filter)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Chapter.countDocuments(filter)
    ]);

    const response: PaginatedChapterResponseType = {
      chapters,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };

    // Cache the response
    await setCache(cacheKeyStr, response);

    res.json(response);
  } catch (error) {
    console.error('Error in getAllChapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
};

export const getChapterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const chapter = await Chapter.findById(req.params.id).lean();
    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }
    res.json(chapter);
  } catch (error) {
    console.error('Error in getChapterById:', error);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
};

export const uploadChapters = async (req: FileRequest, res: Response): Promise<void> => {
  console.log('uploadChapters controller called');
  const failedUploads: any[] = [];
  
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileContent = req.file.buffer.toString();
    const chapters = JSON.parse(fileContent);

    if (!Array.isArray(chapters)) {
      res.status(400).json({ error: 'Invalid file format. Expected array of chapters.' });
      return;
    }

    // Process each chapter
    const results = await Promise.allSettled(
      chapters.map(chapter => Chapter.create(chapter))
    );

    // Collect failed uploads
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failedUploads.push({
          chapter: chapters[index],
          error: result.reason.message
        });
      }
    });

    // Invalidate cache after successful upload
    await invalidateCache();

    res.json({
      message: 'Chapters processed',
      totalProcessed: chapters.length,
      successful: chapters.length - failedUploads.length,
      failed: failedUploads.length,
      failedUploads: failedUploads
    });
  } catch (error) {
    console.error('Error in uploadChapters:', error);
    res.status(500).json({ 
      error: 'Failed to process chapters',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 