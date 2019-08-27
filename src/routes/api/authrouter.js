import { Router } from 'express';
import passport from '../../config/passport';
import { socialAuthController } from '../../controllers';
import { facebookApiMock, googleApiMock } from '../../middlewares';

const authRouter = Router();

authRouter.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));
authRouter.get('/facebook/callback',
  passport.authenticate('facebook'),
  socialAuthController.facebookAuth);

authRouter.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
authRouter.get('/google/callback',
  passport.authenticate('google'),
  socialAuthController.googleAuth);

authRouter.post('/mockFacebook', facebookApiMock, socialAuthController.facebookAuth);
authRouter.post('/mockGoogle', googleApiMock, socialAuthController.googleAuth);

export default authRouter;