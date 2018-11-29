import elementor from "../elementor/elementor";
var { $get, $el } = elementor;

export class LoginRenderer {
    constructor(app) {
        this.app = app;
    }
    
    render() {
        $get("#app_container").innerHTML = "";
    
        var form = $el("form.login-form");
    
        form.$el("label", { for: "username", textContent: "Brugernavn" });
        form.$el("input#username", { type: "text", name: "username", required: "true", autocorrect: "off", autocapitalize: "none" });
    
        form.$el("label", { for: "password", textContent: "Adgangskode" });
        form.$el("input#password", { type: "password", name: "password", required: "true" });
    
        form.$el("input", { type: "submit", value: "Login" });
    
        form.on("submit", this.submit.bind(this));
        form.on("input", () => {
            $get("#app_container .error").remove();
        });
    
        form.appendTo($get("#app_container"));
    
        $get("#username").focus();
    }

    submit(event) {
        $get("#user_container").classList.add("loading");
        $get("#app_container").classList.add("loading");
        
        this.app.api.post("login", {
            username: $get("#username").value,
            password: $get("#password").value
        }).then(json => {
            $get("#user_container").classList.remove("loading");
    
            if (json.status == "ok") {
                $get("#app_container").innerHTML = "";
                this.app.renderer.user.render(json.user);
                this.app.renderer.posts.fetch();
            }
            else {
                $get("#app_container").classList.remove("loading");
    
                if ($get("#app_container .error").isNull) {
                    $get("#app_container form").$el(".error", {
                        textContent: "Forkert brugernavn eller adgangskode"
                    });
                }
            }
        });
    
        event.preventDefault();
    }
}