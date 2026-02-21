import WindowWrapper from "@hoc/WindowWrapper.jsx";
import {techStack} from "@constants/data.js";
import {Check, Flag} from "lucide-react";
import WindowControls from "@components/common/WindowControl.jsx";

function Terminal() {
    return (
        <>
            <div id="window-header">
                <WindowControls target="terminal"></WindowControls>
                <h2>Tech Stack</h2>
            </div>
            <div className="techstack">
              <p>
                <span className="font-bold">@Muragesh % </span>
                show skill i have
              </p>

              <div className="label">
                <p className="w-32">Category</p>
                <p>Technologies</p>
              </div>

              <ul className="content">
                {techStack.map(({ category, items }) => (
                  <li key={category} className="flex items-center gap-10">
                    <div className="flex items-center gap-2 w-40">
                      <Check className="check" size={20} />
                      <h3>{category}</h3>
                    </div>
                    <ul>
                      {items.map((item, i) => (
                        <li key={i}>
                          {item}
                          {i < items.length - 1 ? ", " : ""}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
                <div className="footnote">
                    <p>
                        <Check className="check" size={20} />
                        All tech stack loaded successfully.(100%)
                    </p>

                    <p className='text-black'>
                        <Flag size={15} fill="black" />
                        render time 3ms
                    </p>
                </div>

            </div>
        </>
    );
}


const Terminalwindow = WindowWrapper(Terminal, "terminal");
export default Terminalwindow;