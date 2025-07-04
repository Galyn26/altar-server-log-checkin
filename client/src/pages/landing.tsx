import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Church } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Church className="mx-auto h-12 w-12 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900">Altar Server Check-In</h1>
              <p className="text-sm text-gray-600">Sign in to track your service hours</p>
            </div>
            
            <Button 
              onClick={handleLogin}
              className="w-full py-3 text-base font-medium"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
