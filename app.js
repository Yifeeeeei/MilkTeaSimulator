// var eventsRef = new Firebase("https://beerglass.firebaseio.com/events"),
//     engineRef = new Firebase("https://beerglass.firebaseio.com/engine");

// Matter aliases
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

BeerSimulator.init = function () {
    var canvasContainer = document.getElementById("body"),
        demoStart = document.getElementById("button-start");

    demoStart.addEventListener("click", function () {
        demoStart.style.display = "none";

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

            console.log(_engine);
            for (
                var i = 0;
                i < _engine.world.composites[0].bodies.length;
                i++
            ) {
                if (_engine.world.composites[0].bodies[i].bounds.max.y < 0) {
                    // _engine.world.composites[0].bodies[i].render.visible = false;
                    Matter.Composite.remove(
                        _engine.world.composites[0],
                        _engine.world.composites[0].bodies[i]
                    );
                }
            }

            for (
                var i = 0;
                i < _engine.world.composites[1].bodies.length;
                i++
            ) {
                if (_engine.world.composites[1].bodies[i].bounds.max.y < 0) {
                    // _engine.world.composites[0].bodies[i].render.visible = false;
                    Matter.Composite.remove(
                        _engine.world.composites[1],
                        _engine.world.composites[1].bodies[i]
                    );
                }
            }
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

BeerSimulator.mixed = function () {
    var _world = _engine.world;

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
                Common.random(15, 30),
                { friction: 0.01, restitution: 0.4 }
            );

            body.render.fillStyle = "#E5B02B";
            body.render.strokeStyle = "#B95626";
            console.log(body);

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
                Common.random(15, 30),
                { friction: 0.01, restitution: 0.4 }
            );

            body.render.fillStyle = "#FFF";
            body.render.strokeStyle = "#FFF";
            console.log(body);

            return body;
        }
    );

    World.add(_world, stack);
    setTimeout(function () {
        World.add(_world, cream);
    }, 0);
};

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

    BeerSimulator[_sceneName]();
};

BeerSimulator.updateGravity = function (event) {
    // eventsRef.push({ beta: event.beta, gamma: event.gamma });
    console.log(event);
    // alert(event);

    if (!_engine) return;

    var orientation = window.orientation,
        gravity = _engine.world.gravity;

    if (orientation === 0) {
        gravity.x = Common.clamp(event.gamma, -90, 90) / 90;
        gravity.y = Common.clamp(event.beta, -90, 90) / 90;
    } else if (orientation === 180) {
        gravity.x = Common.clamp(event.gamma, -90, 90) / 90;
        gravity.y = Common.clamp(-event.beta, -90, 90) / 90;
    } else if (orientation === 90) {
        gravity.x = Common.clamp(event.beta, -90, 90) / 90;
        gravity.y = Common.clamp(-event.gamma, -90, 90) / 90;
    } else if (orientation === -90) {
        gravity.x = Common.clamp(-event.beta, -90, 90) / 90;
        gravity.y = Common.clamp(event.gamma, -90, 90) / 90;
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
