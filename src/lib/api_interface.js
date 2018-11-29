export default class ApiInterface {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    get(action) {
        return fetch(this.endpoint + "?action=" + action)
        .then(response => response.json());
    }

    post(action, params) {
        var formData = new FormData();
        Object.keys(params).forEach(key => {
            var value = params[key];
            formData.append(key, value);
        });

        return fetch(this.endpoint + "?action=" + action, {
            method: "POST",
            cache: "no-cache",
            credentials: "same-origin",
            body: formData
        })
        .then(response => response.json());
    }
}