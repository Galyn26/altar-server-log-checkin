import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Church, Clock, Timer, Play, StopCircle, User, LogOut } from "lucide-react";
import { format } from "date-fns";

interface ServiceSession {
  id: number;
  userId: string;
  clockInTime: string;
  clockOutTime: string | null;
  serviceType: string;
  duration: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  weeklyHours: number;
  weeklyServices: number;
  monthlyHours: number;
  monthlyServices: number;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function getCurrentDuration(clockInTime: string): string {
  const now = new Date();
  const clockIn = new Date(clockInTime);
  const diffMinutes = Math.floor((now.getTime() - clockIn.getTime()) / (1000 * 60));
  return formatDuration(diffMinutes);
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, toast]);

  // Fetch current active session
  const { data: currentSession, isLoading: sessionLoading } = useQuery<ServiceSession | null>({
    queryKey: ["/api/sessions/current"],
    retry: false,
  });

  // Fetch service history
  const { data: serviceHistory, isLoading: historyLoading } = useQuery<ServiceSession[]>({
    queryKey: ["/api/sessions/history"],
    retry: false,
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/sessions/stats"],
    retry: false,
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async (serviceType: string = "General Service") => {
      await apiRequest("POST", "/api/sessions/clock-in", { serviceType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/stats"] });
      toast({
        title: "Success!",
        description: "You have successfully clocked in. Your service time is now being tracked.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to clock in. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/sessions/clock-out");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/stats"] });
      toast({
        title: "Success!",
        description: "You have successfully clocked out. Thank you for your service today!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to clock out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Church className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Altar Server Check-In</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <span className="text-sm text-gray-600">Welcome back, </span>
                <span className="text-sm font-medium text-gray-900">
                  {user.firstName || user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Card */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Current Status</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${currentSession ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className={`text-sm font-medium ${currentSession ? 'text-green-600' : 'text-gray-500'}`}>
                      {currentSession ? 'Clocked In' : 'Clocked Out'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {sessionLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <Clock className="text-primary text-xl mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Clock In Time</p>
                              <p className="text-lg font-semibold text-primary">
                                {currentSession 
                                  ? format(new Date(currentSession.clockInTime), 'h:mm a')
                                  : '--:--'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <Timer className="text-orange-500 text-xl mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Current Duration</p>
                              <p className="text-lg font-semibold text-orange-500">
                                {currentSession 
                                  ? getCurrentDuration(currentSession.clockInTime)
                                  : '--h --m'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-center space-y-4">
                    {currentSession ? (
                      <Button
                        onClick={() => clockOutMutation.mutate()}
                        disabled={clockOutMutation.isPending}
                        className="flex items-center justify-center py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-medium"
                      >
                        <StopCircle className="mr-2 h-5 w-5" />
                        {clockOutMutation.isPending ? 'Clocking Out...' : 'Clock Out'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => clockInMutation.mutate()}
                        disabled={clockInMutation.isPending}
                        className="flex items-center justify-center py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-medium"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        {clockInMutation.isPending ? 'Clocking In...' : 'Clock In'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Hours</span>
                      <span className="text-lg font-semibold text-primary">
                        {stats?.weeklyHours || 0}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Services</span>
                      <span className="text-lg font-semibold text-primary">
                        {stats?.weeklyServices || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.min(((stats?.weeklyHours || 0) / 20) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Goal: 20 hours per week</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Hours</span>
                      <span className="text-lg font-semibold text-green-600">
                        {stats?.monthlyHours || 0}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Services</span>
                      <span className="text-lg font-semibold text-green-600">
                        {stats?.monthlyServices || 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Service History */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Service History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : serviceHistory && serviceHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clock In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clock Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serviceHistory.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(session.clockInTime), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.serviceType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(session.clockInTime), 'h:mm a')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.clockOutTime ? (
                            format(new Date(session.clockOutTime), 'h:mm a')
                          ) : (
                            <span className="text-orange-500 font-medium">In Progress</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.duration ? (
                            formatDuration(session.duration)
                          ) : (
                            getCurrentDuration(session.clockInTime)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={session.isActive ? "default" : "secondary"}>
                            {session.isActive ? "Active" : "Completed"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No service history</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start your first service session by clocking in.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
