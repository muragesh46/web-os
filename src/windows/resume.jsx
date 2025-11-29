import Windowwrapper from "../higherordercomponent/windowwrapper.jsx";
import Windowcontrol from "@components/windowcontrol.jsx";
import { Download } from "lucide-react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';




pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

function Resume() {
    return (
        <>
            <div id="window-header" className="flex items-center relative w-full">
                <Windowcontrol target="resume" />
                <h2 className="absolute left-1/2 -translate-x-1/2">Resume</h2>
                <a href="/public/files/resume.pdf" download className="cursor-pointer ml-auto" title="download resume">
                    <Download className="icon" />
                </a>
            </div>
            <hr className="border-t w-full mt-1" />
            <Document file="/files/resume.pdf">
                <Page pageNumber={1} renderAnnotationLayer renderTextLayer />
            </Document>

        </>
    )

}
const Resumewindow = Windowwrapper(Resume, "resume")
export default Resumewindow;