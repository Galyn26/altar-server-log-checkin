import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Church, Users, Clock, Download, Shield, User, LogOut, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

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

interface OverallStats {
  totalUsers: number;
  totalActiveUsers: number;
  totalHoursThisWeek: number;
  totalHoursThisMonth: number;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default function Moderator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/moderator/users"],
    retry: false,
  });

  // Fetch all sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery<ServiceSession[]>({
    queryKey: ["/api/moderator/sessions"],
    retry: false,
  });

  // Fetch overall stats
  const { data: stats, isLoading: statsLoading } = useQuery<OverallStats>({
    queryKey: ["/api/moderator/stats"],
    retry: false,
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PUT", `/api/moderator/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderator/users"] });
      toast({
        title: "Success!",
        description: "User role updated successfully.",
      });
      setSelectedUserId("");
      setSelectedRole("");
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
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  const handleExport = async () => {
    try {
      const response = await fetch("/api/moderator/export", {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export data");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "altar_server_logs.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success!",
        description: "Service logs exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleUpdateRole = () => {
    if (selectedUserId && selectedRole) {
      updateRoleMutation.mutate({ userId: selectedUserId, role: selectedRole });
    }
  };

  const getUserName = (userId: string): string => {
    const user = users?.find(u => u.id === userId);
    if (!user) return "Unknown";
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || "Unknown";
  };

  if (!user || (user as any).role !== 'moderator') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <Shield className="mx-auto h-12 w-12 text-red-500" />
                <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
                <p className="text-sm text-gray-600">You need moderator privileges to access this page</p>
              </div>
              <Button onClick={() => window.location.href = "/"} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Moderator Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/"}
                className="flex items-center"
              >
                <Church className="h-4 w-4 mr-1" />
                Main Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalUsers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalActiveUsers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.totalHoursThisWeek || 0}h`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours This Month</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.totalHoursThisMonth || 0}h`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Button */}
        <div className="mb-8">
          <Button onClick={handleExport} className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export Service Logs (CSV)
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sessions">Service Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleUpdateRole}
                      disabled={!selectedUserId || !selectedRole || updateRoleMutation.isPending}
                    >
                      {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'moderator' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions?.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            {getUserName(session.userId)}
                          </TableCell>
                          <TableCell>{session.serviceType}</TableCell>
                          <TableCell>{format(new Date(session.clockInTime), 'MMM d, h:mm a')}</TableCell>
                          <TableCell>
                            {session.clockOutTime 
                              ? format(new Date(session.clockOutTime), 'MMM d, h:mm a')
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            {session.duration ? formatDuration(session.duration) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {(session as any).clockInLocationVerified !== undefined ? (
                              <Badge variant={(session as any).clockInLocationVerified ? 'default' : 'destructive'}>
                                {(session as any).clockInLocationVerified ? 'Verified' : 'Not Verified'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                No Data
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={session.isActive ? 'default' : 'secondary'}>
                              {session.isActive ? 'Active' : 'Completed'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}