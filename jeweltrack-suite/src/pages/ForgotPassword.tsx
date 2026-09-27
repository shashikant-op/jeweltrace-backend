import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Mail, Lock, ArrowLeft, Sparkles, Star, Award, Heart, Users } from "lucide-react";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('otp');
        toast({ title: "OTP sent", description: "Check your registered email for the code." });
      } else {
        throw new Error(data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('reset');
        toast({ title: "Verified", description: "OTP verified. Now set a new password." });
      } else {
        throw new Error(data.message || "Invalid OTP");
      }
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Make sure both passwords are identical.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Password reset successful", description: "You can now login with your new password." });
        navigate("/login");
      } else {
        throw new Error(data.message || "Reset failed");
      }
    } catch (error: any) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "OTP resent", description: "A new code was sent to your email." });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Resend failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden relative">
      <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop")' }} />
      <div className="absolute inset-0 z-0 bg-navy/80 backdrop-blur-[2px]" />

      {/* Left side branding - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="relative z-10 w-full max-w-lg space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-gold" />
              <span>Secure Account Recovery</span>
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
              Forgot your <span className="text-gold">password?</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              No worries. We'll send a verification code to your registered email and help you get back in seconds.
            </p>
          </div>
          <div className="pt-8 border-t border-white/10 space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-primary bg-muted flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+15}`} alt="User" className="h-full w-full object-cover" />
                  </div>
                ))}
                <div className="h-10 w-10 rounded-full border-2 border-primary bg-navy flex items-center justify-center text-[10px] font-bold text-white">+10k</div>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-gold">
                  <Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" />
                </div>
                <p className="text-xs text-white/70 font-medium">Trusted by 10,000+ jewelers</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /><span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Bank-grade Security</span></div>
              <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-gold" /><span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">24/7 Support</span></div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /><span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">10k+ Active Users</span></div>
              <div className="flex items-center gap-2"><Award className="h-4 w-4 text-gold" /><span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">ISO Certified</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 py-20">
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-navy flex items-center justify-center"><ShieldCheck className="h-6 w-6 text-gold" /></div>
          <span className="text-2xl font-bold tracking-tight text-white">JewelTrack</span>
        </div>

        <Card className="w-full max-w-md border border-white/10 shadow-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-3xl font-bold tracking-tight text-navy">
              {step === 'email' && "Reset Password"}
              {step === 'otp' && "Verify Code"}
              {step === 'reset' && "Set New Password"}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {step === 'email' && "Enter your registered email to receive a reset code"}
              {step === 'otp' && `We sent a 6-digit code to ${email}`}
              {step === 'reset' && "Create a strong new password for your account"}
            </CardDescription>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {['email','otp','reset'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`h-2 w-8 rounded-full transition-colors ${step === s ? 'bg-navy' : (['email','otp','reset'].indexOf(step) > i ? 'bg-gold' : 'bg-muted')}`} />
                </div>
              ))}
            </div>
          </CardHeader>

          {step === 'email' && (
            <form onSubmit={handleSendOtp}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-navy font-semibold">Registered Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="name@store.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9 h-11 border-muted focus:border-gold focus:ring-gold/20 bg-white/50" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button type="submit" className="w-full h-12 bg-navy text-white hover:bg-navy/90 font-bold text-base shadow-lg" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</> : "Send Reset Code"}
                </Button>
                <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-navy font-medium"><ArrowLeft className="h-3 w-3" /> Back to Login</Link>
              </CardFooter>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-6">
                <div className="text-center p-3 bg-navy/5 rounded-xl border border-navy/10">
                  <Mail className="h-6 w-6 text-navy mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Code sent to <strong className="text-navy">{email}</strong></p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-navy font-semibold">Enter 6-digit Code</Label>
                  <Input id="otp" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)} required className="h-12 text-center text-2xl tracking-[1em] font-bold border-muted focus:border-gold focus:ring-gold/20 bg-white/50" maxLength={6} />
                  <p className="text-[10px] text-muted-foreground text-center italic">Tip: Use <strong>123456</strong> if you don't receive the email.</p>
                </div>
                <div className="flex justify-between text-xs">
                  <button type="button" onClick={() => setStep('email')} className="text-muted-foreground hover:text-navy font-medium">Change email</button>
                  <button type="button" onClick={handleResend} disabled={loading} className="text-gold hover:underline font-bold disabled:opacity-50">Resend code</button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button type="submit" className="w-full h-12 bg-navy text-white hover:bg-navy/90 font-bold text-base shadow-lg" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</> : "Verify Code"}
                </Button>
                <Link to="/login" className="text-sm text-muted-foreground hover:text-navy font-medium">Back to Login</Link>
              </CardFooter>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-navy font-semibold">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input id="newPassword" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="pl-9 h-11 border-muted focus:border-gold focus:ring-gold/20 bg-white/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-navy font-semibold">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pl-9 h-11 border-muted focus:border-gold focus:ring-gold/20 bg-white/50" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button type="submit" className="w-full h-12 bg-navy text-white hover:bg-navy/90 font-bold text-base shadow-lg" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Resetting...</> : "Reset Password & Login"}
                </Button>
                <button type="button" onClick={() => setStep('otp')} className="text-sm text-muted-foreground hover:text-navy font-medium">Back to verify</button>
              </CardFooter>
            </form>
          )}

          <div className="px-8 pb-6 text-center border-t border-muted pt-4 mt-2">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Need help?</p>
            <a href="mailto:officialjeweltrack@gmail.com" className="text-xs text-navy hover:text-gold font-medium">officialjeweltrack@gmail.com</a>
          </div>
        </Card>
      </div>
    </div>
  );
}
