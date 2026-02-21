import WindowWrapper from "@hoc/WindowWrapper.jsx";
import WindowControls from "@components/common/WindowControl.jsx";
import useWindowStore from "@store/window.js";

const Text = () => {
    const { window } = useWindowStore();
    const data = window?.txtfile?.data;
    const name = data?.name || "Text File";
    const image = data?.image;
    const subtitle = data?.subtitle;
    const description = data?.description;

    return (
        <div>
            <div id="window-header">
                <WindowControls target="txtfile" />
                <h2>{name}</h2>
            </div>

            <div className="p-6 bg-white">
                {image ? (
                    <div className="flex gap-6">
                        {/* Image Column - Left Side */}
                        <div className="w-2/5 flex-shrink-0">
                            <img
                                src={image}
                                alt={name}
                                className="w-full h-auto rounded-xl shadow-lg object-cover"
                            />
                        </div>

                        {/* Text Column - Right Side */}
                        <div className="flex-1 space-y-4">
                            {subtitle ? (
                                <h3 className="text-xl font-semibold text-gray-900">{subtitle}</h3>
                            ) : null}

                            {Array.isArray(description) && description.length > 0 ? (
                                <div className="space-y-3 leading-relaxed text-base text-gray-700">
                                    {description.map((para, idx) => (
                                        <p key={idx}>{para}</p>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    // Text-only layout when no image
                    <div className="space-y-4">
                        {subtitle ? (
                            <h3 className="text-xl font-semibold text-gray-900">{subtitle}</h3>
                        ) : null}

                        {Array.isArray(description) && description.length > 0 ? (
                            <div className="space-y-3 leading-relaxed text-base text-gray-700">
                                {description.map((para, idx) => (
                                    <p key={idx}>{para}</p>
                                ))}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};
const Textwindow = WindowWrapper(Text, "txtfile")

export default Textwindow;