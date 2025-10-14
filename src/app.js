const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { PrismaClient, Role } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = user; // { userId, role, iat, exp }
    next();
  });
}

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const memeSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  url: Joi.string().uri().required(),
});

const likeSchema = Joi.object({
  userId: Joi.number().required(),
});

// Routes
app.post('/auth/register', async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const { username, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(409).json({ error: 'Username already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, passwordHash, role: Role.USER } });
    return res.status(201).json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, username: true, role: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/memes', authenticateToken, async (req, res) => {
  const { error } = memeSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const { title, url } = req.body;
  try {
    const meme = await prisma.meme.create({ data: { title, url, userId: req.user.userId } });
    return res.status(201).json(meme);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/memes/:id/like', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  // Optional validation using Joi
  const { error } = likeSchema.validate({ userId });
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const memeId = parseInt(id, 10);
    if (Number.isNaN(memeId)) return res.status(400).json({ error: 'Invalid meme id' });

    // Optionally ensure meme exists
    const meme = await prisma.meme.findUnique({ where: { id: memeId } });
    if (!meme) return res.status(404).json({ error: 'Meme not found' });

    const existing = await prisma.userLikesMeme.findUnique({
      where: { userId_memeId: { userId, memeId } },
    });

    if (existing) {
      await prisma.userLikesMeme.delete({ where: { id: existing.id } });
      return res.json({ message: 'Meme unliked' });
    } else {
      await prisma.userLikesMeme.create({ data: { userId, memeId } });
      return res.json({ message: 'Meme liked' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = app;
