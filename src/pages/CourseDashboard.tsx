import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { PlayCircle, CheckCircle, Lock, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { blink, safeDbCall } from '@/lib/blink';
import { toast } from 'sonner';
import { TemplateCard } from '@/components/TemplateDownload';
import { generateTemplate } from '@/lib/templateGenerator';
import { generateHTMLTemplate, openHTMLInNewWindow } from '@/lib/htmlTemplateGenerator';
import jsPDF from 'jspdf';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import AudioPlayer from '@/components/ui/AudioPlayer';
import Module1Content from '@/components/Module1Content';
import Module2Content from '@/components/Module2Content';
import Module3Content from '@/components/Module3Content';
import Module4Content from '@/components/Module4Content';
import Module5Content from '@/components/Module5Content';
import Module6Content from '@/components/Module6Content';
import Module7Content from '@/components/Module7Content';
import Module8Content from '@/components/Module8Content';
import { ModuleExercisesEnhanced } from '@/components/ModuleExercisesEnhanced';
import ModuleResources from '@/components/ModuleResources';
import { FloatingFeedback } from '@/components/FloatingFeedback';
import { courseResources, courseModules as staticModules } from '@/data/courseContent';
import { getUserProfile, checkAndUpgradeUser } from '@/lib/userStatus';
import { appAuth } from '@/lib/simpleAuth';
import { getStoredUser } from '@/lib/auth';

interface Module {
  id: string;
  moduleNumber: string;
  title: string;
  description: string;
  learningOutcomes: string;
  activities: string;
  videoUrl: string;
  contentHtml: string;
  templates: string;
  exercises: string;
  checkOfLearning: string;
  durationMinutes: string;
}

interface ModuleProgress {
  moduleId: string;
  started_at?: string | null;
  completed_at?: string | null;
  quiz_score?: string | null;
  quiz_answers?: string | null;
  videoWatchedPercent: string;
  exercisesCompleted: string;
  notes: string;
}

export default function CourseDashboard() {
  const navigate = useNavigate();
  const normalizeArray = (v: any) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v || '[]'); } catch { return []; }
  };

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [checkAnswer, setCheckAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadCourseData = async (userId: string) => {
      try {
        // Check enrollment
        const enrollments = await safeDbCall(() => blink.db.courseEnrollments.list({
          where: { userId: userId },
          limit: 1
        }));
        
        const urlHasEnrolledFlag = new URLSearchParams(window.location.search).get('enrolled') === '1'
        if (enrollments.length === 0 || (enrollments[0].status !== 'active' && enrollments[0].status !== 'completed')) {
          // Allow admins to preview the course even without active/completed enrollment
          const profile = await getUserProfile(userId).catch(() => null);
          const isAdmin = !!profile && profile.role === 'admin'
          if (!isAdmin) {
            // If user just returned here after enrollment (?enrolled=1), avoid redirect loop; show fallback card instead
            if (!urlHasEnrolledFlag) {
              navigate('/course/enroll');
              return;
            }
          }
        }
        
        // If enrollment exists, set it; if not and admin previewing, keep enrollment null but continue to load modules
        if (enrollments.length > 0) setEnrollment(enrollments[0]);
        
        // Load modules
        const moduleList = await safeDbCall(() => blink.db.courseModules.list({
          orderBy: { moduleNumber: 'asc' }
        }));

        // Deduplicate by moduleNumber and keep only live modules 1–8
        const uniqueSorted = Array.from(
          new Map(moduleList.map((m: any) => [String(m.moduleNumber), m])).values()
        )
          .filter((m: any) => {
            const n = parseInt(String(m.moduleNumber));
            return !Number.isNaN(n) && n >= 1 && n <= 8;
          })
          .sort((a: any, b: any) => parseInt(String(a.moduleNumber)) - parseInt(String(b.moduleNumber)));

        setModules(uniqueSorted);
        
        // Load progress
        const progressList = (enrollments.length > 0)
          ? await safeDbCall(() => blink.db.courseProgress.list({
              where: { userId: userId, enrollmentId: enrollments[0].id }
            }))
          : [];
        
        const progressMap: Record<string, ModuleProgress> = {};
        progressList.forEach((p: any) => {
          progressMap[p.moduleId] = {
            moduleId: p.moduleId,
            started_at: p.startedAt,
            completed_at: p.completedAt,
            quiz_score: p.quizScore,
            quiz_answers: p.quizAnswers,
            videoWatchedPercent: p.videoWatchedPercent || '0',
            exercisesCompleted: p.exercisesCompleted || '[]',
            notes: p.notes || ''
          };
        });
        setProgress(progressMap);
        
        // Set current module
        const currentModuleNum = parseInt(enrollments[0]?.currentModule || '1');
        const current = uniqueSorted.find((m: any) => parseInt(String(m.moduleNumber)) === currentModuleNum);
        if (current) {
          setCurrentModule(current as any);
        } else if (uniqueSorted.length > 0) {
          setCurrentModule(uniqueSorted[0] as any);
        }
      } catch (error) {
        console.error('Error loading course data:', error);
        toast.error('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    let unsubscribe: (() => void) | null = null;

    const loadForUser = async (u: any) => {
      if (u?.id) {
        setUser(u);
        await loadCourseData(u.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    const init = async () => {
      setLoading(true);
      try {
        const stored = await getStoredUser();
        await loadForUser(stored);
      } catch {
        setLoading(false);
      }
    };

    unsubscribe = appAuth.onChange((u) => {
      loadForUser(u).catch(console.error);
    });

    init().catch(console.error);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);

  // Helper to safely create/update a courseProgress row by id to avoid UNIQUE conflicts
  const upsertProgress = async (id: string, data: any) => {
    const existing = await safeDbCall(() => blink.db.courseProgress.list({ where: { id }, limit: 1 }));
    if (existing.length > 0) {
      await safeDbCall(() => blink.db.courseProgress.update(id, data));
    } else {
      await safeDbCall(() => blink.db.courseProgress.create({ id, ...data }));
    }
  };

  const startModule = async (module: Module) => {
    if (!enrollment || !user) return;
    
    const moduleNum = parseInt(module.moduleNumber);
    const currentNum = parseInt(enrollment.currentModule || '0');
    
    // Check if module is locked
    if (moduleNum > currentNum + 1) {
      toast.error('Complete previous modules first');
      return;
    }
    
    setCurrentModule(module);
    
    const progressId = `prog_${enrollment.id}_${module.id}`;
    
    try {
      const existingProgress = progress[module.id];
      await upsertProgress(progressId, {
        userId: user.id,
        enrollmentId: enrollment.id,
        moduleId: module.id,
        startedAt: (existingProgress as any)?.started_at || new Date().toISOString(),
        completedAt: (existingProgress as any)?.completed_at || null,
        quizScore: (existingProgress as any)?.quiz_score || null,
        quizAnswers: (existingProgress as any)?.quiz_answers || null
      });
    } catch (error) {
      console.error('Error updating progress record:', error);
      // Continue even if there's an error
    }
    
    // Update current module in enrollment
    if (moduleNum > currentNum) {
      await safeDbCall(() => blink.db.courseEnrollments.update(enrollment.id, {
        currentModule: module.moduleNumber
      }));
      setEnrollment({ ...enrollment, currentModule: module.moduleNumber });
    }
  };

  const submitCheckOfLearning = async () => {
    if (!currentModule || !enrollment || !user || !checkAnswer.trim()) {
      toast.error('Please provide an answer');
      return;
    }
    
    setSubmitting(true);
    try {
      const progressId = `prog_${enrollment.id}_${currentModule.id}`;
      
      await upsertProgress(progressId, {
        userId: user.id,
        enrollmentId: enrollment.id,
        moduleId: currentModule.id,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        quizAnswers: checkAnswer,
        videoWatchedPercent: '100',
        exercisesCompleted: JSON.stringify(['check_completed'])
      });
      
      // Update completed modules
      const completedModules = JSON.parse(enrollment.completedModules || '[]');
      if (!completedModules.includes(currentModule.moduleNumber)) {
        completedModules.push(currentModule.moduleNumber);
        const updateData: any = {
          completedModules: JSON.stringify(completedModules),
          updatedAt: new Date().toISOString()
        };
        // If all modules completed, mark enrollment as completed
        if (completedModules.length >= modules.length) {
          updateData.status = 'completed';
        }
        await safeDbCall(() => blink.db.courseEnrollments.update(enrollment.id, updateData));
        setEnrollment({ ...enrollment, completedModules: JSON.stringify(completedModules), status: updateData.status || enrollment.status });
      }
      
      // Update local progress
      setProgress({
        ...progress,
        [currentModule.id]: {
          ...progress[currentModule.id],
          completed_at: new Date().toISOString(),
          exercisesCompleted: JSON.stringify(['check_completed'])
        }
      });
      
      toast.success('Module completed! Great work!');
      setCheckAnswer('');
      
      // Check if all modules completed
      if (completedModules.length === modules.length) {
        toast.success('Congratulations! You\'ve completed the entire course!');
        setTimeout(() => {
          navigate('/course/certificate');
        }, 2000);
      } else {
        const nextModule = modules.find(m => parseInt(m.moduleNumber) === parseInt(currentModule.moduleNumber) + 1);
        if (nextModule) {
          setCurrentModule(nextModule);
        }
      }
    } catch (error) {
      console.error('Error submitting check:', error);
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateOverallProgress = () => {
    if (!enrollment || modules.length === 0) return 0;
    const completed = JSON.parse(enrollment.completedModules || '[]').length;
    return (completed / modules.length) * 100;
  };

  const isModuleLocked = (moduleNum: string) => {
    if (!enrollment) return true;
    const currentNum = parseInt(enrollment.currentModule || '0');
    return parseInt(moduleNum) > currentNum + 1;
  };

  const isModuleCompleted = (moduleId: string) => {
    return progress[moduleId]?.completed_at !== null && progress[moduleId]?.completed_at !== undefined;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!enrollment || !currentModule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Active Enrollment</CardTitle>
            <CardDescription>Please enroll in the course to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/course/enroll')} className="w-full">
              Enroll Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compute media URL with fallback to static content sheet
  const dbUrl = currentModule.videoUrl || '';
  const fallbackFromStatic = staticModules.find((m: any) => m.id === currentModule.id || String(m.moduleNumber) === String(currentModule.moduleNumber));
  const fallbackUrl = fallbackFromStatic?.videoUrl || '';
  const overviewMediaUrl = dbUrl || fallbackUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <FloatingFeedback context="course" userEmail={user?.email || ''} userName={user?.displayName || ''} />
      {/* Enhanced Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    GGJ Host Certification Course
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Welcome back, <span className="font-medium text-foreground">{user?.displayName || user?.email}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col lg:items-end space-y-3">
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                  <p className="text-xs text-muted-foreground">
                    {JSON.parse(enrollment?.completedModules || '[]').length} of {modules.length} modules
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Progress 
                      value={calculateOverallProgress()} 
                      className="w-32 h-3 bg-muted/50" 
                    />
                    {calculateOverallProgress() === 100 && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">{Math.round(calculateOverallProgress())}%</span>
                    {calculateOverallProgress() === 100 && (
                      <Badge className="ml-2 bg-green-500 hover:bg-green-600">Complete!</Badge>
                    )}
                  </div>
                </div>
              </div>
              {Math.round(calculateOverallProgress()) === 100 && (
                <div className="text-right">
                  <Button size="sm" onClick={() => navigate('/course/certificate')}>
                    {/* Award icon for clarity */}
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15a6 6 0 1 0-6-6 6 6 0 0 0 6 6Zm0 0v7l3-2 3 2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Get Certificate
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Enhanced Module List */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Course Modules</CardTitle>
                    <CardDescription className="text-xs">Your learning journey</CardDescription>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-medium">
                    {JSON.parse(enrollment?.completedModules || '[]').length}/{modules.length}
                  </span>
                </div>
                <Progress value={calculateOverallProgress()} className="h-1" />
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] lg:h-[600px]">
                  <div className="p-4 space-y-3">
                    {Array.from(new Map(modules.map((m) => [String(m.moduleNumber), m])).values()).map((module) => {
                      const locked = isModuleLocked(module.moduleNumber);
                      const completed = isModuleCompleted(module.id);
                      const current = currentModule?.id === module.id;
                      const completedModuleNumbers = JSON.parse(enrollment?.completedModules || '[]');
                      const isCompleted = completedModuleNumbers.includes(module.moduleNumber);
                      
                      return (
                        <button
                          key={module.id}
                          onClick={() => !locked && startModule(module)}
                          disabled={locked}
                          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                            current ? 'bg-primary/10 border-primary shadow-md ring-1 ring-primary/20' : 
                            isCompleted ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100' :
                            locked ? 'opacity-50 cursor-not-allowed bg-muted/30' : 
                            'hover:bg-accent/50 border-border/60'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="mt-1 relative">
                              {isCompleted ? (
                                <div className="relative">
                                  <CheckCircle className="h-6 w-6 text-green-500 drop-shadow-sm" />
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-100 rounded-full animate-pulse" />
                                </div>
                              ) : locked ? (
                                <Lock className="h-6 w-6 text-muted-foreground" />
                              ) : current ? (
                                <div className="w-6 h-6 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 hover:border-primary/50 transition-colors" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">
                                  Module {module.moduleNumber}
                                </span>
                                {current && (
                                  <Badge variant="default" className="text-xs bg-primary/20 text-primary hover:bg-primary/30">
                                    Current
                                  </Badge>
                                )}
                                {isCompleted && (
                                  <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-200">
                                    ✓ Complete
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-sm mb-2 leading-tight">{module.title}</h4>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{module.durationMinutes} min</span>
                                </div>
                                {!locked && !isCompleted && (
                                  <span className="text-primary font-medium">Start →</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Module Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
              <CardHeader className="pb-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-white font-bold">
                        {currentModule.moduleNumber}
                      </div>
                      <div>
                        <CardTitle className="text-xl leading-tight">{currentModule.title}</CardTitle>
                        <CardDescription className="text-sm mt-1 text-muted-foreground">
                          {currentModule.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-3 py-1">
                      <Clock className="mr-1 h-3 w-3" />
                      {currentModule.durationMinutes} min
                    </Badge>
                    {JSON.parse(enrollment?.completedModules || '[]').includes(currentModule.moduleNumber) && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Complete
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="exercises">Exercises</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Learning Outcomes
                      </h3>
                      <ul className="space-y-2">
                        {normalizeArray(currentModule.learningOutcomes).map((outcome: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-primary mt-0.5" />
                            <span className="text-sm">{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {(() => {
                      const url = overviewMediaUrl;
                      const isAudio = /\.(mp3|m4a|wav|ogg)(\?|$)/i.test(url);
                      const isYouTube = /youtube\.com|youtu\.be/i.test(url);
                      // Don't show the generic "Video Coming Soon" placeholder for modules 5-8
                      const allowPlaceholder = !['5','6','7','8'].includes(currentModule.moduleNumber);

                      if (isAudio) {
                        return (
                          <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-6">
                              <div className="mb-3">
                                <p className="font-medium">Audio Lesson</p>
                                <p className="text-sm text-muted-foreground">Listen to this module's audio overview</p>
                              </div>
                              <AudioPlayer src={url} title={`Module ${currentModule.moduleNumber} — ${currentModule.title}`} />
                            </CardContent>
                          </Card>
                        );
                      }

                      if (isYouTube) {
                        const embedUrl = url.includes('watch?v=') ? url.replace('watch?v=', 'embed/') : url;
                        return (
                          <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-6">
                              <div className="mb-3">
                                <p className="font-medium">Video Lesson</p>
                                <p className="text-sm text-muted-foreground">Watch the module video</p>
                              </div>
                              <AspectRatio ratio={16/9}>
                                <iframe
                                  src={embedUrl}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title={`Module ${currentModule.moduleNumber} video`}
                                />
                              </AspectRatio>
                            </CardContent>
                          </Card>
                        );
                      }

                      // Enhanced placeholder for modules where we want it
                      if (!isAudio && !isYouTube && allowPlaceholder) {
                        return (
                          <Card className="bg-gradient-to-br from-primary/5 via-primary/8 to-accent/5 border-primary/20 shadow-sm">
                            <CardContent className="pt-6">
                              <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl flex items-center justify-center">
                                  <PlayCircle className="h-8 w-8 text-primary" />
                                </div>
                                <div className="space-y-2">
                                  <p className="font-semibold text-lg">Video Lesson</p>
                                  <p className="text-sm text-muted-foreground max-w-sm">
                                    An interactive video lesson for this module is being prepared. 
                                    In the meantime, explore the content and exercises below.
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
                                  <span>Video content coming soon</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }

                      return null;
                    })()}
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-4">
                    <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                      {currentModule.moduleNumber === '1' && <Module1Content />}
                      {currentModule.moduleNumber === '2' && <Module2Content />}
                      {currentModule.moduleNumber === '3' && <Module3Content />}
                      {currentModule.moduleNumber === '4' && <Module4Content />}
                      {currentModule.moduleNumber === '5' && <Module5Content />}
                      {currentModule.moduleNumber === '6' && <Module6Content />}
                      {currentModule.moduleNumber === '7' && <Module7Content />}
                      {currentModule.moduleNumber === '8' && <Module8Content />}
                      {!['1', '2', '3', '4', '5', '6', '7', '8'].includes(currentModule.moduleNumber) && (
                        <div 
                          className="prose max-w-none text-sm"
                          dangerouslySetInnerHTML={{ __html: currentModule.contentHtml || '<p>Content loading...</p>' }}
                        />
                      )}
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="exercises" className="space-y-4">
                    <ModuleExercisesEnhanced moduleNumber={parseInt(currentModule.moduleNumber)} />
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between rounded-md border bg-muted/30 p-4">
                      <div className="text-sm text-muted-foreground">
                        {isModuleCompleted(currentModule.id) ? 'This module is completed.' : 'Mark this module as completed when you\'re done with the exercises.'}
                      </div>
                      <div className="flex gap-2">
                        <Button variant={isModuleCompleted(currentModule.id) ? 'secondary' : 'default'} onClick={async () => { await (async () => { const progressId = `prog_${enrollment.id}_${currentModule.id}`; try { await upsertProgress(progressId, { userId: user.id, enrollmentId: enrollment.id, moduleId: currentModule.id, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), videoWatchedPercent: '100', exercisesCompleted: JSON.stringify(['module_marked_complete']) }); const completedModules = JSON.parse(enrollment.completedModules || '[]'); if (!completedModules.includes(currentModule.moduleNumber)) { completedModules.push(currentModule.moduleNumber); const updateData: any = { completedModules: JSON.stringify(completedModules), updatedAt: new Date().toISOString() }; if (completedModules.length >= modules.length) { updateData.status = 'completed'; } await safeDbCall(() => blink.db.courseEnrollments.update(enrollment.id, updateData)); setEnrollment({ ...enrollment, completedModules: JSON.stringify(completedModules), status: updateData.status || enrollment.status }); } setProgress({ ...progress, [currentModule.id]: { ...progress[currentModule.id], completed_at: new Date().toISOString(), exercisesCompleted: JSON.stringify(['module_marked_complete']) } }); toast.success(`Marked Module ${currentModule.moduleNumber} as completed`); } catch (e) { console.error(e); toast.error('Could not save module completion'); } })(); }} disabled={isModuleCompleted(currentModule.id)}>
                          {isModuleCompleted(currentModule.id) ? 'Completed' : 'Mark Module Completed'}
                        </Button>
                        {Math.round(calculateOverallProgress()) === 100 && (
                          <Button variant="outline" onClick={async () => { try { await safeDbCall(() => blink.db.courseEnrollments.update(enrollment.id, { status: 'completed', updatedAt: new Date().toISOString() })); try { await checkAndUpgradeUser(user.id); } catch (_) {} navigate('/course/certificate'); } catch (e) { console.error(e); toast.error('Failed to finalize course'); } }}>
                            Finish Course & Get Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="resources" className="space-y-6">
                    <ModuleResources 
                      moduleNumber={parseInt(currentModule.moduleNumber)} 
                      resources={(courseResources as any)[parseInt(currentModule.moduleNumber)] || []} 
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
