import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const userService = new UserService();

const createOrGetUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

const getUserIdSchema = z.object({
  email: z.string().email(),
});

export const getOrCreateUser = async (req: Request, res: Response) => {
  try {
    const data = createOrGetUserSchema.parse(req.body);
    const user = await userService.getOrCreateUser(data.email, data.name);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error in getOrCreateUser:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!userService.isValidUserId(id)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    const user = await userService.getUser(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserIdFromEmail = async (req: Request, res: Response) => {
  try {
    const data = getUserIdSchema.parse(req.body);
    const userId = userService.getUserIdFromEmail(data.email);
    res.json({ userId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error in getUserIdFromEmail:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const loginSchema = z.object({
  email: z.string().email(),
});

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const userId = userService.getUserIdFromEmail(data.email);

    // Check if user exists
    const user = await userService.getUser(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found. Please check your email or create an account.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error in login:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const signupSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

const passwordLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const signup = async (req: Request, res: Response) => {
  try {
    const data = signupSchema.parse(req.body);

    // Hash the password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user with username and password
    const user = await userService.createUserWithPassword(
      data.username.toLowerCase().trim(),
      passwordHash
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Username already exists' });
    } else {
      console.error('Error in signup:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const passwordLogin = async (req: Request, res: Response) => {
  try {
    const data = passwordLoginSchema.parse(req.body);

    // Get user by username
    const user = await userService.getUserByUsername(data.username.toLowerCase().trim());

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      console.error('Error in passwordLogin:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
