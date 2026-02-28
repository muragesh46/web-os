import WindowWrapper from "@hoc/WindowWrapper.jsx";
import WindowControls from "@components/common/WindowControl.jsx";
import { Download } from "lucide-react";

function Resume() {
    return (
        <div className="flex flex-col bg-white rounded-lg shadow-2xl border border-black/10 overflow-hidden" style={{ width: "80vw", minWidth: "850px", maxWidth: "1200px", height: "85vh" }}>
            <div id="window-header" className="flex items-center relative w-full shrink-0 p-2 bg-gray-50 border-b border-gray-200">
                <WindowControls target="resume" />
                <h2 className="absolute left-1/2 -translate-x-1/2 font-semibold text-gray-700">Resume</h2>
                <a href="/files/resume.pdf" download className="cursor-pointer ml-auto text-gray-500 hover:text-gray-800 transition-colors mr-2" title="Download Resume">
                    <Download className="w-5 h-5" />
                </a>
            </div>
            <div className="flex-1 relative bg-gray-100">
                <object
                    data="/files/resume.pdf#view=FitH"
                    type="application/pdf"
                    className="absolute inset-0 w-full h-full border-none"
                >
                    <embed
                        src="/files/resume.pdf#view=FitH"
                        type="application/pdf"
                        className="absolute inset-0 w-full h-full border-none"
                    />
                </object>
            </div>
        </div>
    );
}

const Resumewindow = WindowWrapper(Resume, "resume");
export default Resumewindow;
