// var eventsRef = new Firebase("https://beerglass.firebaseio.com/events"),
//     engineRef = new Firebase("https://beerglass.firebaseio.com/engine");
// yeah, i dont really like having firebase services. is it here to steal my personal information?

// Matter aliases
// the gloabl param for gravity
const GRAVITY = 1.0;

// window size
let WORLD_WIDTH = document.documentElement.clientWidth;
let WORLD_HEIGHT = document.documentElement.clientHeight;

//
let water_left_in_bottle = WORLD_HEIGHT * WORLD_WIDTH;

const color_card = {
    milktea: "rgba(243,207,179,0.8)",
    lemonade: "rgba(207,207,207,0.8)",
    chocolatesmoothie: "rgba(60,40,20,0.8)",
    passionfruitdoublebang: "rgba(222,195,2,0.8)",
    redgrapefruit: "rgba(236,35,27,0.8)",
    mango: "rgba(228,177,55,0.9)",
    redtea: "rgba(153,70,57,0.7)",
    taro: "rgba(138,107,190,1.0)",
};
let tea_base = null;

const ingredients_info = {
    pearl: { radius: 20, gap: 20, rows: 3 },
    westrice: { radius: 10, gap: 20, rows: 2 },
    passionfruit: { radius: 10, gap: 20, rows: 5 },
    coconutfruit: { radius: 25, gap: 20, rows: 3 },
    xiancao: { radius: 30, gap: 30, rows: 3 },
    redgrapefruit: { radius: 150, gap: 50, rows: 2 },
    greenlemon: { radius: 150, gap: 50, rows: 1 },
    mango: { radius: 50, gap: 0, rows: 8 },
    pudding: { radius: 50, gap: 10, rows: 3 },
};

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Composites = Matter.Composites,
    Common = Matter.Common,
    MouseConstraint = Matter.MouseConstraint;

var MilkteaSimulator = {};

var _engine,
    _sceneName = "mixed",
    _sceneWidth,
    _sceneHeight,
    _deviceOrientationEvent;

// text

function showText(target_canvas, text, color, font, xx, yy, align = "center") {
    let context = target_canvas.getContext("2d");
    context.fillStyle = color;
    context.font = font;
    context.textAlign = align;
    context.textBaseline = "top";
    context.fillText(text, xx, yy);
}

// play sounds

//生成从minNum到maxNum的随机数
function randomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1, 10);
            break;
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
            break;
        default:
            return 0;
            break;
    }
}

let drinking_sounds = [];
for (let i = 1; i <= 5; i++) {
    drinking_sounds.push(new Audio("audios/drinking_" + i.toString() + ".wav"));
}

function tryPlayDrinkingSound() {
    let is_playing = false;
    for (let i = 1; i < 5; i++) {
        if (!drinking_sounds[i].paused && drinking_sounds[i].currentTime) {
            // it is playing
            is_playing = true;
            break;
        }
    }
    if (!is_playing) {
        let num = randomNum(0, 4);
        drinking_sounds[num].play();
    }
}

let finished_drinking = false;
let burp_sounds = [];
let quote = null;
let quote_from = null;
for (let i = 1; i <= 3; i++) {
    burp_sounds.push(new Audio("audios/burp_" + i.toString() + ".wav"));
}

function tryPlayBurpSoundAndFinishDrinking() {
    if (!finished_drinking) {
        finished_drinking = true;
        let num = randomNum(0, 2);
        burp_sounds[num].play();
    }
}
function getQuote() {
    var httpRequest = new XMLHttpRequest(); //第一步：建立所需的对象
    httpRequest.open("GET", "https://v1.hitokoto.cn/", true); //第二步：打开连接  将请求参数写在url中  ps:"http://localhost:8080/rest/xxx"
    httpRequest.send(); //第三步：发送请求  将请求参数写在URL中
    /**
     * 获取数据后的处理程序
     */
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var json = httpRequest.responseText; //获取到json字符串，还需解析
            var json_dic = JSON.parse(json);
            console.log(json_dic);
            quote = json_dic.hitokoto;
            quote_from = "        " + json_dic.from;

            const font_size = 20;
            const padding = 40;

            const characters_per_line = Math.ceil(
                (WORLD_WIDTH - 2 * padding) / font_size
            );
            let i = 0;
            quote = [];
            while (i * characters_per_line < json_dic.hitokoto.length) {
                quote.push(
                    json_dic.hitokoto.slice(
                        i * characters_per_line,
                        (i + 1) * characters_per_line
                    )
                );
                i = i + 1;
            }
            // quote.push(json_dic.hitokoto.slice(i * characters_per_line));
            console.log(quote);
        }
    };
}

function showQuote() {
    if (finished_drinking && quote) {
        // console.log("showing");
        let paddings = 40;
        let font_size = 20;
        let now_at = (WORLD_HEIGHT * 3) / 4;

        for (let i = 0; i < quote.length; i++) {
            showText(
                _engine.render.canvas,
                quote[i],
                "#333333",
                "normal normal 20px system-ui",
                WORLD_WIDTH / 2,
                now_at
            );
            now_at = now_at + font_size + paddings;
        }

        showText(
            _engine.render.canvas,
            quote_from,
            "#555555",
            "normal normal 20px system-ui",
            WORLD_WIDTH / 2,
            now_at,
            "left"
        );
    }
}

//
let cup_style_img = null;
let cup_w;
let cup_h;
let cup_pos_x;
let cup_pos_y;
function getCupStyleImage() {
    // cup_style_img = new Image();
    // cup_style_img.src = "./cup_style_images/rabbit.png";
    // cup_style_img.width = WORLD_WIDTH / 10;

    var cupstyle_selectors =
        document.getElementsByClassName("cupstyle_selector");
    console.log(cupstyle_selectors.length);
    let cupstyle_img_name = "blank";
    for (let i = 0; i < cupstyle_selectors.length; i++) {
        let cupstyle_input = cupstyle_selectors[i];
        if (cupstyle_input.hasAttribute("checked")) {
            cupstyle_img_name = cupstyle_input.value;
            break;
        }
    }

    switch (cupstyle_img_name) {
        case "blank":
            break;
        case "rabbit": {
            cup_style_img = new Image();
            cup_style_img.src = "./cupstyle_images/rabbit.png";
            const width_scale = 0.3;
            cup_w = WORLD_WIDTH * width_scale;
            cup_h = (cup_w / 200) * 200;
            cup_pos_x = WORLD_WIDTH * 0.5 - 0.5 * cup_w;
            cup_pos_y = WORLD_HEIGHT * 0.4 - 0.5 * cup_h;
            break;
        }
        case "sadtea": {
            cup_style_img = new Image();
            cup_style_img.src = "./cupstyle_images/sadtea.png";
            const width_scale = 0.5;
            cup_w = WORLD_WIDTH * width_scale;
            cup_h = (cup_w / 449) * 370;
            cup_pos_x = WORLD_WIDTH * 0.5 - 0.5 * cup_w;
            cup_pos_y = WORLD_HEIGHT * 0.4 - 0.5 * cup_h;

            break;
        }
        case "bull": {
            cup_style_img = new Image();
            cup_style_img.src = "./cupstyle_images/bull.png";
            const width_scale = 0.5;
            cup_w = WORLD_WIDTH * width_scale;
            console.log(cup_style_img.width);
            cup_h = (cup_w / 291) * 250;
            cup_pos_x = WORLD_WIDTH * 0.5 - 0.5 * cup_w;
            cup_pos_y = WORLD_HEIGHT * 0.4 - 0.5 * cup_h;
            break;
        }

        case "lihua": {
            cup_style_img = new Image();
            cup_style_img.src = "./cupstyle_images/lihua.png";
            // 1024 * 1024
            const width_scale = 1;
            cup_w = WORLD_WIDTH * width_scale;
            console.log(cup_style_img.width);
            cup_h = (cup_w / 1024) * 1024;
            cup_pos_x = WORLD_WIDTH * 0.5 - 0.5 * cup_w;
            cup_pos_y = WORLD_HEIGHT * 0.4 - 0.5 * cup_h;
            break;
        }

        case "pusa": {
            cup_style_img = new Image();
            cup_style_img.src = "./cupstyle_images/pusa.png";
            // 1200 * 1200
            const width_scale = 0.4;
            cup_w = WORLD_WIDTH * width_scale;
            console.log(cup_style_img.width);
            cup_h = (cup_w / 1200) * 1200;
            cup_pos_x = WORLD_WIDTH * 0.5 - 0.5 * cup_w;
            cup_pos_y = WORLD_HEIGHT * 0.4 - 0.5 * cup_h;
            break;
        }
        case "miracle": {
            //1137 * 644
            cup_style_img = new Image();
            cup_style_img.src = "./cupstyle_images/miracle.png";
            const width_scale = 1;
            cup_w = WORLD_WIDTH * width_scale;
            console.log(cup_style_img.width);
            cup_h = (cup_w / 1137) * 644;
            cup_pos_x = WORLD_WIDTH * 0.5 - 0.5 * cup_w;
            cup_pos_y = WORLD_HEIGHT - cup_h;
            break;
        }

        default:
            console.log("encountered unknown cupstyle");
            break;
    }
}

function drawCupStyle() {
    if (cup_style_img) {
        let context = _engine.render.canvas.getContext("2d");

        context.drawImage(cup_style_img, cup_pos_x, cup_pos_y, cup_w, cup_h);
    }
}

function getTeaBase() {
    var teabase_selectors = document.getElementsByClassName("teabase_selector");
    console.log(teabase_selectors.length);
    let tea_selected = "milktea";
    for (let i = 0; i < teabase_selectors.length; i++) {
        let teabase_input = teabase_selectors[i];
        if (teabase_input.hasAttribute("checked")) {
            tea_selected = teabase_input.value;
            break;
        }
    }

    // add ingrediends

    switch (tea_selected) {
        case "milktea":
            tea_base = "milktea";
            break;
        case "lemonade":
            tea_base = "lemonade";
            ingredients.push("greenlemon");
            break;
        case "chocolatesmoothie":
            tea_base = "chocolatesmoothie";
            break;
        case "passionfruitdoublebang":
            tea_base = "passionfruitdoublebang";
            ingredients.push("passionfruit");
            ingredients.push("coconutfruit");
            break;
        case "pearlmilktea":
            tea_base = "milktea";
            ingredients.push("pearl");
            break;
        case "redgrapefruit":
            tea_base = "redgrapefruit";
            ingredients.push("redgrapefruit");
            break;
        case "baixiangmang":
            tea_base = "mango";
            ingredients.push("passionfruit");
            ingredients.push("mango");
            break;
        case "xiangningdacha":
            tea_base = "redtea";
            ingredients.push("greenlemon");
            break;
        default:
            console.log("Unknown teabase");
    }

    console.log(tea_base);
}

// use the dict ingredient
var ingredients = [];
function getIngredients() {
    var ingredients_selectors = document.getElementsByClassName(
        "ingredients_selector"
    );
    console.log(ingredients_selectors.length);
    for (var i = 0; i < ingredients_selectors.length; i++) {
        // console.log(.valueOf);
        if (ingredients_selectors[i].checked) {
            ingredients.push(ingredients_selectors[i].value);
        }
    }
    console.log(ingredients);
}

function draw_polygon(target_canvas, list_of_points, color) {
    if (list_of_points == null || list_of_points.length == 0) {
        return;
    }
    var ctx = target_canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(list_of_points[0][0], list_of_points[0][1]);

    for (var i = 1; i < list_of_points.length; i++) {
        ctx.lineTo(list_of_points[i][0], list_of_points[i][1]);
    }
    ctx.closePath();
    ctx.fill();
}
// behaviors when clicking screen
let clicked_once = false;
let timer = null;

function global_click_controller() {
    const new_timer = Date.now();
    if (clicked_once) {
        console.log("clicked_once");
        if (timer == null) {
            timer = new_timer;
            // show heads up
            showText(
                _engine.render.canvas,
                "再次点击屏幕退出",
                "#555555",
                "normal normal 10px system-ui",
                WORLD_WIDTH / 2,
                10
            );
        } else if (new_timer - timer < 5000) {
            // double clicked
            location.reload();
        }
    } else {
        if (timer != null && new_timer - timer >= 5000) {
            // clear heads up TODO

            timer = null;
        } else if (timer != null && new_timer - timer < 5000) {
            showText(
                _engine.render.canvas,
                "再次点击屏幕退出",
                "#555555",
                "normal normal 10px system-ui",
                WORLD_WIDTH / 2,
                10
            );
        }
    }
    clicked_once = false;
}

var debug_x = 0;
var debug_y = 0;

MilkteaSimulator.init = function () {
    var canvasContainer = document.getElementById("body"),
        demoStart = document.getElementById("button-start");

    demoStart.addEventListener("click", function () {
        demoStart.style.display = "none";
        getTeaBase();
        getIngredients();

        _engine = Engine.create(canvasContainer, {
            render: {
                options: {
                    wireframes: false,
                    showAngleIndicator: false,
                    showDebug: false,
                },
            },
        });

        MilkteaSimulator.fullscreen();

        setTimeout(function () {
            var runner = Engine.run(_engine);

            // pass through runner as timing for debug rendering
            _engine.metrics.timing = runner;

            MilkteaSimulator.updateScene();
        }, 800);

        _engine.render.options.background = "#FFFFFF";

        getQuote();
        getCupStyleImage();

        Matter.Events.on(_engine.render, "beforeRender", function () {
            // const gravity_VEC_X = _engine.world.gravity.x;
            // const gravity_VEC_Y = _engine.world.gravity.y;
            // let water_cords = get_four_water_level_screen_cords(
            //     gravity_VEC_X,
            //     gravity_VEC_Y
            // );
            // draw_polygon(
            //     _engine.render.canvas,
            //     water_cords,
            //     color_card[tea_base]
            // );
        });
        Matter.Events.on(_engine.render, "afterBackgroundRender", function () {
            drawWater();
            return;
        });

        Matter.Events.on(_engine.render, "afterRender", function () {
            // const gravity_VEC_X = _engine.world.gravity.x;
            // const gravity_VEC_Y = _engine.world.gravity.y;
            // let water_cords = get_four_water_level_screen_cords(
            //     gravity_VEC_X,
            //     gravity_VEC_Y
            // );

            // draw_polygon(
            //     _engine.render.canvas,
            //     water_cords,
            //     color_card[tea_base]
            // );
            // drawWater();
            // showText(
            //     _engine.render.canvas,
            //     WORLD_WIDTH.toString() + " " + WORLD_HEIGHT.toString(),
            //     "#000000",
            //     "",
            //     debug_x,
            //     debug_y
            // );
            drawCupStyle();
            global_click_controller();
            showQuote();

            if (water_left_in_bottle == 0) {
                tryPlayBurpSoundAndFinishDrinking();
            }

            for (var j = 0; j < _engine.world.composites.length; j++)
                for (
                    var i = 0;
                    i < _engine.world.composites[0].bodies.length;
                    i++
                ) {
                    if (
                        _engine.world.composites[0].bodies[i].bounds.max.y < 0
                    ) {
                        // _engine.world.composites[0].bodies[i].render.visible = false;
                        Matter.Composite.remove(
                            _engine.world.composites[0],
                            _engine.world.composites[0].bodies[i]
                        );
                    }
                }
        });

        //
        _engine.render.canvas.addEventListener("click", function () {
            clicked_once = true;
        });
    });

    window.addEventListener(
        "deviceorientation",
        function (event) {
            _deviceOrientationEvent = event;
            MilkteaSimulator.updateGravity(event);
        },
        true
    );

    window.addEventListener("touchstart", MilkteaSimulator.fullscreen);

    window.addEventListener(
        "orientationchange",
        function () {
            MilkteaSimulator.updateGravity(_deviceOrientationEvent);
            MilkteaSimulator.updateScene();
            MilkteaSimulator.fullscreen();
        },
        false
    );
};

window.addEventListener("load", MilkteaSimulator.init);

// water level part

// convert onscreen cord X to axis cord x
function X_to_x(X) {
    return X;
}
function x_to_X(x) {
    return x;
}

// convert onscreen cord Y to axis cord y
function Y_to_y(Y) {
    return WORLD_HEIGHT - Y;
}
function y_to_Y(y) {
    return WORLD_HEIGHT - y;
}

function VEC_to_vec(X, Y) {
    return [X, -Y];
}
function vec_to_VEC(x, y) {
    return [x, -y];
}

function get_water_level_cordinates(gravity_VEC_X, gravity_VEC_Y) {
    if (water_left_in_bottle == 0) {
        return null;
    }
    let gravity_vec_x, gravity_vec_y;
    let res = VEC_to_vec(gravity_VEC_X, gravity_VEC_Y);

    gravity_vec_x = res[0];
    gravity_vec_y = res[1];
    if (gravity_vec_x == 0) {
        if (gravity_vec_y >= 0) {
            water_left_in_bottle = 0;
            return null;
        } else if (gravity_vec_y < 0) {
            const h = water_left_in_bottle / WORLD_WIDTH;

            return [
                [0, h],
                [0, 0],
                [WORLD_WIDTH, 0],
                [WORLD_WIDTH, h],
            ];
        }
    } else if (gravity_vec_x < 0) {
        if (gravity_vec_y >= 0) {
            water_left_in_bottle = 0;
            return null;
        }
        // gravity_vec_y < 0
        // calculate threshold k, the k for the water level to went from top left to bottom right
        const threshold_k = (0 - WORLD_HEIGHT) / (WORLD_WIDTH - 0);
        const k = -1 / (gravity_vec_y / gravity_vec_x);
        if (k <= threshold_k) {
            // calculate threshold triangle area
            const threshold_triangle_area =
                0.5 * (-WORLD_HEIGHT / k) * WORLD_HEIGHT;
            if (water_left_in_bottle >= threshold_triangle_area) {
                water_left_in_bottle = threshold_triangle_area;
                // water over flow, leaving threshold points
                tryPlayDrinkingSound();
                return [
                    [0, WORLD_HEIGHT],
                    [0, 0],
                    [-WORLD_HEIGHT / k, 0],
                ];
            } else if (water_left_in_bottle < threshold_triangle_area) {
                const b = Math.sqrt(-2 * k * water_left_in_bottle);
                return [
                    [0, b],
                    [0, 0],
                    [-b / k, 0],
                ];
            }
        } else if (k > threshold_k) {
            // threshold triangle area
            const threshold_triangle_area =
                0.5 * (-WORLD_WIDTH * k) * WORLD_WIDTH;
            if (water_left_in_bottle <= threshold_triangle_area) {
                const b = Math.sqrt(-2 * k * water_left_in_bottle);
                return [
                    [0, b],
                    [0, 0],
                    [-b / k, 0],
                ];
            } else {
                // should be a ladder shape
                const threshold_ladder_area =
                    0.5 *
                    (WORLD_HEIGHT + WORLD_WIDTH * k + WORLD_HEIGHT) *
                    WORLD_WIDTH;
                if (water_left_in_bottle >= threshold_ladder_area) {
                    // water overflow, leaving only the cords of the ladder
                    tryPlayDrinkingSound();
                    water_left_in_bottle = threshold_ladder_area;
                    return [
                        [0, WORLD_HEIGHT],
                        [0, 0],
                        [WORLD_WIDTH, 0],
                        [WORLD_WIDTH, WORLD_WIDTH * k + WORLD_HEIGHT],
                    ];
                } else {
                    // need to calculate a ladder
                    const b =
                        0.5 *
                        ((2 * water_left_in_bottle) / WORLD_WIDTH -
                            WORLD_WIDTH * k);
                    return [
                        [0, b],
                        [0, 0],
                        [WORLD_WIDTH, 0],
                        [WORLD_WIDTH, WORLD_WIDTH * k + b],
                    ];
                }
            }
        }
    } else if (gravity_vec_x > 0) {
        // last condition
        if (gravity_vec_y >= 0) {
            return null;
        }

        // gravity_vec_y < 0
        const threshold_k = WORLD_HEIGHT / WORLD_WIDTH;
        const k = -1 / (gravity_vec_y / gravity_vec_x);
        if (k >= threshold_k) {
            // should be a triangle here
            const threshold_triangle_area =
                0.5 * (WORLD_HEIGHT / k) * WORLD_HEIGHT;
            if (water_left_in_bottle >= threshold_triangle_area) {
                // overflow
                tryPlayDrinkingSound();
                water_left_in_bottle = threshold_triangle_area;
                return [
                    [WORLD_WIDTH - WORLD_HEIGHT / k, 0],
                    [WORLD_WIDTH, 0],
                    [WORLD_WIDTH, WORLD_HEIGHT],
                ];
            } else {
                // b < 0
                const b =
                    Math.sqrt(2 * k * water_left_in_bottle) - WORLD_WIDTH * k;
                return [
                    [-(b / k), 0],
                    [WORLD_WIDTH, 0],
                    [WORLD_WIDTH, k * WORLD_WIDTH + b],
                ];
            }
        } else {
            // k < threshold_k
            const threshold_triangle_area =
                0.5 * WORLD_WIDTH * (k * WORLD_WIDTH);
            if (water_left_in_bottle <= threshold_triangle_area) {
                const b =
                    Math.sqrt(2 * k * water_left_in_bottle) - WORLD_WIDTH * k;
                return [
                    [-b / k, 0],
                    [WORLD_WIDTH, 0],
                    [WORLD_WIDTH, k * WORLD_WIDTH + b],
                ];
            } else {
                // water_left_in bottle > threshold_triangle_area
                const threshold_ladder_area =
                    0.5 *
                    (WORLD_HEIGHT - k * WORLD_WIDTH + WORLD_HEIGHT) *
                    WORLD_WIDTH;
                if (water_left_in_bottle >= threshold_ladder_area) {
                    // overflow
                    tryPlayDrinkingSound();
                    water_left_in_bottle = threshold_ladder_area;
                    return [
                        [0, WORLD_HEIGHT - k * WORLD_WIDTH],
                        [0, 0],
                        [WORLD_WIDTH, 0],
                        [WORLD_WIDTH, WORLD_HEIGHT],
                    ];
                } else {
                    // should be in the shape of a ladder
                    const b =
                        water_left_in_bottle / WORLD_WIDTH -
                        (WORLD_WIDTH * k) / 2;
                    return [
                        [0, b],
                        [0, 0],
                        [WORLD_WIDTH, 0],
                        [WORLD_WIDTH, k * WORLD_WIDTH + b],
                    ];
                }
            }
        }
    }
}

function get_four_water_level_screen_cords(gravity_VEC_X, gravity_VEC_Y) {
    const result = get_water_level_cordinates(gravity_VEC_X, gravity_VEC_Y);

    if (result == null) {
        return null;
    }
    let vec_results = [];
    for (var i = 0; i < result.length; i++) {
        vec_results.push([x_to_X(result[i][0]), y_to_Y(result[i][1])]);
    }
    return vec_results;
}

function drawWater() {
    const gravity_VEC_X = _engine.world.gravity.x;
    const gravity_VEC_Y = _engine.world.gravity.y;
    let water_cords = get_four_water_level_screen_cords(
        gravity_VEC_X,
        gravity_VEC_Y
    );

    draw_polygon(_engine.render.canvas, water_cords, color_card[tea_base]);
}

////////////////////////////////////////////////////////////////

function getCoconutFruit(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.coconutfruit.gap,
        ingredients_info.coconutfruit.gap,
        function (x, y, column, row) {
            var body = Bodies.rectangle(
                x,
                y,
                ingredients_info.coconutfruit.radius * 2,
                ingredients_info.coconutfruit.radius * 2,
                { friction: 0.01, restitution: 0.4 }
            );

            body.render.fillStyle = "rgba(240,240,240,0.6)";
            body.render.strokeStyle = "rgba(160,160,160,0.5)";
            body.render.lineWidth = 10;

            body.density = 0.0005; //default value is 0.001

            return body;
        }
    );
    return ingredient;
}

function getMango(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.mango.gap,
        ingredients_info.mango.gap,
        function (x, y, column, row) {
            var body = Bodies.rectangle(
                x,
                y,
                ingredients_info.mango.radius * 2 + Common.random(0, 50),
                ingredients_info.mango.radius * 2 + Common.random(-50, 0),
                { friction: 0.01, restitution: 0.4 }
            );

            body.render.fillStyle = "rgba(228,128,55,0.9)";
            body.render.strokeStyle = "rgba(228,128,55,0.9)";

            body.density = 0.0005; //default value is 0.001

            return body;
        }
    );
    return ingredient;
}

function getPassionFruit(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.passionfruit.gap,
        ingredients_info.passionfruit.gap,
        function (x, y, column, row) {
            var body = Bodies.circle(
                x,
                y,
                ingredients_info.passionfruit.radius,
                { friction: 0.01, restitution: 0.4 }
            );

            body.render.fillStyle = "rgba(66,58,52,0.7)";
            body.render.strokeStyle = "rgba(66,58,52,0.2)";

            body.density = 0.0005; //default value is 0.001

            return body;
        }
    );
    return ingredient;
}

function getRedGrapeFruit(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.redgrapefruit.gap,
        ingredients_info.redgrapefruit.gap,
        function (x, y, column, row) {
            var body = Bodies.circle(
                x,
                y,
                ingredients_info.redgrapefruit.radius,
                {
                    friction: 0.02,
                    restitution: 0.4,
                    render: {
                        sprite: {
                            texture: "./textures/red_grapefruit.png",
                            xScale: ingredients_info.redgrapefruit.radius / 100,
                            yScale: ingredients_info.redgrapefruit.radius / 100,
                        },
                    },
                }
            );

            body.render.fillStyle = "#000000";
            body.render.strokeStyle = "#FFFFFF";

            body.density = 0.002;

            return body;
        }
    );
    return ingredient;
}

function getGreenLemon(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.greenlemon.gap,
        ingredients_info.greenlemon.gap,
        function (x, y, column, row) {
            var body = Bodies.circle(x, y, ingredients_info.greenlemon.radius, {
                friction: 0.02,
                restitution: 0.4,
                render: {
                    sprite: {
                        texture: "./textures/green_lemon.png",
                        xScale: ingredients_info.greenlemon.radius / 100,
                        yScale: ingredients_info.greenlemon.radius / 100,
                    },
                },
            });

            body.render.fillStyle = "#000000";
            body.render.strokeStyle = "#FFFFFF";

            body.density = 0.002;

            return body;
        }
    );
    return ingredient;
}

function getPearl(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.pearl.gap,
        ingredients_info.pearl.gap,
        function (x, y, column, row) {
            var body = Bodies.circle(x, y, ingredients_info.pearl.radius, {
                friction: 0.02,
                restitution: 0.4,
            });

            body.render.fillStyle = "#000000";
            body.render.strokeStyle = "#FFFFFF";

            body.density = 0.0015;

            return body;
        }
    );
    return ingredient;
}

function getWestRice(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.westrice.gap,
        ingredients_info.westrice.gap,
        function (x, y, column, row) {
            var body = Bodies.circle(
                x,
                y,
                ingredients_info.westrice.radius + Common.random(-2, 2),
                {
                    friction: 0.02,
                    restitution: 0.4,
                }
            );

            body.render.fillStyle = "#FFFFFF";
            body.render.strokeStyle = "#777777";

            body.density = 0.0015;

            return body;
        }
    );
    return ingredient;
}

function getXiancao(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.xiancao.gap,
        ingredients_info.xiancao.gap,
        function (x, y, column, row) {
            var body = Bodies.rectangle(
                x,
                y,
                2 * (ingredients_info.xiancao.radius + Common.random(0, 20)),
                2 * (ingredients_info.xiancao.radius + Common.random(0, 20)),
                {
                    friction: 0.02,
                    restitution: 0.4,
                }
            );

            body.render.fillStyle = "rgba(0,0,0,1)";
            body.render.strokeStyle = "rgba(25,25,25,0.2)";

            body.density = 0.0001;

            return body;
        }
    );
    return ingredient;
}

function getPudding(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.pudding.gap,
        ingredients_info.pudding.gap,
        function (x, y, column, row) {
            var body = Bodies.rectangle(
                x,
                y,
                2 * (ingredients_info.pudding.radius + Common.random(0, 40)),
                2 * (ingredients_info.pudding.radius + Common.random(0, 10)),
                {
                    friction: 0.02,
                    restitution: 0.4,
                }
            );

            body.render.fillStyle = "rgba(241,215,94,0.7)";
            body.render.strokeStyle = "rgba(213,187,66,0.2)";
            body.render.lineWidth = 30;

            body.density = 0.0001;

            return body;
        }
    );
    return ingredient;
}

// estimate height to make sure it do not spill out

//only things like pearls or westrice that sinks to the bottom and take up the space bellow max water level
// function isBottomAddings(adding) {
//     const sinking_addings = ["westrice", "pearl"];

//     if (sinking_addings.indexOf(adding) != -1) {
//         return true;
//     }
//     return false;
// }

// function hasIngredient(ingred) {
//     if (ingredients.indexOf(ingred) != -1) {
//         return true;
//     }
//     return false;
// }

function estimateHeightPassed(max_water_level, scale = 1) {
    height_now = 0;
    for (var i = 0; i < ingredients.length; i++) {
        // go from bottom to top

        height_now +=
            (ingredients_info[ingredients[i]].gap +
                2 * ingredients_info[ingredients[i]].radius) *
            Math.floor(ingredients_info[ingredients[i]].rows * scale);
        if (height_now > max_water_level) {
            return false;
        }
    }
    return true;
}

// make beverage
function makeBeverage(app_world) {
    const max_water_level = WORLD_HEIGHT * 0.8;
    var now_y = WORLD_HEIGHT;
    var scale = 1;
    while (!estimateHeightPassed(max_water_level, scale)) {
        scale = scale * 0.8;
    }
    //make it
    console.log("makeBeverage");
    for (var i = 0; i < ingredients.length; i++) {
        switch (ingredients[i]) {
            case "pearl":
                now_y =
                    now_y -
                    (ingredients_info.pearl.radius * 2 +
                        ingredients_info.pearl.gap) *
                        Math.floor(ingredients_info.pearl.rows * scale);
                var ingred = getPearl(
                    0,
                    now_y,
                    WORLD_WIDTH /
                        (ingredients_info.pearl.radius * 2 +
                            ingredients_info.pearl.gap),
                    Math.floor(ingredients_info.pearl.rows * scale)
                );

                World.add(app_world, ingred);
                break;
            case "westrice":
                now_y =
                    now_y -
                    (ingredients_info.westrice.radius * 2 +
                        ingredients_info.westrice.gap) *
                        Math.floor(ingredients_info.westrice.rows * scale);
                var ingred = getWestRice(
                    0,
                    now_y,
                    WORLD_WIDTH /
                        (ingredients_info.westrice.radius * 2 +
                            ingredients_info.westrice.gap),
                    Math.floor(ingredients_info.westrice.rows * scale)
                );

                World.add(app_world, ingred);
                break;

            case "passionfruit":
                now_y =
                    now_y -
                    (ingredients_info.passionfruit.radius * 2 +
                        ingredients_info.passionfruit.gap) *
                        Math.floor(ingredients_info.passionfruit.rows * scale);
                var ingred = getPassionFruit(
                    0,
                    now_y,
                    WORLD_WIDTH /
                        (ingredients_info.passionfruit.radius * 2 +
                            ingredients_info.passionfruit.gap),
                    Math.floor(ingredients_info.passionfruit.rows * scale)
                );

                World.add(app_world, ingred);
                break;
            case "coconutfruit":
                now_y =
                    now_y -
                    (ingredients_info.coconutfruit.radius * 2 +
                        ingredients_info.coconutfruit.gap) *
                        Math.floor(ingredients_info.coconutfruit.rows * scale);
                var ingred = getCoconutFruit(
                    0,
                    now_y,
                    WORLD_WIDTH /
                        (ingredients_info.coconutfruit.radius * 2 +
                            ingredients_info.coconutfruit.gap),
                    Math.floor(ingredients_info.coconutfruit.rows * scale)
                );

                World.add(app_world, ingred);
                break;
            case "xiancao":
                now_y =
                    now_y -
                    (ingredients_info.xiancao.radius * 2 +
                        ingredients_info.xiancao.gap) *
                        Math.floor(ingredients_info.xiancao.rows * scale);
                var ingred = getXiancao(
                    0,
                    now_y,
                    WORLD_WIDTH /
                        (ingredients_info.xiancao.radius * 2 +
                            ingredients_info.xiancao.gap),
                    Math.floor(ingredients_info.xiancao.rows * scale)
                );

                World.add(app_world, ingred);
                break;
            case "pudding":
                now_y =
                    now_y -
                    (ingredients_info.pudding.radius * 2 +
                        ingredients_info.pudding.gap) *
                        Math.floor(ingredients_info.pudding.rows * scale);
                var ingred = getPudding(
                    0,
                    now_y,
                    WORLD_WIDTH /
                        (ingredients_info.pudding.radius * 2 +
                            ingredients_info.pudding.gap),
                    Math.floor(ingredients_info.pudding.rows * scale)
                );

                World.add(app_world, ingred);
                break;

            case "redgrapefruit":
                now_y =
                    now_y -
                    (ingredients_info.redgrapefruit.radius * 2 +
                        ingredients_info.redgrapefruit.gap) *
                        Math.floor(ingredients_info.redgrapefruit.rows * scale);
                var ingred = getRedGrapeFruit(
                    0,
                    now_y,
                    WORLD_WIDTH /
                        (ingredients_info.redgrapefruit.radius * 2 +
                            ingredients_info.redgrapefruit.gap),
                    Math.floor(ingredients_info.redgrapefruit.rows * scale)
                );

                World.add(app_world, ingred);
                break;
            case "greenlemon":
                now_y =
                    now_y -
                    (ingredients_info.greenlemon.radius * 2 +
                        ingredients_info.greenlemon.gap) *
                        Math.floor(ingredients_info.greenlemon.rows * scale);
                var ingred = getGreenLemon(
                    0,
                    now_y,
                    WORLD_WIDTH /
                        (ingredients_info.greenlemon.radius * 2 +
                            ingredients_info.greenlemon.gap),
                    Math.floor(ingredients_info.greenlemon.rows * scale)
                );

                World.add(app_world, ingred);
                break;
            case "mango":
                now_y =
                    now_y -
                    (ingredients_info.mango.radius * 2 +
                        ingredients_info.mango.gap) *
                        Math.floor(ingredients_info.mango.rows * scale);
                var ingred = getMango(
                    0,
                    now_y,
                    WORLD_WIDTH /
                        (ingredients_info.mango.radius * 2 +
                            ingredients_info.mango.gap),
                    Math.floor(ingredients_info.mango.rows * scale)
                );
                console.log("scale,", scale);

                World.add(app_world, ingred);
                break;

            default:
                console.log(
                    "something definitely went wrong, function: hasBeverage"
                );
                break;
        }
    }
}

MilkteaSimulator.mixed = function () {
    var _world = _engine.world;
    // init gravity
    _world.gravity.y = GRAVITY;

    // mixup the ingredients

    MilkteaSimulator.reset();
    getCupStyleImage();
    makeBeverage(_world);
};

MilkteaSimulator.updateScene = function () {
    if (!_engine) return;
    _sceneWidth = document.documentElement.clientWidth;
    _sceneHeight = document.documentElement.clientHeight;

    WORLD_HEIGHT = _sceneHeight;
    WORLD_WIDTH = _sceneWidth;

    var boundsMax = _engine.world.bounds.max,
        renderOptions = _engine.render.options,
        canvas = _engine.render.canvas;

    boundsMax.x = _sceneWidth;
    boundsMax.y = _sceneHeight;

    canvas.width = renderOptions.width = _sceneWidth;
    canvas.height = renderOptions.height = _sceneHeight;

    MilkteaSimulator[_sceneName]();
};

MilkteaSimulator.updateGravity = function (event) {
    // eventsRef.push({ beta: event.beta, gamma: event.gamma });

    // alert(event);

    if (!_engine) return;

    var orientation = window.orientation,
        gravity = _engine.world.gravity;

    if (orientation === 0) {
        gravity.x = (GRAVITY * Common.clamp(event.gamma, -90, 90)) / 90;
        gravity.y = (GRAVITY * Common.clamp(event.beta, -90, 90)) / 90;
    } else if (orientation === 180) {
        gravity.x = (GRAVITY * Common.clamp(event.gamma, -90, 90)) / 90;
        gravity.y = (GRAVITY * Common.clamp(-event.beta, -90, 90)) / 90;
    } else if (orientation === 90) {
        gravity.x = (GRAVITY * Common.clamp(event.beta, -90, 90)) / 90;
        gravity.y = (GRAVITY * Common.clamp(-event.gamma, -90, 90)) / 90;
    } else if (orientation === -90) {
        gravity.x = (GRAVITY * Common.clamp(-event.beta, -90, 90)) / 90;
        gravity.y = (GRAVITY * Common.clamp(event.gamma, -90, 90)) / 90;
    }
};

MilkteaSimulator.fullscreen = function () {
    var lockFunction = window.screen.orientation.lock;

    var _fullscreenElement = _engine.render.canvas;

    if (
        !document.fullscreenElement &&
        !document.mozFullScreenElement &&
        !document.webkitFullscreenElement
    ) {
        if (_fullscreenElement.requestFullscreen) {
            _fullscreenElement.requestFullscreen();
        } else if (_fullscreenElement.mozRequestFullScreen) {
            _fullscreenElement.mozRequestFullScreen();
        } else if (_fullscreenElement.webkitRequestFullscreen) {
            _fullscreenElement.webkitRequestFullscreen(
                Element.ALLOW_KEYBOARD_INPUT
            );
        }
    }

    if (lockFunction.call(window.screen.orientation, "portrait-primary")) {
        console.log("Orientation locked");
    } else {
        console.error("There was a problem in locking the orientation");
    }
};

MilkteaSimulator.reset = function () {
    var _world = _engine.world;

    Common._seed = 2;

    World.clear(_world);
    Engine.clear(_engine);

    var offset = 5;
    // World.addBody(_world, Bodies.rectangle(_sceneWidth * 0.5, -offset, _sceneWidth + 0.5, 50.5, { isStatic: true }));
    World.addBody(
        _world,
        Bodies.rectangle(
            _sceneWidth * 0.5,
            _sceneHeight + 25,
            _sceneWidth + 0.5,
            50,
            { isStatic: true }
        )
    );
    World.addBody(
        _world,
        Bodies.rectangle(
            _sceneWidth + 25,
            _sceneHeight * 0.5,
            50,
            _sceneHeight + 0.5,
            { isStatic: true }
        )
    );
    World.addBody(
        _world,
        Bodies.rectangle(-25, _sceneHeight * 0.5, 50, _sceneHeight + 0.5, {
            isStatic: true,
        })
    );
};
