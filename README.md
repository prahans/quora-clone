# Quora Clone

A full-stack Quora-inspired Q&A platform built with React, TypeScript, Node.js, Express, and MongoDB.

The project focuses on building a real-world full-stack application with authentication, protected routes, REST APIs, database operations, and secure cookie-based JWT authentication.

## 🚀 Features

### Authentication

- User registration
- User login
- Password hashing with bcrypt
- JWT-based authentication
- JWT stored in HTTP-only cookies
- Authentication middleware
- Protected API routes
- Current authenticated user support
- Logout support

### Posts

- Create posts
- View posts
- View individual posts
- Edit posts
- Delete posts
- Store posts in MongoDB
- Associate posts with users

### Backend

- RESTful API built with Express
- TypeScript
- Express middleware
- Modular route structure
- Controller-based architecture
- MongoDB database
- Mongoose ODM
- CORS configuration
- Environment variables
- Centralized database connection

### Frontend

- React
- TypeScript
- React Router
- Axios
- Login and signup pages
- Post listing
- Create/edit/delete post functionality
- Client-side navigation

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- React Router
- Axios
- Vite

### Backend

- Node.js
- Express.js
- TypeScript
- Mongoose
- MongoDB
- JSON Web Token (JWT)
- bcrypt
- cookie-parser
- CORS

### Development

- Git
- GitHub
- ESLint

---

## 📁 Project Structure

```text
quora-clone/
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── Home.tsx
│   │   ├── LoginPage.tsx
│   │   ├── New.tsx
│   │   ├── Edit.tsx
│   │   ├── Show.tsx
│   │   └── main.tsx
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   └── postController.ts
│   │   │
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts
│   │   │
│   │   ├── models/
│   │   │   ├── users.ts
│   │   │   └── posts.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   └── postRoutes.ts
│   │   │
│   │   ├── util/
│   │   │   └── secretToken.ts
│   │   │
│   │   └── index.ts
│   │
│   └── package.json
│
└── README.md
```
