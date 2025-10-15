import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyCheckin } from "@/components/DailyCheckin";
import { PingDoula } from "@/components/PingDoula";
import { DoulaDashboard } from "@/components/DoulaDashboard";
import { HealthEducation } from "@/components/HealthEducation";
import { HealthConditionsOnboarding } from "@/components/HealthConditionsOnboarding";
import { SuggestedCareTeam } from "@/components/SuggestedCareTeam";
import { PostpartumAnxietyAssessment } from "@/components/PostpartumAnxietyAssessment";
import { PerinatalAnxietyScale } from "@/components/PerinatalAnxietyScale";
import { ProfileSettings } from "@/components/ProfileSettings";
import { Heart, MessageCircle, Calendar, Settings, BookOpen, AlertTriangle, Shield } from "lucide-react";
import CareTeamManagement from "@/components/CareTeamManagement";
import PatientConsentSettings from "@/components/PatientConsentSettings";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePostpartumAnxietyAlert } from "@/hooks/usePostpartumAnxietyAlert";
import { useDueDateCheck } from "@/hooks/useDueDateCheck";
import { DueDateCheckPrompt } from "@/components/DueDateCheckPrompt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuditLog } from "@/hooks/useAuditLog";

const Index = () => {
  const { user, signOut } = useAuth();
  const { logView } = useAuditLog();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [showPostpartumAssessment, setShowPostpartumAssessment] = useState(false);
  const [showPerinatalAssessment, setShowPerinatalAssessment] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { 
    shouldShowPostpartumAssessment, 
    shouldShowPerinatalAssessment,
    isChecking, 
    dismissPostpartumAssessment,
    dismissPerinatalAssessment
  } = usePostpartumAnxietyAlert();

  const {
    shouldShowDueDatePrompt,
    isLoading: isDueDateLoading,
    updateToPostpartum,
    postponeCheck
  } = useDueDateCheck();

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  useEffect(() => {
    // Log dashboard view
    if (user && userRole) {
      logView('dashboard', undefined, user.id);
    }
  }, [user, userRole, logView]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setShowOnboarding(!data?.onboarding_completed);
      setUserRole(data?.role || 'patient');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true);
      setUserRole('patient');
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handlePostpartumAssessmentComplete = () => {
    setShowPostpartumAssessment(false);
    dismissPostpartumAssessment();
  };

  const handlePerinatalAssessmentComplete = () => {
    setShowPerinatalAssessment(false);
    dismissPerinatalAssessment();
  };

  const showPostpartumAssessmentAlert = () => {
    setShowPostpartumAssessment(true);
  };

  const showPerinatalAssessmentAlert = () => {
    setShowPerinatalAssessment(true);
  };

  if (isCheckingOnboarding || isChecking || isDueDateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-medium text-matri-cream">Loading...</div>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <HealthConditionsOnboarding onComplete={handleOnboardingComplete} />;
  }

  // Check if we should show the due date prompt (highest priority after onboarding)
  if (shouldShowDueDatePrompt) {
    return (
      <DueDateCheckPrompt
        onConfirmBirth={updateToPostpartum}
        onPostpone={postponeCheck}
      />
    );
  }

  if (showPostpartumAssessment) {
    return <PostpartumAnxietyAssessment onComplete={handlePostpartumAssessmentComplete} />;
  }

  if (showPerinatalAssessment) {
    return <PerinatalAnxietyScale onComplete={handlePerinatalAssessmentComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-harmony-brown text-primary-foreground p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/matri-logo.jpg" 
              alt="MATRI Logo" 
              className="w-12 h-12 rounded-full object-cover"
            />
          <div>
            <h1 className="text-2xl font-bold">MATRI</h1>
            <p className="text-sm opacity-90">
              {userRole === 'patient' ? 'Protection Beyond Birth' : userRole === 'doula' ? 'Doula Portal' : userRole === 'midwife' ? 'Midwife Portal' : 'CHW Portal'}
            </p>
          </div>
          </div>
          <Button onClick={signOut} variant="secondary" size="sm" className="bg-harmony-cream text-harmony-brown hover:bg-harmony-warm">
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 bg-harmony-cream min-h-screen">
        <div className="mb-6 bg-harmony-warm p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-harmony-brown">
            Welcome back, {user?.email?.split('@')[0]}! 💙
          </h2>
          <p className="text-muted-foreground">
            {userRole === 'patient' 
              ? "How are you feeling today? Your care team is here to support you."
              : "Your care dashboard - monitor and support your clients with confidence."
            }
          </p>
        </div>

        {/* Alerts only for patients */}
        {userRole === "patient" && shouldShowPostpartumAssessment && (
          <div className="mb-6">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-orange-800">Postpartum Wellness Check</AlertTitle>
              <AlertDescription className="text-orange-700">
                It's been one week since your due date. We'd like you to complete a brief postpartum anxiety assessment to ensure you're getting the support you need.
                <div className="mt-3 flex gap-2">
                  <Button 
                    onClick={showPostpartumAssessmentAlert}
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Take Postpartum Assessment
                  </Button>
                  <Button 
                    onClick={dismissPostpartumAssessment}
                    variant="outline" 
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Remind me later
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {userRole === "patient" && shouldShowPerinatalAssessment && (
          <div className="mb-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-blue-800">Perinatal Anxiety Check</AlertTitle>
              <AlertDescription className="text-blue-700">
                Please complete this perinatal anxiety scale to help us better understand your emotional well-being and provide appropriate support.
                <div className="mt-3 flex gap-2">
                  <Button 
                    onClick={showPerinatalAssessmentAlert}
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Take Perinatal Scale
                  </Button>
                  <Button 
                    onClick={dismissPerinatalAssessment}
                    variant="outline" 
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Remind me later
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Tabs defaultValue={userRole === 'patient' ? "checkin" : "dashboard"} className="w-full">
          <TabsList className={`grid w-full ${
            userRole === 'patient' ? 'grid-cols-4' : 'grid-cols-3'
          }`}>
            {userRole === 'patient' && (
              <>
                <TabsTrigger value="checkin" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Check-In</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Contact Care Team</span>
                </TabsTrigger>
                <TabsTrigger value="education" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Health Education</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Care Dashboard</span>
                </TabsTrigger>
              </>
            )}
            {(userRole === 'doula' || userRole === 'midwife' || userRole === 'chw') && (
              <>
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Care Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Contact Care Team</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <div className="mt-6">
            {userRole === 'patient' && (
              <>
                <TabsContent value="checkin">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-semibold text-harmony-brown">How are you feeling today?</h3>
                      <p className="text-muted-foreground">Your daily check-in helps your care team support you.</p>
                    </div>
                    <DailyCheckin />
                  </div>
                </TabsContent>
                <TabsContent value="contact">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-semibold text-harmony-brown">Reach Your Care Team</h3>
                      <p className="text-muted-foreground">Get immediate support when you need it most.</p>
                    </div>
                    <PingDoula />
                  </div>
                </TabsContent>
                <TabsContent value="education">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-semibold text-harmony-brown">Your Health Library</h3>
                      <p className="text-muted-foreground">Evidence-based resources for your pregnancy and postpartum journey.</p>
                    </div>
                    <HealthEducation />
                  </div>
                </TabsContent>
                <TabsContent value="dashboard">
                  <DoulaDashboard />
                </TabsContent>
              </>
            )}

            {(userRole === 'doula' || userRole === 'midwife' || userRole === 'chw') && (
              <>
                <TabsContent value="dashboard">
                  <DoulaDashboard />
                </TabsContent>
                <TabsContent value="contact">
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h3 className="text-lg font-semibold mb-4">Contact Care Team</h3>
                      <p className="text-muted-foreground">Care team messaging and coordination features coming soon.</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="settings">
                  <div className="max-w-2xl mx-auto space-y-6">
                    <ProfileSettings />
                    <CareTeamManagement />
                    <PatientConsentSettings />
                  </div>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </main>
    </div>
  );
};
export default Index;