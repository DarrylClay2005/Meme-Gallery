const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

describe('Meme Likes', () => {
  let token;
  let memeId;
  let userId;
  const username = `testuser_${Date.now()}`;
  const password = 'password123';

  beforeAll(async () => {
    // Clean DB (best-effort)
    await prisma.userLikesMeme.deleteMany();
    await prisma.meme.deleteMany();
    await prisma.user.deleteMany();

    // Register user
    await request(app)
      .post('/auth/register')
      .send({ username, password })
      .expect((res) => {
        if (res.statusCode !== 201 && res.statusCode !== 409) {
          throw new Error(`Unexpected status: ${res.statusCode}`);
        }
      });

    // Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username, password })
      .expect(200);
    token = loginRes.body.token;
    userId = jwt.verify(token, JWT_SECRET).userId;

    // Create a meme
    const memeRes = await request(app)
      .post('/memes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Funny meme', url: 'https://example.com/meme.jpg' })
      .expect(201);
    memeId = memeRes.body.id;
  });

  beforeEach(async () => {
    // Ensure a clean like state before each test
    await prisma.userLikesMeme.deleteMany({ where: { userId, memeId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should like a meme', async () => {
    const res = await request(app)
      .post(`/memes/${memeId}/like`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Meme liked');
  });

  it('should unlike a meme if already liked', async () => {
    // First like
    await request(app)
      .post(`/memes/${memeId}/like`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Then unlike
    const res = await request(app)
      .post(`/memes/${memeId}/like`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Meme unliked');
  });
});
