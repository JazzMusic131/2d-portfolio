import { dialogueData, dialogueDataExample, scaleFactor } from "./constants";
import { displayDialogue, setCamScale } from "./utils";
import { k } from "./kaboomCtx";

k.loadSprite('spritesheet', './spritesheet.png', {
    sliceX: 39,
    sliceY: 31,
    anims: {
        'idle-down': 936,
        'walk-down': {
            from: 936, to: 939, loop: true, speed: 8
        },
        'idle-side': 975,
        'walk-side': {
            from: 975, to: 978, loop: true, speed: 8
        },
        'idle-up': 1014,
        'walk-up': {
            from: 1014, to: 1017, loop: true, speed: 8
        },
    },
});

//k.loadSprite('map', './map-example.png');
k.loadSprite('map', './map.png');
k.setBackground(k.Color.fromHex('#5ba675'));

k.scene('main', async () => {

    // Map data & layers
    //const mapData = await (await fetch('./map-example.json')).json();
    const mapData = await (await fetch('./map.json')).json();
    const layers = mapData.layers;

    // Map object
    const map = k.add([
        k.sprite('map'),
        k.pos(0),
        k.scale(scaleFactor)
    ]);

    // Player object
    const player = k.make([
        k.sprite('spritesheet', { anim: 'idle-down' }),
        k.area({
            shape: new k.Rect(k.vec2(0, 3), 10, 10),
        }),
        k.body(),
        k.anchor('center'),
        k.pos(),
        k.scale(scaleFactor),
        {
            // Props
            speed: 250,
            direction: 'down',
            isInDialogue: false,
        },
        "player",
    ]);

    // Boundaries & Spawnpoints
    for (const layer of layers) {

        if (layer.name === "boundaries") {
            for (const boundary of layer.objects) {

                map.add([
                    k.area({
                        shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
                    }),
                    k.body({
                        isStatic: true
                    }),
                    k.pos(boundary.x, boundary.y),
                    boundary.name,
                ]);

                if (boundary.name) {
                    player.onCollide(boundary.name, () => {
                        if (boundary.name !== 'wall') {
                            player.isInDialogue = true;
                            //displayDialogue(dialogueDataExample[boundary.name], () => player.isInDialogue = false);
                            displayDialogue(dialogueData[boundary.name], () => player.isInDialogue = false);
                        }
                    });
                }

            }
            continue;
        }

        if (layer.name === "spawnpoints") {
            for (const entity of layer.objects) {

                if (entity.name === "player") {
                    player.pos = k.vec2(
                        (map.pos.x + entity.x) * scaleFactor,
                        (map.pos.y + entity.y) * scaleFactor
                    );
                    k.add(player);
                    continue;
                }

            }
        }

    } // END - Boundaries & Spawnpoints

    setCamScale(k);

    k.onResize(() => {
        setCamScale(k);
    });

    k.onUpdate(() => {
        //k.camPos(player.pos.x, player.pos.y + 100);
        k.camPos(player.pos.x + 100, player.pos.y + 50);
    });

    k.onMouseDown((mouseBtn) => {

        if (mouseBtn !== "left" || player.isInDialogue) return;

        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);

        const mouseAngle = player.pos.angle(worldMousePos);
        const lowerBound = 50;
        const upperBound = 125;

        // Walk up animation
        if (mouseAngle > lowerBound && mouseAngle < upperBound && player.curAnim() !== 'walk-up') {
            player.play('walk-up');
            player.direction = 'up';
            return;
        }

        // Walk down animation
        if (mouseAngle < -lowerBound && mouseAngle > -upperBound && player.curAnim() !== 'walk-down' ) {
            player.play('walk-down');
            player.direction = 'down';
            return;
        }

        // Walk left animation
        if (Math.abs(mouseAngle) < lowerBound) {
            player.flipX = true;
            if (player.curAnim() !== 'walk-side') player.play('walk-side');
            player.direction = 'left';
            return;
        }

        // Walk right animation
        if (Math.abs(mouseAngle) > upperBound) {
            player.flipX = false;
            if (player.curAnim() !== 'walk-side') player.play('walk-side');
            player.direction = 'right';
            return;
        }

    });

    k.onMouseRelease(() => {

        if (player.direction === 'down') {
            player.play('idle-down');
            return;
        }

        if (player.direction === 'up') {
            player.play('idle-up');
            return;
        }

        player.play('idle-side');

    });

});

k.go('main');