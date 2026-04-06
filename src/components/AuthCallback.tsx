import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        return; // No authenticated user, do nothing
      }

      const email = session.user.email.trim().toLowerCase();

      const { data: waitlistEntry } = await supabase
        .from('waitlist')
        .select('wants_tester_access')
        .eq('email', email)
        .maybeSingle();

      if (waitlistEntry?.wants_tester_access) {
        window.location.href = 'https://tester-access-page.vercel.app';
      } else {
        navigate('/waitlist');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return null; // This component renders nothing
}
