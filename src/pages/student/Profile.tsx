import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function StudentProfile() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/student" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your account information</p>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Profile settings coming soon</p>
        </div>
      </main>
    </div>
  );
}