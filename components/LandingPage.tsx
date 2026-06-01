"use client";

import { useEffect, useState } from "react";

type LandingPageProps = {
  onStartClick: () => void;
};

// Custom typewriter component for smooth letter-by-letter typing simulation
function Typewriter({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

export function LandingPage({ onStartClick }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  // Auto cycle through walkthrough simulator states every 5.5 seconds for a relaxed reading pacing
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev === 3 ? 1 : (prev + 1) as 1 | 2 | 3));
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#090d12] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-violet-500/30 selection:text-white">
      
      {/* Background Unsplash Blend with Luxury Deep Gradients */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.06] pointer-events-none mix-blend-luminosity scale-105 transition-transform duration-1000"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=1600&q=80')" 
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#090d12] via-transparent to-[#090d12] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06),transparent_60%)] pointer-events-none" />

      {/* Top Navigation */}
      <header className="border-b border-white/5 backdrop-blur-md sticky top-0 z-40 bg-[#090d12]/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-[0_0_20px_rgba(124,58,237,0.25)]">
              H
            </div>
            <span className="text-xl font-bold tracking-tight text-white">HireFlow</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[10px] uppercase tracking-widest text-slate-400 font-semibold font-mono">
            <span className="hover:text-white cursor-pointer transition">Copilot Hub</span>
            <span className="hover:text-white cursor-pointer transition">SaaS Dashboard</span>
            <span className="hover:text-white cursor-pointer transition">Evaluations</span>
          </nav>

          <button
            type="button"
            onClick={onStartClick}
            className="rounded-md border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-violet-400 transition hover:bg-violet-500 hover:text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]"
          >
            Start Interview
          </button>
        </div>
      </header>

      {/* Main Hero & Presentation */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 md:py-24 space-y-28 z-10 relative">
        
        {/* Hero Section */}
        <section className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6 text-left max-w-xl">
            <div className="inline-flex items-center gap-2 border border-violet-500/15 bg-violet-500/5 px-3 py-1 rounded-full text-xs font-medium text-violet-400 animate-pulse-glow">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              Advanced AI Dual-Layer Intelligence
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Practice interviews with an AI that <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">actually prepares you.</span>
            </h1>

            <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-lg">
              Get role-specific mock interviews, real-time feedback, communication insights, and a clear improvement plan before your actual interview.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center">
              <button
                type="button"
                onClick={onStartClick}
                className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white px-8 py-4 text-xs font-bold tracking-widest uppercase transition shadow-[0_0_30px_rgba(124,58,237,0.25)]"
              >
                Start practicing
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto rounded-lg border border-white/5 bg-slate-900/60 hover:bg-slate-800 px-8 py-4 text-xs font-bold tracking-widest uppercase transition text-slate-300 text-center"
              >
                View demo
              </a>
            </div>

            {/* Micro Social Proof Strip */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold font-mono">Trusted by candidates securing offers at</p>
              <div className="flex gap-4 items-center opacity-40 grayscale contrast-200">
                <span className="text-xs font-bold tracking-tight text-white font-mono">VERCEL</span>
                <span className="text-xs font-bold tracking-tight text-white font-mono">STRIPE</span>
                <span className="text-xs font-bold tracking-tight text-white font-mono">SUPABASE</span>
                <span className="text-xs font-bold tracking-tight text-white font-mono">LINEAR</span>
              </div>
            </div>
          </div>

          {/* Programmatic Animated Walkthrough Simulator (Moving Elements) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono px-2">
              <span>Interactive Telemetry Walkthrough</span>
              <span className="text-violet-400 tracking-wider">Step {activeTab} of 3</span>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-5 shadow-2xl relative min-h-[350px] flex flex-col justify-between overflow-hidden">
              
              {/* Tab navigation headers */}
              <div className="flex border-b border-white/5 pb-3">
                {[
                  { id: 1, label: "Setup" },
                  { id: 2, label: "Interview" },
                  { id: 3, label: "Evaluation" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as 1 | 2 | 3)}
                    className={`pb-1.5 text-[10px] font-bold uppercase tracking-wider border-b-2 mr-6 transition-all duration-300 ${
                      activeTab === tab.id
                        ? "border-violet-500 text-violet-400"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Simulation Screen Content */}
              <div className="flex-1 flex items-center py-4">
                
                {/* State 1: Setup */}
                {activeTab === 1 && (
                  <div className="w-full space-y-3 transition-opacity duration-500 ease-in-out">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-widest text-violet-400 font-bold">1. Parameter Calibration</span>
                      <h4 className="text-sm font-bold text-white">Target Position & JD Specifications</h4>
                    </div>
                    <div className="rounded-lg bg-[#090d12]/80 border border-white/5 p-3 text-left font-mono space-y-2 relative overflow-hidden">
                      <div className="flex items-center justify-between text-[8px] text-slate-500">
                        <span>Pasting: Senior Frontend Engineer</span>
                        <span className="text-teal-400 font-bold">PDF PARSED</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-300 h-10 overflow-hidden">
                        <Typewriter text={`{ "skills": ["React", "Next.js", "TailwindCSS"], "experience": "Mid-Senior" }`} speed={15} />
                      </p>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 animate-pulse-glow" style={{ width: "80%" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* State 2: Active Room */}
                {activeTab === 2 && (
                  <div className="w-full space-y-4 transition-opacity duration-500 ease-in-out">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase tracking-widest text-violet-400 font-bold">2. Distraction-Free Room</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                    </div>
                    
                    <div className="grid gap-3 grid-cols-[1fr_90px]">
                      {/* Typewriter Mock Question */}
                      <div className="rounded-lg bg-[#090d12]/80 border border-white/5 p-3 text-left space-y-1 relative min-h-[72px]">
                        <span className="text-[8px] uppercase tracking-widest text-teal-400 font-bold">AI Interviewer</span>
                        <p className="text-[10px] text-slate-200 leading-relaxed font-mono">
                          <Typewriter text="Can you explain the key performance optimization tradeoffs in Next.js Server Components?" speed={25} />
                        </p>
                      </div>

                      {/* Mock webcam */}
                      <div className="rounded-lg bg-slate-950 border border-white/5 relative overflow-hidden flex items-center justify-center aspect-video h-full">
                        <div className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                        <span className="text-[7px] uppercase tracking-widest text-slate-600 font-mono font-bold">Webcam</span>
                        {/* Interactive scanline animation */}
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-teal-400/40 shadow-[0_0_8px_rgba(45,212,191,0.5)] animate-bounce" />
                      </div>
                    </div>

                    {/* Speech wave mockup with smooth pulsing */}
                    <div className="flex gap-1 justify-center items-center h-5">
                      {[1, 3, 2, 4, 3, 5, 3, 4, 2, 3, 1].map((bar, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-violet-400 rounded-full animate-pulse"
                          style={{ 
                            height: `${bar * 4}px`,
                            animationDelay: `${i * 150}ms`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* State 3: Evaluation hub */}
                {activeTab === 3 && (
                  <div className="w-full space-y-4 transition-opacity duration-500 ease-in-out">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-widest text-violet-400 font-bold">3. Telemetry Scorecard</span>
                      <h4 className="text-sm font-bold text-white">Consensus Evaluation Reports</h4>
                    </div>

                    <div className="grid gap-3 grid-cols-2">
                      <div className="rounded-lg border border-teal-500/15 bg-teal-500/[0.02] p-3 text-left shadow-lg">
                        <span className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block">Consensus Call</span>
                        <p className="text-lg font-extrabold text-teal-400">STRONG HIRE</p>
                      </div>
                      
                      <div className="rounded-lg border border-white/5 bg-[#090d12]/50 p-3 text-left space-y-1 shadow-lg">
                        <span className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block">Competency Score</span>
                        <p className="text-lg font-extrabold text-white font-mono">88%</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/5 bg-[#090d12]/40 p-3 text-left text-[9px] text-slate-400 leading-relaxed font-mono min-h-[44px]">
                      <Typewriter text="STAR format response checks successfully completed. High competency indicators recorded." speed={20} />
                    </div>
                  </div>
                )}

              </div>

              {/* Progress indicator timeline dot controls */}
              <div className="flex justify-center gap-2.5 pt-3 border-t border-white/5">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveTab(num as 1 | 2 | 3)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeTab === num ? "bg-violet-400 w-4.5" : "bg-slate-700 w-1.5"
                    }`}
                  />
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-violet-400 font-mono">Capabilities Matrix</span>
            <h2 className="text-3xl font-bold text-white tracking-tight">Full-Spectrum Interview Simulation</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Simulate actual target corporate panels with parallel tracking of vocal, visual, and screen parameters.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Feature 1 */}
            <div className="rounded-xl border border-white/5 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 hover:border-white/10 transition group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider group-hover:text-violet-400 transition-colors">Resume-Aware Interviews</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Generates questions dynamically matching your stated skills, past technical accomplishments, metrics, and technology stacks.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-white/5 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 hover:border-white/10 transition group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider group-hover:text-violet-400 transition-colors">Dynamic Follow-Up Probing</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Goes beyond flat lists. The AI active listener drills down into your technical solutions, questioning architectural tradeoffs and edge conditions.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-white/5 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 hover:border-white/10 transition group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider group-hover:text-violet-400 transition-colors">Voice Interview Simulation</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Allows direct verbal responses. Real-time audio synthesis and built-in speech-to-text recognition remove the overhead of keyboard inputs.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-white/5 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 hover:border-white/10 transition group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider group-hover:text-violet-400 transition-colors">Coding Screen Capture</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Enables visual verification for coding and system architecture questions by sharing and capturing live screenshot artifacts.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border border-white/5 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 hover:border-white/10 transition group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider group-hover:text-violet-400 transition-colors">Expert Answer Rewrite</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Reveals exact knowledge gaps. Generative engine compares your transcripts side-by-side with senior-level professional responses.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border border-white/5 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 hover:border-white/10 transition group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider group-hover:text-violet-400 transition-colors">Non-Verbal Webcam Feedback</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Analyzes your presence and posture metrics locally using camera tracking (eye contact, alignment) without uploading raw stream files.
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/40 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 HireFlow Technologies. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer transition">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer transition">Security Compliance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
