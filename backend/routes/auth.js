const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

// ── SIGNUP ──
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, blood, city, area } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed,
      bloodGroup: blood,
      city,
      area,
      location: `${city}${area ? ', ' + area : ''}`,
      isAvailable: true
    });

    await user.save();
    res.json({ msg: 'Signup successful. Please login.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error. Try again.' });
  }
});

// ── LOGIN ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid email or password.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id:          user._id,
        name:        user.name,
        email:       user.email,
        bloodGroup:  user.bloodGroup,
        location:    user.location,
        city:        user.city,
        isAvailable: user.isAvailable
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error. Try again.' });
  }
});

module.exports = router;