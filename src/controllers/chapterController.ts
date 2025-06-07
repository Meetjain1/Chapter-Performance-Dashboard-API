import { Request, Response } from 'express';
import 'multer'; // Import multer to make Express.Multer types available
import Chapter, { ChapterStatus, PaginatedChapterResponse } from '../models/Chapter';
import { cacheKey, getCache, setCache, invalidateCache } from '../services/redisService';
import fs from 'fs';
import path from 'path';

// Add MulterRequest interface
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const getAllChapters = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      weakChapters,
      subject,
      class: classLevel,
      unit,
      page = '1',
      limit = '10'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (status) {
      // Convert status to proper case format
      const statusMap: { [key: string]: ChapterStatus } = {
        'not started': ChapterStatus.NOT_STARTED,
        'in progress': ChapterStatus.IN_PROGRESS,
        'completed': ChapterStatus.COMPLETED
      };

      const normalizedStatus = status.toString().toLowerCase();
      const validStatus = statusMap[normalizedStatus];

      if (validStatus) {
        filter.status = validStatus;
      } else {
        res.status(400).json({ 
          error: `Invalid status value. Must be one of: ${Object.values(ChapterStatus).join(', ')}` 
        });
        return;
      }
    }
    
    if (weakChapters !== undefined) {
      filter.isWeakChapter = weakChapters === 'true';
    }
    
    if (subject) {
      filter.subject = subject;
    }
    
    if (classLevel) {
      filter.class = classLevel;
    }
    
    if (unit) {
      filter.unit = unit;
    }

    // Check cache first
    const cacheKeyStr = cacheKey({ ...filter, page, limit });
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

    const response: PaginatedChapterResponse = {
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

export const uploadChapters = async (req: MulterRequest, res: Response): Promise<void> => {
  console.log('uploadChapters controller called');
  const failedUploads: any[] = [];
  
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const filePath = path.join(process.cwd(), req.file.path);
    console.log('Reading file from:', filePath);
    
    let fileContent: string;
    try {
      fileContent = fs.readFileSync(filePath, 'utf8');
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error reading file:', err);
      res.status(400).json({ error: 'Could not read uploaded file' });
      return;
    }

    let chapters: any[];
    try {
      chapters = JSON.parse(fileContent);
      if (!Array.isArray(chapters)) {
        res.status(400).json({ error: 'File must contain an array of chapters' });
        return;
      }
    } catch (err) {
      console.error('Error parsing JSON:', err);
      res.status(400).json({ error: 'Invalid JSON format' });
      return;
    }

    const successfulUploads: any[] = [];
    
    // Process each chapter individually
    for (const chapter of chapters) {
      try {
        const mappedChapter = {
          chapter: chapter.chapter || '',
          class: String(chapter.class || ''),
          subject: chapter.subject || '',
          unit: chapter.unit || '',
          status: (chapter.status || ChapterStatus.NOT_STARTED) as ChapterStatus,
          isWeakChapter: Boolean(chapter.isWeakChapter || false),
          yearWiseQuestionCount: chapter.yearWiseQuestionCount || {},
          questionSolved: Number(chapter.questionSolved || 0)
        };

        const newChapter = new Chapter(mappedChapter);
        await newChapter.validate();
        successfulUploads.push(mappedChapter);
      } catch (error: any) {
        failedUploads.push({
          chapter: chapter.chapter,
          error: error.message
        });
      }
    }

    // Insert successful uploads
    if (successfulUploads.length > 0) {
      await Chapter.insertMany(successfulUploads, { ordered: false });
      // Invalidate cache after successful upload
      await invalidateCache();
    }

    res.status(200).json({
      message: 'Upload completed',
      totalProcessed: chapters.length,
      successful: successfulUploads.length,
      failed: failedUploads.length,
      failedUploads: failedUploads.length > 0 ? failedUploads : undefined
    });

  } catch (error: any) {
    console.error('Error in uploadChapters:', error);
    
    if (error.code === 11000) {
      res.status(409).json({ 
        error: 'Duplicate chapters found',
        details: error.message,
        failedUploads
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to upload chapters',
      message: error.message,
      failedUploads
    });
  }
}; 