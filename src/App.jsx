import React from 'react';
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
gsap.registerPlugin(Draggable);


import './index.css'

import Navbar from "@components/Navbar.jsx";
import Welcome from "@components/welcome.jsx";
import Dock from "@components/dock.jsx"
import Terminalwindow from "@windows/terminal.jsx";
import Askwindow from "@windows/ask.jsx";
import Resumewindow from "@windows/resume.jsx";


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
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
  return (
    <ErrorBoundary>
      <main className="w-full h-screen relative overflow-hidden">
        <Navbar></Navbar>
        <Welcome />
        <Dock></Dock>

        <Terminalwindow />
        <Askwindow></Askwindow>
        <Resumewindow></Resumewindow>



      </main>
    </ErrorBoundary>
  )
}

export default App
