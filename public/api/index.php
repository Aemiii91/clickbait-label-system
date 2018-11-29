<?php 
include_once "db_connect.php";

define("SUCCESS", "ok");
define("FAILURE", "error");

define("JSON_PATH", "../data/all.json");

$db = connect_db();

mysqli_set_charset($db, "utf8");

$action = isset($_GET["action"]) ? $_GET["action"] : "";
$output = (object) [
    "status" => FAILURE
];

switch ($action) {
    case "login": $output = login($db); break;
    case "logout": $output = logout(); break;
    case "change_password": $output = change_password($db); break;
    case "user": $output = get_user(); break;
    case "posts": $output = get_posts($db); break;
    case "label": $output = set_label($db); break;
    case "overview": $output = get_overview($db); break;
}

header("Content-Type: application/json; charset=utf-8");
echo json_encode($output);


/******************************************************************************
 * action=login
 * $_POST["username"]
 * $_POST["password"]
 ******************************************************************************/

function login($db) {
    $output = (object) [
        "status" => FAILURE,
        "message" => "Login failed"
    ];

    if(isset($_POST["username"]) && isset($_POST["password"])) {
        $user_username = mysqli_real_escape_string($db, $_POST["username"]);
        $user_password = $_POST["password"];
        
        $row = db_query($db, "SELECT `id`, `name`, `username`, `password` FROM clickbait_users WHERE username='$user_username'");
        
        if (md5($user_password) == $row["password"]){
            $output->status = SUCCESS;
            $output->message = "Login successful";
            $output->user = (object) [
                "name" => $row["name"],
                "username" => $row["username"],
                "id" => (int) $row["id"]
            ];
            $_SESSION["user_session"] = $output->user;
        }
        else {
            $output->message = "Invalid credentials";
        }
    }

    return $output;
}


/******************************************************************************
 * action=logout
 ******************************************************************************/

function logout() {
    $output = (object) [
        "status" => FAILURE,
        "message" => "Logout failed"
    ];

    unset($_SESSION["user_session"]);
    
    if (session_destroy()) {
        $output->status = SUCCESS;
        $output->message = "Logout successful";
    }

    return $output;
}


/******************************************************************************
 * action=user
 ******************************************************************************/

function get_user() {
    $output = (object) [
        "status" => FAILURE,
        "message" => "Not logged in"
    ];

    if (isset($_SESSION["user_session"])) {
        $output->status = SUCCESS;
        $output->message = "";
        $output->user = $_SESSION["user_session"];
    }

    return $output;
}


/******************************************************************************
 * action=change_password
 * $_POST["password"] - old password
 * $_POST["change_to"] - new password
 ******************************************************************************/

function change_password($db) {
    $output = get_user();

    if ($output->status == SUCCESS) {
        $user = $output->user;
        $user_id = $user->id;
        $output = (object) [
            "status" => FAILURE
        ];

        if (isset($_POST["password"]) && isset($_POST["change_to"])) {
            $old_password = $_POST["password"];
            $new_password = md5($_POST["change_to"]);

            $row = db_query($db, "SELECT `id`, `password` FROM clickbait_users WHERE `id`=$user_id");

            if (md5($old_password) == $row["password"]) {
                $sql = "UPDATE clickbait_users SET `password`='$new_password' WHERE `id`=$user_id";

                if (mysqli_query($db, $sql) === true) {
                    $output->status = SUCCESS;
                }
                else {
                    $output->message = $db->error;
                }
            }
            else {
                $output->message = "Wrong password";
            }
        }
    }

    return $output;
}


/******************************************************************************
 * action=label
 * $_POST["post_id"]
 * $_POST["is_clickbait"] - boolean: 1 or 0
 ******************************************************************************/

function set_label($db) {
    $output = get_user();

    if ($output->status == SUCCESS) {
        $user = $output->user;
        $user_id = $user->id;
        $output = (object) [
            "status" => FAILURE
        ];

        if (isset($_POST["post_id"]) && isset($_POST["is_clickbait"])) {
            $post_id = intval($_POST["post_id"]);
            $is_clickbait = $_POST["is_clickbait"] == "1" ? 1 : 0;

            $sql = "SELECT * FROM clickbait_labels WHERE `post_id`=$post_id AND `user_id`=$user_id";
            $row = db_query($db, $sql);

            if ($row) {
                $label_id = $row["id"];
                $sql = "UPDATE clickbait_labels SET `is_clickbait`=$is_clickbait WHERE `id`=$label_id";
            }
            else {
                $sql = "INSERT INTO clickbait_labels (`user_id`, `post_id`, `is_clickbait`) VALUES ($user_id, $post_id, $is_clickbait)";
            }

            if (mysqli_query($db, $sql) === true) {
                $output->status = SUCCESS;
            }
            else {
                $output->message = $db->error;
            }
        }
    }

    return $output;
}


/******************************************************************************
 * action=posts
 * &round=1 - optional, change round
 ******************************************************************************/

function get_posts($db) {
    $output = get_user();

    if ($output->status == SUCCESS) {
        $user = $output->user;
        $id = $user->id;

        $output->round_current = $round = _get_round($db, $user->id);

        if (isset($_GET["round"]) && (int) $_GET["round"] <= $round)
            $round = (int) $_GET["round"];

        $output->status = SUCCESS;
        $output->round = $round;
        $output->count = 0;
        $output->no_label = 0;
        $output->posts = [];

        $posts_all = _get_json_data();

        $output->round_max = floor(count($posts_all) / 150);

        if ($id == 1 || $id == 4 || $id == 5)
            $output = _add_posts_section($db, $posts_all, $round, 0, $output);
        if ($id == 1 || $id == 2 || $id == 5)
            $output = _add_posts_section($db, $posts_all, $round, 1, $output);
        if ($id == 1 || $id == 2 || $id == 3)
            $output = _add_posts_section($db, $posts_all, $round, 2, $output);
        if ($id == 2 || $id == 3 || $id == 4)
            $output = _add_posts_section($db, $posts_all, $round, 3, $output);
        if ($id == 3 || $id == 4 || $id == 5)
            $output = _add_posts_section($db, $posts_all, $round, 4, $output);

        $output->count = count($output->posts);
    }

    return $output;
}

function _get_json_data() {
    $json_data = file_get_contents(JSON_PATH);
    $json_object = json_decode($json_data);
    return $json_object->posts;
}

function _add_posts_section($db, $posts_all, $round, $section, $output) {
    $user = $output->user;
    $round_index = $round * 150;
    $section_index = $section * 30;
    $user_id = $user->id;

    for ($i = 0; $i < 30; $i++) {
        $index = $round_index + $section_index + $i;

        if ($index >= count($posts_all)) break;

        $post = $posts_all[$index];
        $post_id = $post->id;

        $sql = "SELECT `is_clickbait` FROM clickbait_labels WHERE `post_id`=$post_id AND `user_id`=$user_id";
        $row = db_query($db, $sql);

        if (!$row)
            $output->no_label++;

        $post->is_clickbait = $row ? (int) $row["is_clickbait"] : -1;

        array_push($output->posts, $post);
    }

    return $output;
}


/******************************************************************************
 * action=overview
 ******************************************************************************/

function get_overview($db) {
    $output = get_user();

    if ($output->status == SUCCESS) {
        $progress = [];
        $result = mysqli_query($db, "SELECT `id`, `name`, `username` FROM clickbait_users");

        while ($row = mysqli_fetch_assoc($result)) {
            $user = (object) [
                "name" => $row["name"],
                "username" => $row["username"],
                "id" => (int) $row["id"]
            ];
            $user->labeled = _get_label_count($db, $user->id);
            $user->round = floor($user->labeled / 90);
            $user->activity = _get_timestamp($db, $user->id);
            array_push($progress, $user);

            if ($user->id == $output->user->id)
                $output->user = $user;
        }

        $output->users = $progress;

        $verified_labels = [
            ["key" => "0", "value" => 0],
            ["key" => "0.33", "value" => 0],
            ["key" => "0.67", "value" => 0],
            ["key" => "1", "value" => 0],
        ];
        $label_order = ["0" => 0, "0.33" => 1, "0.67" => 2, "1" => 3];
        $result = _get_verified_labels($db);

        while ($row = mysqli_fetch_assoc($result)) {
            $average = (string) round((float) $row["average"], 2);
            $verified_labels[$label_order[$average]]["value"] = (int) $row["count"];
        }

        $output->labels = $verified_labels;
    }

    return $output;
}


function _get_timestamp($db, $user_id) {
    $sql = "SELECT `timestamp` FROM clickbait_labels WHERE `user_id`=$user_id ORDER BY `timestamp` DESC";
    $row = db_query($db, $sql);
    
    if ($row) {
        $dt = new DateTime($row["timestamp"]);
        return $dt->format("d/m/Y H.i");
    }
    
    return "";
}

function _get_label_count($db, $user_id) {
    $sql = "SELECT COUNT(*) FROM clickbait_labels WHERE `user_id`=$user_id";
    $row = db_query($db, $sql);
    return $row ? (int) $row["COUNT(*)"] : 0;
}

function _get_round($db, $user_id) {
    return floor(_get_label_count($db, $user_id) / 90);
}

function _get_verified_labels($db) {
    $sql = "SELECT average, COUNT(average) 'count' FROM (SELECT post_id, AVG(is_clickbait) 'average', COUNT(user_id) 'rater_count' FROM clickbait_labels GROUP BY post_id) label_scores WHERE `rater_count`=3 GROUP BY average";
    return mysqli_query($db, $sql);
}



function db_query($db, $sql) {
    $resultset = mysqli_query($db, $sql) or die("database error:" . mysqli_error($db));
    return mysqli_fetch_assoc($resultset);
}