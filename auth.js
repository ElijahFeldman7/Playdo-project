const express = require('express');
const router = express.Router();
const User = require('../models/User');
const twilio = require('twilio');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
let verificationCode;

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/'
}), (req, res) => {
    // Successful authentication
    res.redirect('/'); // Redirect to the home page or dashboard
});

// Registration route
router.post('/register', async (req, res) => {
    const { username, email, password, phone } = req.body;
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await twilioClient.messages.create({
        body: `Your verification code is: ${verificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
    });

    req.session.userData = { username, email, password, phone };
    res.json({ success: true, message: "Verification code sent to your phone." });
});

// Verification route
router.post('/verify', async (req, res) => {
    const { code } = req.body;

    if (code === verificationCode) {
        const { username, email, password, phone } = req.session.userData;
        const newUser = new User({ username, email, password, phone });
        
        await newUser.save();
        req.session = null;  // Clear session
        return res.json({ success: true, message: "User registered successfully!" });
    } else {
        return res.json({ success: false, message: "Invalid verification code." });
    }
});

module.exports = router;
