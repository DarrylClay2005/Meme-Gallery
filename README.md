# Meme Gallery API

A simple Node.js + Express API with Prisma (SQLite) that supports user registration/login, creating memes, and toggling likes (like/unlike). Includes validation and automated tests.

## Features
- JWT auth: register, login, and get current user
- Meme creation by authenticated users
- Like/unlike toggle per user per meme (many-to-many via join table)
- Input validation with Joi
- Prisma ORM with SQLite + migrations
- Jest + Supertest tests

## Tech Stack
- Express, Prisma (SQLite), JWT, Joi
- Jest, Supertest, Nodemon

## Getting Started
1) Install dependencies
```bash path=null start=null
npm install --prefix /home/thunder/Documents/GitHub/Meme-Gallery
```

2) Configure environment
Create .env at project root (already created by setup):
```bash path=null start=null
DATABASE_URL="file:./dev.db"
JWT_SECRET="devsecret" # replace in production
```

3) Run Prisma migrations
```bash path=null start=null
npm run prisma:migrate --prefix /home/thunder/Documents/GitHub/Meme-Gallery
```

4) Start the server (dev)
```bash path=null start=null
npm run dev --prefix /home/thunder/Documents/GitHub/Meme-Gallery
```
Server defaults to http://localhost:3000

## API
- Auth
  - POST /auth/register → { username, password }
  - POST /auth/login → { username, password } returns { token }
  - GET /auth/me (protected) → current user
- Memes
  - POST /memes (protected) → { title, url }
- Likes
  - POST /memes/:id/like (protected) → toggle like/unlike

Example
```bash path=null start=null
# Register
curl -s -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"password123"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"password123"}' | jq -r .token)

# Create a meme
curl -s -X POST http://localhost:3000/memes \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Funny","url":"https://example.com/meme.jpg"}'

# Like/unlike
curl -s -X POST http://localhost:3000/memes/1/like \
  -H "Authorization: Bearer $TOKEN"
```

## Tests
Run automated tests:
```bash path=null start=null
npm test --prefix /home/thunder/Documents/GitHub/Meme-Gallery
```
Tests cover like and unlike behaviors via POST /memes/:id/like.

## Project Structure
- src/app.js: Express app (routes, auth, validation)
- src/server.js: Server entry
- prisma/schema.prisma: Models (User, Meme, UserLikesMeme)
- tests/memeLikes.test.js: Jest + Supertest tests

## Notes
- JWT secret in .env is for development only.
- For Postman deliverables, capture screenshots of login and like/unlike calls.
