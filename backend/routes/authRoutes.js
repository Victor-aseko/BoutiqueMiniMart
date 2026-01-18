const express = require('express');
const router = express.Router();
const {
    authUser,
    registerUser,
    getUserProfile,
    forgotPassword,
    resetPassword,
    updateUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password-page/:token', (req, res) => {
    const { token } = req.params;
    const appUrl = `boutiqueminimart://reset-password/${token}`;
    res.send(`
        <html>
            <head>
                <title>Reset Password - MiniBoutique</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #F9FAFB; margin: 0; padding: 20px; }
                    .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 100%; border: 1px solid #DFE6E9; }
                    .logo { font-size: 24px; font-weight: bold; color: #2D3436; margin-bottom: 20px; }
                    h1 { color: #2D3436; font-size: 20px; margin-bottom: 12px; }
                    p { color: #636E72; font-size: 15px; line-height: 1.6; margin-bottom: 30px; }
                    .btn { display: inline-block; background: #0984E3; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; transition: background 0.2s; }
                    .btn:hover { background: #0771C4; }
                    .footer { margin-top: 30px; font-size: 13px; color: #B2BEC3; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="logo">MiniBoutique</div>
                    <h1>Reset Your Password</h1>
                    <p>We're opening the MiniBoutique app so you can securely reset your password.</p>
                    <a href="${appUrl}" class="btn">Click here if app doesn't open</a>
                </div>
                <div class="footer">If you didn't request this, you can safely ignore this page.</div>
                <script>
                    // Try to open the app
                    window.location.replace("${appUrl}");
                    
                    // Fallback for some browsers if replace doesn't work
                    setTimeout(function() {
                        window.location.href = "${appUrl}";
                    }, 1000);
                </script>
            </body>
        </html>
    `);
});
router.post('/reset-password/:resetToken', resetPassword);
router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

module.exports = router;
