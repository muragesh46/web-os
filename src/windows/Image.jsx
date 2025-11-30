import windowWrapper from "../higherordercomponent/windowwrapper.jsx";
import WindowControls from "@components/windowcontrol.jsx";
import useWindowStore from "../store/window.js";

const Image = () => {
    const { window } = useWindowStore();
    const data = window?.imgfile?.data;
    const name = data?.name || "Image";
    const imageUrl = data?.imageUrl;

    return (
        <div>
            <div id="window-header">
                <WindowControls target="imgfile" />
                <p>{name}</p>
            </div>

            <div className="preview">
                {imageUrl ? (
                    <img src={imageUrl} alt={name} />
                ) : (
                    <div className="p-10 text-center text-gray-500">
                        <p>No image to display</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const Imagewindow = windowWrapper(Image, "imgfile");

export default Imagewindow;
