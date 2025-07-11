import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Download, Calendar, TrendingUp } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

export default function UserReports() {
  const [, setLocation] = useLocation();
  const { user } = useCustomerAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-950 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setLocation('/dashboard/user')}
              variant="ghost"
              size="icon"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Reports</h1>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-purple-400" />
                <span>Financial Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">
                Access your detailed financial reports and analytics.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Monthly Statement</h3>
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      View your monthly gift card activity
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Annual Summary</h3>
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Year-end gift card summary report
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}