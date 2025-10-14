# Backend Architecture Plan — Meme Gallery API

Goal
Extend the Meme Gallery API with authentication, user roles, and interactions (liking/unliking memes), while keeping the design simple and secure.

Planned Routes
- Auth
  - POST /auth/register → create a new user
  - POST /auth/login → authenticate and return JWT
  - GET /auth/me → return current user profile (protected)
- Memes
  - GET /memes → list memes (optional filters: userId, sort, pagination)
  - GET /memes/:id → get a single meme by id
  - POST /memes → create a meme (protected)
  - PATCH /memes/:id → update own meme (protected; owner or admin)
  - DELETE /memes/:id → delete meme (protected; owner or admin)
- Likes
  - POST /memes/:id/like → like/unlike (toggle) a meme (protected)
  - GET /memes/:id/likes → get like count or list of users who liked (optional)
- Users
  - GET /users/:id/memes → list memes created by a specific user
  - DELETE /users/:id → delete a user (admin only; optional)

Models and Relationships
- User
  - id (UUID), username (unique), passwordHash, role (enum: 'admin' | 'user'), createdAt, updatedAt
- Meme
  - id (UUID), title (string), url (string), userId (FK → User.id), createdAt, updatedAt
- UserLikesMeme (join/pivot)
  - userId (FK → User.id), memeId (FK → Meme.id), createdAt
  - Unique constraint on (userId, memeId) to prevent duplicate likes
Relationships:
- User 1—N Meme (User hasMany Memes; Meme belongsTo User)
- User N—M Meme through UserLikesMeme (likes)

Authentication Flow
1) Registration
   - Client sends username + password.
   - Server validates input; hash password with bcrypt (or Argon2).
   - Create User with role='user' by default.
2) Login
   - Verify username/password against passwordHash.
   - Issue a signed JWT with claims: sub=<userId>, role=<'user'|'admin'>, iat, exp.
   - Return token to client.
3) Protected access
   - Clients include Authorization: Bearer <token>.
   - Auth middleware verifies signature, checks exp, loads user context.
   - Route-level guards enforce role/ownership where needed.
4) Logout
   - Client discards token (stateless JWT). Token revocation optional.

Roles and Authorization
- Regular user ('user'):
  - CRUD on own memes (create, update, delete).
  - Read any public meme(s).
  - Like/unlike memes.
- Admin ('admin'):
  - All user capabilities, plus:
  - Delete any meme.
  - Delete any user (caution: typically with safeguards).
Enforcement:
- requireAuth middleware for protected routes.
- requireRole('admin') for admin-only endpoints.
- requireOwnership('meme') to restrict updates/deletes to meme owners (or admin override).

Validation, Errors, and Security Notes
- Validate inputs (e.g., url format, title length).
- Hash passwords; never store plaintext.
- On auth errors: 401 Unauthorized; on forbidden actions: 403 Forbidden.
- Rate-limit sensitive endpoints (auth, like toggle) to prevent abuse.

Optional Diagram
User ──< Meme
User >── UserLikesMeme ──< Meme
(>── indicates many-to-many via pivot; ──< indicates one-to-many)
