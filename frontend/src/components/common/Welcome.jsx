import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
let fontweights = {
    subtitle: { min: 100, max: 400, default: 100 },
    title: { min: 400, max: 900, default: 400 }
};

let setupTextHower = (container, type) => {
    if (!container) {
        return () => { };
    }
    let letters = container.querySelectorAll("span");
    let { min, max, default: base } = fontweights[type];
    let animateleter = (letter, weight, duration = 0.25) => {
        return gsap.to(letter, {
            duration, ease: "power2.out",
            fontVariationSettings: `"wght" ${weight}`
        });
    }

    let handlemousemove = (event) => {
        let { left } = container.getBoundingClientRect();
        let mousex = event.clientX - left;
        letters.forEach((letter) => {
            let { left: l, width: w } = letter.getBoundingClientRect();
            let distance = Math.abs(mousex - (l - left + w / 2))
            let intensity = Math.exp(-(distance ** 2) / 2000)
            animateleter(letter, min + (max - min) * intensity)
        })
    }
    let handlemouseout = () => {
        letters.forEach((letter) => { animateleter(letter, base, 0.3) })
    }
    container.addEventListener("mousemove", handlemousemove);
    container.addEventListener("mouseout", handlemouseout);
    return () => {
        container.removeEventListener("mousemove", handlemousemove);
        container.removeEventListener("mouseout", handlemouseout);
    }
}

let renderText = (text, className, baseWeight = 400) => {
    return [...text].map((char, i) => (
        <span
            key={i}
            className={className}
            style={{ fontVariationSettings: `'wght' ${baseWeight}` }}
        >
            {char === " " ? "\u00A0" : char}
        </span>
    ));
};

function Welcome() {
    let titleRef = useRef(null);
    let subtitleRef1 = useRef(null);
    let nameRef = useRef(null);
    let subtitleRef2 = useRef(null);

    useGSAP(() => {
        let titlecleanup = setupTextHower(titleRef.current, "title");
        let subtitle1cleanup = setupTextHower(subtitleRef1.current, "subtitle");
        let namecleanup = setupTextHower(nameRef.current, "title");
        let subtitle2cleanup = setupTextHower(subtitleRef2.current, "subtitle");
        return () => {
            titlecleanup();
            subtitle1cleanup();
            namecleanup();
            subtitle2cleanup();

        }
    }, []);
    return (
        <section id="welcome">
            <div>
                <p className="flex justify-center">
                    <span ref={subtitleRef1} className="flex">
                        {renderText("Hey, Its  ", "text-xl font-georama", 100)}
                    </span>
                    <span ref={nameRef} className="flex">
                        {renderText("Muragesh ", "text-xl font-georama", 400)}
                    </span>
                    <span ref={subtitleRef2} className="flex">
                        {renderText("! Welcome to my Web-OS", "text-xl font-georama", 100)}
                    </span>
                </p>
                <br>
                </br>
            </div>

            <h1 ref={titleRef}>{renderText("Web-OS", "text-7xl italic font-georama")}</h1>
            <div className="small-screen">
                <p>this is designed for destop/ipad only</p>
            </div>
        </section>
    );
}

export default Welcome;