import WindowWrapper from "@hoc/WindowWrapper.jsx";
import WindowControls from "@components/common/WindowControl.jsx";
import { socials } from "@constants/data.js";


function Contact() {
    return (
        <div className="flex flex-col h-full">
            <div id="window-header" className="shrink-0">
                <div id="window-controls">
                    <WindowControls target="contact" />
                </div>
                <h2>Contact</h2>
            </div>

            <div className="p-6 space-y-5 bg-white dark:bg-gray-900 overflow-y-auto max-h-[75vh]">
                <div className="flex items-center gap-4">
                    <img
                        src="/images/muragesh.jpg"
                        alt="Muragesh"
                        className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-gray-100 dark:border-gray-700"
                    />
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Let's Connect</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Got an idea or just want to chat tech? DM me anytime!</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {socials.map(({ id, bg, link, icon, text }) => (
                        <a
                            key={id}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ backgroundColor: bg }}
                            className="flex items-center gap-3 p-3.5 rounded-xl text-white font-medium hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-pointer shadow-sm"
                        >
                            <img src={icon} alt={text} className="size-5 shrink-0 brightness-0 invert" />
                            <span className="text-sm font-semibold">{text}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
const ContactWindow = WindowWrapper(Contact, "contact");
export default ContactWindow;
