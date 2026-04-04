// app/page.tsx
// Root page — wraps Map with AuthGuard.
// Unauthenticated users are redirected to /welcome.
// Authenticated users see the full map as before.

import AuthGuard from "./_components/AuthGuard";
import Map from "./_components/Map";

export default function Home() {
  return (
    <AuthGuard>
      <div className="h-full">
        <Map />
      </div>
    </AuthGuard>
  );
}
