import { navLinks, navIcons } from "@constants/data.js"
import dayjs from "dayjs"
import usewindowstore from "@store/window.js";

function Navbar() {
    const {openwindow}=usewindowstore()
    return (
        <nav className="nav">
            <div>
                <img src="/images/logo.svg" alt="logo" />
                <p>Muragesh</p>
                <ul>
                    {navLinks.map(({ id, name,type }) => (
                        <li key={id} onClick={() => openwindow(type)}>
                            <p>{name}</p>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <ul>
                    {navIcons.map(({ id, img }) => (
                        <li key={id}>
                            <img src={img} alt={`icon-${id}`} />
                        </li>
                    ))}
                </ul>
                <time>
                    {dayjs().format(" ddd D h:mm A")}
                </time>
            </div>


        </nav>
    )
}

export default Navbar