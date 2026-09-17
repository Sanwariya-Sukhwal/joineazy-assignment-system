# Joineazy Assignment System - Frontend

A React.js + Tailwind CSS frontend for the Joineazy assignment management system.

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:5000`

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_BACKEND_URL=http://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

The frontend will open at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── AssignmentCard.jsx
│   │   ├── GroupCard.jsx
│   │   └── ConfirmModal.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── student/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── MyGroup.jsx
│   │   │   └── Assignments.jsx
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── Assignments.jsx
│   │       ├── CreateAssignment.jsx
│   │       ├── Groups.jsx
│   │       └── Analytics.jsx
│   ├── services/
│   │   └── api.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── routes/
│   │   └── ProtectedRoute.jsx
│   ├── App.jsx
│   └── index.css
├── public/
│   └── index.html
├── package.json
├── tailwind.config.js
├── Dockerfile
└── README.md
```

## Key Features

### Authentication
- User registration and login
- JWT token-based authentication
- Role-based access (Student/Admin)
- Protected routes

### Student Features
- View dashboard with assigned assignments
- Create and manage groups
- Add group members by email
- Confirm assignment submissions
- Track group progress with visual indicators

### Admin Features
- Create and manage assignments
- Set due dates and OneDrive submission links
- Track submission status for all groups
- View analytics and performance metrics
- Monitor individual student progress

### UI/UX
- Responsive design with Tailwind CSS
- Role-based navigation
- Real-time form validation
- Loading states and error handling
- Modal confirmations for critical actions
- Progress bars for assignment completion

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Docker Deployment

Build the Docker image:
```bash
docker build -t joineazy-frontend .
```

Run the container:
```bash
docker run -p 3000:3000 joineazy-frontend
```

## API Integration

The frontend communicates with the backend API using axios.

Example API call pattern:
```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

## State Management

Uses React Context API for:
- User authentication state
- Current user data
- Global notifications
- Modal states

Consider Redux or Zustand for larger applications.

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom CSS**: Located in `src/index.css` for global styles
- **Component Styling**: Inline Tailwind classes in JSX

### Tailwind Configuration

Key configurations in `tailwind.config.js`:
- Color scheme
- Typography settings
- Responsive breakpoints
- Custom components

## Performance Optimization

- Code splitting with React.lazy()
- Lazy loading images
- Memoization of components
- Debouncing API calls
- Caching strategies

## Testing

Run tests:
```bash
npm test
```

## Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:5000`
- Check `REACT_APP_API_URL` in `.env`
- Verify CORS is configured correctly on backend

### Token Expiration
- Implement token refresh mechanism
- Auto-logout on token expiration
- Prompt user to re-login

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC

## Support

For issues or questions, refer to the main project README.md
