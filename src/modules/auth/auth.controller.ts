import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
  BadRequestException,
  Session,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard as CustomAuthGuard } from './auth.guard';
import { isOriginAllowed } from 'src/config/cors.config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // -------- EMAIL REGISTER ----------
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: any
  ) {
    const result = await this.authService.register(dto, req.sessionID);

    // Save to session
    req.session.user = result.user

    return result;
  }

  // -------- EMAIL LOGIN -------------
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: any
  ) {
    const result = await this.authService.loginWithEmail(dto, req.sessionID);
    // Save to session
    req.session.user = result.user

    return result;
  }

  // -------- GOOGLE LOGIN (POPUP) -------------
  @Get('google')
  googleLogin(@Query('origin') origin: string, @Res() res: any) {
    console.log('🔵 Step 1: Received origin from FE:', origin);

    if (!origin || !isOriginAllowed(origin)) {
      throw new BadRequestException('Invalid or missing origin parameter');
    }

    const state = Buffer.from(JSON.stringify({ origin })).toString('base64');
    console.log('🔵 Step 2: Encoded state:', state);

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
    googleAuthUrl.searchParams.set('redirect_uri', process.env.GOOGLE_CALLBACK_URL || '');
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'email profile');
    googleAuthUrl.searchParams.set('state', state);
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');

    console.log('🔵 Step 3: Redirecting to Google:', googleAuthUrl.toString());

    return res.redirect(googleAuthUrl.toString());
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    try {
      console.log('🟢 Step 4: Google callback received');
      console.log('🟢 Step 5: req.user:', req.user);

      const { profile, state } = req.user;

      if (!profile) {
        throw new BadRequestException('Missing profile from Google');
      }

      if (!state?.origin) {
        throw new BadRequestException('Missing origin in state');
      }

      console.log('🟢 Step 6: Valid origin:', state.origin);
      console.log('🟢 Step 7: Profile email:', profile.emails?.[0]?.value);

      const result = await this.authService.loginWithGoogle(profile);

      // Save to session
      req.session.user = result.user

      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('🟢 Step 8: Session saved:', req.session);

      const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Login Success</title>
  </head>
  <body>
    <script>
        const targetOrigin = "${state.origin}";
        const payload = {
          type: "google-auth-success",
          user: ${JSON.stringify(result.user)},
          sessionId: "${req.sessionID}"
        };

        console.log("🚀 Sending postMessage to:", targetOrigin);
        console.log("📦 Payload:", payload);

        if (window.opener) {
          window.opener.postMessage(payload, targetOrigin);
          setTimeout(() => window.close(), 500);
        } else {
          document.body.innerHTML = "<h2>✅ Login successful!</h2><p>You may close this window.</p>";
        }
    </script>
  </body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('❌ Callback error:', error);

      const errorHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Login Failed</title>
  </head>
  <body>
    <h2>❌ Authentication failed</h2>
    <p>${error.message}</p>
    <button onclick="window.close()">Close</button>
  </body>
</html>`;

      res.status(400).setHeader('Content-Type', 'text/html').send(errorHtml);
    }
  }

  // -------- GET PROFILE -------------
  @Get('me')
  @UseGuards(CustomAuthGuard)
  getProfile(@Req() req) {
    return {
      user: req.user,
      sessionId: req.sessionID,
    };
  }

  // -------- LOGOUT -------------
  @Post('logout')
  @UseGuards(CustomAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req, @Res() res) {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Logout failed',
        });
      }

      res.clearCookie('connect.sid');
      return res.json({
        success: true,
        message: 'Đăng xuất thành công!',
      });
    });
  }
}