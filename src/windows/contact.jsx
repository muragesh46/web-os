import windowWrapper from "../higherordercomponent/windowwrapper.jsx";
import Windowcontrol from "@components/windowcontrol.jsx";
import { socials } from "@constants/data.js";


function Contact() {
    return (
        <div>
            <div id='window-header'>
                <Windowcontrol target="contact" />
                <h2>contact</h2>
            </div>
            <h2>Muragesh’s Portfolio</h2>
            <div className="p-5 space-y-5">
                <img
                    src="/images/muragesh.jpg"
                    alt="Muragesh"
                    className="w-20 rounded-full"
                />



                <h3>Let’s Connect</h3>
                <p>Got an idea Or just want to chat tech? I’m all here just DM me!</p>

                <ul>
                    {socials.map(({ id, bg, link, icon, text }) => (
                        <li key={id} style={{ backgroundColor: bg }}>

                            <a href={link} target="_blank" rel="noopener noreferrer">
                                <img src={icon} alt={text} className="size-5" />
                            </a>
                            <p>{text}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )


}
const Contactwindow = windowWrapper(Contact, "contact");
export default Contactwindow;