import { CheckCircle } from 'lucide-react';

export default function MigratePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold">Migration Complete</h1>
        <p className="text-muted-foreground">All data has been migrated to Supabase. This page is no longer needed.</p>
      </div>
    </div>
  );
}
