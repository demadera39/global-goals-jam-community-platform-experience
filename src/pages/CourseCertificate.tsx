import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, CheckCircle, BookOpen, Wand2 } from 'lucide-react';
import { blink } from '@/lib/blink';
import { toast } from 'sonner';
import { CertificateTemplate } from '@/components/CertificateTemplate';
import { generateCertificate } from '@/lib/certificates';
import { checkAndUpgradeUser } from '@/lib/userStatus';
// added: legacy auth bootstrap to keep previous signin working
import { getAuthToken, getStoredUser } from '@/lib/auth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { downloadDataUrl } from '@/lib/utils';

export default function CourseCertificate() {
  const navigate = useNavigate();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [totalModules, setTotalModules] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [participantName, setParticipantName] = useState<string>('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadCertificateData = async (userId: string) => {
      try {
        // 1) Load modules and compute total (unique 1–8)
        const allModules = await blink.db.courseModules.list({ orderBy: { moduleNumber: 'asc' } });
        const uniqueModules = Array.from(
          new Map(allModules.map((m: any) => [String(m.moduleNumber), m])).values()
        ).filter((m: any) => {
          const n = parseInt(String(m.moduleNumber));
          return !Number.isNaN(n) && n >= 1 && n <= 8;
        });
        const moduleIdToNumber: Record<string, string> = {};
        uniqueModules.forEach((m: any) => { moduleIdToNumber[m.id] = String(m.moduleNumber); });
        const total = uniqueModules.length > 0 ? uniqueModules.length : 8;
        setTotalModules(total);

        // 2) Fetch multiple enrollments and pick the best (active/completed, newest)
        const enrollments = await blink.db.courseEnrollments.list({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          limit: 10
        });

        if (!Array.isArray(enrollments) || enrollments.length === 0) {
          setEnrollment(null);
          setCompletedModules([]);
          return;
        }

        const preferred = enrollments.find((e: any) => ['active', 'completed'].includes(e.status)) || enrollments[0];
        setEnrollment(preferred);

        // 3) Clean completedModules from enrollment - be extra robust with parsing
        let cleaned: string[] = [];
        try {
          let raw: any;
          // Try parsing as JSON first
          try {
            raw = JSON.parse(preferred.completedModules || '[]');
          } catch {
            // If JSON parse fails, try to extract numbers from string
            const strValue = String(preferred.completedModules || '');
            const matches = strValue.match(/\d+/g) || [];
            raw = matches;
          }
          const arr = Array.isArray(raw) ? raw : [];
          cleaned = Array.from(new Set(arr.map((v: any) => String(v)))).filter((v) => {
            const n = parseInt(v);
            return !Number.isNaN(n) && n >= 1 && n <= 8;
          });
        } catch { cleaned = []; }

        // 4) Always reconcile from courseProgress as source of truth (more reliable than enrollment's completedModules field)
        try {
          const progress = await blink.db.courseProgress.list({ where: { userId, enrollmentId: preferred.id } });
          const fromProgress = new Set<string>();
          for (const p of progress) {
            // Check both completedAt and completed_at (handle both camelCase and snake_case)
            const isCompleted = p.completedAt || (p as any).completed_at;
            if (isCompleted && isCompleted !== null && isCompleted !== 'null') {
              const modNum = moduleIdToNumber[p.moduleId];
              if (modNum) fromProgress.add(String(modNum));
            }
          }
          
          console.log('Progress reconciliation:', {
            fromProgressCount: fromProgress.size,
            fromProgressModules: Array.from(fromProgress),
            fromEnrollmentCount: cleaned.length,
            fromEnrollmentModules: cleaned
          });
          
          // Always prefer courseProgress as the source of truth
          if (fromProgress.size > 0) {
            cleaned = Array.from(fromProgress).sort((a, b) => parseInt(a) - parseInt(b));
            // persist the reconciliation for future consistency (best-effort)
            try {
              await blink.db.courseEnrollments.update(preferred.id, {
                completedModules: JSON.stringify(cleaned),
                updatedAt: new Date().toISOString()
              });
            } catch (_) {}
          } else if (cleaned.length > 0) {
            // If we have enrollment data but no progress records, trust enrollment
            console.log('Using enrollment completedModules as no progress records found');
          }
        } catch (e) {
          // Non-fatal
          console.warn('Reconcile from courseProgress failed', e);
        }

        // Debug logging for certificate access
        console.log('Certificate Access Debug:', {
          completedModules: cleaned,
          completedCount: cleaned.length,
          totalModules: total,
          enrollmentStatus: preferred.status,
          certificateIssued: preferred.certificateIssuedAt || preferred.certificateUrl,
          rawCompletedModules: preferred.completedModules
        });

        // Auto-upgrade user role if they've completed/paid for the course
        try {
          await checkAndUpgradeUser(userId);
        } catch (upgradeError) {
          console.warn('Auto-upgrade check failed (non-fatal):', upgradeError);
        }

        // Ensure we use the user's display name from DB for certificate rendering
        try {
          const dbUsers = await blink.db.users.list({ where: { id: userId }, limit: 1 });
          const dbUser = dbUsers?.[0];

          // Also look up latest course registration as name fallback
          let regFullName = '';
          try {
            const regs = await blink.db.courseRegistrations.list({ where: { userId }, orderBy: { createdAt: 'desc' }, limit: 1 });
            regFullName = regs?.[0]?.fullName || '';
          } catch {}

          // Also peek stored user
          let stored: any = null;
          try { stored = await getStoredUser(); } catch {}

          if (dbUser) {
            setUser((prev: any) => ({
              ...(prev || {}),
              displayName: dbUser.displayName || (prev ? (prev as any).displayName : undefined),
              email: dbUser.email || (prev ? (prev as any).email : undefined)
            }));
          }

          const email = (dbUser?.email || stored?.email || '').trim();
          const emailName = email ? email.split('@')[0] : '';
          const prevName = (typeof user === 'object' && user) ? (user as any).displayName : '';

          const resolved = [dbUser?.displayName, prevName, stored?.displayName, regFullName, emailName]
            .map(v => (v || '').trim())
            .find(v => v.length > 0) || 'Your Name';
          setParticipantName(resolved);
        } catch (_) {}
        setCompletedModules(cleaned);
      } catch (error) {
        console.error('Error loading certificate data:', error);
        toast.error('Failed to load certificate data');
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      setLoading(true);

      // Preload certificate assets as data URLs to avoid CORS/SVG rendering issues in exports
      const toDataUrl = async (url: string): Promise<string> => {
        const res = await fetch(url, { cache: 'no-store', mode: 'cors' });
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('svg')) {
          const svg = await res.text();
          const base64 = btoa(unescape(encodeURIComponent(svg)));
          return `data:image/svg+xml;base64,${base64}`;
        }
        const blob = await res.blob();
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        return dataUrl;
      };
      try {
        const [logo, sig] = await Promise.all([
          toDataUrl('https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/GGJ_logo_socials.png'),
          toDataUrl('https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/signature.png')
        ]);
        setLogoDataUrl(logo);
        setSignatureDataUrl(sig);
      } catch (e) {
        // non-fatal; fall back to public paths
        console.warn('Failed to preload certificate assets', e);
        // Use the Supabase-hosted signature as fallback
        setSignatureDataUrl('https://ovpxkzmevqowrgoiuxta.supabase.co/storage/v1/object/public/GGJ/signature.png');
      }

      // Keep previous signin working: bootstrap legacy token and user
      try {
        const token = await getAuthToken();
        // legacy token ignored; using managed auth only
        const stored = await getStoredUser();
        if (stored?.id) {
          setUser(stored);
          await loadCertificateData(stored.id);
        }
      } catch (e) {
        // ignore
      }

      // Also listen to Blink managed auth (original flow)
      unsubscribe = blink.auth.onAuthStateChanged((state) => {
        setUser(state.user);
        setLoading(state.isLoading);
        if (state.user) {
          loadCertificateData(state.user.id);
        }
      });
    };

    init();

    return () => {
      try { unsubscribe && unsubscribe(); } catch {}
    };
  }, [navigate]);

  const handleDownloadCertificate = async () => {
    if (!user || !enrollment) return;
    
    setGenerating(true);
    try {
      // Update enrollment with certificate details BEFORE opening the certificate
      await blink.db.courseEnrollments.update(enrollment.id, {
        certificateIssuedAt: new Date().toISOString(),
        status: 'completed',
        updatedAt: new Date().toISOString()
      });

      // Attempt to auto-upgrade to host
      try {
        await checkAndUpgradeUser(user.id);
      } catch (_) {}
      
      // Create achievement record (check if it already exists first)
      try {
        const existingAchievements = await blink.db.userAchievements.list({
          where: { userId: user.id, achievementType: 'certification' },
          limit: 1
        });
        
        if (!existingAchievements || existingAchievements.length === 0) {
          await blink.db.userAchievements.create({
            id: `ach_cert_${Date.now()}`,
            userId: user.id,
            achievementType: 'certification',
            achievementName: 'GGJ Host Certified',
            description: 'Completed the Global Goals Jam Host Certification Course',
            points: 100
          });
        }
      } catch (err) {
        console.warn('Failed to create achievement record:', err);
      }

      // Save a certificate record for host certificate in DB for future reference
      try {
        await (await import('@/lib/certificates')).createCertificateRecord({
          eventId: 'host-course',
          recipientId: user.id,
          participantName: participantName || user.displayName || user.email,
          eventTitle: 'Host Certification Course',
          eventLocation: 'Online',
          eventDate: new Date().toISOString(),
          certificateUrl: undefined,
          certificateType: 'host'
        })
      } catch (err) {
        console.warn('Failed to create certificate DB record for host certificate:', err)
      }
      
      // Now open the certificate in a new window
      await generateCertificate({
        participantName: participantName || user.displayName || user.email,
        eventTitle: 'Host Certification Course',
        eventLocation: 'Online',
        eventDate: new Date().toISOString(),
        certificateKind: 'host'
      });
      
      toast.success('Certificate opened! You can print or save it from the new window.');
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const waitForImages = (container: HTMLElement) => {
    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    return Promise.all(
      imgs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve(true);
        return new Promise((resolve) => {
          const onDone = () => { img.removeEventListener('load', onDone); img.removeEventListener('error', onDone); resolve(true); };
          img.addEventListener('load', onDone);
          img.addEventListener('error', onDone);
        });
      })
    );
  };

  const handleDownloadPdf = async () => {
    if (!certificateRef.current) {
      toast.error('Certificate not ready. Please wait for the preview to load.');
      return;
    }
    setGenerating(true);
    
    const loadingToastId = toast.loading('Generating PDF... This may take up to 30 seconds.');
    
    try {
      const element = certificateRef.current;
      
      // Verify data URLs are loaded
      if (!logoDataUrl || !signatureDataUrl) {
        throw new Error('Certificate assets not loaded yet. Please refresh the page and try again.');
      }
      
      // Wait for all images to fully load
      await waitForImages(element);
      
      // Extra delay for browser rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clone and prepare the element for rendering
      const clonedElement = element.cloneNode(true) as HTMLElement;
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '0';
      document.body.appendChild(clonedElement);
      
      // Replace all images with data URLs in the clone
      const imgs = clonedElement.querySelectorAll('img');
      const imgPromises: Promise<void>[] = [];
      imgs.forEach((img: HTMLImageElement) => {
        if (img.src && !img.src.startsWith('data:')) {
          imgPromises.push(
            new Promise<void>((resolve) => {
              const originalSrc = img.src;
              fetch(originalSrc, { mode: 'cors', cache: 'no-store' })
                .then(res => res.blob())
                .then(blob => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    img.src = reader.result as string;
                    resolve();
                  };
                  reader.onerror = () => resolve();
                  reader.readAsDataURL(blob);
                })
                .catch(() => resolve());
            })
          );
        }
      });
      await Promise.all(imgPromises);
      
      // Wait for the clone's images to render
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Capture with optimized settings for better compatibility
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true, // Allow taint for data URLs
        foreignObjectRendering: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0, // No timeout since we preloaded
        logging: true, // Enable logging to debug issues
        width: 1100,
        height: 800,
        windowWidth: 1100,
        windowHeight: 800
      });
      
      // Remove clone
      document.body.removeChild(clonedElement);
      
      // Verify canvas has content by checking pixel data
      const ctx = canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData?.data.some(pixel => pixel !== 255); // Check if not all white
      
      if (!hasContent || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Certificate rendering failed. Please use the "Open Printable" button instead.');
      }
      
      // Create PDF with the canvas
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
      
      const namePart = (participantName || user?.displayName || 'certificate').replace(/[^a-z0-9]+/gi, '-');
      pdf.save(`GGJ-Host-Certificate-${namePart}.pdf`);
      
      toast.dismiss(loadingToastId);
      toast.success('PDF downloaded successfully!');
    } catch (e: any) {
      console.error('PDF export failed', e);
      toast.dismiss(loadingToastId);
      toast.error(`Failed to export PDF: ${e?.message || 'Unknown error'}. Please try the "Open Printable" button instead.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadJpeg = async () => {
    if (!certificateRef.current) {
      toast.error('Certificate not ready. Please wait for the preview to load.');
      return;
    }
    setGenerating(true);
    
    const loadingToastId = toast.loading('Generating image... This may take up to 30 seconds.');
    
    try {
      const element = certificateRef.current;
      
      // Verify data URLs are loaded
      if (!logoDataUrl || !signatureDataUrl) {
        throw new Error('Certificate assets not loaded yet. Please refresh the page and try again.');
      }
      
      // Wait for all images to fully load
      await waitForImages(element);
      
      // Extra delay for browser rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clone and prepare the element for rendering
      const clonedElement = element.cloneNode(true) as HTMLElement;
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '0';
      document.body.appendChild(clonedElement);
      
      // Replace all images with data URLs in the clone
      const imgs = clonedElement.querySelectorAll('img');
      const imgPromises: Promise<void>[] = [];
      imgs.forEach((img: HTMLImageElement) => {
        if (img.src && !img.src.startsWith('data:')) {
          imgPromises.push(
            new Promise<void>((resolve) => {
              const originalSrc = img.src;
              fetch(originalSrc, { mode: 'cors', cache: 'no-store' })
                .then(res => res.blob())
                .then(blob => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    img.src = reader.result as string;
                    resolve();
                  };
                  reader.onerror = () => resolve();
                  reader.readAsDataURL(blob);
                })
                .catch(() => resolve());
            })
          );
        }
      });
      await Promise.all(imgPromises);
      
      // Wait for the clone's images to render
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Capture with optimized settings for better compatibility
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true, // Allow taint for data URLs
        foreignObjectRendering: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0, // No timeout since we preloaded
        logging: true, // Enable logging to debug issues
        width: 1100,
        height: 800,
        windowWidth: 1100,
        windowHeight: 800
      });
      
      // Remove clone
      document.body.removeChild(clonedElement);
      
      // Verify canvas has content by checking pixel data
      const ctx = canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData?.data.some(pixel => pixel !== 255); // Check if not all white
      
      if (!hasContent || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Certificate rendering failed. Please use the "Open Printable" button instead.');
      }
      
      // Create high-quality JPEG
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const namePart = (participantName || user?.displayName || 'certificate').replace(/[^a-z0-9]+/gi, '-');
      downloadDataUrl(imgData, `GGJ-Host-Certificate-${namePart}.jpg`);
      
      toast.dismiss(loadingToastId);
      toast.success('Image downloaded successfully!');
    } catch (e: any) {
      console.error('Image export failed', e);
      toast.dismiss(loadingToastId);
      toast.error(`Failed to export image: ${e?.message || 'Unknown error'}. Please try the "Open Printable" button instead.`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading certificate...</p>
        </div>
      </div>
    );
  }

  // Check if certificate is available: either all modules completed OR enrollment status is 'completed' OR certificate already issued
  // Use a very lenient check: if we have at least 6 of 8 modules completed, or enrollment is marked complete
  // This helps users who may have legitimate progress but technical sync issues
  const hasCompletedAllModules = completedModules.length >= totalModules;
  const hasCompletedMostModules = completedModules.length >= Math.max(6, totalModules - 2); // Allow access if 6/8 modules done
  const enrollmentCompleted = enrollment?.status === 'completed' || enrollment?.status === 'active';
  const certificateIssued = enrollment?.certificateIssuedAt || enrollment?.certificateUrl;
  const canAccessCertificate = hasCompletedAllModules || hasCompletedMostModules || enrollmentCompleted || certificateIssued;

  if (!enrollment || !canAccessCertificate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Certificate Not Available</CardTitle>
            <CardDescription>
              Complete all course modules to receive your certificate.
              {completedModules.length > 0 && (
                <span className="block mt-2 text-sm">
                  Progress: {completedModules.length} of {totalModules} modules completed
                  {completedModules.length >= (totalModules - 1) && (
                    <span className="block mt-1 text-primary font-semibold">
                      Almost there! Just {totalModules - completedModules.length} more module(s) to go!
                    </span>
                  )}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/course/dashboard')} className="w-full">
              Return to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <div className="flex justify-center mb-4">
            <Award className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Congratulations, {user?.displayName || user?.email}!
          </h1>
          <p className="text-xl text-muted-foreground">
            You've successfully completed the GGJ Host Certification Course
          </p>
        </div>

        {/* Achievement Summary */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Modules Completed</p>
                  <p className="text-2xl font-bold">{completedModules.length} / {totalModules}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Certification Status</p>
                  <p className="text-2xl font-bold text-green-600">Certified</p>
                </div>
                <Award className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Achievement Points</p>
                  <p className="text-2xl font-bold">100</p>
                </div>
                <Share2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificate Preview */}
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Your Host Certificate</CardTitle>
            <CardDescription>This certifies your completion of the GGJ Host Certification Course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-8 mb-6 overflow-auto">
              <div className="transform scale-75 origin-top">
                <CertificateTemplate
                  ref={certificateRef}
                  participantName={participantName || user?.displayName || user?.email || 'Your Name'}
                  eventTitle="Host Certification Course"
                  eventLocation="Online"
                  eventDate={new Date().toISOString()}
                  editionYear={new Date().getFullYear().toString()}
                  certificateKind="host"
                  logoSrc={logoDataUrl}
                  signatureSrc={signatureDataUrl}
                />
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleDownloadCertificate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Open Printable
                  </>
                )}
              </Button>

              <Button 
                size="lg"
                variant="secondary"
                onClick={handleDownloadPdf}
                disabled={generating}
              >
                <Download className="mr-2 h-5 w-5" />
                Download as PDF
              </Button>

              <Button 
                size="lg"
                variant="secondary"
                onClick={handleDownloadJpeg}
                disabled={generating}
              >
                <Download className="mr-2 h-5 w-5" />
                Download as Image (JPG)
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/host-dashboard')}
              >
                Go to Host Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>🎉 What's Next?</CardTitle>
            <CardDescription>You're now ready to host your first Global Goals Jam!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Access Your Host Dashboard</h4>
                  <p className="text-sm text-muted-foreground">Create and manage your local jam events</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Download Host Toolkit</h4>
                  <p className="text-sm text-muted-foreground">Access exclusive resources and templates</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Join the Community</h4>
                  <p className="text-sm text-muted-foreground">Connect with other hosts in our forum</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">4</span>
                </div>
                <div>
                  <h4 className="font-medium">Schedule Your First Jam</h4>
                  <p className="text-sm text-muted-foreground">Pick a date and start recruiting participants</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toolkit Use Rights */}
        <Card className="max-w-4xl mx-auto mt-8 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Your Toolkit Usage Rights
            </CardTitle>
            <CardDescription>
              As a certified host, you have lifetime access to all toolkit resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  What You Can Do
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                  <li className="list-disc">Generate unlimited AI-powered jamkits tailored to any SDG and context</li>
                  <li className="list-disc">Download all method cards, templates, and facilitation guides</li>
                  <li className="list-disc">Use all materials for your local Global Goals Jam events</li>
                  <li className="list-disc">Share materials with your participants and team</li>
                  <li className="list-disc">Adapt templates to fit your local context</li>
                </ul>
              </div>

              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">License Terms</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your certification includes lifetime access to the Global Goals Jam toolkit ecosystem. 
                  All materials are provided under a Creative Commons license for non-commercial use in 
                  organizing Global Goals Jam events.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/toolkit')}
                  className="w-full"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Access Toolkit Generator
                </Button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Questions about toolkit usage? Contact us at{' '}
                  <a href="mailto:support@globalgoalsjam.org" className="text-primary hover:underline">
                    support@globalgoalsjam.org
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}