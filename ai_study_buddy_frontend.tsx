import React, { useState, useEffect } from 'react';
import { 
  Search, Globe, Layers, Calendar, Minimize2, 
  UserCircle, Play, Pause, RotateCcw, FileText, 
  Image as ImageIcon, BookOpen, Send, CheckCircle2, ChevronRight, ChevronLeft
} from 'lucide-react';

// --- UI Components ---
const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-wider uppercase rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]",
    outline: "bg-transparent text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50"
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-2">{label}</label>}
    <input 
      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
      {...props}
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-2">{label}</label>}
    <textarea 
      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all resize-y min-h-[120px]"
      {...props}
    />
  </div>
);

// --- Main Application ---
export default function App() {
  const [currentView, setCurrentView] = useState('home');

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div 
          className="text-xl font-bold tracking-tight text-white cursor-pointer"
          onClick={() => setCurrentView('home')}
        >
          AI Study Buddy
        </div>
        <div className="hidden md:flex flex-wrap gap-2">
          {['Research', 'Summarizer', 'Flashcards', 'QA', 'PDF RAG'].map(nav => (
            <button
              key={nav}
              onClick={() => setCurrentView(nav.toLowerCase().replace(' ', '-'))}
              className={`px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase rounded-md transition-colors ${
                currentView === nav.toLowerCase().replace(' ', '-') 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              {nav}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-12 pb-32">
        {currentView === 'home' && <HomeView setView={setCurrentView} />}
        {currentView === 'summarizer' && <SummarizerView />}
        {currentView === 'flashcards' && <FlashcardsView />}
        {currentView === 'qa' && <QaView />}
        {currentView === 'pdf-rag' && <PdfRagView setView={setCurrentView} />}
        {currentView === 'research' && <ResearchView />}
      </main>

      {/* Global Pomodoro Widget */}
      <PomodoroWidget />
    </div>
  );
}

// --- Views ---

function HomeView({ setView }) {
  const features = [
    { id: 'research', icon: Search, title: 'Topic Researcher', desc: 'Get comprehensive markdown guides on any topic.' },
    { id: 'pdf-rag', icon: FileText, title: 'PDF RAG Engine', desc: 'Chat with your massive textbooks instantly.' },
    { id: 'flashcards', icon: Layers, title: 'Smart Flashcards', desc: 'Test your knowledge with 3D AI flashcards.' },
    { id: 'summarizer', icon: Minimize2, title: 'Summarizer 2.0', desc: 'Condense heavy text or web links effortlessly.' },
    { id: 'qa', icon: UserCircle, title: 'AI Tutor (QA)', desc: 'Extract direct answers from specific contexts.' },
    { id: 'visual-qa', icon: ImageIcon, title: 'Visual QA', desc: 'Analyze diagrams, equations, and charts.' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center max-w-2xl mx-auto mb-16 mt-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
          Your Intelligent Study Buddy
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl font-light mb-8">
          A premium suite of AI-powered tools to help you learn faster, analyze textbooks, and ace your exams.
        </p>
        <Button onClick={() => setView('pdf-rag')} className="px-8 py-3 text-sm">
          Try the PDF RAG Engine
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => (
          <GlassCard key={f.id} className="flex flex-col items-start group hover:bg-zinc-800/50 cursor-pointer transition-all" >
            <div className="p-3 bg-zinc-900 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-zinc-400 mb-6 flex-1">{f.desc}</p>
            <Button variant="outline" onClick={() => setView(f.id)} className="w-full text-[10px]">
              Launch Tool
            </Button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function SummarizerView() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSummarize = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API Call to Flask backend
    setTimeout(() => {
      setResult("• The core of the RAG architecture involves breaking down large documents into manageable chunks.\n• These chunks are converted into dense mathematical vectors (embeddings) and stored in a FAISS index.\n• During querying, the system retrieves only the most relevant chunks to bypass context window limits efficiently.");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <h2 className="text-3xl font-bold tracking-tight mb-2">Smart Summarizer</h2>
      <p className="text-zinc-400 text-sm mb-8">Condense long articles or text blocks instantly.</p>
      
      {!result ? (
        <GlassCard>
          <form onSubmit={handleSummarize}>
            <Input label="Option 1: Web Link (URL)" placeholder="https://..." />
            <div className="flex items-center gap-4 my-6 opacity-50">
              <div className="flex-1 h-px bg-zinc-800"></div>
              <span className="text-[10px] font-mono tracking-widest uppercase">OR</span>
              <div className="flex-1 h-px bg-zinc-800"></div>
            </div>
            <Textarea label="Option 2: Paste Text" placeholder="Paste heavy text here..." />
            <Button className="w-full mt-2" disabled={loading}>
              {loading ? 'Summarizing...' : 'Summarize Now'}
            </Button>
          </form>
        </GlassCard>
      ) : (
        <GlassCard className="border-zinc-700 bg-zinc-900/80">
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Summary Result</h3>
          <div className="whitespace-pre-wrap text-zinc-200 leading-relaxed font-light">
            {result}
          </div>
          <div className="mt-8 flex gap-3">
            <Button onClick={() => setResult('')} variant="outline">Summarize Another</Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function FlashcardsView() {
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const generateCards = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate Gemini API return
    setTimeout(() => {
      setCards([
        { q: "What is FAISS?", a: "Facebook AI Similarity Search. A library for efficient similarity search and clustering of dense vectors." },
        { q: "Why use RAG?", a: "Retrieval-Augmented Generation prevents LLM hallucinations by forcing the model to cite retrieved, accurate context blocks." },
        { q: "What is an embedding?", a: "A numerical vector representation of text that captures semantic meaning." }
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-left-8 duration-500">
      <h2 className="text-3xl font-bold tracking-tight mb-2">Interactive Flashcards</h2>
      <p className="text-zinc-400 text-sm mb-8">Generate 3D study cards on any topic instantly.</p>

      {cards.length === 0 ? (
        <GlassCard>
          <form onSubmit={generateCards}>
            <Input 
              label="Study Topic" 
              placeholder="e.g., Vector Databases, Photosynthesis..." 
              value={topic}
              onChange={e => setTopic(e.target.value)}
              required 
            />
            <Button className="w-full mt-2" disabled={loading}>
              {loading ? 'Generating deck...' : 'Create Flashcards'}
            </Button>
          </form>
        </GlassCard>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-full h-80 relative perspective-1000 mb-8 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`w-full h-full absolute transform-style-3d transition-transform duration-700 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <GlassCard className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center text-center p-8 bg-zinc-900 border-zinc-700">
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase absolute top-6">Question {currentIndex + 1} of {cards.length}</span>
                <h3 className="text-2xl font-medium">{cards[currentIndex].q}</h3>
                <span className="text-xs text-zinc-600 absolute bottom-6">Click to flip</span>
              </GlassCard>
              {/* Back */}
              <GlassCard className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center text-center p-8 bg-zinc-800 border-zinc-600">
                <span className="text-[10px] tracking-widest text-zinc-400 uppercase absolute top-6">Answer</span>
                <p className="text-lg text-zinc-200 font-light leading-relaxed">{cards[currentIndex].a}</p>
              </GlassCard>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full justify-between">
            <Button 
              variant="outline" 
              onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex(prev => Math.max(0, prev - 1)), 150); }}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Prev
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="text-red-400 hover:bg-red-950 hover:border-red-900">Need Review</Button>
              <Button variant="outline" className="text-green-400 hover:bg-green-950 hover:border-green-900">Got It</Button>
            </div>
            <Button 
              variant="outline" 
              onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1)), 150); }}
              disabled={currentIndex === cards.length - 1}
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PdfRagView({ setView }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, indexed

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) return;
    setStatus('uploading');
    // Simulate FAISS embedding process
    setTimeout(() => {
      setStatus('indexed');
    }, 2500);
  };

  if (status === 'indexed') {
    return (
      <div className="max-w-xl mx-auto text-center animate-in zoom-in">
        <div className="w-20 h-20 bg-green-950 border border-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Document Indexed Successfully!</h2>
        <p className="text-zinc-400 mb-8">Your textbook has been chunked, embedded, and mapped to a FAISS index. You can now chat with it.</p>
        <Button onClick={() => setView('qa')} className="w-full py-4 text-sm bg-green-500 text-black hover:bg-green-400 border-none">
          Start Q&A Chat Session
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8">
      <h2 className="text-3xl font-bold tracking-tight mb-2">Upload Textbook (RAG)</h2>
      <p className="text-zinc-400 text-sm mb-8">Upload large PDFs to embed them for lightning-fast, context-aware querying.</p>
      
      <GlassCard>
        <form onSubmit={handleUpload}>
          <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-950/50 rounded-xl p-12 text-center transition-colors mb-6 relative">
            <input 
              type="file" 
              accept=".pdf" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-sm font-semibold mb-1">{file ? file.name : 'Drag & drop your PDF here'}</h3>
            <p className="text-xs text-zinc-500">Maximum file size: 50MB</p>
          </div>
          
          <Button className="w-full" disabled={!file || status === 'uploading'}>
            {status === 'uploading' ? 'Generating Vector Embeddings...' : 'Process Document 🚀'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

function QaView() {
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hello! I am your AI Tutor. Ask me anything about your uploaded documents or a general topic.' }
  ]);
  const [input, setInput] = useState('');

  const sendMsg = (e) => {
    e.preventDefault();
    if(!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    const query = input;
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'model', text: `Based on the RAG index, here is the answer to: "${query}". \n\nThe chunks suggest that vector embeddings enable high-speed semantic search.` }]);
    }, 1200);
  }

  return (
    <div className="max-w-3xl mx-auto h-[70vh] flex flex-col animate-in fade-in">
      <div className="flex items-center mb-6">
        <UserCircle className="w-6 h-6 mr-3 text-zinc-400" />
        <h2 className="text-2xl font-bold tracking-tight">AI Tutor Chat</h2>
      </div>

      <GlassCard className="flex-1 flex flex-col p-4 overflow-hidden bg-zinc-950 border-zinc-800">
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 flex flex-col">
          {messages.map((msg, i) => (
            <div key={i} className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'self-end bg-white text-black rounded-br-sm' 
                : 'self-start bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
          ))}
        </div>
        
        <form onSubmit={sendMsg} className="mt-4 relative flex items-center">
          <input 
            type="text" 
            placeholder="Ask a follow-up question..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-zinc-500"
          />
          <button type="submit" className="absolute right-2 p-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

function ResearchView() {
  return (
    <div className="max-w-2xl mx-auto animate-in fade-in">
      <h2 className="text-3xl font-bold tracking-tight mb-2">Topic Researcher</h2>
      <p className="text-zinc-400 text-sm mb-8">Generate comprehensive, well-structured guides.</p>
      <GlassCard>
        <Input label="Topic to research" placeholder="e.g. Quantum Computing Basics" />
        <Button className="w-full mt-2">Generate Research Report</Button>
      </GlassCard>
    </div>
  );
}

// --- Pomodoro Widget ---
function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Bell sound would trigger here
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="fixed bottom-6 right-6 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-4 rounded-2xl shadow-2xl w-48 z-50 transition-transform hover:-translate-y-1">
      <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-500 text-center mb-1">Focus Timer</div>
      <div className="text-4xl font-light text-center mb-4 tracking-tighter text-white">{m}:{s}</div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 py-1.5 px-2 text-[10px]" onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? <Pause className="w-3 h-3 mr-1"/> : <Play className="w-3 h-3 mr-1"/>}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button variant="outline" className="py-1.5 px-2" onClick={() => { setIsRunning(false); setTimeLeft(25 * 60); }}>
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}