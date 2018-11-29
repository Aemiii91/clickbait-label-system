import $get from "./lib/elementor/elementor";
import ApiInterface from "./lib/api_interface";
import "./lib/hotkey_handler";

import { PasswordRenderer } from "./lib/renderers/password";
import { LoginRenderer } from "./lib/renderers/login";
import { PostsRenderer } from "./lib/renderers/posts";
import { UserRenderer } from "./lib/renderers/user";
import { OverviewRenderer } from "./lib/renderers/overview";
import { HistoryHandler } from "./lib/history_handler";

// insure https protocol
if (!location.protocol.match(/https/i) && location.host != "localhost")
    location.replace(location.href.replace(/http/i, "https"));

// application main class
class ClickbaitLabelApp {
    constructor() {
        this.user = null;
        this.api = new ApiInterface("./api/");
        this.history = new HistoryHandler();

        this.renderer = {
            login:    new LoginRenderer(this),
            user:     new UserRenderer(this),
            password: new PasswordRenderer(this),
            posts:    new PostsRenderer(this),
            overview: new OverviewRenderer(this)
        };
        
        // this makes the body element focusable
        document.body.setAttribute("tabindex", "1");

        // render basic application
        var toolbar = $get(document.body).$el("#app_toolbar.app-toolbar");
        toolbar.$el("#page_title.header", { textContent: document.title });
        toolbar.$el("#user_container.user-profile.loading");

        $get(document.body).$el("#app_container.app-container.loading");

        // the posts.fetch function also checks if user is logged in
        this.renderer.posts.fetch();
    }
}

$get(window).on("load", () => { new ClickbaitLabelApp() });