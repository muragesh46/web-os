import React from 'react';
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
import TerminalWindow from "@windows/Terminal.jsx";
import AskWindow from "@windows/Ask.jsx";
import AboutWindow from "@windows/About.jsx";
import ResumeWindow from "@windows/Resume.jsx";
import CalendarWindow from "@windows/calander.jsx";
import FinderWindow from "@windows/Finder.jsx";
import TextWindow from "@windows/Text.jsx";
import ImageWindow from "@windows/Image.jsx";
import ContactWindow from "@windows/Contact.jsx";
import Photos from "@windows/Photos.jsx";
import VideoCallWindow from "@windows/VideoCall.jsx";
import Launchpad from "@windows/Launchpad.jsx";
import ChatWindow from "@features/chat/Chat.jsx";
import useSocketStore from "@store/socket";
import IncomingCall from "@components/common/IncomingCall.jsx";

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
        <div className="p-10 text-red-600 bg-white/80 backdrop-blur-md rounded-xl m-10">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <details className="whitespace-pre-wrap">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
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

  return (
    <ErrorBoundary>
      <main className="w-full h-screen relative overflow-hidden">
        {!user && <LockScreen />}
        <Navbar></Navbar>
        <Welcome />
        <Dock></Dock>
        <Launchpad />

        <TerminalWindow />
        <AskWindow></AskWindow>
        <AboutWindow />
        <ResumeWindow></ResumeWindow>
        <CalendarWindow />
        <FinderWindow />
        <TextWindow></TextWindow>
        <ImageWindow></ImageWindow>
        <ContactWindow></ContactWindow>
        <Home></Home>
        <Photos></Photos>
        <ChatWindow />
        <VideoCallWindow />

        {/* Global Notifications */}
        <IncomingCall />
      </main>
    </ErrorBoundary>
  )
}

export default App
