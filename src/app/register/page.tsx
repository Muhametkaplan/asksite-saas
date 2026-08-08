'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?redirect=checkout');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-xs font-bold text-gray-500">
      Kayıt sayfasına yönlendiriliyorsunuz...
    </div>
  );
}
