const express        = require('express');
const router         = express.Router();
const PostedRequest  = require('../models/EmergencyRequest');
const IncomingRequest = require('../models/IncomingRequest');
const User           = require('../models/User');
const auth           = require('../middleware/auth');
const nodemailer     = require('nodemailer');

// ── Email transporter ──
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendRequestEmailToDonor(request, donorEmail, donorName) {
  if (!donorEmail) return;
  try {
    await transporter.sendMail({
      from:    `"Health Tech Connect" <${process.env.EMAIL_USER}>`,
      to:      donorEmail,
      subject: `🩸 Someone needs your blood – ${request.bloodRequired} at ${request.hospital}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;
          border:1px solid #eee;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,#e53935,#ff1744);
            padding:1.5rem;text-align:center;">
            <h2 style="color:#fff;margin:0;">🩸 Blood Request Alert</h2>
          </div>
          <div style="padding:1.5rem;">
            <p>Hi <strong>${donorName}</strong>,</p>
            <p>Someone has requested your blood type. Log in to accept or reject.</p>
            <table style="width:100%;border-collapse:collapse;margin-top:1rem;">
              <tr style="background:#fff5f5;">
                <td style="padding:8px;font-weight:700;color:#888;width:40%;">Patient</td>
                <td style="padding:8px;">${request.patientName}</td>
              </tr>
              <tr>
                <td style="padding:8px;font-weight:700;color:#888;">Blood Group</td>
                <td style="padding:8px;color:#e53935;font-weight:800;">${request.bloodRequired}</td>
              </tr>
              <tr style="background:#fff5f5;">
                <td style="padding:8px;font-weight:700;color:#888;">Hospital</td>
                <td style="padding:8px;">${request.hospital}</td>
              </tr>
              <tr>
                <td style="padding:8px;font-weight:700;color:#888;">Location</td>
                <td style="padding:8px;">${request.location}</td>
              </tr>
              <tr style="background:#fff5f5;">
                <td style="padding:8px;font-weight:700;color:#888;">Urgency</td>
                <td style="padding:8px;">${request.urgency}</td>
              </tr>
              <tr>
                <td style="padding:8px;font-weight:700;color:#888;">Contact</td>
                <td style="padding:8px;">${request.contact}</td>
              </tr>
            </table>
            <p style="margin-top:1.5rem;color:#888;font-size:0.88rem;">
              Log in to Health Tech Connect → Request page to respond.
            </p>
          </div>
        </div>
      `
    });
    console.log(`✅ Email sent to ${donorEmail}`);
  } catch (err) {
    console.error('❌ Email error:', err.message);
  }
}

// ── POST: Create a new blood request ──
// Saves to BOTH postedrequests AND incomingrequests
router.post('/', auth, async (req, res) => {
  try {
    const {
      patientName, bloodRequired, hospital, location,
      urgency, contact, notes,
      targetDonorId, targetDonorEmail
    } = req.body;

    // Get requester email from database
    const requester = await User.findById(req.user.id).select('email');
    const requesterEmail = requester?.email || '';

    const posted = new PostedRequest({
      patientName,
      bloodRequired,
      hospital,
      location,
      urgency,
      contact,
      notes,
      requestedBy:    req.user.id,
      requesterEmail: requesterEmail,
      targetDonor:    targetDonorId || null,
      donorEmail:     targetDonorEmail || '',
      status:         'pending'
    });
    await posted.save();

    if (targetDonorId) {
      const incoming = new IncomingRequest({
        postedRequest:  posted._id,
        targetDonor:    targetDonorId,
        donorEmail:     targetDonorEmail || '',
        patientName,
        bloodRequired,
        hospital,
        location,
        urgency,
        contact,
        notes,
        requestedBy:    req.user.id,
        requesterEmail: requesterEmail,
        status:         'pending'
      });
      await incoming.save();

      // 3. Send email to the specific donor
      if (targetDonorEmail) {
        const donor = await User.findById(targetDonorId).select('name');
        sendRequestEmailToDonor(posted, targetDonorEmail, donor?.name || 'Donor');
      }
    }

    res.json({ msg: 'Blood request sent successfully!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error. Try again.' });
  }
});

// ── GET: Incoming requests for logged-in donor ──
// Reads from incomingrequests collection
router.get('/incoming', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    if (!user.isAvailable) return res.json([]);

    const requests = await IncomingRequest.find({
      targetDonor: req.user.id,
      status:      { $in: ['pending', 'accepted'] }
    })
    .sort({ createdAt: -1 })
    .populate('requestedBy', 'name email');

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

// ── GET: Requests the logged-in user posted ──
// Reads from postedrequests collection
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await PostedRequest.find({ requestedBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
});

// ── GET: Donations the logged-in user completed ──
// Reads from incomingrequests where they accepted and marked donated
router.get('/my-donations', auth, async (req, res) => {
  try {
    const donations = await IncomingRequest.find({
      acceptedBy: req.user.id,
      status:     'donated'
    })
    .sort({ updatedAt: -1 })
    .populate('requestedBy', 'name');
    res.json(donations);
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
});

// ── PATCH: Update status (accept / reject / donated) ──
// Updates BOTH collections to keep them in sync
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    // Update in incomingrequests
    const incoming = await IncomingRequest.findById(req.params.id);

    if (!incoming) return res.status(404).json({ msg: 'Request not found.' });

    if (status === 'accepted') {
      incoming.status     = 'accepted';
      incoming.acceptedBy = req.user.id;
    } else if (status === 'donated') {
      if (String(incoming.acceptedBy) !== String(req.user.id))
        return res.status(403).json({ msg: 'Only the accepting donor can mark as donated.' });
      incoming.status = 'donated';
    } else if (status === 'rejected') {
      incoming.status = 'rejected';
    } else {
      return res.status(400).json({ msg: 'Invalid status.' });
    }

    await incoming.save();

    // Also sync status to postedrequests
    const postedStatus = incoming.status === 'donated' ? 'blood_received' : incoming.status;
    await PostedRequest.findByIdAndUpdate(
      incoming.postedRequest,
      { status: postedStatus, acceptedBy: incoming.acceptedBy || null }
    );

    res.json({ msg: `Request marked as ${status}.` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

module.exports = router;