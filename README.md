# Joineazy Assignment System

A full-stack web application for managing students, groups, assignments, assignment distribution, submission confirmations, and progress analytics.

## Project Overview

Joineazy Assignment System is a full-stack educational assignment management platform where students and professors can manage courses, groups, assignments, submissions, acknowledgements, and progress analytics.

The application supports role-based workflows for:

- Students
- Professors/Admins

Students can enroll in courses, create and manage groups, view assignments, submit assignments, and track their progress.

Professors can create courses, enroll students, create assignments, choose individual or group submission types, assign group assignments, monitor submissions and acknowledgements, and view analytics.

### Student Features

- Register and log in
- View enrolled courses
- View professor/course information
- Create student groups
- Add group members using student email
- View group details and members
- View assignments assigned to enrolled courses/groups
- Support individual and group assignments
- Open assignment resource links
- Confirm assignment submission
- Acknowledge submitted assignments
- Group leader acknowledgement for group assignments
- View submission status
- View acknowledgement status
- View assignment and group progress
- Responsive student dashboard

### Admin / Professor Features

- Secure professor/admin login
- Professor dashboard
- Create courses
- Edit courses
- Delete courses
- View enrolled student count per course
- Enroll students into courses
- Remove students from courses
- Create assignments
- Edit assignments
- Delete assignments
- Select course for an assignment
- Select Individual or Group submission type
- Set assignment title, description, deadline, and resource link
- Assign group assignments to specific groups
- View assignment details
- Monitor student and group submissions
- Monitor acknowledgement status
- View submission progress
- View group analytics
- View student analytics
- View assignment analytics
- View course analytics

---

## Technology Stack

### Frontend

- React.js 18
- Create React App (`react-scripts`)
- React Router
- Tailwind CSS 3.3
- Axios
- React Context API

### Backend

- Node.js 18
- Express.js
- PostgreSQL
- `pg` (node-postgres)
- JWT authentication
- bcryptjs password hashing
- CORS
- REST APIs

### DevOps

- Docker
- Docker Compose
- PostgreSQL Docker image

### Development Tools

- Git / GitHub
- npm
- Postman / Thunder Client
- VS Code

---

## System Architecture

```text
                         ┌──────────────────────────┐
                         │       Web Browser        │
                         │      React + Tailwind    │
                         └────────────┬─────────────┘
                                      │
                                HTTP REST API
                                + JWT Token
                                      │
                         ┌────────────▼─────────────┐
                         │      Node.js / Express    │
                         │                           │
                         │ Routes                    │
                         │ Controllers               │
                         │ Services                  │
                         │ JWT Middleware            │
                         │ Role Middleware            │
                         └────────────┬─────────────┘
                                      │
                                  SQL / pg
                                      │
                         ┌────────────▼─────────────┐
                         │       PostgreSQL          │
                         │                           │
                         │ users                     │
                         │ groups                    │
                         │ group_members             │
                         │ assignments               │
                         │ assignment_groups         │
                         │ submissions               │
                         └───────────────────────────┘

                 Docker Compose manages all three services:
                    Frontend + Backend + PostgreSQL
```

### Request Flow

```text
React Page
   ↓
Axios API Client
   ↓
Express Route
   ↓
JWT Authentication / Role Authorization
   ↓
Controller
   ↓
Service / PostgreSQL Query
   ↓
JSON Response
   ↓
React UI Update
```

---

## Authentication and Authorization

The application uses JWT-based authentication.

### Registration

New users are registered as students by default.

```text
POST /api/auth/register
```

### Login

After successful login, the backend returns a JWT and user information.

```text
POST /api/auth/login
```

The frontend stores the authentication token and sends it with protected API requests:

```text
Authorization: Bearer <JWT_TOKEN>
```

### Roles

The application supports:

- `student`
- `admin` — used internally for the Professor/Admin workspace

Public registration creates student accounts.

Professor/Admin accounts are managed separately and are not available through public registration.

---

## Database Schema

PostgreSQL is used as the relational database.

### Tables

1. `users` - Authentication, profile, and role information
2. `courses` - Professor-managed courses
3. `course_students` - Student-course enrollment relationship
4. `groups` - Student groups
5. `group_members` - Group membership relationship
6. `assignments` - Assignment information including course and submission type
7. `assignment_groups` - Assignment-to-group relationship
8. `submissions` - Individual/group submission and acknowledgement tracking

### Entity Relationship Diagram

```mermaid
erDiagram

    USERS ||--o{ COURSES : teaches
    USERS ||--o{ COURSE_STUDENTS : enrolls
    COURSES ||--o{ COURSE_STUDENTS : contains

    USERS ||--o{ GROUPS : leads
    USERS ||--o{ GROUP_MEMBERS : joins
    GROUPS ||--o{ GROUP_MEMBERS : contains

    COURSES ||--o{ ASSIGNMENTS : contains
    USERS ||--o{ ASSIGNMENTS : creates

    ASSIGNMENTS ||--o{ ASSIGNMENT_GROUPS : assigned_to
    GROUPS ||--o{ ASSIGNMENT_GROUPS : receives

    ASSIGNMENTS ||--o{ SUBMISSIONS : has
    USERS ||--o{ SUBMISSIONS : submits
    USERS ||--o{ SUBMISSIONS : acknowledges
    GROUPS ||--o{ SUBMISSIONS : submits

    USERS {
        int id PK
        varchar email UK
        varchar password
        varchar first_name
        varchar last_name
        varchar role
        timestamp created_at
        timestamp updated_at
    }

    COURSES {
        int id PK
        varchar name
        text description
        int professor_id FK
        timestamp created_at
        timestamp updated_at
    }

    COURSE_STUDENTS {
        int id PK
        int course_id FK
        int student_id FK
        timestamp enrolled_at
    }

    GROUPS {
        int id PK
        varchar name
        int leader_id FK
        text description
        timestamp created_at
        timestamp updated_at
    }

    GROUP_MEMBERS {
        int id PK
        int group_id FK
        int user_id FK
        timestamp joined_at
    }

    ASSIGNMENTS {
        int id PK
        varchar title
        text description
        timestamp due_date
        varchar submission_type
        varchar onedrive_link
        int course_id FK
        int created_by FK
        timestamp created_at
        timestamp updated_at
    }

    ASSIGNMENT_GROUPS {
        int id PK
        int assignment_id FK
        int group_id FK
        timestamp assigned_at
    }

    SUBMISSIONS {
        int id PK
        int assignment_id FK
        int group_id FK
        int student_id FK
        boolean is_submitted
        boolean acknowledged
        int submitted_by FK
        int acknowledged_by FK
        timestamp submitted_at
        timestamp acknowledged_at
        timestamp created_at
        timestamp updated_at
    }
```

### Important Relationships

- One user can lead multiple groups.
- One group can contain multiple students.
- Students and groups are connected through `group_members`.
- One admin can create multiple assignments.
- Assignments and groups are connected through `assignment_groups`.
- Each assignment/group combination has one submission record.
- `submitted_by` records the student who confirmed the submission.

---

## API Documentation

### Base URL

```text
http://localhost:5000/api
```

### Authentication Header

Protected endpoints use:

```text
Authorization: Bearer <JWT_TOKEN>
```

### Authentication APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a student |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get current authenticated user |

### Group APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/groups` | Create a group |
| GET | `/groups` | Get groups |
| GET | `/groups/:id` | Get group details |
| GET | `/groups/my-groups` | Get groups for current student |
| POST | `/groups/:id/members` | Add a member by email |
| DELETE | `/groups/:id/members/:studentId` | Remove a member |

### Course APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/courses` | Get professor's courses |
| POST | `/courses` | Create a course |
| GET | `/courses/:id` | Get course details |
| PUT | `/courses/:id` | Update a course |
| DELETE | `/courses/:id` | Delete a course |
| GET | `/student/courses` | Get enrolled courses for current student |

### Student Enrollment APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/students` | Get students |
| GET | `/students/course/:courseId` | Get students enrolled in a course |
| POST | `/students/course/:courseId` | Enroll a student |
| DELETE | `/students/course/:courseId/:studentId` | Remove a student from a course |

### Assignment APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/assignments` | Create an assignment |
| GET | `/assignments` | Get assignments |
| GET | `/assignments/:id` | Get assignment details |
| PUT | `/assignments/:id` | Update an assignment |
| DELETE | `/assignments/:id` | Delete an assignment |
| POST | `/assignments/:id/groups` | Assign an assignment to a group |
| GET | `/assignments/:id/groups` | Get groups assigned to an assignment |
| GET | `/assignments/group/:groupId` | Get assignments for a group |

### Assignment Submission Types

Assignments support two submission types:

#### Individual

Each student submits and acknowledges their own assignment.

```text
Student
   ↓
Submit Assignment
   ↓
Submission Confirmed
   ↓
Student Acknowledges
```

#### Group

The assignment is assigned to a group.

```text
Group Member
      ↓
Submit Assignment
      ↓
Group Submission Confirmed
      ↓
Group Leader
      ↓
Acknowledges Assignment
      ↓
Status Reflected for Group
```

Only the group leader can acknowledge a group assignment.

### Submission APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/submissions/:assignmentId/confirm` | Confirm assignment submission |
| POST | `/submissions/:assignmentId/acknowledge` | Acknowledge assignment |
| GET | `/submissions` | Get all submissions |
| GET | `/submissions/:assignmentId/:groupId` | Get submission status |
| GET | `/submissions/group/:groupId` | Get group submissions |
| GET | `/submissions/assignment/:assignmentId` | Get assignment submissions |

### Analytics APIs

Admin-only analytics endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/analytics/overview` | Dashboard overview statistics |
| GET | `/analytics/groups` | Group progress analytics |
| GET | `/analytics/students` | Student progress analytics |
| GET | `/analytics/assignments` | Assignment statistics |
| GET | `/analytics/assignments/:assignmentId` | Detailed assignment statistics |

---

## Two-Step Submission Confirmation

The student submission flow is designed to reduce accidental confirmation.

```text
Student opens assignment
        ↓
Clicks "Yes, I have submitted"
        ↓
Confirmation modal appears
        ↓
Student confirms
        ↓
POST /api/submissions/:assignmentId/confirm
        ↓
Backend validates authentication and group membership
        ↓
Submission record is created/updated
        ↓
Assignment becomes "Submitted"
        ↓
Group progress is updated
```

---

## Folder Structure

```text
joineazy-assignment-system/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── groupController.js
│   │   │   ├── assignmentController.js
│   │   │   ├── submissionController.js
│   │   │   └── analyticsController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── roleMiddleware.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── groupRoutes.js
│   │   │   ├── assignmentRoutes.js
│   │   │   ├── submissionRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── groupService.js
│   │   │   └── assignmentService.js
│   │   ├── utils/
│   │   │   └── jwt.js
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── AssignmentCard.jsx
│   │   │   ├── GroupCard.jsx
│   │   │   └── ConfirmModal.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── student/
│   │   │   │   ├── StudentDashboard.jsx
│   │   │   │   ├── MyGroup.jsx
│   │   │   │   └── Assignments.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── Assignments.jsx
│   │   │       ├── CreateAssignment.jsx
│   │   │       ├── EditAssignment.jsx
│   │   │       ├── Groups.jsx
│   │   │       └── Analytics.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── Dockerfile
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## Quick Start

### Prerequisites

For Docker-based setup:

- Docker Desktop
- Git

For manual local development:

- Node.js 18+
- PostgreSQL 15+ recommended
- npm

---

## Run with Docker

From the project root:

```bash
docker compose up --build
```

### First Time Run

Build the images and start all services:

```bash
docker compose up --build
```

### Already Set Up

If the project has already been built:

```bash
docker compose up
```

### After Dockerfile or Dependency Changes

Rebuild the containers:

```bash
docker compose up --build
```

The services are exposed as:

```text
Frontend:  http://localhost:3000
Backend:   http://localhost:5000
PostgreSQL: localhost:5432
```

### Check Containers

```bash
docker compose ps
```

### Backend Logs

```bash
docker compose logs -f backend
```

### Frontend Logs

```bash
docker compose logs -f frontend
```

### Stop Docker

```bash
docker compose down
```

### Stop Containers and Remove Database Volume

Only use this when you intentionally want to reset the local database:

```bash
docker compose down -v
```

> **Important:** Do not use `docker compose down -v` unless you intentionally want to delete the local PostgreSQL database volume.

---

## Environment Variables

### Backend

Example development configuration:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<your-password>
DB_NAME=joineazy_db

JWT_SECRET=<change-in-production>
JWT_EXPIRY=7d

FRONTEND_URL=http://localhost:3000
```

When the backend runs inside Docker Compose, the database host is the PostgreSQL service name:

```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=joineazy_user
DB_PASSWORD=<docker-db-password>
DB_NAME=joineazy_db
```

### Frontend

Because the frontend uses Create React App:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BACKEND_URL=http://localhost:5000
```

> Never commit real production secrets or passwords to GitHub.

---

## Database Initialization

The backend initializes and updates the required PostgreSQL tables when the application starts.

The database contains:

```text
users
courses
course_students
groups
group_members
assignments
assignment_groups
submissions
```

When using Docker Compose, PostgreSQL data is persisted in the named Docker volume:

```text
postgres_data
```

This means normal container restarts do not remove the database data.

---

## Creating an Admin Account

Public registration creates student accounts by default.

For local testing, an existing account can be promoted to admin directly in PostgreSQL:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@gmail.com';
```

Verify:

```sql
SELECT id, email, first_name, last_name, role
FROM users
WHERE email = 'admin@gmail.com';
```

After changing the role, log out and log in again so a new JWT containing the updated role is issued.

---

## Manual Development Setup

### Backend

```bash
cd backend
npm install
npm start
```

Backend:

```text
http://localhost:5000
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

Frontend:

```text
http://localhost:3000
```

For manual development, make sure PostgreSQL is running and the backend `.env` contains the correct local database credentials.

---

## Role-Based Access Control

The application uses both frontend route protection and backend authorization.

### Frontend

Protected routes verify whether the user is authenticated.

Role-specific routes ensure that:

```text
student → Student workspace
admin   → Admin workspace
```

### Backend

JWT middleware verifies the token.

Role middleware protects admin-only endpoints such as analytics and assignment administration.

This prevents users from accessing protected features only by changing frontend URLs.

---

## Key Design Decisions

### 1. React + Tailwind CSS

React provides reusable components and page-based UI composition. Tailwind CSS keeps styling close to the components and supports responsive layouts without maintaining a large collection of custom page-specific styles.

### 2. Express REST API

Express provides a lightweight API layer with separate routes, controllers, services, and middleware.

### 3. PostgreSQL

PostgreSQL is suitable for this application because the data contains strong relationships between users, groups, assignments, and submissions. Foreign keys and unique constraints help maintain data integrity.

### 4. JWT Authentication

JWT provides stateless authentication for the React frontend and Express backend.

### 5. Context API

React Context is sufficient for the application's global authentication state without adding the complexity of a larger state-management library.

### 6. Assignment-to-Group Join Table

The `assignment_groups` table separates assignment creation from assignment distribution and allows an assignment to be associated with specific groups.

### 7. Submission Record per Assignment and Group

The `submissions` table uses a unique `(assignment_id, group_id)` relationship so a group has one submission status for a particular assignment.

### 8. Docker Compose

Docker Compose provides a repeatable development environment containing:

```text
React frontend
Node/Express backend
PostgreSQL database
```

---

## Security

Implemented:

- Password hashing with bcryptjs
- JWT authentication
- JWT expiration
- Role-based authorization
- Protected API endpoints
- Parameterized PostgreSQL queries
- CORS configuration
- Foreign key constraints
- Unique database constraints
- Environment variables for configuration

### Production Security Improvements

For a production deployment, the following should also be considered:

- HTTPS/TLS
- Secure HTTP-only cookie-based token handling
- Rate limiting
- Security headers
- Strong production secrets
- Centralized logging and monitoring
- Database backups
- Secret management
- Dependency updates
- Input validation and sanitization

---

## Testing Checklist

### Student Flow

- [ ] Register student
- [ ] Login as student
- [ ] Create group
- [ ] Add another student to group
- [ ] View group members
- [ ] View assigned assignments
- [ ] Open OneDrive link
- [ ] Confirm submission
- [ ] Verify submitted status
- [ ] Verify group progress

### Admin Flow

- [ ] Login as admin
- [ ] View admin dashboard
- [ ] Create assignment
- [ ] Edit assignment
- [ ] Delete assignment
- [ ] Assign assignment to group
- [ ] View group analytics
- [ ] View student analytics
- [ ] Verify submission statistics

### Task 2 Student Flow

- [ ] Register student
- [ ] Login as student
- [ ] View enrolled courses
- [ ] Create group
- [ ] Add group member
- [ ] View group members
- [ ] View course assignments
- [ ] View individual assignment
- [ ] View group assignment
- [ ] Submit individual assignment
- [ ] Submit group assignment
- [ ] Acknowledge individual assignment
- [ ] Group leader acknowledges group assignment
- [ ] Verify acknowledgement status
- [ ] Verify assignment progress
- [ ] Verify group progress
- [ ] Verify responsive/mobile UI

### Task 2 Professor Flow

- [ ] Login as professor/admin
- [ ] View professor dashboard
- [ ] Create course
- [ ] Edit course
- [ ] Delete course
- [ ] Enroll student into course
- [ ] Remove student from course
- [ ] View course student count
- [ ] Create individual assignment
- [ ] Create group assignment
- [ ] Edit assignment
- [ ] Delete assignment
- [ ] Assign assignment to group
- [ ] View assignment details
- [ ] Monitor submissions
- [ ] Monitor acknowledgements
- [ ] Filter/view submission status
- [ ] View course analytics
- [ ] View group analytics
- [ ] View student analytics
- [ ] View assignment analytics

### Task 2 Docker Flow

- [ ] First run with `docker compose up --build`
- [ ] Subsequent run with `docker compose up`
- [ ] PostgreSQL becomes healthy
- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Frontend communicates with backend
- [ ] Database data persists after restart

### Docker Flow

- [ ] `docker compose up --build`
- [ ] PostgreSQL becomes healthy
- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Frontend can communicate with backend
- [ ] Database data persists after container restart

---

## Current Docker Services

```text
┌─────────────────────────────────────────────┐
│              Docker Compose                 │
│                                             │
│  ┌──────────────┐    ┌──────────────┐       │
│  │   Frontend   │───▶│   Backend    │       │
│  │   React      │    │ Node/Express │       │
│  │   :3000      │    │    :5000     │       │
│  └──────────────┘    └──────┬───────┘       │
│                             │               │
│                      ┌──────▼───────┐       │
│                      │  PostgreSQL  │       │
│                      │    :5432     │       │
│                      └──────────────┘       │
└─────────────────────────────────────────────┘
```

---

## Known Limitations

The current implementation focuses on the core assignment workflow.

Current limitations include:

- OneDrive is handled through links rather than direct file upload.
- Email notifications are not implemented as a separate email service.
- Real-time WebSocket updates are not implemented.
- Advanced search/filtering is limited.
- Grading and teacher feedback workflows are outside the current scope.

### Possible Future Enhancements

- Email notifications
- Real-time notifications with Socket.io
- Direct cloud file integration
- Advanced assignment filtering
- Grading and feedback
- More detailed analytics visualizations
- Automated end-to-end testing
- CI/CD pipeline
- Production deployment

---

## Git Workflow

Recommended commit style:

```bash
git commit -m "feat(backend): implement JWT authentication"
git commit -m "feat(backend): add group management APIs"
git commit -m "feat(backend): add assignment management APIs"
git commit -m "feat(backend): add submission tracking"
git commit -m "feat(backend): add analytics APIs"
git commit -m "feat(frontend): implement student dashboard"
git commit -m "feat(frontend): implement admin dashboard"
git commit -m "feat(frontend): implement assignment management"
git commit -m "feat(frontend): implement group management"
git commit -m "style(frontend): improve responsive Tailwind UI"
git commit -m "fix(backend): correct group assignment progress"
git commit -m "docs: update project documentation"
```

---

## Deployment

### Development Deployment

The project is containerized using Docker Compose.

```bash
docker compose up --build
```

### Production Considerations

For production:

1. Use a managed PostgreSQL database or a properly secured PostgreSQL server.
2. Use a strong random JWT secret.
3. Configure production CORS origins.
4. Enable HTTPS.
5. Build the React application for production.
6. Run the backend with production environment variables.
7. Keep secrets outside Git.
8. Configure database backups.
9. Add monitoring and centralized logging.
10. Use a production reverse proxy where appropriate.

---

## Demo

### Local Demo

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5000
```

### Submission Links

Add the final links before submitting the assignment:

```text
GitHub Repository: <add-github-repository-url>
Demo Video:        <add-demo-video-url>
Live Platform:    <add-live-platform-url-if-available>
```

---

## Project Status

### Task 1

Completed:

- Student registration/login
- Admin/Professor login
- Group management
- Assignment management
- Group assignment distribution
- Submission confirmation
- Group progress tracking
- Analytics
- PostgreSQL persistence
- Dockerized frontend, backend, and database

### Task 2

Implemented:

- Course management
- Student-course enrollment
- Professor dashboard
- Individual assignment support
- Group assignment support
- Submission acknowledgement
- Group leader acknowledgement
- Submission progress tracking
- Course-based assignments
- Student course dashboard
- Professor course analytics
- Student progress analytics
- Group progress analytics
- Responsive UI improvements
- Role-based access control
- Docker-based full-stack development environment

---

## Author

**Sanwariya Lal Sukhwal**

- MCA — Mohanlal Sukhadia University, Udaipur
- Full Stack Development — Java / React / Node.js
- GitHub: https://github.com/Sanwariya-Sukhwal
- LinkedIn: https://www.linkedin.com/in/sanwariya02

---

## License

This project was developed for educational and internship assignment purposes as part of the Joineazy Full Stack Internship task.