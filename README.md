# Web OS - Portfolio & Interactive Desktop

Welcome! This isn't just a standard portfolio website—it's a fully interactive desktop experience running right in your browser. I built this to demonstrate what's possible with modern web technologies and to give you a fun way to explore my work.

## Features

-   **Desktop Interface**: A clean, beautiful desktop environment that feels just like your computer, complete with a wallpaper and a dock.
-   **Draggable Windows**: Interactive windows that you can drag, minimize, and close. Go ahead, move things around!
-   **Dock**: A macOS-style dock for quick access to applications.
-   **Terminal**: For the power users, there's a functional terminal emulator to execute commands and navigate the virtual file system.
-   **AI Assistant (Ask)**: An integrated AI chat interface powered by Google Gemini. Have a question? Just ask.
-   **Resume Viewer**: A dedicated window to view my professional background and resume.
-   **Animations**: Smooth, fluid animations that make the interface feel alive.

## Tech Stack

I used some amazing tools to bring this project to life:

-   **Frontend Framework**: React
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **Animations**: GSAP (GreenSock Animation Platform)
-   **State Management**: Zustand
-   **Icons**: Lucide React
-   **AI Integration**: Google Generative AI SDK

## Installation

If you're curious about the code or want to run it locally, here is how you can do it:

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

## Contributing

Contributions are always welcome! If you have ideas for improvements or find any bugs, please feel free to submit a Pull Request.
