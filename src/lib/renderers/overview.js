import moment from "moment-with-locales-es6";
import elementor from "../elementor/elementor";
var { $get, $el } = elementor;

$get(window).on("load", () => {
    moment.locale("da");
});

var label_names = {
    "0":    "Ikke-clickbait",
    "0.33": "1/3",
    "0.5": "50-50",
    "0.67": "2/3",
    "1":    "Clickbait"
};

export class OverviewRenderer {
    constructor(app) {
        this.app = app;
        this.app.history.register_page("status", this.render.bind(this));
    }

    render(event) {
        var modal = $get("#overview_modal"),
            dialog = $get("#overview_modal_dialog");

        if (modal.isNull) {
            modal = $el("#overview_modal.modal");
            dialog = modal.$el("#overview_modal_dialog.dialog.loading");
            modal.on("mousedown", event => {
                if (event.target == modal) {
                    modal.remove();
                    this.app.history.replace(null);
                }
            });
            modal.appendTo(document.body);

            if (event) this.app.history.push("status");
        }

        this.app.api.get("overview").then(json => {
            if (json.status == "ok") {
                dialog.classList.remove("loading");
                dialog.innerHTML = "";

                var top_section = dialog.$el(".column-section");

                var users_column = top_section.$el(".column.column-left");
                json.users.forEach(user => {
                    var card = users_column.$el(".user-card"), time_since = "";

                    if (user.activity) {
                        time_since = moment(user.activity, "DD/MM/YYYY HH.mm").fromNow();
                    }
                    var user_header = card.$el(".user-header");
                    user_header.$el(".user-name", { 
                        innerHTML: `<b>${user.name}</b><span title="${user.activity}">${time_since}</span>`
                    });
                    user_header.$el(".user-count", { textContent: user.labeled });

                    var percent = (user.labeled % 90) / 90 * 100;

                    var user_info = card.$el(".user-info");
                    user_info.$el(".user-round", { textContent: user.round+1 });
                    user_info.$el(".user-progress", {
                        style: {
                            backgroundSize: percent + "% 4px"
                        }
                    });
                    user_info.$el(".user-progress-percent", { textContent: Math.round(percent) + "%" });
                });

                var label_column = top_section.$el(".column.column-right");
                label_column.$el("h1", { textContent: "Overskrifter" });

                label_column.$el("h2", { textContent: "3 vurderinger" });

                json.labels.forEach(label => {
                    var card = label_column.$el(".label-card");
                    card.$el(".label-name", { textContent: label_names[label.key] } );
                    card.$el(".label-count", { textContent: label.value });
                });

                label_column.$el("h2", { textContent: "2 vurderinger" });

                json.partials.forEach(label => {
                    var card = label_column.$el(".label-card");
                    card.$el(".label-name", { textContent: label_names[label.key] } );
                    card.$el(".label-count", { textContent: label.value });
                });

                dialog.$el("button", { textContent: "Luk", "data-hotkey": "escape" }).on("click", () => {
                    modal.remove();
                    this.app.history.replace(null);
                });

                clearTimeout(this.status_timer);
                this.status_timer = setTimeout(() => {
                    if (!$get("#overview_modal").isNull)
                        this.render();
                }, 60000);
            }
            else {
                modal.remove();
                this.app.history.replace(null);
            }
        });

        if (event) {
            $get(document.body).focus();
            event.preventDefault();
        }
    }
}