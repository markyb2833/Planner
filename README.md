# Planner Application

A visual, canvas-based planner with real-time collaboration built with React, Node.js, Express, Socket.io, and MySQL.

## Features

- Zoomable canvas board with drag-and-drop cards
- Real-time collaboration with multiple users
- Customizable cards (text, images, lists)
- Visual links between cards
- Page grouping and organization
- User authentication and permissions
- Email password reset

## Prerequisites

- Docker and Docker Compose installed
- Your existing MySQL database at 192.168.0.197 (or use containerized version)

## Getting Started

### Option 1: Using Your Existing MySQL Database

1. **Setup the database:**
   ```bash
   docker-compose run --rm db-setup
   ```

2. **Run in development mode (with hot reload):**
   ```bash
   docker-compose --profile dev up
   ```
   - Backend will be available at http://localhost:3001
   - Frontend will be available at http://localhost:3000

3. **Run in production mode:**
   ```bash
   docker-compose up --build
   ```

### Option 2: Using Containerized MySQL Database

1. **Start everything including MySQL:**
   ```bash
   docker-compose --profile with-db --profile dev up
   ```

2. **Update .env to use containerized database:**
   ```
   DATABASE_URL=mysql://newinv:password123!@db/planner
   ```

## Docker Commands

### Development Mode
```bash
# Start dev servers with hot reload
docker-compose --profile dev up

# Stop dev servers
docker-compose --profile dev down
```

### Database Setup
```bash
# Run database setup script
docker-compose run --rm db-setup

# Access MySQL directly (if using containerized DB)
docker exec -it planner-db mysql -u newinv -p planner
```

### Production Mode
```bash
# Build and start production
docker-compose up --build -d

# View logs
docker-compose logs -f app

# Stop production
docker-compose down
```

### Clean Up
```bash
# Remove all containers and volumes
docker-compose --profile dev --profile with-db down -v

# Remove images
docker-compose down --rmi all
```

## Project Structure

```
planner/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Main server file
│   ├── routes/            # API routes
│   ├── controllers/       # Business logic
│   ├── middleware/        # Auth, validation, etc.
│   └── utils/             # Helper functions
├── database_schema.sql    # Database schema
├── setup_database.js      # DB setup script
├── docker-compose.yml     # Docker orchestration
├── Dockerfile            # Production container
├── .env                  # Environment variables
└── package.json          # Backend dependencies
```

## Environment Variables

The `.env` file should contain:
```
SECRET_KEY=your-secret-key
DATABASE_URL=mysql://user:password@host/database
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

## Development Workflow

1. Make changes to code
2. Changes automatically reload in containers
3. Frontend: http://localhost:3000
4. Backend API: http://localhost:3001
5. Database: Your existing MySQL or containerized at localhost:3306

## Tech Stack

- **Frontend:** React, Socket.io-client, React DnD
- **Backend:** Node.js, Express, Socket.io
- **Database:** MySQL
- **Authentication:** JWT, bcrypt
- **Email:** Nodemailer with Gmail
