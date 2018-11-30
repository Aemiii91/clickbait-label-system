import $get from "../elementor/elementor";

export class PostsRenderer {
    constructor(app) {
        this.app = app;
        this.posts = [];
        this.labeled = 0;
        this.round = 0;
        this.round_current = 0;
        this.round_max = 0;
    }


    /**
     * Fetches a "round" of posts and renders the last post not yet labeled.
     * 
     * @param {int} round 
     */

    fetch(round = -1) {
        this.app.api.get("posts" + (round >= 0 ? "&round=" + round : "")).then(json => {
            $get("#user_container").classList.remove("loading");
            $get("#app_container").classList.remove("loading");
    
            if (json.status == "ok") {
                this.app.renderer.user.render(json.user);

                this.posts = json.posts;
                this.labeled = Math.max(0, Math.min(json.posts.length - json.no_label, json.posts.length));
                this.round = json.round;
                this.round_current = json.round_current;
                this.round_max = json.round_max;

                this.render(this.labeled);
            }
            else {
                this.app.renderer.user.logout();
            }
        });
    }


    /**
     * Renders a post in the main container.
     * 
     * @param {int} index 
     */
    
    render(index) {
        index = Math.max(0, Math.min(index, this.posts.length-1));
    
        var post = this.posts[index];
        if (!post) return;
    
        var loading_class = this.current_index > index ? "loading.loading-alt" : "loading";
    
        this.current_index = index;
    
        var container = $get("#app_container");
        container.innerHTML = "";
    
        var article = container.$el("article.post");
    
        // "round" navigation container
        var nav_round = article.$el("nav.round-navigation");

        // button: previous round
        _add_nav_button(nav_round, "prev-round", "Forrige runde (PgUp)", "pageup", null, this.round > 0, () => {
            this.set_round(this.round-1);
        });
        
        nav_round.$el(".post-round", { innerHTML: `<span>Runde ${this.round+1}</span>` });

        // button: next round
        _add_nav_button(nav_round, "next-round", "Næste runde (PgDn)", "pagedown", null, this.round < this.round_current, () => {
            this.set_round(this.round+1);
        });
    
        // post navigation container
        var nav_post = nav_round.$el(".post-navigation");

        // button: previous post
        _add_nav_button(nav_post, "prev-post", "Forrige (Pil-op)", "arrowup", "arrowleft", index > 0, () => {
            this.render(index-1);
        });

        // button: next post
        _add_nav_button(nav_post, "next-post", "Næste (Pil-ned)", "arrowdown", "arrowright", index < this.labeled && index < this.posts.length - 1, () => {
            this.render(index+1);
        });

        // button: current post
        _add_nav_button(nav_post, "current-post", "Nuværende (Space)", "space", "end", index < this.labeled && index < this.posts.length - 1, () => {
            this.render(this.labeled);
        });
    
        // post headline container
        var card = article.$el("#current_card.card.animated." + loading_class, {
            "data-is-clickbait": post.is_clickbait,
            "data-index": index
        });
        card.$el("h1.post-header", { textContent: post.target.headline });
        card.$el(".post-count", { innerHTML: `<span># ${index+1}</span> / ${this.posts.length}` });

        // add touch capabilities to card
        card.on("touchstart", this.cardTouchHandler.bind(this));
    
        // labeling controls container
        var label_buttons = article.$el(".label-buttons");
    
        // button: label as clickbait
        label_buttons.$el("button#btn_mark_true.red" + (post.is_clickbait === 1 ? ".selected" : ""), {
            textContent: "Clickbait",
            title: "Markér som clickbait ('C'-tast)",
            "data-hotkey": "c"
        }).on("click", () => {
            this.set_label(index, true);
        });

        // button: label as non-clickbait
        label_buttons.$el("button#btn_mark_false.green" + (post.is_clickbait === 0 ? ".selected" : ""), {
            textContent: "Ikke-clickbait",
            title: "Markér som ikke-clickbait ('I'-tast)",
            "data-hotkey": "i"
        }).on("click", () => {
            this.set_label(index, false);
        });
    
        // initiate move-in animation
        setTimeout(() => {
            card.classList.remove("loading");
        });
    }


    /**
     * Change current round.
     * 
     * @param {int} round 
     */
    
    set_round(round) {
        var app_container = $get("#app_container");

        app_container.innerHTML = "";
        app_container.classList.add("loading");
        app_container.$el("h1.round-header", { textContent: "Runde " + (round + 1) });
        
        this.fetch(round);
    }

    /**
     * Submit labeling of post.
     * 
     * @param {int} index 
     * @param {boolean} is_clickbait 
     */
    
    set_label(index, is_clickbait) {
        var post = this.posts[index];
    
        // add 'selected' class to labeling button
        _deselect_mark_btns();
        $get("#btn_mark_" + (is_clickbait ? "true" : "false")).classList.add("selected");
        
        // disable all button while loading
        $get(["#app_container button"]).forEach(btn => {
            btn.disabled = true;
        });
        
        // add 'marked-true' or 'marked-false' to card, initiating going-out animation
        $get("#current_card").classList.add("marked-" + (is_clickbait ? "true" : "false"));
    
        // submit label choice
        this.app.api.post("label", {
            post_id: post.id,
            is_clickbait: is_clickbait ? 1 : 0
        }).then(json => {
            if (json.status == "ok") {
                // if labeled for the first time, add to 'labeled' counter
                if (post.is_clickbait == -1)
                    this.labeled = Math.min(this.labeled+1, this.posts.length);
    
                // set label on post object
                post.is_clickbait = is_clickbait ? 1 : 0;
    
                // render last post not labeled - or go to next round, timeout = animation to finish
                clearTimeout(this.label_timer);
                this.label_timer = setTimeout(() => {
                    if (index < this.posts.length-1)
                        this.render(this.labeled);
                    else
                        this.set_round(this.round+1);
                }, 300);
            }
            else {
                // something went wrong on server - revert
                $get(["#app_container button"]).forEach(btn => {
                    btn.disabled = false;
                });
                $get("#current_card").classList.remove("marked-" + (is_clickbait ? "true" : "false"));
            }
        });
    }


    /**
     * Enables card touch capabilities, ie. swipe left to mark as clickbait,
     * and swipe right to mark as non-clickbait.
     * 
     * @param {Event} event 
     */

    cardTouchHandler(event) {
        var card = $get("#current_card"),
            touch = event.touches[0],
            start = { x: touch.clientX, y: touch.clientY },
            curr = start,
            diff = { x: 0, y: 0 },
            max = card.offsetWidth,
            card_moving = false,
            is_clickbait = parseInt(card.getAttribute("data-is-clickbait")),
            index = parseInt(card.getAttribute("data-index")),
            submit_ratio = 0.25;
    
        var _cancel = () => {
            card.style.left = "";
            card.classList.add("animated");
    
            _deselect_mark_btns();
            if (is_clickbait === 1) $get("#btn_mark_true").classList.add("selected");
            if (is_clickbait === 0) $get("#btn_mark_false").classList.add("selected");
    
            card.off("touchmove").off("touchend").off("touchcancel");
        };
    
        card.classList.remove("animated");
    
        card.on("touchmove", event => {
            var touch = event.touches[0];
    
            curr = { x: touch.clientX, y: touch.clientY };
            diff = { 
                x: Math.max(-max, Math.min(curr.x - start.x, max)),
                y: curr.y - start.y
            };
            
            if (card_moving || Math.abs(diff.x) > 10) {
                card_moving = true;
    
                _deselect_mark_btns();
    
                if (Math.abs(diff.x) > max*submit_ratio) {
                    $get("#btn_mark_" + (diff.x<0 ? "true" : "false")).classList.add("selected");
                }
    
                card.style.left = diff.x + "px";
    
                event.preventDefault();
            }
            else if (Math.abs(diff.y) > 10) {
                _cancel();
            }
        });
    
        card.on("touchend", () => {
            _cancel();
            if (Math.abs(diff.x) > max*submit_ratio) {
                this.set_label(index, diff.x<0);
            }
        });
    
        card.on("touchcancel", _cancel);
    }
}


/**
 * Navigation button factory function.
 * 
 * @param {Element} container 
 * @param {string} className 
 * @param {string} title 
 * @param {string} hotkey 
 * @param {string} alt_hotkey 
 * @param {boolean} enabled 
 * @param {function} clickHandler 
 */

function _add_nav_button(container, className, title, hotkey, alt_hotkey, enabled, clickHandler) {
    var btn = container.$el("button." + className, { title: title });

    if (hotkey)
        btn.setAttribute("data-hotkey", hotkey);
    if (alt_hotkey)
        btn.setAttribute("data-hotkey-alt", alt_hotkey);

    if (enabled)
        btn.on("click", clickHandler);
    else
        btn.disabled = true;
}


function _deselect_mark_btns() {
    $get("#btn_mark_true").classList.remove("selected");
    $get("#btn_mark_false").classList.remove("selected");
}