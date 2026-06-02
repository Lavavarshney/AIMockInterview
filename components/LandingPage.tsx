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

  // Auto cycle through walkthrough simulator states every 6 seconds for a relaxed reading pacing
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev === 3 ? 1 : (prev + 1) as 1 | 2 | 3));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-teal-500/30 selection:text-white">
      
      {/* Luxury Background Grid & Spotlights */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0c111c_1px,transparent_1px),linear-gradient(to_bottom,#0c111c_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Glowing pulsing accent spotlights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-violet-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

      {/* Main Hero & Presentation */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 md:py-24 space-y-32 z-10 relative w-full">
        
        {/* Hero Section */}
        <section className="grid gap-12 lg:grid-cols-12 items-center">
          
          {/* Left Column: Premium Pitch */}
          <div className="space-y-6 text-left lg:col-span-7 max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-teal-500/15 bg-teal-500/5 px-3 py-1 rounded-full text-xs font-semibold text-teal-400 tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              Advanced Telemetry Scoping Round
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
              Stand Out in your next{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-400">
                Software Eng. Interview
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-lg font-sans">
              Expert-led AI mock interviews, live workspace capture, non-verbal telemetry insights, and comparative FAANG rewrites designed to calibrate your real-world readiness.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center">
              <button
                type="button"
                onClick={onStartClick}
                className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 px-8 py-4 text-xs font-black tracking-widest uppercase transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(20,184,166,0.3)]"
              >
                Start practicing
              </button>
              
              <a
                href="#features"
                className="w-full sm:w-auto rounded-lg border border-white/5 bg-[#0d131a]/60 hover:bg-[#121820] hover:text-white px-8 py-4 text-xs font-bold tracking-widest uppercase transition-all duration-300 text-slate-300 text-center border-t-white/10"
              >
                Explore Features
              </a>
            </div>

            {/* Trust Logo Bar matching HELLO INTERVIEW */}
            <div className="pt-8 border-t border-white/5 space-y-3">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Our candidates regularly receive offers from</p>
              <div className="flex flex-wrap gap-x-6 gap-y-3 items-center opacity-45 grayscale contrast-200">
                <span className="text-xs font-black tracking-tight text-white font-mono hover:text-teal-400 hover:opacity-100 transition-all cursor-default">MICROSOFT</span>
                <span className="text-xs font-black tracking-tight text-white font-mono hover:text-teal-400 hover:opacity-100 transition-all cursor-default">META</span>
                <span className="text-xs font-black tracking-tight text-white font-mono hover:text-teal-400 hover:opacity-100 transition-all cursor-default">GOOGLE</span>
                <span className="text-xs font-black tracking-tight text-white font-mono hover:text-teal-400 hover:opacity-100 transition-all cursor-default">AMAZON</span>
                <span className="text-xs font-black tracking-tight text-white font-mono hover:text-teal-400 hover:opacity-100 transition-all cursor-default">NETFLIX</span>
                <span className="text-xs font-black tracking-tight text-white font-mono hover:text-teal-400 hover:opacity-100 transition-all cursor-default">OPENAI</span>
              </div>
            </div>
          </div>

          {/* Right Column: HELLO INTERVIEW style Floating Parallax Cut-out & Offset Frame */}
          <div className="lg:col-span-5 flex justify-center items-center relative py-10 lg:py-0 select-none">
            
            {/* Dynamic Offset Frame Silhouette */}
            <div className="relative w-72 h-80 sm:w-80 sm:h-96 group cursor-default">
              
              {/* Back Offset Border Contour (Animate float) */}
              <div className="absolute inset-0 rounded-2xl border-4 border-teal-400 transform translate-x-4 translate-y-4 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2 pointer-events-none" />
              
              {/* Main Image Frame (Floating above) */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#121820] to-[#0c111c] border border-white/10 shadow-2xl transition-all duration-500 transform group-hover:-translate-x-1 group-hover:-translate-y-1">
                {/* Embedded smiling developer portrait cut-out from Unsplash */}
                <div 
                  className="w-full h-full bg-cover bg-center mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 opacity-80 group-hover:scale-105"
                  style={{ 
                    backgroundImage: "url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80')" 
                  }}
                />
                
                {/* Accent scanlines or gradient maps */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
              </div>

              {/* Sunburst radial vector lines popping behind developer */}
              <div className="absolute -top-6 -right-6 w-20 h-20 opacity-20 group-hover:rotate-45 transition-transform duration-1000 pointer-events-none">
                <svg viewBox="0 0 100 100" fill="none" stroke="#14b8a6" strokeWidth="6" className="w-full h-full">
                  <path d="M50 0v100M0 50h100M15 15l70 70M85 15L15 85" />
                </svg>
              </div>

              {/* Floating Real-time Telemetry Pill A */}
              <div className="absolute top-10 -left-12 rounded-full border border-teal-500/20 bg-slate-950/80 backdrop-blur px-3 py-1.5 text-[9px] font-bold text-teal-400 uppercase tracking-widest shadow-xl flex items-center gap-1.5 transform hover:scale-105 transition animate-bounce" style={{ animationDuration: '3s' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                Domain: Expert
              </div>

              {/* Floating Real-time Telemetry Pill B */}
              <div className="absolute bottom-16 -right-10 rounded-full border border-violet-500/20 bg-slate-950/80 backdrop-blur px-3 py-1.5 text-[9px] font-bold text-violet-400 uppercase tracking-widest shadow-xl flex items-center gap-1.5 transform hover:scale-105 transition animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                STAR Logic: Passed
              </div>

              {/* Floating Real-time Telemetry Pill C */}
              <div className="absolute -bottom-4 left-10 rounded-full border border-pink-500/20 bg-slate-950/80 backdrop-blur px-3.5 py-1.5 text-[9px] font-bold text-pink-400 uppercase tracking-widest shadow-xl flex items-center gap-1.5 transform hover:scale-105 transition animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
                Articulation: 94%
              </div>

            </div>

          </div>

        </section>

        {/* Dynamic Walkthrough Simulator terminal console (Interactive 3D-Tilt Console) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono px-2 gap-2">
            <span>Dynamic Telemetry Simulation Engine</span>
            <span className="text-teal-400 font-extrabold bg-teal-400/5 border border-teal-500/10 px-2.5 py-0.5 rounded tracking-widest uppercase">
              Step {activeTab} of 3 • Active Calibration
            </span>
          </div>

          {/* Terminal Console with CSS 3D Tilt perspective effect */}
          <div 
            className="rounded-2xl border border-white/5 bg-[#0d131a]/95 p-5 shadow-2xl relative min-h-[380px] flex flex-col justify-between overflow-hidden transition-all duration-500 ease-out transform hover:rotate-x-2 hover:-rotate-y-2 hover:scale-[1.01] hover:border-teal-500/25 border-t-white/10"
            style={{ 
              perspective: '1200px',
              transformStyle: 'preserve-3d' 
            }}
          >
            {/* Red, Yellow, Green Window Dots */}
            <div className="flex border-b border-white/5 pb-3 items-center justify-between">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/20 border border-rose-500/35" />
                <span className="h-3 w-3 rounded-full bg-amber-500/20 border border-amber-500/35" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/20 border border-emerald-500/35" />
              </div>
              
              {/* Tab Navigation header */}
              <div className="flex gap-6">
                {[
                  { id: 1, label: "1. Calibration" },
                  { id: 2, label: "2. Live Room" },
                  { id: 3, label: "3. Scorecard" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as 1 | 2 | 3)}
                    className={`pb-1 text-[9px] font-bold uppercase tracking-wider border-b-2 transition-all duration-300 ${
                      activeTab === tab.id
                        ? "border-teal-400 text-teal-400"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Console content slot */}
            <div className="flex-1 flex items-center py-6" style={{ transform: 'translateZ(20px)' }}>
              
              {/* Tab 1: Calibration */}
              {activeTab === 1 && (
                <div className="w-full space-y-4 transition-opacity duration-500 ease-in-out">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-teal-400 font-extrabold">Scope Parameter Calibration</span>
                    <h4 className="text-base font-bold text-white tracking-tight">Parser Extraction Results</h4>
                  </div>
                  
                  <div className="rounded-xl bg-[#06090e]/80 border border-white/5 p-4 text-left font-mono space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between text-[8px] text-slate-500 pb-1.5 border-b border-white/5">
                      <span>File Target: resume.pdf</span>
                      <span className="text-teal-400 font-bold tracking-widest uppercase">READY ROUND</span>
                    </div>
                    
                    <p className="text-[10.5px] leading-relaxed text-slate-300 h-12 overflow-hidden whitespace-pre-wrap font-mono">
                      <Typewriter text={`{ "target": "Software Engineer", "focus": "System Design & Optimization", "exp": "Mid-Senior" }`} speed={15} />
                    </p>

                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 animate-pulse" style={{ width: "85%" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Live Room */}
              {activeTab === 2 && (
                <div className="w-full space-y-5 transition-opacity duration-500 ease-in-out">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest text-teal-400 font-extrabold">Active Assessment room</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 text-[8px] font-bold text-rose-400 uppercase tracking-widest">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                      REC ACTIVE
                    </span>
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-[1fr_120px]">
                    {/* Interview Prompt */}
                    <div className="rounded-xl bg-[#06090e]/80 border border-white/5 p-4 text-left space-y-1.5 min-h-[84px]">
                      <span className="text-[8px] uppercase tracking-widest text-teal-400 font-extrabold">AI PANEL PROMPT</span>
                      <p className="text-[11px] text-slate-200 leading-relaxed font-mono">
                        <Typewriter text="Can you walk me through your technical approach to scaling high-throughput APIs under constraint environments?" speed={20} />
                      </p>
                    </div>

                    {/* Camera view */}
                    <div className="rounded-xl bg-slate-950 border border-white/5 relative overflow-hidden flex items-center justify-center aspect-video md:aspect-auto h-24 md:h-full">
                      <div className="absolute top-1.5 left-1.5 h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-[7px] uppercase tracking-widest text-slate-500 font-mono font-bold">Local Stream</span>
                      {/* Laser scanner effect */}
                      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-teal-400/40 shadow-[0_0_8px_rgba(20,184,166,0.6)] animate-bounce" />
                    </div>
                  </div>

                  {/* Pulsing vocal wave mockup */}
                  <div className="flex gap-1 justify-center items-center h-6">
                    {[1, 3, 2, 4, 3, 5, 4, 6, 4, 5, 3, 4, 2, 3, 1].map((bar, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-gradient-to-t from-violet-500 to-teal-400 rounded-full animate-pulse"
                        style={{ 
                          height: `${bar * 4}px`,
                          animationDelay: `${i * 120}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Scorecard */}
              {activeTab === 3 && (
                <div className="w-full space-y-4 transition-opacity duration-500 ease-in-out">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-teal-400 font-extrabold">Telemetry Synthesis Report</span>
                    <h4 className="text-base font-bold text-white tracking-tight">Hiring Consensus metrics</h4>
                  </div>

                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    <div className="rounded-xl border border-teal-500/15 bg-teal-500/[0.02] p-3 text-left shadow-lg">
                      <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold block">Consensus Call</span>
                      <p className="text-base font-black text-teal-400 uppercase tracking-widest pt-1">STRONG HIRE</p>
                    </div>
                    
                    <div className="rounded-xl border border-white/5 bg-[#06090e]/50 p-3 text-left space-y-0.5 shadow-lg">
                      <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold block">Competency Score</span>
                      <p className="text-base font-extrabold text-white font-mono pt-0.5">88%</p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-[#06090e]/50 p-3 text-left space-y-0.5 shadow-lg">
                      <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold block">Articulation</span>
                      <p className="text-base font-extrabold text-white font-mono pt-0.5">92%</p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-[#06090e]/50 p-3 text-left space-y-0.5 shadow-lg">
                      <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold block">Non-Verbal Focus</span>
                      <p className="text-base font-extrabold text-white font-mono pt-0.5">Passed</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#06090e]/40 p-4 text-left text-[10.5px] text-slate-400 leading-relaxed font-mono min-h-[48px]">
                    <Typewriter text="Evaluation completed: Star structure verification passed. Core vocabulary matches target job description specifications." speed={15} />
                  </div>
                </div>
              )}

            </div>

            {/* Simulated progress dot controls */}
            <div className="flex justify-center gap-3 pt-3 border-t border-white/5">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setActiveTab(num as 1 | 2 | 3)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeTab === num ? "bg-teal-400 w-5" : "bg-slate-700 w-1.5"
                  }`}
                />
              ))}
            </div>

          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-teal-400 font-mono">Capabilities Matrix</span>
            <h2 className="text-3xl font-bold text-white tracking-tight">Full-Spectrum Mock Platform</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Simulate actual target corporate panels with parallel tracking of vocal, visual, and screen parameters.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Feature 1 */}
            <div className="rounded-xl border border-white/5 bg-[#0d131a]/60 p-6 flex flex-col justify-between space-y-4 hover:border-teal-500/20 hover:bg-[#121820]/60 transition-all duration-300 group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-teal-400 transition-colors">Resume-Aware Interviews</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Generates questions dynamically matching your stated skills, past technical accomplishments, metrics, and technology stacks.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-white/5 bg-[#0d131a]/60 p-6 flex flex-col justify-between space-y-4 hover:border-teal-500/20 hover:bg-[#121820]/60 transition-all duration-300 group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-teal-400 transition-colors">Dynamic Follow-Up Probing</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Goes beyond flat lists. The AI active listener drills down into your technical solutions, questioning architectural tradeoffs and edge conditions.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-white/5 bg-[#0d131a]/60 p-6 flex flex-col justify-between space-y-4 hover:border-teal-500/20 hover:bg-[#121820]/60 transition-all duration-300 group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-teal-400 transition-colors">Voice Interview Simulation</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Allows direct verbal responses. Real-time audio synthesis and built-in speech-to-text recognition remove the overhead of keyboard inputs.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-white/5 bg-[#0d131a]/60 p-6 flex flex-col justify-between space-y-4 hover:border-teal-500/20 hover:bg-[#121820]/60 transition-all duration-300 group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-teal-400 transition-colors">Coding Screen Capture</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Enables visual verification for coding and system architecture questions by sharing and capturing live screenshot artifacts.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border border-white/5 bg-[#0d131a]/60 p-6 flex flex-col justify-between space-y-4 hover:border-teal-500/20 hover:bg-[#121820]/60 transition-all duration-300 group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-teal-400 transition-colors">Expert Answer Rewrite</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Reveals exact knowledge gaps. Generative engine compares your transcripts side-by-side with senior-level professional responses.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border border-white/5 bg-[#0d131a]/60 p-6 flex flex-col justify-between space-y-4 hover:border-teal-500/20 hover:bg-[#121820]/60 transition-all duration-300 group hover:shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-teal-400 transition-colors">Non-Verbal Feedback</h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  Analyzes your presence and posture metrics locally using camera tracking (eye contact, alignment) without uploading raw stream files.
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/20 py-8 px-6 text-center text-xs text-slate-500 relative z-10">
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
