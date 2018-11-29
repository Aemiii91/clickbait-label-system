import $get from "./elementor/elementor";

export function hotkeyHandler(event) {
    if (_isInputElement(event.target) && (!event.key || !event.key.match(/escape/i)))
        return;

    var hotkey = _getHotkey(event),
        btn = $get(`[data-hotkey='${hotkey}']`),
        btn_alt = $get(`[data-hotkey-alt='${hotkey}']`);

    if (!btn.isNull) {
        btn.click();
        event.preventDefault();
    }

    if (!btn_alt.isNull) {
        btn_alt.click();
        event.preventDefault();
    }
}

$get(window).on("keydown", hotkeyHandler);

function _isInputElement(el) {
    return el && el.tagName && el.tagName.match(/(input|textarea|select)/i);
}

function _getHotkey(event) {
    var keys = [];

    if (event.ctrlKey) keys.push("control");
    if (event.shiftKey) keys.push("shift");
    if (event.altKey) keys.push("alt");
    if (event.key == " ") keys.push("space");
    
    if (!event.key.match(/(control|shift|alt| )/i))
        keys.push(event.key.toLowerCase());

    return keys.join("+");
}