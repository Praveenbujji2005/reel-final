import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/googleCalendarService';
import { escapeHtml } from '@/lib/sanitize';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    const safeError = escapeHtml(error);
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Connection Failed</title>
          <style>
            body { background: #0c0a0c; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #161216; border: 1px solid rgba(239, 68, 68, 0.4); padding: 32px; border-radius: 20px; max-width: 440px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
            h2 { color: #f87171; margin-top: 0; }
            p { color: #aaa; font-size: 14px; line-height: 1.6; }
            .btn { display: inline-block; background: #333; color: #fff; padding: 10px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Connection Cancelled</h2>
            <p>Google authorization was not completed: ${safeError}</p>
            <a href="/admin/inquiries" class="btn" onclick="window.close();">Close Window</a>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_CALENDAR_ERROR', error: ${JSON.stringify(error)} }, window.location.origin);
              setTimeout(() => window.close(), 2500);
            }
          </script>
        </body>
      </html>
    `;
    return new NextResponse(errorHtml, { headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
  }

  try {
    const { origin } = url;
    const result = await exchangeCodeForTokens(code, origin);
    const safeEmail = escapeHtml(result.email || 'Google Account');

    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Connected</title>
          <style>
            body { background: #0c0a0c; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #161216; border: 1px solid rgba(66, 133, 244, 0.4); padding: 36px; border-radius: 24px; max-width: 440px; text-align: center; box-shadow: 0 20px 60px rgba(66, 133, 244, 0.2); }
            .icon { width: 56px; height: 56px; border-radius: 16px; background: rgba(66, 133, 244, 0.15); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
            h2 { color: #fff; margin: 0 0 8px; font-size: 20px; }
            p { color: #aaa; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }
            .email-badge { display: inline-block; background: rgba(66, 133, 244, 0.2); border: 1px solid rgba(66, 133, 244, 0.4); color: #8ab4f8; font-weight: 600; padding: 6px 14px; border-radius: 9999px; font-size: 13px; margin-bottom: 20px; }
            .btn { display: inline-block; background: #4285F4; color: #fff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#4285F4">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
            </div>
            <h2>Google Calendar Connected!</h2>
            <p>Your Google account has been securely connected for reelXpress enquiry event syncing.</p>
            <div class="email-badge">${safeEmail}</div>
            <div>
              <a href="/admin/inquiries?calendar_connected=true" class="btn" onclick="if(window.opener){window.close();return false;}">Return to Dashboard</a>
            </div>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_CALENDAR_CONNECTED',
                success: true,
                email: ${JSON.stringify(result.email || '')}
              }, window.location.origin);
              setTimeout(() => {
                window.close();
              }, 1200);
            } else {
              setTimeout(() => {
                window.location.href = '/admin/inquiries?calendar_connected=true';
              }, 1500);
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(successHtml, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err) {
    const safeError = escapeHtml(err.message || 'Failed to authenticate with Google.');
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connection Error</title>
          <style>
            body { background: #0c0a0c; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; }
            .card { background: #161216; border: 1px solid rgba(239, 68, 68, 0.4); padding: 32px; border-radius: 20px; max-width: 440px; text-align: center; }
            h2 { color: #f87171; }
            p { color: #aaa; font-size: 14px; }
            .btn { display: inline-block; background: #333; color: #fff; padding: 10px 24px; border-radius: 9999px; text-decoration: none; margin-top: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Connection Error</h2>
            <p>${safeError}</p>
            <a href="/admin/inquiries" class="btn">Back to Inquiries</a>
          </div>
        </body>
      </html>
    `;
    return new NextResponse(errorHtml, { headers: { 'Content-Type': 'text/html' } });
  }
}
