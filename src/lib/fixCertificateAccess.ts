/**
 * Utility to manually fix certificate access for users who completed the course
 * but have sync issues with their enrollment status
 */

import { blink } from './blink';

export interface CertificateFixResult {
  userId: string;
  email: string;
  displayName: string;
  enrollmentId: string;
  previousStatus: string;
  newStatus: string;
  completedModules: string[];
  fixed: boolean;
  error?: string;
}

/**
 * Fix certificate access for a specific user by email
 */
export async function fixUserCertificateAccess(email: string): Promise<CertificateFixResult> {
  try {
    // 1. Find user by email (case-insensitive search by fetching all users and filtering)
    const normalizedEmail = email.trim().toLowerCase();
    const allUsers = await blink.db.users.list({
      limit: 1000 // Get all users to search case-insensitively
    });

    const users = allUsers.filter((u: any) => 
      u.email && u.email.toLowerCase() === normalizedEmail
    );

    if (!users || users.length === 0) {
      throw new Error(`User not found with email: ${email}`);
    }

    const user = users[0];

    // 2. Find their enrollment(s)
    const enrollments = await blink.db.courseEnrollments.list({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      limit: 1
    });

    if (!enrollments || enrollments.length === 0) {
      throw new Error(`No enrollment found for user: ${email}`);
    }

    const enrollment = enrollments[0];
    const previousStatus = enrollment.status || 'unknown';

    // 3. Parse completed modules
    let completedModules: string[] = [];
    try {
      const raw = JSON.parse(enrollment.completedModules || '[]');
      completedModules = Array.isArray(raw) ? raw : [];
    } catch {
      completedModules = [];
    }

    // 4. Check course progress records for reconciliation
    try {
      const allModules = await blink.db.courseModules.list({
        orderBy: { moduleNumber: 'asc' }
      });

      const moduleIdToNumber: Record<string, string> = {};
      allModules.forEach((m: any) => {
        moduleIdToNumber[m.id] = String(m.moduleNumber);
      });

      const progress = await blink.db.courseProgress.list({
        where: { userId: user.id, enrollmentId: enrollment.id }
      });

      const fromProgress = new Set<string>();
      for (const p of progress) {
        if (p.completedAt) {
          const modNum = moduleIdToNumber[p.moduleId];
          if (modNum) fromProgress.add(String(modNum));
        }
      }

      if (fromProgress.size > 0) {
        completedModules = Array.from(fromProgress).sort((a, b) => parseInt(a) - parseInt(b));
      }
    } catch (err) {
      console.warn('Failed to reconcile from progress records', err);
    }

    // 5. Update enrollment to completed status
    await blink.db.courseEnrollments.update(enrollment.id, {
      status: 'completed',
      completedModules: JSON.stringify(completedModules),
      certificateIssuedAt: enrollment.certificateIssuedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName || 'Unknown',
      enrollmentId: enrollment.id,
      previousStatus,
      newStatus: 'completed',
      completedModules,
      fixed: true
    };
  } catch (error: any) {
    return {
      userId: '',
      email,
      displayName: '',
      enrollmentId: '',
      previousStatus: '',
      newStatus: '',
      completedModules: [],
      fixed: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Fix certificate access for all users who have 6+ modules completed
 * but are not marked as completed
 */
export async function fixAllPendingCertificates(): Promise<CertificateFixResult[]> {
  const results: CertificateFixResult[] = [];

  try {
    // Get all enrollments
    const enrollments = await blink.db.courseEnrollments.list({
      limit: 1000
    });

    for (const enrollment of enrollments) {
      // Skip already completed
      if (enrollment.status === 'completed' && enrollment.certificateIssuedAt) {
        continue;
      }

      // Parse completed modules
      let completedModules: string[] = [];
      try {
        const raw = JSON.parse(enrollment.completedModules || '[]');
        completedModules = Array.isArray(raw) ? raw : [];
      } catch {
        completedModules = [];
      }

      // Check if they have 6+ modules completed
      if (completedModules.length >= 6) {
        // Get user info
        const users = await blink.db.users.list({
          where: { id: enrollment.userId },
          limit: 1
        });

        if (users && users.length > 0) {
          const user = users[0];
          const previousStatus = enrollment.status || 'unknown';

          // Update to completed
          await blink.db.courseEnrollments.update(enrollment.id, {
            status: 'completed',
            certificateIssuedAt: enrollment.certificateIssuedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          results.push({
            userId: user.id,
            email: user.email,
            displayName: user.displayName || 'Unknown',
            enrollmentId: enrollment.id,
            previousStatus,
            newStatus: 'completed',
            completedModules,
            fixed: true
          });
        }
      }
    }
  } catch (error: any) {
    console.error('Error fixing pending certificates:', error);
  }

  return results;
}
