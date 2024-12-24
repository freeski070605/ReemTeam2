const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();


// Register route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
// Logging the request body for debugging
console.log('Request Body:', req.body);
console.log('Type of username:', typeof username);
console.log('Type of email:', typeof email);
console.log('Type of password:', typeof password);

  // Validate the input
  if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid input data' });
}

try {
    // Check if user already exists
    let user = await User.findOne({ username: username.trim() });
    if (user) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // Create new user and save to database
    user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Error registering user', error });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please provide username and password' });
  }

  try {
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Compare passwords
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Set session userId
    req.session.userId = user._id;
    console.log('User logged in:', user._id);
    res.status(200).json({ success: true, message: 'Logged in successfully' });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, message: 'Error logging in', error });
  }
});

// Profile route
router.get('/profile', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }

    // Fetch user profile data excluding password
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return user profile data
    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        chips: user.chips, // Example additional fields
        isAdmin: user.isAdmin,
        // Add more fields as needed
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile', error });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).json({ success: false, message: 'Error logging out', error: err });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
    console.log('User logged out');

    
  });
});

/// Update chips route
router.put('/:username/updateChips', async (req, res) => {
  const { username } = req.params;
  const { chips } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.chips = chips; // Add or subtract chips based on the input
    await user.save();

    res.status(200).json({ success: true, message: 'Chips updated successfully', chips: user.chips });
  } catch (error) {
    console.error('Error updating chips:', error);
    res.status(500).json({ success: false, message: 'Error updating chips', error });
  }
});

// Route to get user data by username
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username: username.trim() }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});





module.exports = router;
