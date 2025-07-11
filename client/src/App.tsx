import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import Balance from "@/pages/Balance";
import Redeem from "@/pages/Redeem";
import Dashboard from "@/pages/Dashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/shop" component={Shop} />
          <Route path="/balance" component={Balance} />
          <Route path="/redeem" component={Redeem} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/shop" component={Shop} />
          <Route path="/balance" component={Balance} />
          <Route path="/redeem" component={Redeem} />
          <Route path="/dashboard" component={Dashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
