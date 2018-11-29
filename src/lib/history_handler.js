import $get from "./elementor/elementor";

export class HistoryHandler {
    constructor(app) {
        this.app = app;
        this.$_GET = _get_location_params();
        this.pages = {};

        $get(window).on("popstate", this.popstateHandler.bind(this));
    }

    push(page) {
        if (page)
            history.pushState({ page: page }, null, "?page=" + page);
        else
            history.pushState(null, null, "./");
    }

    replace(page) {
        if (page)
            history.replaceState({ page: page }, null, "?page=" + page);
        else
            history.replaceState(null, null, "./");
    }

    register_page(page, renderFunc) {
        this.pages[page] = renderFunc;
    }

    render_page(page) {
        if (typeof this.pages[page] == "function") this.pages[page]();
    }

    user_loaded() {
        this.render_page(this.$_GET["page"]);
    }

    popstateHandler(event) {
        if (event.state == null) {
            $get(".modal").remove();
        }
        else {
            this.render_page(event.state.page);
        }
    }
}

function _get_location_params() {
    var params = location.search.substr(1).split("&"),
        result = {};

    params.forEach(param => {
        var [key, value] = param.split("=");
        result[key] = decodeURIComponent(value);
    });

    return result;
}