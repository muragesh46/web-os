# Web OS - Portfolio & Interactive Desktop

A React-based web application that mimics a desktop operating system interface. It features draggable windows, a dock, a terminal, an AI-powered assistant, and a resume viewer. This project serves as an interactive portfolio and a demonstration of modern web technologies.

## 🚀 Features

-   **Desktop Interface**: A clean, beautiful desktop environment with a wallpaper and taskbar/dock.
-   **Draggable Windows**: Interactive windows that can be dragged, minimized, and closed.
-   **Dock**: macOS-style dock for quick access to applications.
-   **Terminal**: A functional terminal emulator for executing commands and navigating a virtual file system.
-   **AI Assistant (Ask)**: An integrated AI chat interface powered by Google Gemini to answer questions.
-   **Resume Viewer**: A dedicated window to view the developer's resume.
-   **Animations**: Smooth animations using GSAP (GreenSock Animation Platform).

## 🛠️ Tech Stack

-   **Frontend Framework**: [React](https://react.dev/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Animations**: [GSAP](https://gsap.com/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **AI Integration**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai)

## 📦 Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/muragesh46/web-os.git
    cd web-os
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add your Gemini API key:

    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Build for production:**

    ```bash
    npm run build
    ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
