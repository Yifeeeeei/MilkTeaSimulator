// var eventsRef = new Firebase("https://beerglass.firebaseio.com/events"),
//     engineRef = new Firebase("https://beerglass.firebaseio.com/engine");
// yeah, i dont really like having firebase services. is it here to steal my personal information?

// Matter aliases
// the gloabl param for gravity
const GRAVITY = 2.0;

// window size
let WORLD_WIDTH = document.documentElement.clientWidth;
let WORLD_HEIGHT = document.documentElement.clientHeight;

//
let water_left_in_bottle = WORLD_HEIGHT * WORLD_WIDTH;
// all available ingredients, from bottom to top
const ALL_INGREDIENTS = [
    "pearl",
    "westrice",
    "lemonade",
    "milktea",
    "chocolatesmoothie",
    "milktop",
];

const color_card = {
    milktea: "rgba(243,207,179,0.5)",
    lemonade: "rgba(207,207,207,0.5)",
    chocolatesmoothie: "rgba(68,43,25,0.5)",
};
let tea_base_color = null;

const ingredients_info = {
    pearl: { radius: 50, gap: 2, rows: 2 },
    westrice: { radius: 10, gap: 3, rows: 2 },
    lemonade: { radius: 30, gap: 0, rows: -1 },
    milktea: { radius: 30, gap: 0, rows: -1 },
    chocolatesmoothie: { radius: 30, gap: 0, rows: -1 },
    milktop: { radius: 20, gap: 0, rows: 5 },
};

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Composites = Matter.Composites,
    Common = Matter.Common,
    MouseConstraint = Matter.MouseConstraint;

var BeerSimulator = {};

var _engine,
    _sceneName = "mixed",
    _sceneWidth,
    _sceneHeight,
    _deviceOrientationEvent;

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

BeerSimulator.init = function () {
    var canvasContainer = document.getElementById("body"),
        demoStart = document.getElementById("button-start");

    demoStart.addEventListener("click", function () {
        demoStart.style.display = "none";

        getIngredients();

        _engine = Engine.create(canvasContainer, {
            render: {
                options: {
                    wireframes: false,
                    showAngleIndicator: false,
                    showDebug: true,
                },
            },
        });

        BeerSimulator.fullscreen();

        setTimeout(function () {
            var runner = Engine.run(_engine);

            // pass through runner as timing for debug rendering
            _engine.metrics.timing = runner;

            BeerSimulator.updateScene();
        }, 800);

        _engine.render.options.background = "#000";

        Matter.Events.on(_engine.render, "afterRender", function () {
            // engineRef.push({ world: _engine.world });
            // var ctx1 = _engine.render.canvas.getContext("2d");
            // ctx1.fillStyle = "rgb(200,0,0)";
            // //绘制矩形
            // ctx1.fillRect(10, 10, 55, 50);

            // ctx1.fillStyle = "rgba(0, 0, 200, 0.5)";
            // ctx1.fillRect(30, 30, 55, 50);
            if (tea_base_color == null) {
                for (var k in color_card) {
                    if (ingredients.indexOf(k) != -1) {
                        tea_base_color = color_card[k];
                    }
                }
            }

            const gravity_VEC_X = _engine.world.gravity.x;
            const gravity_VEC_Y = _engine.world.gravity.y;
            let water_cords = get_four_water_level_screen_cords(
                gravity_VEC_X,
                gravity_VEC_Y
            );

            draw_polygon(_engine.render.canvas, water_cords, tea_base_color);

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

            // for (
            //     var i = 0;
            //     i < _engine.world.composites[1].bodies.length;
            //     i++
            // ) {
            //     if (_engine.world.composites[1].bodies[i].bounds.max.y < 0) {
            //         // _engine.world.composites[0].bodies[i].render.visible = false;
            //         Matter.Composite.remove(
            //             _engine.world.composites[1],
            //             _engine.world.composites[1].bodies[i]
            //         );
            //     }
            // }
        });
    });

    window.addEventListener(
        "deviceorientation",
        function (event) {
            _deviceOrientationEvent = event;
            BeerSimulator.updateGravity(event);
        },
        true
    );

    window.addEventListener("touchstart", BeerSimulator.fullscreen);

    window.addEventListener(
        "orientationchange",
        function () {
            BeerSimulator.updateGravity(_deviceOrientationEvent);
            BeerSimulator.updateScene();
            BeerSimulator.fullscreen();
        },
        false
    );
};

window.addEventListener("load", BeerSimulator.init);

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
                return [
                    [0, WORLD_HEIGHT],
                    [0, 0],
                    [-WORLD_HEIGHT / k, 0],
                ];
            } else if (water_left_in_bottle < threshold_triangle_area) {
                const b = Math.sqrt(-2 * k * water_left_in_bottle);
                return [[0, b], [0, 0], [-b / k]];
            }
        } else if (k > threshold_k) {
            // threshold triangle area
            const threshold_triangle_area =
                0.5 * (-WORLD_WIDTH * k) * WORLD_WIDTH;
            if (water_left_in_bottle <= threshold_triangle_area) {
                const b = Math.sqrt(-2 * k * water_left_in_bottle);
                return [[0, b], [0, 0], [-b / k]];
            } else {
                // should be a ladder shape
                const threshold_ladder_area =
                    0.5 *
                    (WORLD_HEIGHT + WORLD_WIDTH * k + WORLD_HEIGHT) *
                    WORLD_WIDTH;
                if (water_left_in_bottle >= threshold_ladder_area) {
                    // water overflow, leaving only the cords of the ladder
                    water_left_in_bottle = threshold_ladder_area;
                    return [
                        [0, WORLD_HEIGHT],
                        [0, 0],
                        [WORLD_WIDTH, 0],
                        [WORLD_WIDTH * k + WORLD_HEIGHT],
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
                        [WORLD_WIDTH * k + b, 0],
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
                water_left_in_bottle = threshold_triangle_area;
                const b = h - WORLD_WIDTH * k;
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

////////////////////////////////////////////////////////////////

function getMilkTea(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.milktea.gap,
        ingredients_info.milktea.gap,
        function (x, y, column, row) {
            var body = Bodies.polygon(
                x,
                y,
                Math.round(Common.random(6, 12)),
                ingredients_info.milktea.radius,
                { friction: 0.01, restitution: 0.4 }
            );

            body.render.fillStyle = "#F3CFB3";
            body.render.strokeStyle = "#F3CFB3";

            return body;
        }
    );
    return ingredient;
}

function getChocolateSmoothie(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.chocolatesmoothie.gap,
        ingredients_info.chocolatesmoothie.gap,
        function (x, y, column, row) {
            var body = Bodies.polygon(
                x,
                y,
                Math.round(Common.random(6, 12)),
                ingredients_info.chocolatesmoothie.radius +
                    Common.random(-10, 10),
                { friction: 0.05, restitution: 0.4 }
            );

            body.render.fillStyle = "#442b19";
            body.render.strokeStyle = "#442b19";

            return body;
        }
    );
    return ingredient;
}

function getLemonade(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.lemonade.gap,
        ingredients_info.lemonade.gap,
        function (x, y, column, row) {
            var body = Bodies.polygon(
                x,
                y,
                Math.round(Common.random(6, 12)),
                ingredients_info.lemonade.radius + Common.random(-10, 10),
                { friction: 0.001, restitution: 0.4 }
            );

            body.render.fillStyle = "#cfcfcf";
            body.render.strokeStyle = "#cfcfcf";

            return body;
        }
    );
    return ingredient;
}

function getMilkTop(xx, yy, columns, rows) {
    var ingredient = Composites.stack(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.milktop.gap,
        ingredients_info.milktop.gap,
        function (x, y, column, row) {
            var body = Bodies.polygon(
                x,
                y,
                Math.round(Common.random(6, 12)),
                ingredients_info.milktop.radius + Common.random(-20, 20),
                { friction: 0.01, restitution: 0.4 }
            );

            body.render.fillStyle = "#FFFFFF";
            body.render.strokeStyle = "#FFFFFF";

            body.density = 0.0005; //default value is 0.001

            return body;
        }
    );
    return ingredient;
}

function getPearl(xx, yy, columns, rows) {
    var ingredient = Composites.pyramid(
        xx,
        yy,
        columns,
        rows,
        ingredients_info.pearl.gap,
        ingredients_info.pearl.gap,
        function (x, y, column, row) {
            var body = Bodies.circle(
                x,
                y,
                ingredients_info.pearl.radius + Common.random(-5, 5),
                {
                    friction: 0.02,
                    restitution: 0.4,
                }
            );

            body.render.fillStyle = "#000000";
            body.render.strokeStyle = "#FFFFFF";

            body.density = 0.0015;

            return body;
        }
    );
    return ingredient;
}

function getWestRice(xx, yy, columns, rows) {
    var ingredient = Composites.pyramid(
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

// estimate height to make sure it do not spill out

//only things like pearls or westrice that sinks to the bottom and take up the space bellow max water level
function isBottomAddings(adding) {
    const sinking_addings = ["westrice", "pearl"];

    if (sinking_addings.indexOf(adding) != -1) {
        return true;
    }
    return false;
}

function hasIngredient(ingred) {
    if (ingredients.indexOf(ingred) != -1) {
        return true;
    }
    return false;
}

function estimateHeightPassed(max_water_level, scale = 1) {
    height_now = 0;
    for (var i = 0; i < ALL_INGREDIENTS.length; i++) {
        // go from bottom to top
        if (
            hasIngredient(ALL_INGREDIENTS[i]) &&
            isBottomAddings(ALL_INGREDIENTS[i])
        ) {
            height_now +=
                (ingredients_info[ALL_INGREDIENTS[i]].gap +
                    2 * ingredients_info[ALL_INGREDIENTS[i]].radius) *
                Math.floor(ingredients_info[ALL_INGREDIENTS[i]].rows * scale);
            if (height_now > max_water_level) {
                return false;
            }
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
        scale = scale * 0.5;
    }
    //make it
    for (var i = 0; i < ALL_INGREDIENTS.length; i++) {
        if (hasIngredient(ALL_INGREDIENTS[i])) {
            switch (ALL_INGREDIENTS[i]) {
                case "pearl":
                    now_y =
                        now_y -
                        (ingredients_info.pearl.radius * 2 +
                            ingredients_info.pearl.gap) *
                            ingredients_info.pearl.rows;
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
                            ingredients_info.westrice.rows;
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
                case "lemonade":
                    now_y =
                        now_y -
                        (ingredients_info.lemonade.radius * 2 +
                            ingredients_info.lemonade.gap) *
                            ingredients_info.lemonade.rows;
                    console.log("milktea adding");
                    var ingred = getLemonade(
                        0,
                        WORLD_HEIGHT - max_water_level,
                        WORLD_WIDTH /
                            (ingredients_info.lemonade.radius * 2 +
                                ingredients_info.lemonade.gap),
                        Math.floor(
                            (max_water_level - (WORLD_HEIGHT - now_y)) /
                                (ingredients_info.lemonade.radius +
                                    ingredients_info.lemonade.gap)
                        )
                    );
                    World.add(app_world, ingred);
                    break;
                case "milktea":
                    now_y =
                        now_y -
                        (ingredients_info.milktea.radius * 2 +
                            ingredients_info.milktea.gap) *
                            ingredients_info.milktea.rows;
                    var ingred = getMilkTea(
                        0,
                        WORLD_HEIGHT - max_water_level,
                        WORLD_WIDTH /
                            (ingredients_info.milktea.radius * 2 +
                                ingredients_info.milktea.gap),
                        Math.floor(
                            (max_water_level - (WORLD_HEIGHT - now_y)) /
                                (ingredients_info.milktea.radius +
                                    ingredients_info.milktea.gap)
                        )
                    );
                    World.add(app_world, ingred);
                    break;
                case "chocolatesmoothie":
                    now_y =
                        now_y -
                        (ingredients_info.chocolatesmoothie.radius * 2 +
                            ingredients_info.chocolatesmoothie.gap) *
                            ingredients_info.chocolatesmoothie.rows;
                    var ingred = getChocolateSmoothie(
                        0,
                        WORLD_HEIGHT - max_water_level,
                        WORLD_WIDTH /
                            (ingredients_info.chocolatesmoothie.radius * 2 +
                                ingredients_info.chocolatesmoothie.gap),
                        Math.floor(
                            (max_water_level - (WORLD_HEIGHT - now_y)) /
                                (ingredients_info.chocolatesmoothie.radius +
                                    ingredients_info.chocolatesmoothie.gap)
                        )
                    );
                    World.add(app_world, ingred);
                    break;
                case "milktop":
                    now_y =
                        now_y -
                        (ingredients_info.milktop.radius * 2 +
                            ingredients_info.milktop.gap) *
                            ingredients_info.milktop.rows;
                    var ingred = getMilkTop(
                        0,
                        WORLD_HEIGHT -
                            max_water_level -
                            (ingredients_info.milktop.radius * 2 +
                                ingredients_info.milktop.gap) *
                                ingredients_info.milktop.rows,
                        WORLD_WIDTH /
                            (ingredients_info.milktop.radius * 2 +
                                ingredients_info.milktop.gap),
                        Math.floor(ingredients_info.milktop.rows * scale)
                    );

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
}

BeerSimulator.mixed = function () {
    var _world = _engine.world;
    // init gravity
    _world.gravity.y = GRAVITY;

    // mixup the ingredients

    BeerSimulator.reset();

    // World.add(_world, MouseConstraint.create(_engine));

    var stack = Composites.stack(
        20,
        200,
        15,
        12,
        0,
        0,
        function (x, y, column, row) {
            // return Bodies.circle(x, y, 1);
            var body = Bodies.polygon(
                x,
                y,
                Math.round(Common.random(6, 12)),
                Common.random(30, 50),
                { friction: 0.01, restitution: 0.4 }
            );

            body.render.fillStyle = "#E5B02B";
            body.render.strokeStyle = "#B95626";

            return body;
        }
    );

    var cream = Composites.stack(
        20,
        0,
        15,
        4,
        0,
        0,
        function (x, y, column, row) {
            // return Bodies.circle(x, y, 1);
            var body = Bodies.polygon(
                x,
                y,
                Math.round(Common.random(6, 12)),
                Common.random(15, 20),
                { friction: 0.01, restitution: 0.4 }
            );

            body.render.fillStyle = "#FFF";
            body.render.strokeStyle = "#FFF";

            return body;
        }
    );

    // World.add(_world, stack);
    // World.add(_world, cream);
    makeBeverage(_world);
    // setTimeout(function () {
    //     World.add(_world, cream);
    // }, 0);
};

// Events.on(_engine.render, "afterRender", function () {
//     var ctx = canvas.getContext("2d");
//     ctx.fillStyle = "rgb(200,0,0)";
//     //绘制矩形
//     ctx.fillRect(10, 10, 55, 50);

//     ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
//     ctx.fillRect(30, 30, 55, 50);
// });

BeerSimulator.updateScene = function () {
    if (!_engine) return;
    _sceneWidth = document.documentElement.clientWidth;
    _sceneHeight = document.documentElement.clientHeight;

    var boundsMax = _engine.world.bounds.max,
        renderOptions = _engine.render.options,
        canvas = _engine.render.canvas;

    boundsMax.x = _sceneWidth;
    boundsMax.y = _sceneHeight;

    canvas.width = renderOptions.width = _sceneWidth;
    canvas.height = renderOptions.height = _sceneHeight;
    WORLD_HEIGHT = _sceneHeight;
    WORLD_WIDTH = _sceneWidth;

    BeerSimulator[_sceneName]();
};

BeerSimulator.updateGravity = function (event) {
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

BeerSimulator.fullscreen = function () {
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

BeerSimulator.reset = function () {
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
            _sceneHeight + offset,
            _sceneWidth + 0.5,
            50.5,
            { isStatic: true }
        )
    );
    World.addBody(
        _world,
        Bodies.rectangle(
            _sceneWidth + offset,
            _sceneHeight * 0.5,
            50.5,
            _sceneHeight + 0.5,
            { isStatic: true }
        )
    );
    World.addBody(
        _world,
        Bodies.rectangle(
            -offset,
            _sceneHeight * 0.5,
            50.5,
            _sceneHeight + 0.5,
            { isStatic: true }
        )
    );
};
