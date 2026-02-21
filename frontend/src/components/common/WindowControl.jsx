import usewindowstore from "@store/window.js";


function WindowControls({ target }) {
    const { closewindow, minimisewindow } = usewindowstore();

    const handleClose = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        closewindow(target);
    };

    const handleMinimise = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        minimisewindow(target);
    };

    return (
        <div
            id="window-controls"
            className="window-controls"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                className="close"
                aria-label="Close window"
                title="Close"
                onClick={handleClose}
            />
            <button
                type="button"
                className="minimise"
                aria-label="Minimize window"
                title="Minimize"
                onClick={handleMinimise}
            />
        </div>
    );
}
export default WindowControls;