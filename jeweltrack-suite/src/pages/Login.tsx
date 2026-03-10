import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Zap, BarChart3, Globe, Sparkles, Mail, ExternalLink, Users, Star, Award, Heart } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      
      const savedUser = localStorage.getItem('user');
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      if (userObj?.role === 'superadmin') {
        navigate("/superadmin");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden relative">
      {/* Full Page Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform transition-[duration:20s] hover:scale-105"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop")' }}
      />
      <div className="absolute inset-0 z-0 bg-navy/80 backdrop-blur-[2px]" />

      {/* Left Side: Creative Graphics & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden z-10">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none">
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full gap-4">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-white/10 rounded-sm" />
            ))}
          </div>
        </div>

        <div className="relative z-10 w-full max-w-lg space-y-12">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-medium backdrop-blur-sm animate-bounce">
              <Sparkles className="h-3 w-3 text-gold" />
              <span>Next-Gen Jewelry Management</span>
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
              Manage your <span className="text-gold">Jewelry Empire</span> with precision.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              From inventory tracking to high-speed invoicing, JewelTrack provides the ultimate suite for modern jewelers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
              <Zap className="h-8 w-8 text-gold mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white">Instant Invoicing</h3>
              <p className="text-sm text-white/50">Generate GST-ready bills in seconds.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
              <BarChart3 className="h-8 w-8 text-gold mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white">Live Analytics</h3>
              <p className="text-sm text-white/50">Real-time sales & profit tracking.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
              <ShieldCheck className="h-8 w-8 text-gold mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white">Secure Data</h3>
              <p className="text-sm text-white/50">Bank-grade encryption for your data.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all group">
              <Globe className="h-8 w-8 text-gold mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white">Multi-Store</h3>
              <p className="text-sm text-white/50">Manage all branches from one place.</p>
            </div>
          </div>

          {/* Social Proof & Conversion Details */}
          <div className="pt-8 border-t border-white/10 space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-primary bg-muted flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="h-full w-full object-cover" />
                  </div>
                ))}
                <div className="h-10 w-10 rounded-full border-2 border-primary bg-navy flex items-center justify-center text-[10px] font-bold text-white">
                  +10k
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-gold">
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                </div>
                <p className="text-xs text-white/70 font-medium">Trusted by 10,000+ jewelers worldwide</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gold" />
                <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">#1 Industry Tool</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gold" />
                <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">ISO Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-gold" />
                <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-navy flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-gold" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">JewelTrack</span>
        </div>

        <Card className="w-full max-w-md border border-white/10 shadow-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-4xl font-bold tracking-tight text-navy">Welcome Back</CardTitle>
            <CardDescription className="text-base text-muted-foreground">Access your store management dashboard</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-navy font-semibold">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-muted focus:border-gold focus:ring-gold/20 bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-navy font-semibold">Password</Label>
                  <Link to="#" className="text-xs text-gold hover:underline font-medium">Forgot password?</Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-muted focus:border-gold focus:ring-gold/20 bg-white/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-6 pt-4">
              <Button 
                type="submit" 
                className="w-full h-12 bg-navy text-white hover:bg-navy/90 font-bold text-lg shadow-lg active:scale-[0.98] transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Login to Dashboard"
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don't have a store account?{" "}
                <Link to="/register" className="text-gold hover:underline font-bold">
                  Register Your Store
                </Link>
              </div>
            </CardFooter>
          </form>
          <div className="px-8 pb-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-muted-foreground font-medium">Quick Access</span>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-muted text-center">
              <p className="text-[10px] font-bold text-navy uppercase mb-1">Demo Account</p>
              <p className="text-xs font-semibold text-navy">rajesh@mehtajewellers.com</p>
              <p className="text-xs text-muted-foreground mt-0.5">Password: password123</p>
            </div>
          </div>
          <div className="px-8 pb-8 text-center space-y-2 border-t border-muted pt-6">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Support & Ownership</p>
            <div className="flex flex-col gap-1">
              <a href="mailto:officialjeweltrack@gmail.com" className="text-xs text-navy hover:text-gold transition-colors flex items-center justify-center gap-1.5 font-medium">
                <Mail className="h-3 w-3" /> officialjeweltrack@gmail.com
              </a>
              <a href="https://op-shashikant.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-navy transition-colors flex items-center justify-center gap-1">
                Developed by <span className="underline font-semibold">Shashikant</span> <ExternalLink className="h-2 w-2" />
              </a>
            </div>
          </div>
        </Card>

        {/* Conversion Boosting Trust Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 hidden sm:block">
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
            <div className="flex flex-col items-center">
              <span className="text-navy font-bold text-lg">10,000+</span>
              <span className="text-[9px] text-muted-foreground uppercase font-bold">Happy Stores</span>
            </div>
            <div className="h-8 w-px bg-muted" />
            <div className="flex flex-col items-center">
              <span className="text-navy font-bold text-lg">99.9%</span>
              <span className="text-[9px] text-muted-foreground uppercase font-bold">Uptime</span>
            </div>
            <div className="h-8 w-px bg-muted" />
            <div className="flex flex-col items-center">
              <div className="flex gap-0.5 text-gold mb-0.5">
                <Star className="h-2 w-2 fill-current" />
                <Star className="h-2 w-2 fill-current" />
                <Star className="h-2 w-2 fill-current" />
                <Star className="h-2 w-2 fill-current" />
                <Star className="h-2 w-2 fill-current" />
              </div>
              <span className="text-[9px] text-muted-foreground uppercase font-bold">Top Rated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
