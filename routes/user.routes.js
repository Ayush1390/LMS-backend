import {Router} from 'express';
import {register,login,logout,profile, resetPassword, forgotPassword, changePassword, updateUser} from '../controllers/user.controller.js';
import { isLoggedIn } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';
const router = Router();

router.post('/login',login);
router.post('/register',upload.single("avatar"),register);
router.get('/logout',isLoggedIn,logout);
router.get('/profile',isLoggedIn,profile);
router.post('/reset', forgotPassword);
router.post('/reset/:resetToken', resetPassword);
router.post('/change-password',isLoggedIn,changePassword);
router.put('/update/:id',isLoggedIn,upload.single("avatar"),updateUser); 


export default router;