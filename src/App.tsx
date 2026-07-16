/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  X, 
  ArrowDown, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Layers, 
  Compass, 
  Check, 
  MessageSquare,
  Clock,
  Video,
  Monitor,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Shield,
  ShieldCheck,
  Lock,
  Terminal,
  AlertTriangle
} from 'lucide-react';

// Use standard Vite asset URL pattern to safely load the generated portrait
const editorPortrait = new URL('./assets/images/editor_portrait_1784141207039.jpg', import.meta.url).href;

// 6 High-Quality, Cinematic, Monochrome stock video loops for projects
const PROJECTS = [
  {
    id: "proj-1",
    title: "Shadow & Light",
    category: "Documentary",
    duration: "2m 14s",
    fps: "24 fps",
    resolution: "4K UHD",
    ratio: "16:9",
    client: "Urban Minimalist",
    software: "Premiere Pro / DaVinci Resolve",
    desc: "A highly cinematic short documentary exploring light and shadow play across modernist concrete structures. Cut to a heavy, slow sub-bass rhythm.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", // Tears of Steel cinematic sci-fi
    gradient: "from-neutral-900 to-neutral-950"
  },
  {
    id: "proj-2",
    title: "Rhythm of Chaos",
    category: "Music Video",
    duration: "3m 45s",
    fps: "23.976 fps",
    resolution: "4K DCI",
    ratio: "2.39:1 Anamorphic",
    client: "VNDR Music",
    software: "Premiere Pro / After Effects",
    desc: "Fast-paced, syncopated rhythm edit with glitch overlays and custom-mapped frame-skips syncing to electronic ambient breaks.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", // Sintel cinematic fantasy animation
    gradient: "from-neutral-950 to-neutral-900"
  },
  {
    id: "proj-3",
    title: "Silent Echoes",
    category: "Narrative Short",
    duration: "5m 12s",
    fps: "24 fps",
    resolution: "4K UHD",
    ratio: "16:9",
    client: "Aperture Films",
    software: "DaVinci Resolve / Premiere Pro",
    desc: "A dialogue-free short film focusing entirely on micro-expressions, pacing, and sound design. The visual rhythm guides the narrative.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", // Stable abstract motion clip
    gradient: "from-neutral-800 to-neutral-950"
  },
  {
    id: "proj-4",
    title: "Kinetic Lines",
    category: "Experimental Reel",
    duration: "1m 30s",
    fps: "30 fps",
    resolution: "1080p FHD",
    ratio: "1:1 Square",
    client: "Design Lab Co.",
    software: "After Effects / Premiere Pro",
    desc: "Experimental fusion of kinetic typography, line drawings, and frame-by-frame pacing exploring human anatomy and geometric wireframes.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // High contrast dynamic fire elements
    gradient: "from-neutral-900 to-neutral-800"
  },
  {
    id: "proj-5",
    title: "Monolith",
    category: "Brand Film",
    duration: "1m 45s",
    fps: "24 fps",
    resolution: "4K UHD",
    ratio: "2.39:1 Anamorphic",
    client: "Symmetry Architects",
    software: "DaVinci Resolve / Premiere Pro",
    desc: "Slow-paced architectural exposition showcasing stark geometries, brutalist pillars, and high-contrast concrete facades.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Elephants Dream open movie CGI elements
    gradient: "from-neutral-950 to-neutral-850"
  },
  {
    id: "proj-6",
    title: "Dark Whispers",
    category: "Thriller Promo",
    duration: "0m 45s",
    fps: "24 fps",
    resolution: "4K UHD",
    ratio: "16:9",
    client: "Grimm Productions",
    software: "Premiere Pro / After Effects",
    desc: "Tense teaser trailer with frantic jump cuts, flash-frames, and rhythmic sync to organic sound design (heartbeats, heavy breathing).",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", // High dynamic motion loop
    gradient: "from-neutral-900 to-neutral-950"
  }
];

export default function App() {
  const [introActive, setIntroActive] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [selectedProject, setSelectedProject] = useState<typeof PROJECTS[0] | null>(null);
  
  // Security Feature States
  const [securityAlert, setSecurityAlert] = useState<{ type: 'copy' | 'devtools' | 'shield'; message: string } | null>(null);
  const [secureGateUrl, setSecureGateUrl] = useState<string | null>(null);
  const [secureGateStep, setSecureGateStep] = useState<number>(0);
  
  // Track video source dynamically so state changes are handled reactively by React.
  // We initialize to null so we don't attempt to load any video before the check completes.
  const [introVideoSrc, setIntroVideoSrc] = useState<string | null>(null);
  
  // Autoplay blocking state detection
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  
  // Lightbox controller state
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);

  // Gated session storage checking on mount
  useEffect(() => {
    const hasPlayed = sessionStorage.getItem('chanduedits_intro_played');
    if (hasPlayed === 'true') {
      console.log('Intro video: session storage has played flag. Skipping intro sequence.');
      setIntroActive(false);
    } else {
      console.log('Intro video: starting new intro sequence session.');
      
      // Perform a HEAD request to check if /assets/video/web_intro.mp4 exists on the server.
      const checkVideoExists = async () => {
        try {
          console.log('Intro video: Checking if local "/assets/video/web_intro.mp4" exists on the server...');
          const response = await fetch('/assets/video/web_intro.mp4', { method: 'HEAD' });
          const contentType = response.headers.get('content-type') || '';
          if (response.ok && !contentType.toLowerCase().includes('text/html')) {
            console.log('Intro video: video file found/loaded');
            setIntroVideoSrc('/assets/video/web_intro.mp4');
          } else {
            console.log('Intro video: Local "/assets/video/web_intro.mp4" not found or is SPA HTML redirect (Status:', response.status, 'Content-Type:', contentType, '). Using fallback.');
            setIntroVideoSrc('https://www.w3schools.com/html/mov_bbb.mp4');
          }
        } catch (err) {
          console.warn('Intro video: Failed to query local video file. Using fallback.');
          setIntroVideoSrc('https://www.w3schools.com/html/mov_bbb.mp4');
        }
      };
      checkVideoExists();
    }
  }, []);

  // Premium Client-Side Security Shield Hook
  useEffect(() => {
    // 1. Right Click Protection
    const handleContextMenu = (e: MouseEvent) => {
      // Allow standard text input elements if any, but protect creative elements/viewports
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      e.preventDefault();
      setSecurityAlert({
        type: 'copy',
        message: 'CHANDUEDITS SHIELD: Media assets and creative materials are protected. Context menu disabled.'
      });
    };

    // 2. Developer Tools Hotkeys Prevention
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      const isF12 = e.key === 'F12';
      // Ctrl+Shift+I / Cmd+Opt+I
      const isInspect = (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') || 
                        (e.metaKey && e.altKey && e.key.toLowerCase() === 'i');
      // Ctrl+Shift+C / Cmd+Opt+C (Element inspector)
      const isInspectElement = (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') ||
                               (e.metaKey && e.altKey && e.key.toLowerCase() === 'c');
      // Ctrl+U / Cmd+Opt+U (View source)
      const isViewSource = (e.ctrlKey && e.key.toLowerCase() === 'u') ||
                           (e.metaKey && e.altKey && e.key.toLowerCase() === 'u');
      // Ctrl+S / Cmd+S (Save page)
      const isSavePage = (e.ctrlKey && e.key.toLowerCase() === 's') ||
                         (e.metaKey && e.key.toLowerCase() === 's');

      if (isF12 || isInspect || isInspectElement || isViewSource || isSavePage) {
        e.preventDefault();
        setSecurityAlert({
          type: 'devtools',
          message: 'SECURITY OVERLAY: Live environment source protection active. Developer panel shortcut intercepted.'
        });
      }
    };

    // 3. Content Copy Guard
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 100) {
        e.preventDefault();
        setSecurityAlert({
          type: 'copy',
          message: 'COPY LOCK: High-fidelity creative texts are copy-protected.'
        });
      }
    };

    // 4. Custom developer console banner (Easter Egg / Warning)
    console.log(
      "%c🛡️ CHANDUEDITS SECURITY MONITOR ACTIVE",
      "color: #ffffff; background: #000000; font-size: 16px; font-weight: bold; padding: 8px 16px; border: 1px solid #333; border-radius: 4px;"
    );
    console.log(
      "%cAccess to compiled workspace resources is guarded. Unauthorized cloning, hotlinking, or scraping is flagged by system protection.",
      "color: #888888; font-size: 12px; font-family: monospace;"
    );

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('copy', handleCopy);
    };
  }, []);

  // Clear security alert after duration
  useEffect(() => {
    if (securityAlert) {
      const timer = setTimeout(() => {
        setSecurityAlert(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [securityAlert]);

  // Premium Link Protection / Secure Sandbox Handshake Gate
  const triggerSecureLinkGate = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSecureGateUrl(url);
    setSecureGateStep(0);
  };

  // Handles the secure gate countdown & final execution
  useEffect(() => {
    if (secureGateUrl !== null) {
      if (secureGateStep < 4) {
        const timer = setTimeout(() => {
          setSecureGateStep(prev => prev + 1);
        }, 300); // Super fast, smooth visual checks
        return () => clearTimeout(timer);
      } else {
        // Safe, sandboxed external redirection
        const win = window.open(secureGateUrl, '_blank', 'noopener,noreferrer');
        if (win) {
          // popup successful
        } else {
          // fallback if popups are heavily blocked by iframe sandbox
          window.location.href = secureGateUrl;
        }
        setSecureGateUrl(null);
        setSecureGateStep(0);
      }
    }
  }, [secureGateUrl, secureGateStep]);

  // Reactive video loader/player when source changes
  useEffect(() => {
    if (introActive && introVideoRef.current && introVideoSrc) {
      console.log('Intro video: Attempting to play video source:', introVideoSrc);
      
      // Explicitly load the element to apply the new src
      introVideoRef.current.load();
      
      const playPromise = introVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Intro video: playback started');
            setAutoplayBlocked(false);
          })
          .catch((error) => {
            const errorMsg = error ? (error.message || String(error)) : 'Autoplay blocked';
            console.warn('Intro video: play() rejected. Autoplay blocked or failed. Error message:', errorMsg);
            setAutoplayBlocked(true);
          });
      }
    }
  }, [introVideoSrc, introActive]);

  // Update scroll tracking
  useEffect(() => {
    if (introActive) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 3;
      const sections = ['hero', 'about', 'work', 'contact'];

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const offsetTop = el.offsetTop;
          const offsetHeight = el.offsetHeight;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [introActive]);

  // Handle intro sequence completion (Skip or Completed Naturally)
  const handleSkipIntro = (isSkip: boolean = false) => {
    if (isSkip) {
      console.log('Intro video: skip triggered');
    } else {
      console.log('Intro video: playback ended');
    }

    if (introVideoRef.current) {
      try {
        introVideoRef.current.pause();
      } catch (err) {
        // Ignore any errors if pausing is not possible
      }
    }

    console.log('Intro video: transition to Hero triggered');
    sessionStorage.setItem('chanduedits_intro_played', 'true');
    setIntroActive(false);
  };

  // Fallback if local intro video doesn't exist or throws an onerror event
  const [errorTimerStarted, setErrorTimerStarted] = useState(false);

  const startFallbackTimeout = () => {
    if (errorTimerStarted) return;
    setErrorTimerStarted(true);
    console.log('Intro video: Starting 3-second fallback timeout before skipping to Hero.');
    setTimeout(() => {
      console.log('Intro video: Fallback timeout completed.');
      handleSkipIntro(false);
    }, 3000);
  };

  const handleIntroVideoError = () => {
    console.warn('Intro video: Failed to load from current source:', introVideoSrc);
    startFallbackTimeout();
  };

  // Handle video player lightbox state updates
  useEffect(() => {
    if (selectedProject && videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, selectedProject]);

  // Dynamic waveform canvas animation in the lightbox workspace
  useEffect(() => {
    if (!selectedProject || !waveformCanvasRef.current) return;
    
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const barCount = 40;
    const bars: { x: number; width: number; targetHeight: number; currentHeight: number }[] = [];

    // Initialize bars
    for (let i = 0; i < barCount; i++) {
      bars.push({
        x: (canvas.width / barCount) * i,
        width: (canvas.width / barCount) - 3,
        targetHeight: 5,
        currentHeight: 5
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#737373'; // Muted grey

      bars.forEach((bar, index) => {
        // Change height based on playback state and random noise
        if (isPlaying) {
          bar.targetHeight = Math.random() * (canvas.height - 10) + 5;
        } else {
          bar.targetHeight = 4;
        }

        // Smooth height transition
        bar.currentHeight += (bar.targetHeight - bar.currentHeight) * 0.15;

        const y = (canvas.height - bar.currentHeight) / 2;
        ctx.fillRect(bar.x, y, bar.width, bar.currentHeight);
      });

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [selectedProject, isPlaying]);

  // Keyboard navigation for video controls & escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
      }
      if (e.key === ' ' && selectedProject) {
        e.preventDefault();
        if (videoRef.current) {
          if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
          } else {
            videoRef.current.play();
            setIsPlaying(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject, isPlaying]);

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-[#f5f5f5] selection:bg-neutral-800 selection:text-white">
      {/* Background Film Grain Overlay */}
      <div className="film-grain" id="grain" />

      <AnimatePresence>
        {/* 1. INTRO SEQUENCE */}
        {introActive ? (
          <motion.div
            key="intro-screen"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ 
              opacity: 0,
              scale: 0.95,
              transition: { duration: 0.7, ease: "easeInOut" }
            }}
            className="fixed inset-0 z-50 flex flex-col justify-between bg-black overflow-hidden"
            id="intro-container"
          >
            {/* Full-bleed muted auto-playing video */}
            <div className="absolute inset-0 w-full h-full">
              {introVideoSrc && (
                <video
                  ref={introVideoRef}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onLoadedMetadata={() => console.log('Intro video: onLoadedMetadata event fired (metadata fetched).')}
                  onLoadedData={() => console.log('Intro video: video file found/loaded')}
                  onPlay={() => console.log('Intro video: playback started')}
                  onEnded={() => {
                    handleSkipIntro(false);
                  }}
                  onError={handleIntroVideoError}
                  className="w-full h-full object-cover opacity-80"
                  id="intro-video"
                >
                  <source src={introVideoSrc} type="video/mp4" />
                </video>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
            </div>

            {/* Centered Play Button Overlay if Autoplay is Blocked */}
            {autoplayBlocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md"
                id="autoplay-blocked-overlay"
              >
                <div className="max-w-md p-8 text-center space-y-6">
                  <div className="w-2 h-2 rounded-full bg-white mx-auto animate-ping" />
                  <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest block">// ACTION REQUIRED</span>
                  <p className="font-display text-sm text-neutral-300 tracking-wider">
                    BROWSER PREVENTED AUTOMATIC PLAYBACK
                  </p>
                  <button
                    onClick={() => {
                      console.log('Intro video: Centered play button clicked manually.');
                      if (introVideoRef.current) {
                        introVideoRef.current.play()
                          .then(() => {
                            console.log('Intro video: playback started');
                            setAutoplayBlocked(false);
                          })
                          .catch(err => {
                            const errorMsg = err ? (err.message || String(err)) : 'Manual play blocked';
                            console.error('Intro video: Manual play attempt failed:', errorMsg);
                          });
                      }
                    }}
                    className="inline-flex items-center gap-3 bg-[#f5f5f5] text-black hover:bg-white px-8 py-4 rounded-full font-display text-xs font-semibold tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(245,245,245,0.15)] hover:shadow-[0_0_35px_rgba(245,245,245,0.3)] hover:scale-[1.03] cursor-pointer"
                    id="manual-play-intro-btn"
                  >
                    <Play size={12} className="fill-black text-black ml-0.5" />
                    <span>PLAY INTRO REEL</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Header / Brand Overlay */}
            <div className="relative z-10 p-8 md:p-16 flex justify-between items-start w-full">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="font-display font-medium tracking-widest text-xs uppercase text-neutral-400">CHANDUEDITS / STUDIO REEL</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1, duration: 1 }}
                className="text-xs font-mono text-neutral-500"
              >
                STATION_00 // EST. 2026
              </motion.div>
            </div>

            {/* Core focus / status */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-6">
              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: [0, 0.8, 0.4, 0.8, 0], scale: 1 }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="font-display text-sm tracking-[0.3em] uppercase text-neutral-300 pointer-events-none"
              >
                Cinematic Sequence Playing
              </motion.p>
            </div>

            {/* Bottom Controls / Skip Trigger */}
            <div className="relative z-10 p-8 md:p-16 flex justify-between items-end w-full">
              <div className="text-left font-mono text-[10px] text-neutral-500 leading-relaxed max-w-xs hidden sm:block">
                TAP TO BYPASS INTRO REEL. THE SITE REVEALS CHANDU'S LATEST POST-PRODUCTION ARCHIVE, INTERACTIVE LIGHTBOX, AND CREATIVE TIMELINE.
              </div>
              
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.7, y: 0 }}
                whileHover={{ opacity: 1, x: 5 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                onClick={() => handleSkipIntro(true)}
                className="flex items-center gap-2 font-display text-xs tracking-widest uppercase text-white cursor-pointer group py-2"
                id="skip-intro-btn"
              >
                <span>SKIP INTRO</span>
                <span className="text-[10px] opacity-60 group-hover:translate-x-1 transition-transform">→</span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* MAIN SITE PORTFOLIO CONTAINER */
          <motion.div
            key="main-portfolio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col min-h-screen"
          >
            {/* Elegant Fixed Header */}
            <header className="fixed top-0 left-0 w-full z-40 bg-[#0a0a0a]/85 backdrop-blur-md border-b border-neutral-900/80 px-6 py-4 md:px-12 flex justify-between items-center transition-all duration-300">
              <a href="#hero" className="font-display font-bold text-sm tracking-[0.4em] text-white hover:text-neutral-300 transition-all duration-500 ease-out flex items-center gap-2 uppercase relative group" id="header-logo">
                <span className="relative">
                  CHANDU
                  <span className="absolute bottom-[-2px] left-0 w-0 h-[1.5px] bg-white transition-all duration-500 group-hover:w-full" />
                </span>
                <span className="text-neutral-400 font-extralight tracking-[0.3em] ml-1 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-[9px] scale-95 transition-all duration-500 group-hover:bg-white group-hover:text-black group-hover:border-white">
                  EDITS
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse relative">
                  <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                </span>
              </a>

              <div className="flex items-center gap-4 sm:gap-6 md:gap-8" id="header-right-controls">
                {/* Clean inline navigation with perfect baseline alignment */}
                <nav className="hidden md:flex items-center gap-6 md:gap-8" id="header-nav">
                  {['hero', 'about', 'work', 'contact'].map((sect) => (
                    <a
                      key={sect}
                      href={`#${sect}`}
                      onClick={() => setActiveSection(sect)}
                      className={`font-display text-[11px] tracking-widest uppercase transition-all duration-300 relative py-1 hover:text-white ${
                        activeSection === sect ? 'text-white font-medium' : 'text-neutral-500'
                      }`}
                    >
                      {sect === 'hero' ? 'HOME' : sect}
                      {activeSection === sect && (
                        <motion.span 
                          layoutId="active-indicator"
                          className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white rounded-full"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </a>
                  ))}
                </nav>

                {/* Vertical Divider (Hidden on small screens) */}
                <span className="hidden md:inline-block h-4 w-[1px] bg-neutral-800" />

                {/* Premium Custom Dropdown Option to Select Section */}
                <div className="relative" id="section-selector-container">
                  <button
                    onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                    className="flex flex-col justify-center items-center gap-1 w-9 h-9 border border-neutral-800 hover:border-neutral-700 bg-neutral-950/80 hover:bg-neutral-900 rounded-full transition-all duration-300 shadow-lg cursor-pointer"
                    id="section-selector-trigger"
                    title="Select Section"
                  >
                    <span className={`w-4 h-[1.5px] bg-white rounded-full transition-all duration-300 ${showSectionDropdown ? 'rotate-45 translate-y-[5.5px]' : ''}`} />
                    <span className={`w-4 h-[1.5px] bg-white rounded-full transition-all duration-300 ${showSectionDropdown ? 'opacity-0 scale-x-0' : 'opacity-100'}`} />
                    <span className={`w-4 h-[1.5px] bg-white rounded-full transition-all duration-300 ${showSectionDropdown ? '-rotate-45 -translate-y-[5.5px]' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showSectionDropdown && (
                      <>
                        {/* Invisible overlay backdrop to close on click outside */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowSectionDropdown(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute right-0 mt-2 w-48 bg-[#0d0d0d]/95 border border-neutral-850 rounded-xl shadow-2xl z-50 py-2 p-1 overflow-hidden backdrop-blur-xl"
                          id="section-selector-dropdown"
                        >
                          <div className="px-3 py-1.5 border-b border-neutral-900 mb-1">
                            <span className="font-mono text-[9px] text-neutral-500 tracking-wider uppercase block">SELECT SECTION</span>
                          </div>
                          {['hero', 'about', 'work', 'contact'].map((sect) => (
                            <a
                              key={sect}
                              href={`#${sect}`}
                              onClick={() => {
                                  setActiveSection(sect);
                                  setShowSectionDropdown(false);
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg font-display text-[11px] tracking-widest uppercase transition-all duration-200 ${
                                activeSection === sect 
                                  ? 'bg-neutral-900 text-white font-medium' 
                                  : 'text-neutral-400 hover:bg-neutral-900/40 hover:text-white'
                              }`}
                            >
                              <span>{sect === 'hero' ? 'HOME' : sect}</span>
                              {activeSection === sect && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              )}
                            </a>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Vertical Divider (Hidden on extra small screens) */}
                <span className="h-4 w-[1px] bg-neutral-800" />

                {/* Premium Hire Me Button */}
                <a 
                  href="#contact" 
                  onClick={() => setActiveSection('contact')}
                  className="px-4 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-full font-display text-[10px] font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-[1.03] active:scale-[0.98] inline-flex items-center justify-center whitespace-nowrap"
                  id="hire-me-btn"
                >
                  HIRE ME
                </a>
              </div>
            </header>

            {/* Left Vertical Section Tracker (Desktops) */}
            <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-6 items-center">
              <span className="h-12 w-[1px] bg-neutral-900" />
              {['hero', 'about', 'work', 'contact'].map((sect) => (
                <a
                  key={sect}
                  href={`#${sect}`}
                  className="group relative flex items-center justify-center py-1"
                  title={`Go to ${sect}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeSection === sect ? 'bg-white scale-125' : 'bg-neutral-800 group-hover:bg-neutral-400'}`} />
                  <span className="absolute left-6 font-display text-[9px] tracking-widest uppercase text-white bg-neutral-950 px-2 py-1 rounded border border-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {sect}
                  </span>
                </a>
              ))}
              <span className="h-12 w-[1px] bg-neutral-900" />
            </div>

            {/* 2. HERO SECTION */}
            <section
              id="hero"
              className="relative min-h-screen flex flex-col justify-center items-center px-6 text-center overflow-hidden pt-20"
            >
              {/* Cinematic Looping Ambient Showreel Overlay */}
              <div className="absolute inset-0 -z-10 bg-black">
                {/* Slow moving architectural/particle noise in back */}
                <video
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" // Stable abstract motion clip
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-15 filter grayscale contrast-125"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
              </div>

              {/* Massive Bold Monochrome Typography */}
              <div className="max-w-5xl mx-auto flex flex-col items-center justify-center pt-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative"
                >
                  <h1 
                    className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tighter text-white leading-none mb-6 select-none uppercase transition-all duration-500 hover:tracking-normal cursor-default"
                    id="hero-name"
                  >
                    CHANDU<span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-300 to-neutral-600">EDITS</span>
                  </h1>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 0.8, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 1.2 }}
                  className="flex items-center gap-4 text-neutral-400 mb-12"
                >
                  <span className="h-[1px] w-8 bg-neutral-700" />
                  <p className="font-display text-xs sm:text-sm tracking-[0.25em] uppercase" id="hero-tagline">
                    Frame by Frame. Story by Story.
                  </p>
                  <span className="h-[1px] w-8 bg-neutral-700" />
                </motion.div>

                {/* Subtitle brief */}
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 0.6, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 1.2 }}
                  className="max-w-xl text-xs sm:text-sm font-sans text-neutral-400 leading-relaxed font-light mb-16 px-4"
                >
                  An archival collection of rhythmic post-production, aesthetic documentary, and high-energy narrative editing.
                </motion.p>

                {/* Scroll Indicator */}
                <motion.a
                  href="#about"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  transition={{ delay: 1, duration: 1 }}
                  whileHover={{ opacity: 1, translateY: 3 }}
                  className="flex flex-col items-center gap-3 group text-neutral-400 cursor-pointer"
                  id="scroll-indicator"
                >
                  <span className="font-display text-[9px] tracking-widest uppercase">DISCOVER THE ARCHIVE</span>
                  <div className="w-6 h-10 rounded-full border border-neutral-800 flex items-start justify-center p-1.5">
                    <div className="w-1 h-2 rounded-full bg-neutral-400 animate-pulse-scroll" />
                  </div>
                </motion.a>
              </div>
            </section>

            {/* 3. ABOUT ME SECTION */}
            <section
              id="about"
              className="relative min-h-screen flex items-center justify-center px-6 py-24 md:py-32 bg-[#0d0d0d]"
            >
              <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                {/* Left Side: Portrait Placeholder / Generated Image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="relative group flex justify-center"
                >
                  <div className="relative overflow-hidden rounded border border-neutral-800 bg-neutral-900 aspect-[3/4] max-w-[270px] w-full shadow-[0_0_40px_rgba(0,0,0,0.6)]">
                    {/* Portrait overlay filter */}
                    <div className="absolute inset-0 bg-neutral-950/20 z-10 transition-opacity group-hover:bg-transparent duration-700" />
                    
                    {/* Main generated image */}
                    <img
                      src={editorPortrait}
                      alt="Portrait of Chandu - Video Editor"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter grayscale contrast-110 brightness-95 scale-100 group-hover:scale-[1.03] transition-all duration-700 ease-out"
                      id="about-portrait"
                    />

                    {/* Technical marker overlay */}
                    <div className="absolute bottom-4 left-4 z-20 font-mono text-[9px] text-neutral-400 bg-black/60 px-2 py-1 rounded tracking-widest uppercase">
                      SYS_CHANDU_001
                    </div>
                  </div>

                  {/* Background ambient lighting element */}
                  <div className="absolute -inset-2 -z-10 rounded-lg bg-neutral-400/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                </motion.div>

                {/* Right Side: Staggered text reveals */}
                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1 }}
                    className="space-y-4"
                  >
                    <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest block">// THE EDITOR</span>
                    <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[#f5f5f5]" id="about-title">
                      The Rhythm Behind The Frames.
                    </h2>
                  </motion.div>

                  <div className="space-y-6 text-neutral-400 font-sans text-sm md:text-base leading-relaxed font-light">
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ delay: 0.2, duration: 1 }}
                    >
                      I'm Chandu, a video editor who turns raw footage into stories that move people. I believe video editing is more than putting clips together—it is composing tempo, sculpting space, and directing human emotions.
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ delay: 0.4, duration: 1 }}
                    >
                      Working across cinematic documentaries, high-energy promotional campaigns, and experimental motion reels, I craft tailored rhythmic structures that highlight the message of directors and brands alike. Each project is sculpted frame-by-frame.
                    </motion.p>
                  </div>

                  {/* Creative core philosophies */}
                  <div className="pt-4 grid grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="border-l border-neutral-800 pl-4 space-y-1"
                    >
                      <span className="font-mono text-[10px] text-neutral-500 block">01 / PACING</span>
                      <span className="font-display text-xs text-neutral-300 font-medium">Rhythmic sync & beats</span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                      className="border-l border-neutral-800 pl-4 space-y-1"
                    >
                      <span className="font-mono text-[10px] text-neutral-500 block">02 / COLOR</span>
                      <span className="font-display text-xs text-neutral-300 font-medium">Moody monochrome grading</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. MY WORK SECTION */}
            <section
              id="work"
              className="relative min-h-screen px-6 py-24 md:py-32 bg-[#0a0a0a]"
            >
              <div className="max-w-6xl mx-auto w-full space-y-16">
                
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-900 pb-8">
                  <div className="space-y-4">
                    <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest block">// WORKS</span>
                    <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-[#f5f5f5]" id="work-title">
                      The Editorial Archive.
                    </h2>
                  </div>
                  <p className="max-w-md font-sans text-xs sm:text-sm text-neutral-400 font-light">
                    Click any thumbnail below to enter the interactive workspace lightbox, analyze the editing tempo, examine waveforms, and view the post-production specifications.
                  </p>
                </div>

                {/* Staggered Grid Gallery of Videos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="projects-grid">
                  {PROJECTS.map((project, idx) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: idx * 0.1, duration: 0.8 }}
                      onClick={() => {
                        setSelectedProject(project);
                        setPlaybackSpeed(1);
                        setIsPlaying(true);
                        setIsMuted(true);
                      }}
                      className="group relative flex flex-col justify-between p-6 bg-[#0e0e0e] border border-neutral-900 rounded hover:border-neutral-700 transition-all duration-300 cursor-pointer overflow-hidden aspect-[4/3] h-full"
                    >
                      {/* Interactive Visual Cue Background (subtle gradient lines) */}
                      <div className="absolute inset-0 -z-10 opacity-30 group-hover:opacity-40 transition-opacity bg-radial from-neutral-800 via-[#0a0a0a] to-[#0a0a0a]" />

                      {/* Card Header Info */}
                      <div className="flex justify-between items-start z-10 w-full">
                        <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">{project.category}</span>
                        <span className="font-mono text-[10px] text-neutral-500">{project.duration}</span>
                      </div>

                      {/* Giant Central Play Icon & Metadata */}
                      <div className="flex flex-col items-center justify-center py-6 z-10">
                        {/* Play Icon Circle */}
                        <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-950 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-neutral-400 group-hover:bg-neutral-900 transition-all duration-500">
                          <Play size={16} className="text-neutral-400 group-hover:text-white fill-neutral-400 group-hover:fill-white ml-0.5 group-hover:animate-pulse transition-all duration-300" />
                        </div>
                        <span className="font-mono text-[9px] tracking-widest text-neutral-500 uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          ENTER WORKSPACE
                        </span>
                      </div>

                      {/* Card Footer Info */}
                      <div className="z-10 space-y-2 w-full">
                        <h3 className="font-display text-lg font-medium text-neutral-200 group-hover:text-white transition-colors">
                          {project.title}
                        </h3>
                        <div className="flex justify-between text-neutral-500 font-mono text-[9px] border-t border-neutral-900 pt-2">
                          <span>{project.resolution}</span>
                          <span>{project.fps}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Swap Notice / Guidance */}
                <div className="p-6 rounded border border-neutral-900 bg-[#0d0d0d]/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 animate-ping" />
                    <div className="space-y-1">
                      <p className="font-display text-xs text-neutral-300 font-medium uppercase tracking-wider">DEVELOPER INTEGRATION DIRECTIVE</p>
                      <p className="font-sans text-[11px] text-neutral-500">You can easily swap the high-quality stock streams in <code className="bg-neutral-900 px-1 rounded">App.tsx</code> with physical movie assets or YouTube links later.</p>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-neutral-500 tracking-widest">STATION_WORK_06</span>
                </div>
              </div>
            </section>

            {/* 5. HIRE ME / CONTACT SECTION */}
            <section
              id="contact"
              className="relative min-h-[90vh] flex flex-col justify-between px-6 py-24 md:py-32 bg-[#0d0d0d] border-t border-neutral-900"
            >
              {/* Central Statement */}
              <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col items-center justify-center text-center space-y-10">
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="space-y-4"
                >
                  <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest block">// INVITATION</span>
                  <h2 className="font-display text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-[#f5f5f5] uppercase" id="contact-heading">
                    Let's create something unforgettable.
                  </h2>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 0.6, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 1 }}
                  className="max-w-lg font-sans text-xs sm:text-sm text-neutral-400 leading-relaxed font-light"
                >
                  Have an upcoming project, showreel, or video editing requirement? Let's sync up directly on WhatsApp and build a cinematic masterwork.
                </motion.p>

                {/* ONE single premium WhatsApp CTA Button */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="pt-4"
                >
                  <a
                    href="https://wa.me/919030699767?text=Hi%20Chandu%2C%20I'd%20like%20to%20discuss%20a%20video%20editing%20project!"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => triggerSecureLinkGate("https://wa.me/919030699767?text=Hi%20Chandu%2C%20I'd%20like%20to%20discuss%20a%20video%20editing%20project!", e)}
                    className="inline-flex items-center gap-3.5 bg-white text-black hover:bg-neutral-100 px-10 py-4.5 sm:px-12 sm:py-5 rounded-full font-display text-xs sm:text-sm font-black tracking-[0.25em] uppercase transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-[1.04] active:scale-[0.98] group cursor-pointer"
                    id="whatsapp-cta"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-5 h-5 text-[#25D366] transition-transform duration-300 group-hover:scale-110"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.636-1.023-5.11-2.885-6.974C16.57 1.91 14.093.883 11.458.883 6.023.883 1.597 5.311 1.594 10.749c-.001 1.673.438 3.303 1.272 4.747l-.995 3.635 3.73-.977zm11.367-7.316c-.31-.155-1.837-.907-2.122-1.01-.284-.104-.49-.155-.697.155-.206.31-.8.155-1.01.104l-1.01.815-.81.697-.69-.8c-.31-.155-.69-.49-1.32-.8-.62-.31-1.01-.81-1.14-.99s-.14-.28-.14-.28.14-.28.28-.41c.14-.14.28-.28.41-.41l.14-.14c.14-.14.2-.28.28-.41s.05-.28-.02-.41-.69-1.68-.95-2.29c-.26-.62-.51-.51-.69-.51s-.38-.02-.59-.02a1.1 1.1 0 0 0-.8.36c-.28.31-1.1 1.06-1.1 2.58s1.1 3 1.25 3.2c.15.2 2.17 3.31 5.26 4.64.74.31 1.31.5 1.77.64.74.24 1.41.21 1.94.13.59-.09 1.84-.75 2.1-1.47s.26-1.34.18-1.47c-.08-.13-.29-.21-.6-.36z"/>
                    </svg>
                    <span>HIRE ME</span>
                    <span className="text-xs group-hover:translate-x-2 transition-transform duration-300 ease-out">→</span>
                  </a>
                </motion.div>
              </div>

              {/* Footer Section */}
              <div className="max-w-6xl mx-auto w-full pt-16 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-neutral-900 text-neutral-500 font-mono text-[10px]">
                <div>
                  CHANDUEDITS © 2026 // POST-PRODUCTION DIRECTOR
                </div>
                
                <div className="flex items-center gap-4 text-neutral-600">
                  <span>DESIGNED BY CHANDU</span>
                  <span>•</span>
                  <span>MONOCHROME REEL ARCHIVE</span>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. INTERACTIVE EDITING WORKSPACE LIGHTBOX (MODAL) */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedProject(null)}
            id="lightbox-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#0b0b0b] border border-neutral-850 rounded-lg w-full max-w-5xl overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              id="lightbox-panel"
            >
              
              {/* Header: Title, Client & Exit Controls */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-900 bg-[#0e0e0e]">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-600 animate-pulse" />
                  <div className="space-y-0.5">
                    <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest block">POST_STATION_WORKSPACE // EDITING</span>
                    <h3 className="font-display text-sm md:text-base font-semibold text-[#f5f5f5] tracking-wide">
                      {selectedProject.title} — {selectedProject.category}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="w-8 h-8 rounded-full border border-neutral-800 hover:border-neutral-400 bg-neutral-950 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-300 cursor-pointer"
                  title="Close Workspace (Esc)"
                  id="close-lightbox-btn"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Main Workspace Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Left Area (8 cols): Video Player and Timeline */}
                <div className="lg:col-span-8 p-6 space-y-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-900">
                  
                  {/* Aspect Ratio Sized Video Container */}
                  <div className="relative rounded overflow-hidden bg-black border border-neutral-950 flex items-center justify-center group aspect-video">
                    
                    <video
                      ref={videoRef}
                      src={selectedProject.videoUrl}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      className="w-full h-full object-cover filter grayscale contrast-115 brightness-95"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(videoRef.current.currentTime);
                        }
                      }}
                      onDurationChange={() => {
                        if (videoRef.current) {
                          setVideoDuration(videoRef.current.duration);
                        }
                      }}
                      id="lightbox-video"
                    />

                    {/* Ambient Grayscale Scanline Texture overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                    {/* Workspace On-Screen Status */}
                    <div className="absolute top-4 left-4 font-mono text-[8px] tracking-widest bg-black/60 px-2 py-1 rounded text-neutral-400 select-none uppercase">
                      REEL // ACTIVE_PLAYBACK
                    </div>
                  </div>

                  {/* Audio Sound Waveform Canvas & Playback Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Interactive Play/Pause/Mute */}
                    <div className="md:col-span-3 flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            if (isPlaying) {
                              videoRef.current.pause();
                              setIsPlaying(false);
                            } else {
                              videoRef.current.play().catch(err => console.log(err));
                              setIsPlaying(true);
                            }
                          }
                        }}
                        className="w-9 h-9 rounded bg-[#f5f5f5] text-black hover:bg-white flex items-center justify-center transition-colors font-mono font-bold text-xs cursor-pointer"
                        title="Play/Pause (Space)"
                      >
                        {isPlaying ? 'PAUSE' : 'PLAY'}
                      </button>

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-9 h-9 rounded border border-neutral-800 hover:border-neutral-400 bg-neutral-950 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                    </div>

                    {/* Timeline soundwave animation */}
                    <div className="md:col-span-6 space-y-1">
                      <span className="font-mono text-[8px] text-neutral-500 uppercase tracking-wider block">AUDIO SPECTRUM SIMULATOR</span>
                      <canvas 
                        ref={waveformCanvasRef} 
                        width={300} 
                        height={24} 
                        className="w-full bg-neutral-950 border border-neutral-900 rounded h-6"
                      />
                    </div>

                    {/* Speed Regulator (Analyze the cuts rhythm!) */}
                    <div className="md:col-span-3 space-y-1 text-right">
                      <span className="font-mono text-[8px] text-neutral-500 uppercase tracking-wider block text-left md:text-right">EDIT RATE (SPEED)</span>
                      <div className="flex gap-1 justify-start md:justify-end">
                        {[0.5, 1, 2].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={`px-2 py-1 rounded font-mono text-[9px] border transition-all ${playbackSpeed === speed ? 'bg-[#f5f5f5] text-black border-transparent font-medium' : 'bg-neutral-950 text-neutral-400 border-neutral-850 hover:border-neutral-500'}`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Manual Video Scrubbing Slider (Timeline) */}
                  <div className="space-y-2 pt-2 border-t border-neutral-900">
                    <div className="flex justify-between items-center text-neutral-400 font-mono text-[9px]">
                      <span>CHANDU_TIMELINE_01</span>
                      <span>
                        {currentTime.toFixed(2)}s / {videoDuration ? videoDuration.toFixed(2) : '0.00'}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 100}
                      step={0.01}
                      value={currentTime}
                      onChange={(e) => {
                        const newTime = parseFloat(e.target.value);
                        setCurrentTime(newTime);
                        if (videoRef.current) {
                          videoRef.current.currentTime = newTime;
                        }
                      }}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-ew-resize accent-neutral-300"
                    />
                  </div>
                </div>

                {/* Right Area (4 cols): Project Specifications & Details */}
                <div className="lg:col-span-4 p-6 bg-[#0c0c0c] space-y-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    
                    {/* Metadata Header */}
                    <div>
                      <span className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">// ARCHIVE SPECIFICATIONS</span>
                      <h4 className="font-display text-sm font-semibold text-neutral-100 uppercase tracking-wide mt-1">METADATA RAW</h4>
                    </div>

                    {/* Metadata specs grid */}
                    <div className="space-y-3.5 border-t border-neutral-900 pt-4">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-neutral-500">CLIENT</span>
                        <span className="text-neutral-300 font-medium">{selectedProject.client}</span>
                      </div>
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-neutral-500">RESOLUTION</span>
                        <span className="text-neutral-300 font-medium">{selectedProject.resolution}</span>
                      </div>
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-neutral-500">FRAME RATE</span>
                        <span className="text-neutral-300 font-medium">{selectedProject.fps}</span>
                      </div>
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-neutral-500">ASPECT RATIO</span>
                        <span className="text-neutral-300 font-medium">{selectedProject.ratio}</span>
                      </div>
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-neutral-500">SOFTWARE USED</span>
                        <span className="text-neutral-300 font-medium truncate max-w-[180px]" title={selectedProject.software}>
                          {selectedProject.software}
                        </span>
                      </div>
                    </div>

                    {/* Concept Bio */}
                    <div className="space-y-2 border-t border-neutral-900 pt-4">
                      <span className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">// CREATIVE DIRECTORY</span>
                      <p className="font-sans text-xs text-neutral-400 leading-relaxed font-light">
                        {selectedProject.desc}
                      </p>
                    </div>
                  </div>

                  {/* Direct Action */}
                  <div className="pt-6 border-t border-neutral-900 space-y-4">
                    <div className="flex items-center gap-2 font-mono text-[9px] text-neutral-500 uppercase">
                      <Sparkles size={10} />
                      <span>LOVE THIS EDITING RHYTHM?</span>
                    </div>
                    <a
                      href={`https://wa.me/919030699767?text=Hi%20Chandu%2C%20I%20just%20watched%20your%20project%20"${encodeURIComponent(selectedProject.title)}"%20and%2520I%20want%20to%20hire%20you%20for%20a%20video%20project!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => triggerSecureLinkGate(`https://wa.me/919030699767?text=Hi%20Chandu%2C%20I%20just%20watched%20your%20project%20"${encodeURIComponent(selectedProject.title)}"%20and%2520I%20want%20to%20hire%20you%20for%20a%20video%20project!`, e)}
                      className="w-full py-3 bg-neutral-200 hover:bg-white text-black rounded text-center font-display text-[10px] tracking-widest font-semibold uppercase block transition-all"
                    >
                      HIRE CHANDU ON WHATSAPP
                    </a>
                  </div>

                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Security Warning Toasts */}
      <AnimatePresence>
        {securityAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-black/90 border border-neutral-800 rounded-lg p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden"
            id="security-shield-toast"
          >
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white">
                {securityAlert.type === 'copy' ? <Lock size={16} /> : <Shield size={16} />}
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest block">SYSTEM_SECURITY_SHIELD</span>
                <p className="font-sans text-xs text-neutral-200 leading-normal font-light">
                  {securityAlert.message}
                </p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-neutral-900">
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3.5, ease: "linear" }}
                className="h-full bg-white"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Futuristic Secure Link Redirection Gateway Overlay */}
      <AnimatePresence>
        {secureGateUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060606]/98 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
            id="secure-gateway-overlay"
          >
            <div className="max-w-md w-full space-y-8">
              
              {/* Spinning / Pulsing Secure Shield Radar Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="w-16 h-16 rounded-full border border-dashed border-neutral-800 flex items-center justify-center"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <ShieldCheck size={24} className="animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Status Header */}
              <div className="space-y-2">
                <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest block">SECURITY REDIRECT MANAGER v1.0.4</span>
                <h3 className="font-display text-sm font-bold tracking-[0.25em] text-white uppercase">
                  SECURE CONNECTION ESTABLISHED
                </h3>
              </div>

              {/* Secure Log Console Terminal */}
              <div className="bg-[#0b0b0b] border border-neutral-850 rounded-lg p-4 font-mono text-[10px] text-left space-y-2.5 max-w-sm mx-auto shadow-2xl relative overflow-hidden">
                <div className="flex justify-between border-b border-neutral-900 pb-2 mb-2">
                  <span className="text-neutral-500">// HANDSHAKE_SESSION</span>
                  <span className="text-neutral-400">ACTIVE</span>
                </div>
                
                <div className="space-y-1.5 min-h-[90px]">
                  <div className="flex gap-2 text-neutral-500">
                    <span>&gt;</span>
                    <span className="text-neutral-300">REQUEST_ROUTE:</span>
                    <span className="text-neutral-400 truncate max-w-[180px]">{secureGateUrl}</span>
                  </div>

                  {secureGateStep >= 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 text-neutral-500">
                      <span>&gt;</span>
                      <span className="text-white font-medium">INITIATING DISPATCH GATEWAY...</span>
                    </motion.div>
                  )}

                  {secureGateStep >= 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 text-neutral-500">
                      <span>&gt;</span>
                      <span className="text-neutral-400">CHECKING SIGNATURE PROTECTION... PASS</span>
                    </motion.div>
                  )}

                  {secureGateStep >= 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 text-neutral-500">
                      <span>&gt;</span>
                      <span className="text-neutral-400">ENCRYPTION SANDBOX HANDSHAKE... VALID</span>
                    </motion.div>
                  )}

                  {secureGateStep >= 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 text-neutral-500">
                      <span>&gt;</span>
                      <span className="text-[#25D366] font-bold">DISPATCHING SECURE REDIRECT...</span>
                    </motion.div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-[2px] bg-neutral-900 rounded-full overflow-hidden mt-3">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: `${(secureGateStep / 4) * 100}%` }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full bg-white"
                  />
                </div>
              </div>

              <p className="font-sans text-[11px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
                We verify the integrity of external links to protect your browser context against CSRF and malicious script execution.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
