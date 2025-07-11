import { useToast } from "@/hooks/use-toast";

export function useLogin() {
  const { toast } = useToast();

  const handleLogin = () => {
    toast({
      title: "Login Required",
      description: "Please log in to access this feature.",
      variant: "default",
    });
    
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  return { handleLogin };
}