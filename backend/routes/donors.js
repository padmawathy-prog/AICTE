const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const auth    = require('../middleware/auth');

// ── GET ALL DONORS ──
router.get('/all', async (req, res) => {
  try {
    const donors = await User.find({ isAvailable: true }).select('-password');
    res.json(donors);
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
});

// ── SEARCH DONORS by bloodGroup + city (protected) ──
router.get('/search', auth, async (req, res) => {
  try {
    const { bloodGroup, city } = req.query;

    const query = { isAvailable: true };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city)       query.city = new RegExp(city, 'i');

    const donors = await User.find(query).select('-password');
    res.json(donors);
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
});

// ── PATCH: Toggle isAvailable for logged-in user ──
router.patch('/availability', auth, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isAvailable },
      { new: true }
    ).select('-password');
    res.json({ msg: 'Availability updated.', isAvailable: user.isAvailable });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
});

module.exports = router;