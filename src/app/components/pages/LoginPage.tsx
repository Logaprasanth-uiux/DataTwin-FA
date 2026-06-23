import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    // Simulate brief network delay for premium feel
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  const handleDemoAccess = () => {
    setEmail("demo@datatwin.ai");
    setPassword("demo1234");
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 600);
  };

  return (
    <div
      className="flex h-screen w-full overflow-hidden select-none bg-background text-foreground"
      style={{ fontFamily: "var(--font-family)" }}
    >
      {/* ── LEFT PANEL: Value Prop & Premium Visualizations (Desktop Only) ── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden border-r border-border bg-gradient-to-br from-[#f8fafe] via-[#f1f5f9] to-[#eef3ff] dark:from-[#0d0d11] dark:via-[#13131a] dark:to-[#181826]">
        {/* Abstract Background Blurs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />

        {/* Top Header branding */}
        <div className="flex items-center gap-2.5 z-10">
          <div
            className="flex items-center justify-center rounded-xl shadow-sm border border-border bg-card"
            style={{ width: 40, height: 40 }}
          >
            <Sparkles size={20} className="text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-lg" style={{ color: "var(--foreground)" }}>
                DataTwin
              </span>
              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-white tracking-widest uppercase">
                AI
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Finance & Procurement Operations
            </p>
          </div>
        </div>

        {/* Value Prop Headlines */}
        <div className="my-auto flex flex-col gap-8 z-10 max-w-[560px]">
          <div className="flex flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 border border-blue-100 dark:border-blue-900/50 w-fit">
              <Sparkles size={11} /> AI-Powered Procurement & Finance Operations
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight" style={{ color: "var(--foreground)" }}>
              Transform Contracts, Purchase Orders, and Invoices into Actionable Intelligence.
            </h1>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Manage procurement workflows, monitor spend utilization, track invoice status, and accelerate approvals through AI-driven automation.
            </p>
          </div>

          {/* Visualization Graph: Contract -> PO -> Invoice */}
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Real-time Procurement Lifecycle
            </p>

            <div className="flex items-center justify-between relative bg-card/65 dark:bg-card/45 backdrop-blur-md rounded-2xl p-5 border border-border shadow-sm gap-2">
              {/* Flow line background */}
              <div className="absolute left-[15%] right-[15%] top-[45%] h-[1.5px] bg-dashed border-t border-dashed border-border z-0" />
              {/* Animating dot */}
              <div className="absolute left-[15%] top-[45%] w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(79,110,247,0.8)] z-0 animate-flow" />

              {/* Node 1: Contract */}
              <div className="flex flex-col items-center gap-2 z-10 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shadow-sm">
                  <FileText size={18} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold">CT-2026-001</p>
                  <p className="text-[9px] text-muted-foreground">₹25L Limit</p>
                </div>
              </div>

              {/* Node 2: PO */}
              <div className="flex flex-col items-center gap-2 z-10 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shadow-sm">
                  <ShoppingCart size={18} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold">PO-2026-006</p>
                  <p className="text-[9px] text-muted-foreground">₹11.2L Value</p>
                </div>
              </div>

              {/* Node 3: Invoice */}
              <div className="flex flex-col items-center gap-2 z-10 flex-1">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shadow-sm">
                  <Receipt size={18} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold">INV-2026-006</p>
                  <p className="text-[9px] text-muted-foreground">₹11.2L Validated</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights & Spend Analytics indicators */}
          <div className="grid grid-cols-2 gap-4">
            {/* AI Insight Card */}
            <div className="bg-card/65 dark:bg-card/45 backdrop-blur-md rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-blue-600 text-[11px] font-bold">
                <Sparkles size={12} />
                <span>AI Insights</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                3-way match successful. Pricing conforms to contract term guidelines.
              </p>
              <div className="flex items-center gap-1 mt-1 text-[9px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40 w-fit">
                <CheckCircle size={10} /> 100% matched
              </div>
            </div>

            {/* Spend Analytics Widget */}
            <div className="bg-card/65 dark:bg-card/45 backdrop-blur-md rounded-2xl p-4 border border-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-bold">
                  <TrendingUp size={12} />
                  <span>SLA Utilization</span>
                </div>
                <span className="text-[11px] font-bold">82%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mt-3">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "82%" }} />
              </div>
              <p className="text-[9px] text-muted-foreground mt-2">
                Allocated PO value: ₹20.5L / ₹25L
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-muted-foreground z-10">
          © 2026 DataTwin AI. All rights reserved. Professional procurement automation suite.
        </p>

        {/* CSS Keyframes for visualization animation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes flow {
            0% { left: 18%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { left: 82%; opacity: 0; }
          }
          .animate-flow {
            animation: flow 4s infinite linear;
          }
        `}} />
      </div>

      {/* ── RIGHT PANEL: Main Authentication Form ── */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-12 bg-card relative">
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-blue-400/5 blur-[100px] pointer-events-none" />

        {/* Top Header branding (Mobile Only) */}
        <div className="flex lg:hidden items-center gap-2 mb-6">
          <div className="flex items-center justify-center rounded-xl border border-border bg-secondary" style={{ width: 34, height: 34 }}>
            <Sparkles size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm">DataTwin</span>
              <span className="rounded px-1.5 py-0.5 text-[8px] font-bold bg-blue-600 text-white tracking-widest uppercase">AI</span>
            </div>
          </div>
        </div>

        {/* Login form centered container */}
        <div className="my-auto mx-auto w-full max-w-[400px] flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground" style={{ fontSize: 20 }}>
              Sign in to DataTwin AI
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Enter your credentials to manage your enterprise account.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-100 dark:border-red-950/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg pl-9 pr-3 text-xs bg-secondary border border-border transition-all focus:border-blue-600 focus:bg-card focus:outline-none"
                  style={{ height: 38 }}
                />
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert("Password reset workflow is controlled by corporate directory policies. Contact IT Admin."); }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline transition-colors"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg pl-9 pr-9 text-xs bg-secondary border border-border transition-all focus:border-blue-600 focus:bg-card focus:outline-none"
                  style={{ height: 38 }}
                />
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none py-0.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-border text-blue-600 focus:ring-blue-500/20"
                style={{ width: 14, height: 14 }}
              />
              <span className="text-[11px] font-medium text-muted-foreground">
                Remember this device for 30 days
              </span>
            </label>

            {/* Primary sign in CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg flex items-center justify-center gap-2 bg-foreground text-background font-bold text-xs shadow-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
              style={{ height: 38 }}
            >
              {loading ? "Verifying..." : "Sign In"}
              {!loading && <ArrowRight size={13} />}
            </button>
          </form>

          {/* Social authentication breaks */}
          <div className="flex items-center gap-3 my-1">
            <div className="h-[1px] bg-border flex-grow" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Or Authentication via
            </span>
            <div className="h-[1px] bg-border flex-grow" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Microsoft login button */}
            <button
              onClick={() => { alert("Redirecting to Single Sign-On..."); onLogin(); }}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card text-xs font-semibold shadow-xs hover:bg-accent transition-colors cursor-pointer"
              style={{ height: 36 }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 23 23" fill="none">
                <path d="M0 0h11v11H0z" fill="#F25022" />
                <path d="M12 0h11v11H12z" fill="#7FBA00" />
                <path d="M0 12h11v11H0z" fill="#00A4EF" />
                <path d="M12 12h11v11H12z" fill="#FFB900" />
              </svg>
              <span>Microsoft</span>
            </button>

            {/* Google login button */}
            <button
              onClick={() => { alert("Redirecting to Google Identity..."); onLogin(); }}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card text-xs font-semibold shadow-xs hover:bg-accent transition-colors cursor-pointer"
              style={{ height: 36 }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Google</span>
            </button>
          </div>

          {/* Interactive Demo Environment Access */}
          <div
            onClick={handleDemoAccess}
            className="flex flex-col gap-2 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Demo Environment Access
              </span>
              <span className="text-[9px] font-semibold text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-300 rounded px-1.5 py-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                Click to Auto-fill & Login
              </span>
            </div>
            <div className="flex flex-col gap-0.5 text-[12px] leading-tight">
              <p className="font-semibold text-foreground">
                Email: <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors">demo@datatwin.ai</span>
              </p>
              <p className="font-semibold text-foreground">
                Password: <span className="font-mono text-muted-foreground">demo1234</span>
              </p>
            </div>
          </div>
        </div>

        {/* Secure Auth Footer */}
        <div className="flex flex-col items-center justify-center gap-1.5 mt-8 border-t border-border pt-4 text-center">
          <p className="text-[10px] text-muted-foreground">
            Secure enterprise authentication powered by modern identity standards.
          </p>
          <p className="text-[9px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> OAuth 2.0 · SAML 2.0 · Directory Sync Enabled
          </p>
        </div>
      </div>
    </div>
  );
}
