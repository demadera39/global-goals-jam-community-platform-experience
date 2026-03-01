import React, { useState } from 'react';
import { blink } from '@/lib/blink';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';

const TABLES_TO_MIGRATE = [
  'users',
  'events',
  'event_registrations',
  'media',
  'certificates',
  'forum_categories',
  'forum_threads',
  'forum_posts',
  'toolkits',
  'user_achievements',
  'host_applications',
  'host_invites',
  'course_registrations',
  'course_enrollments',
  'course_modules',
  'course_progress',
  'email_schedule',
  'donations',
  'stripe_events',
  'password_resets',
  'password_reset_tokens',
  'magic_link_tokens',
  'email_verification_tokens',
  'jam_highlights'
];

export default function MigratePage() {
  const [status, setStatus] = useState<Record<string, { state: 'pending' | 'migrating' | 'success' | 'error'; count: number; error?: string }>>(
    Object.fromEntries(TABLES_TO_MIGRATE.map(t => [t, { state: 'pending', count: 0 }]))
  );
  const [isMigratingAll, setIsMigratingAll] = useState(false);

  const migrateTable = async (tableName: string) => {
    setStatus(prev => ({ ...prev, [tableName]: { ...prev[tableName], state: 'migrating' } }));
    
    try {
      // 1. Fetch from Blink
      const records = await blink.database.list(tableName, { limit: 1000 });
      
      if (records.length === 0) {
        setStatus(prev => ({ ...prev, [tableName]: { state: 'success', count: 0 } }));
        return;
      }

      // 2. Clear existing in Supabase (optional, but good for idempotent migration)
      // await supabase.from(tableName).delete().neq('id', 'placeholder');

      // 3. Insert into Supabase
      // We use upsert to handle existing records
      const { error } = await supabase.from(tableName).upsert(records, { onConflict: 'id' });

      if (error) throw error;

      setStatus(prev => ({ ...prev, [tableName]: { state: 'success', count: records.length } }));
    } catch (err: any) {
      console.error(`Migration failed for ${tableName}:`, err);
      setStatus(prev => ({ ...prev, [tableName]: { state: 'error', count: 0, error: err.message } }));
      toast.error(`Failed to migrate ${tableName}`);
    }
  };

  const migrateAll = async () => {
    setIsMigratingAll(true);
    toast.loading('Migrating all tables...', { id: 'migrate-all' });
    
    for (const table of TABLES_TO_MIGRATE) {
      await migrateTable(table);
    }
    
    setIsMigratingAll(false);
    toast.success('Migration completed!', { id: 'migrate-all' });
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Database Migration</h1>
            <p className="text-muted-foreground mt-2">Migrate all data from Blink (Turso) to Supabase (PostgreSQL).</p>
          </div>
          <Button 
            onClick={migrateAll} 
            disabled={isMigratingAll}
            className="bg-primary hover:bg-primary/90"
          >
            {isMigratingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            Migrate All Data
          </Button>
        </div>

        <div className="grid gap-4">
          {TABLES_TO_MIGRATE.map(table => (
            <Card key={table} className="overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium">{table}</span>
                  {status[table].state === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {status[table].state === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {status[table].state === 'migrating' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                <div className="flex items-center gap-4">
                  {status[table].count > 0 && (
                    <span className="text-sm font-medium">{status[table].count} records</span>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => migrateTable(table)}
                    disabled={status[table].state === 'migrating' || isMigratingAll}
                  >
                    Migrate
                  </Button>
                </div>
              </div>
              {status[table].error && (
                <CardContent className="p-4 bg-red-50 text-red-600 text-sm">
                  {status[table].error}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
