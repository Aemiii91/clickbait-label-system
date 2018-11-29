import elementor from "../elementor/elementor";
var { $get, $el } = elementor;

export class PasswordRenderer {
    constructor(app) {
        this.app = app;
        this.app.history.register_page("change_password", this.render.bind(this));
    }
    
    render(event) {
        if ($get("#change_password_modal").isNull) {
            var modal = $el("#change_password_modal.modal");
            var form = modal.$el("form.change-password-form");
        
            form.$el("input", { type: "hidden", name: "username", value: this.app.user.username });

            form.$el("label", { for: "old_password", textContent: "Nuværende adgangskode" });
            form.$el("input#old_password", { type: "password", name: "password", required: "true" });
            form.$el("label", { for: "new_password", textContent: "Ny adgangskode" });
            form.$el("input#new_password", { type: "password", required: "true" });
            form.$el("label", { for: "new_password_check", textContent: "Gentag ny adgangskode" });
            form.$el("input#new_password_check", { type: "password", required: "true" });
        
            form.$el("input", { type: "submit", value: "Skift adgangskode" });
            form.$el("a#change_password_cancel", { textContent: "Annuller", "data-hotkey": "escape", href: "#" })
            .on("click", event => {
                $get("#change_password_modal").remove();
                history.replaceState(null, null, "./");
                event.preventDefault();
            });

            modal.on("mousedown", event => {
                if (event.target == $get("#change_password_modal"))
                    $get("#change_password_cancel").click();
            });
        
            form.on("submit", this.submit.bind(this));
            form.on("input", () => {
                $get(".error").remove();
            });

            modal.appendTo(document.body);

            $get("#old_password").focus();

            if (event) this.app.history.push("change_password");
        }

        if (event) event.preventDefault();
    }

    submit(event) {
        if ($get("#new_password").value == $get("#new_password_check").value) {
            this.app.api.post("change_password", {
                password: $get("#old_password").value,
                change_to: $get("#new_password").value
            }).then(json => {
                if (json.status == "ok") {
                    $get("#change_password_modal").remove();
                    this.app.history.push(null);
                }
                else {
                    if ($get("#change_password_modal .error").isNull) {
                        $get("#change_password_modal form").$el(".error", {
                            textContent: "Forkert adgangskode"
                        });
                    }
                }
            });
        }

        event.preventDefault();
    }
}