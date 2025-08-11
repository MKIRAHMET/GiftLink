const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pino = require('pino');
const connectToDatabase = require('../models/db');

dotenv.config();
const logger = pino();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Register Route
router.post('/register', async (req, res) => {
    try {
        // 1. Connect to DB
        const db = await connectToDatabase();
        if (!db) {
            logger.error('Database connection failed');
            return res.status(500).send('Database connection error');
        }

        // 2. Access collection
        const usersCollection = db.collection('users');
        if (!usersCollection) {
            logger.error('Users collection not found');
            return res.status(500).send('Users collection not found');
        }

        // 3. Check for existing user
        const existingUser = await usersCollection.findOne({ email: req.body.email });
        if (existingUser) {
            logger.warn('User with this email already exists');
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // 4. Hash password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(req.body.password, salt);

        // 5. Create new user object
        const newUser = {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hashedPassword,
            createdAt: new Date(),
        };

        // 6. Insert into DB
        const insertResult = await usersCollection.insertOne(newUser);
        if (!insertResult.acknowledged) {
            logger.error('User registration failed');
            return res.status(500).send('User registration failed');
        }

        // 7. Create JWT
        const payload = {
            user: {
                id: insertResult.insertedId,
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        logger.info('User registered successfully');
        res.json({ authtoken, email: newUser.email });

    } catch (error) {
        logger.error(error.message);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
