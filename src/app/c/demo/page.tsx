'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CDemoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/demo');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-xs font-bold text-gray-500">
      Demo sayfasına yönlendiriliyorsunuz...
    </div>
  );
}
