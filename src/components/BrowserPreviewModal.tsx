import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, RefreshCw, ExternalLink, Monitor, Tablet, Smartphone, 
  Lock, Copy, Check, Code2, Eye, Terminal, Maximize2, Minimize2 
} from 'lucide-react';

interface BrowserPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language?: string;
  title?: string;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const BrowserPreviewModal: React.FC<BrowserPreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  language = 'html',
  title = 'Live Web Preview',
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: string; message: string; time: string }>>([]);
  const [showConsole, setShowConsole] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate runnable HTML bundle for the iframe
  const generateRunnableHtml = (sourceCode: string, lang: string): string => {
    const trimmed = sourceCode.trim();

    // If it's already a full HTML document
    if (trimmed.toLowerCase().includes('<!doctype html') || trimmed.toLowerCase().includes('<html')) {
      // Inject console interceptor script into the head
      const consoleScript = `
        <script>
          (function() {
            var oldLog = console.log;
            var oldError = console.error;
            var oldWarn = console.warn;
            window.addEventListener('error', function(e) {
              window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', message: e.message + ' (Line ' + e.lineno + ')' }, '*');
            });
            console.log = function() {
              var args = Array.prototype.slice.call(arguments);
              window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'log', message: args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ') }, '*');
              oldLog.apply(console, arguments);
            };
            console.error = function() {
              var args = Array.prototype.slice.call(arguments);
              window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', message: args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ') }, '*');
              oldError.apply(console, arguments);
            };
            console.warn = function() {
              var args = Array.prototype.slice.call(arguments);
              window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'warn', message: args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ') }, '*');
              oldWarn.apply(console, arguments);
            };
          })();
        </script>
      `;

      if (trimmed.includes('<head>')) {
        return trimmed.replace('<head>', `<head>${consoleScript}`);
      } else if (trimmed.includes('<html>')) {
        return trimmed.replace('<html>', `<html><head>${consoleScript}</head>`);
      }
      return `${consoleScript}${trimmed}`;
    }

    // If it's a React / JSX component
    if (lang === 'jsx' || lang === 'tsx' || lang === 'react' || trimmed.includes('import React') || trimmed.includes('export default')) {
      const cleanCode = trimmed
        .replace(/import\s+.*?;/g, '')
        .replace(/export\s+default\s+function\s+(\w+)/g, 'function $1')
        .replace(/export\s+default\s+(\w+);?/g, '')
        .replace(/export\s+/g, '');

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
  <div id="root"></div>
  <script type="text/babel">
    ${cleanCode}

    // Auto-mount component
    try {
      var ComponentToRender = typeof App !== 'undefined' ? App : 
                             typeof Main !== 'undefined' ? Main : 
                             typeof Dashboard !== 'undefined' ? Dashboard : null;
      if (ComponentToRender) {
        var root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(ComponentToRender));
      } else {
        document.getElementById('root').innerHTML = '<div class="p-8 text-center text-slate-300">Component ready. Ensure an App component is defined.</div>';
      }
    } catch (err) {
      document.getElementById('root').innerHTML = '<div class="p-6 m-4 rounded-xl bg-red-900/40 border border-red-500 text-red-200 font-mono text-xs">Runtime Error: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
    }

    // Default HTML wrapper for CSS / JS / HTML snippets
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8">
  ${trimmed}
</body>
</html>`;
  };

  // Listen to console log messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CONSOLE_LOG') {
        setConsoleLogs((prev) => [
          ...prev.slice(-49),
          {
            type: event.data.level,
            message: event.data.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle copying code
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open in new tab
  const handleOpenNewTab = () => {
    const htmlContent = generateRunnableHtml(code, language);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  const getViewportWidthClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] max-w-full';
      case 'tablet':
        return 'w-[768px] max-w-full';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  const cleanUrlTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`bg-[#0b0e17] border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isFullscreen 
              ? 'fixed inset-2 z-50 w-[calc(100vw-16px)] h-[calc(100vh-16px)]' 
              : 'w-full max-w-6xl h-[90vh] max-h-[850px]'
          }`}
          style={{
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(139, 92, 246, 0.15)',
          }}
        >
          {/* Top Browser Bar (macOS / Modern Browser style) */}
          <div className="px-4 py-2.5 bg-[#121624] border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 select-none">
            {/* Window Controls & Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={onClose}
                  className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 transition-all cursor-pointer border border-[#e0443e]" 
                  title="Close"
                />
                <button 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 transition-all cursor-pointer border border-[#dea123]" 
                  title="Minimize / Maximize"
                />
                <button 
                  onClick={() => setKey((k) => k + 1)}
                  className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 transition-all cursor-pointer border border-[#1aab29]" 
                  title="Reload"
                />
              </div>

              {/* Tab Switcher: Live Preview vs Source Code */}
              <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Preview</span>
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'code'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Source Code</span>
                </button>
              </div>
            </div>

            {/* Browser Address Bar */}
            <div className="flex-1 max-w-lg min-w-[220px] hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-slate-500 font-mono">https://</span>
              <span className="text-slate-200 font-mono truncate">preview.chatbot.dev/{cleanUrlTitle}.html</span>
              <button
                onClick={() => setKey((k) => k + 1)}
                className="ml-auto p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Reload page"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* Right Controls: Viewport toggle, New Tab, Fullscreen, Close */}
            <div className="flex items-center gap-1.5">
              {/* Responsive Viewport Buttons */}
              {activeTab === 'preview' && (
                <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 text-slate-400 mr-1">
                  <button
                    onClick={() => setViewport('desktop')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewport === 'desktop' ? 'bg-white/15 text-white' : 'hover:text-white'
                    }`}
                    title="Desktop view (100%)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewport('tablet')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewport === 'tablet' ? 'bg-white/15 text-white' : 'hover:text-white'
                    }`}
                    title="Tablet view (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewport('mobile')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewport === 'mobile' ? 'bg-white/15 text-white' : 'hover:text-white'
                    }`}
                    title="Mobile view (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Copy Code */}
              <button
                onClick={handleCopy}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy code"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              {/* Open in New Tab */}
              <button
                onClick={handleOpenNewTab}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Open in new window"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              {/* Toggle Fullscreen */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Modal */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-[#060810]">
            {activeTab === 'preview' ? (
              <div className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-auto bg-[#07090f]">
                <div
                  className={`${getViewportWidthClass()} h-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-white`}
                >
                  <iframe
                    key={key}
                    ref={iframeRef}
                    title={title}
                    srcDoc={generateRunnableHtml(code, language)}
                    sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 w-full h-full overflow-y-auto p-4 font-mono text-xs text-slate-200 bg-[#060810] select-text leading-relaxed no-scrollbar">
                <pre>
                  <code>{code}</code>
                </pre>
              </div>
            )}

            {/* Collapsible Console Drawer */}
            {consoleLogs.length > 0 && (
              <div className="border-t border-white/10 bg-[#090d18]">
                <div 
                  onClick={() => setShowConsole(!showConsole)}
                  className="px-4 py-2 flex items-center justify-between text-xs text-slate-300 hover:bg-white/[0.03] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-semibold font-mono text-[11px]">Console ({consoleLogs.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{showConsole ? 'Hide' : 'Show'}</span>
                </div>

                {showConsole && (
                  <div className="p-3 font-mono text-[11px] max-h-40 overflow-y-auto space-y-1.5 bg-black/60 border-t border-white/5 no-scrollbar">
                    {consoleLogs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2 ${
                          log.type === 'error' ? 'text-rose-400' : log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        <span className="text-slate-600 select-none text-[10px]">{log.time}</span>
                        <span className="whitespace-pre-wrap">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2 bg-[#0c101d] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-300">Live Sandboxed Execution</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Engine: HTML5 / Tailwind / React</span>
              <button 
                onClick={() => setKey((k) => k + 1)}
                className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Rerun</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
