# Web OS - Portfolio & Interactive Desktop

Welcome! This isn't just a standard portfolio website—it's a fully interactive desktop experience running right in your browser. I built this to demonstrate what's possible with modern web technologies and to give you a fun way to explore my work.

## Project Structure

The project is structured into two main components:

-   **`frontend/`**: The React/Vite-based interactive desktop environment.
-   **`backend/`**: The Node.js/Express-based backend (supporting features like videocall).

## Features

-   **Desktop Interface**: A clean, beautiful desktop environment that feels just like your computer, complete with a wallpaper and a dock.
-   **Draggable Windows**: Interactive windows that you can drag, minimize, and close. Go ahead, move things around!
-   **Dock**: A macOS-style dock for quick access to applications.
-   **Chat App**: A full-featured chat application with real-time messaging, participant search, and contact management.
-   **Multi-User Video Call**: High-quality video calls with a dynamic grid layout. Invite multiple participants into a single session for a group experience.
-   **Global Notifications**: Incoming call alerts are integrated globally across the OS, so you never miss a connection.
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
-   **Real-time Communication**: Socket.IO & WebRTC (Mesh Network)
-   **AI Integration**: Google Generative AI SDK
-   **Backend**: Node.js & Express
-   **Database**: MongoDB (Mongoose)

## Installation

Follow these steps to set up and run the project locally:

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/muragesh46/web-os.git
    cd web-os
    ```

2.  **Environment Setup:**
    Create a `.env` file in the root directory (refer to `.env.example`):
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Backend Setup (Optional):**
    ```bash
    cd backend
    npm install
    npm run dev
    ```

## Contributing

Contributions are always welcome! If you have ideas for improvements or find any bugs, please feel free to submit a Pull Request.
