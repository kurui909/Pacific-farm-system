// src/hooks/useGoogleAuth.js
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export const useGoogleAuth = (mode = 'login') => {
  const { loginWithGoogle } = useAuth();

  const googleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        await loginWithGoogle(tokenResponse.access_token, userInfo);
        toast.success(mode === 'login' ? 'Logged in with Google' : 'Account created with Google');
      } catch (error) {
        toast.error('Google authentication failed');
      }
    },
    onError: () => toast.error('Google login failed'),
  });

  return googleAuth;
};