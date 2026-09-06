import { User, sendEmailVerification } from 'firebase/auth';

/**
 * Dispatches verification email.
 * First tries the custom branded HTML email API route.
 * Falls back to native Firebase client email verification if custom route is unconfigured or fails.
 */
export async function dispatchVerificationEmail(
  user: User,
  name?: string
): Promise<{ success: boolean; method: 'custom_html' | 'firebase_default' }> {
  try {
    const res = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        name: name || user.displayName || '',
      }),
    });

    const data = await res.json();
    if (data.success) {
      return { success: true, method: 'custom_html' };
    }
  } catch (e) {
    console.warn('[dispatchVerificationEmail] Custom email dispatch error, falling back:', e);
  }

  // Graceful fallback to Firebase default sender
  await sendEmailVerification(user);
  return { success: true, method: 'firebase_default' };
}
