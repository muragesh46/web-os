import WindowWrapper from "@hoc/WindowWrapper.jsx";
import WindowControls from "@components/common/WindowControl.jsx";

const About = () => {
    // Hardcoded about-me data
    const name = "about-me.txt";
    const subtitle = "Meet the Developer Behind the Code";
    const image = "/images/muragesh.jpg";
    const description = [
        "Hey! I'm Muragesh 👋, a web developer who enjoys building sleek, interactive websites that actually work well.",
        "I specialize in JavaScript, React, and Node.js—and I love making things feel smooth, fast, and just a little bit delightful.",
        "I'm big on clean UI, good UX, and writing code that doesn't need a search party to debug.",
        "Outside of dev work, you'll find me tweaking layouts at 2AM, sipping overpriced coffee, or impulse-buying gadgets I absolutely convinced myself I needed 😅",
    ];

    return (
        <div>
            <div id="window-header">
                <WindowControls target="about" />
                <h2>{name}</h2>
            </div>

            <div className="p-6 bg-white">
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
                        <h3 className="text-xl font-semibold text-gray-900">{subtitle}</h3>

                        <div className="space-y-3 leading-relaxed text-base text-gray-700">
                            {description.map((para, idx) => (
                                <p key={idx}>{para}</p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Aboutwindow = WindowWrapper(About, "about");

export default Aboutwindow;
