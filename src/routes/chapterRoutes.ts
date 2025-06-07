import { Router, RequestHandler } from 'express';
import multer from 'multer';
import { getAllChapters, getChapterById, uploadChapters } from '../controllers/chapterController';
import { rateLimiter } from '../middleware/rateLimit';
import { isAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Chapter:
 *       type: object
 *       required:
 *         - chapter
 *         - class
 *         - subject
 *         - unit
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB generated ID
 *         chapter:
 *           type: string
 *           description: Chapter name
 *         class:
 *           type: string
 *           description: Class level (e.g., "Class 11")
 *         subject:
 *           type: string
 *           description: Subject name
 *         unit:
 *           type: string
 *           description: Unit name
 *         status:
 *           type: string
 *           enum: ["Not Started", "In Progress", "Completed"]
 *           description: Chapter status
 *         isWeakChapter:
 *           type: boolean
 *           description: Whether this is a weak chapter
 *         yearWiseQuestionCount:
 *           type: object
 *           description: Question count by year
 *         questionSolved:
 *           type: number
 *           description: Total questions solved
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/chapters:
 *   get:
 *     summary: Get all chapters with filters and pagination
 *     description: Retrieve a list of chapters with optional filtering and pagination. Results are cached for 1 hour.
 *     tags: [Chapters]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["Not Started", "In Progress", "Completed"]
 *         description: Filter by chapter status
 *       - in: query
 *         name: weakChapters
 *         schema:
 *           type: boolean
 *         description: Filter for weak chapters
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *         description: Filter by class
 *       - in: query
 *         name: unit
 *         schema:
 *           type: string
 *         description: Filter by unit
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of chapters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chapters:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chapter'
 *                 total:
 *                   type: integer
 *                   description: Total number of chapters matching the filters
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 limit:
 *                   type: integer
 *                   description: Items per page
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *       400:
 *         description: Invalid query parameters
 *       429:
 *         description: Too many requests
 *
 *   post:
 *     summary: Upload chapters from JSON file
 *     description: Upload multiple chapters from a JSON file. Only accessible by admin users.
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: JSON file containing array of chapters
 *     responses:
 *       200:
 *         description: Chapters uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 totalProcessed:
 *                   type: integer
 *                 successful:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 failedUploads:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       chapter:
 *                         type: string
 *                       error:
 *                         type: string
 *       400:
 *         description: Invalid file or data format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not an admin user
 *       429:
 *         description: Too many requests
 */

/**
 * @swagger
 * /api/v1/chapters/{id}:
 *   get:
 *     summary: Get chapter by ID
 *     description: Retrieve a specific chapter by its MongoDB ID
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the chapter
 *     responses:
 *       200:
 *         description: Chapter details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chapter'
 *       404:
 *         description: Chapter not found
 *       429:
 *         description: Too many requests
 */

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(null, false);
      cb(new Error('Only JSON files are allowed'));
    }
  },
});

// Apply rate limiter to all routes
router.use(rateLimiter as RequestHandler);

// Get all chapters with filters and pagination
router.get('/', getAllChapters as RequestHandler);

// Get specific chapter by ID
router.get('/:id', getChapterById as RequestHandler);

// Upload chapters (admin only)
router.post('/', 
  isAdmin as RequestHandler,
  upload.single('file'),
  uploadChapters as RequestHandler
);

export default router; 