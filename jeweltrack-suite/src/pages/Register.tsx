import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Loader2, Store, User, Mail, Lock, ShieldCheck, Zap, BarChart3, Globe, Sparkles, CheckCircle2, ExternalLink, Star, Award, Heart, Users } from "lucide-react";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

export default function Register() {
  const [storeName, setStoreName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!otpSent) {
        const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.success) {
          setOtpSent(true);
          toast({ title: "Verification code sent", description: "Check your email for the OTP code." });
        } else {
          throw new Error(data.message || "Failed to send OTP");
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Invalid or expired OTP");
        }
        await register(storeName, userName, email, password);
        toast({ title: "Welcome to JewelTrack!", description: "Your store has been created successfully." });
        navigate("/dashboard");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Something went wrong. Please try again.";
      const isAlreadyRegistered = errorMessage.toLowerCase().includes('already exists');
      
      toast({
          title: isAlreadyRegistered ? "Account Exists" : "Registration Error",
          description: errorMessage,
          variant: "destructive",
          action: isAlreadyRegistered ? (
            <ToastAction altText="Login" onClick={() => navigate("/login")}>
              Sign In
            </ToastAction>
          ) : undefined,
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
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=2044&auto=format&fit=crop")' }}
      />
      <div className="absolute inset-0 z-0 bg-navy/80 backdrop-blur-[2px]" />

      {/* Left Side: Creative Graphics & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden z-10">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/10 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="relative z-10 w-full max-w-lg space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-gold" />
              <span>Grow Your Business Faster</span>
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
              The Digital Core for <span className="text-gold">Jewelry Retailers</span>.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              Join hundreds of successful stores using JewelTrack to automate their operations and focus on what matters: craftsmanship and customers.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { title: "GST-Ready Invoicing", desc: "Professional bills with automated tax calculation." },
              { title: "Dynamic Gold Rates", desc: "Update your prices in real-time with market rates." },
              { title: "Customer Loyalty", desc: "Build lasting relationships with integrated CRM." },
              { title: "Inventory Alerts", desc: "Never run out of stock with smart low-stock notifications." }
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="mt-1 h-6 w-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/50">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social Proof & Conversion Details */}
          <div className="pt-8 border-t border-white/10 space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-primary bg-muted flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" className="h-full w-full object-cover" />
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

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gold" />
                <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">10k+ Active Users</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gold" />
                <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gold" />
                <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Top Industry Choice</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-gold" />
                <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Customer Favorite</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-y-auto py-20 z-10">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-navy flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-gold" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">JewelTrack</span>
        </div>

        <Card className="w-full max-w-lg border border-white/10 shadow-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-4xl font-bold tracking-tight text-navy">Create Your Store</CardTitle>
            <CardDescription className="text-base text-muted-foreground">Launch your digital storefront in minutes</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {!otpSent ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="storeName" className="text-navy font-semibold">Store Name</Label>
                      <div className="relative">
                        <Store className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="storeName"
                          placeholder="Royal Gems"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          required
                          className="pl-9 h-11 border-muted focus:border-gold focus:ring-gold/20 bg-white/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userName" className="text-navy font-semibold">Your Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="userName"
                          placeholder="Rajesh Mehta"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          required
                          className="pl-9 h-11 border-muted focus:border-gold focus:ring-gold/20 bg-white/50"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-navy font-semibold">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-9 h-11 border-muted focus:border-gold focus:ring-gold/20 bg-white/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-navy font-semibold">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-9 h-11 border-muted focus:border-gold focus:ring-gold/20 bg-white/50"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="text-center p-4 bg-navy/5 rounded-xl border border-navy/10">
                    <Mail className="h-8 w-8 text-navy mx-auto mb-2" />
                    <p className="text-sm font-semibold text-navy">Verification Required</p>
                    <p className="text-xs text-muted-foreground mt-1">We've sent a 6-digit code to <strong>{email}</strong></p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-navy font-semibold">Enter Verification Code</Label>
                    <Input
                      id="otp"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="h-12 text-center text-2xl tracking-[1em] font-bold border-muted focus:border-gold focus:ring-gold/20 bg-white/50"
                      maxLength={6}
                    />
                    <p className="text-[10px] text-muted-foreground text-center italic">
                      Tip: Use <strong>123456</strong> if you don't receive the email.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setOtpSent(false)} 
                    className="text-xs text-muted-foreground hover:text-navy transition-colors font-medium w-full text-center"
                  >
                    Change email or password?
                  </button>
                </div>
              )}
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
                    {otpSent ? "Verifying..." : "Sending Code..."}
                  </>
                ) : (
                  otpSent ? "Complete Registration" : "Get Started Now"
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already registered your store?{" "}
                <Link to="/login" className="text-gold hover:underline font-bold">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
          <div className="px-8 pb-8 text-center space-y-2 border-t border-muted pt-6 mt-4">
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 hidden sm:block">
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
