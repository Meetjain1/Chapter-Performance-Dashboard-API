# Chapter Performance Dashboard API

A RESTful API for managing chapter performance data with advanced features like caching, rate limiting, and admin authentication.

## Features

- RESTful API endpoints for chapter management
- Redis caching with 1-hour TTL and automatic invalidation
- Rate limiting (30 requests/minute per IP)
- Admin authentication with JWT
- Comprehensive filtering (status, subject, unit, class, etc.)
- Pagination support
- MongoDB integration with Mongoose
- TypeScript implementation
- Swagger documentation
- Postman collection for testing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- TypeScript

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chapter-performance-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chapter-performance
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

4. Build the TypeScript code:
```bash
npm run build
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

### Authentication
- `POST /api/v1/auth/login`
  - Login as admin
  - Body: `{ "email": "admin@example.com", "password": "admin123" }`
  - Returns JWT token for protected routes

### Chapters
- `GET /api/v1/chapters`
  - Get all chapters with filtering and pagination
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `class`: Filter by class number
    - `subject`: Filter by subject
    - `unit`: Filter by unit
    - `status`: Filter by status ("Not Started"/"In Progress"/"Completed")
    - `isWeakChapter`: Filter weak chapters (true/false)
  - Response is cached for 1 hour
  - Rate limited to 30 requests/minute per IP

- `GET /api/v1/chapters/:id`
  - Get a specific chapter by ID
  - Rate limited to 30 requests/minute per IP

- `POST /api/v1/chapters`
  - Upload chapters (Admin only)
  - Requires JWT token in Authorization header
  - Accepts JSON file upload
  - Invalidates cache on successful upload
  - Rate limited to 30 requests/minute per IP

## Testing

### Swagger Documentation
- Access the Swagger UI at: `http://localhost:3000/docs`
- Interactive API documentation with request/response examples

### Postman Collection
- Import the provided `postman_collection.json`
- Set environment variables:
  - `baseUrl`: Your API base URL
  - `authToken`: JWT token from login
  - `chapterId`: Valid chapter ID for testing

## Sample Data Format

```json
{
  "chapter": "Linear Equations",
  "class": "Class 10",
  "subject": "Mathematics",
  "unit": "Algebra",
  "status": "Not Started",
  "isWeakChapter": false,
  "yearWiseQuestionCount": {
    "2019": 10,
    "2020": 8,
    "2021": 5,
    "2022": 7,
    "2023": 6,
    "2024": 9
  },
  "questionSolved": 0
}
``` 