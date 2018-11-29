import $get from "../elementor/elementor";

export class UserRenderer {
    constructor(app) {
        this.app = app;
    }


    /**
     * Renders the user icon and menu.
     * 
     * @param {object} user 
     */

    render(user) {
        var container = $get("#user_container");
        this.app.user = user;
        
        container.innerHTML = "";

        if (user != null) {
            container.classList.add("active");

            container.$el("button.profile-icon", { textContent: user.name.substr(0,1) });

            var menu = container.$el(".profile-menu", { tabindex: "1" });

            var profile_card = menu.$el(".profile-card");
            profile_card.$el(".profile-icon-large", { textContent: user.name.substr(0,1) });
            
            var profile_names = profile_card.$el(".profile-names");
            profile_names.$el(".profile-name", { textContent: user.name });
            profile_names.$el(".profile-username", { textContent: user.username });

            menu.$el("hr");

            menu.$el("a.icon.icon-database", {
                textContent: "Status", href: "#"
            }).on("click", event => {
                this.app.renderer.overview.render(event);
            });
            
            menu.$el("hr");
            
            menu.$el("a.icon.icon-key", {
                textContent: "Skift adgangskode", href: "#"
            }).on("click", event => {
                this.app.renderer.password.render(event);
            });
            
            menu.$el("a.icon.icon-logout", {
                textContent: "Log ud", href: "#"
            }).on("click", this.logout.bind(this));

            container.on("keydown", event => {
                if (event.keyCode == 27) {
                    document.body.focus();
                    event.preventDefault();
                }
            });

            this.app.history.user_loaded();
        }
    }


    /**
     * Logout the user.
     * 
     * @param {Event} event 
     */

    logout(event) {
        $get("#user_container").classList.add("loading");
        $get("#app_container").classList.add("loading");

        this.app.api.get("logout").then(json => {
            $get("#user_container").classList.remove("loading");        
            $get("#app_container").classList.remove("loading");

            if (json.status == "ok") {
                this.render(null);
                this.app.renderer.login.render();
            }
        });
        
        if (event) event.preventDefault();
    }
}