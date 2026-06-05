import React, { Suspense } from 'react';
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
gsap.registerPlugin(Draggable);
import './index.css'
import Navbar from "@components/layout/Navbar.jsx";
import Welcome from "@components/common/Welcome.jsx";
import Home from "@components/layout/Home.jsx";
import Dock from "@components/layout/Dock.jsx"
import LockScreen from "@components/common/LockScreen.jsx";
import useAuthStore from "@store/auth";
import IncomingCall from "@components/common/IncomingCall.jsx";
import NotificationBanner from "@features/notifications/NotificationBanner.jsx";
import useSocketStore from "@store/socket";
import useSettingsStore from "@store/settings";

// Fix #6: Lazy-load all app windows — they are heavy and most are never opened.
// Only mount the component in the DOM the first time a user opens it.
const TerminalWindow   = React.lazy(() => import('@features/terminal/Terminal.jsx'));
const MAI              = React.lazy(() => import('@features/MAI/MAI.jsx'));
const AboutWindow      = React.lazy(() => import('@features/about/About.jsx'));
const ResumeWindow     = React.lazy(() => import('@features/resume/Resume.jsx'));
const CalendarWindow   = React.lazy(() => import('@features/calendar/Calendar.jsx'));
const MapsWindow       = React.lazy(() => import('@features/maps/Maps.jsx'));
const FinderWindow     = React.lazy(() => import('@features/finder/Finder.jsx'));
const TextWindow       = React.lazy(() => import('@features/text/Text.jsx'));
const ImageWindow      = React.lazy(() => import('@features/image/Image.jsx'));
const ContactWindow    = React.lazy(() => import('@features/contact/Contact.jsx'));
const Photos           = React.lazy(() => import('@features/photos/Photos.jsx'));
const VideoCallWindow  = React.lazy(() => import('@features/videocall/VideoCall.jsx'));
const Launchpad        = React.lazy(() => import('@features/launchpad/Launchpad.jsx'));
const ChatWindow       = React.lazy(() => import('@features/chat/Chat.jsx'));
const CalculatorWindow = React.lazy(() => import('@features/calculator/Calculator.jsx'));
const SpotlightSearch  = React.lazy(() => import('@features/spotlight/Spotlight.jsx'));
const SettingsWindow   = React.lazy(() => import('@features/settings/Settings.jsx'));
const CodeIDEWindow    = React.lazy(() => import('@features/code/CodeIDE.jsx'));
const MusicWindow      = React.lazy(() => import('@features/music/Music.jsx'));
const CameraWindow     = React.lazy(() => import('@features/camera/Camera.jsx'));

// Fix #20: ErrorBoundary supports dark mode
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-red-500 bg-white dark:bg-gray-900 dark:text-red-400 backdrop-blur-md rounded-xl m-10 border border-red-200 dark:border-red-800 shadow-xl">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Something went wrong.</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">An unexpected error occurred. Try refreshing the page.</p>
          <details className="whitespace-pre-wrap text-sm text-red-600 dark:text-red-400">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fix #18: Minimal splash shown during Zustand hydration
function SplashScreen() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <img src="/macbook.png" alt="Loading" className="w-16 h-16 animate-pulse opacity-80" />
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    </div>
  );
}

function App() {
  const { user } = useAuthStore();
  const { initSocket, disconnectSockets } = useSocketStore();

  React.useEffect(() => {
    if (user?.token) {
      initSocket(user.token);
    } else {
      disconnectSockets();
    }
  }, [user?.token, initSocket, disconnectSockets]);

  const { theme, reduceMotion } = useSettingsStore();

  React.useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  React.useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  // Wake up Render backend on app load
  React.useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    fetch(API_BASE_URL).catch((err) => console.log('Backend wake-up ping failed:', err));
  }, []);

  return (
    <ErrorBoundary>
      {/* Fix #18: Suspense wraps all lazy windows. SplashScreen shows on initial chunk load. */}
      <Suspense fallback={<SplashScreen />}>
        <main className="w-full h-screen relative overflow-hidden">
          {!user && <LockScreen />}
          <Navbar></Navbar>
          <Welcome />
          <Dock></Dock>
          <Launchpad />

          <TerminalWindow />

          <AboutWindow />
          <ResumeWindow></ResumeWindow>
          <CalendarWindow />
          <MapsWindow />
          <FinderWindow />
          <TextWindow></TextWindow>
          <ImageWindow></ImageWindow>
          <ContactWindow></ContactWindow>
          <Home></Home>
          <Photos></Photos>
          <ChatWindow />
          <VideoCallWindow />
          <CalculatorWindow />
          <CodeIDEWindow />
          <MusicWindow />
          <CameraWindow />

          {/* Global Notifications */}
          <IncomingCall />
          <NotificationBanner />

          {/* Global Overlays */}
          <SpotlightSearch />
          <MAI />

          {/* App Windows */}
          <SettingsWindow />
        </main>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
