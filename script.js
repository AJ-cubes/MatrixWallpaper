const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
let dropsPerColumn, columns, drops, dropChars, resetGrow, growingIndex, resetShrink, shrinkingIndex, resetButtonCircle, sproutCount, bubbleRadius, fontSize;

const sprouts = [];
const explosions = [];

function getExplosionCounterBox() {
    const text = `Explosion Count: ${explosionCount}`;
    ctx.font = "22px 'Pixelify Sans', monospace";
    const padding = 12;
    const framePad = 50;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = 28;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = textHeight + padding * 2;
    const frameX = width - boxWidth - framePad;
    const frameY = framePad;

    return { frameX, frameY, boxWidth, boxHeight };
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const minDim = Math.min(width, height);
    fontSize = Math.round(minDim / 30);
    bubbleRadius = Math.floor(minDim / (fontSize * 0.5));
    dropsPerColumn = Math.floor(minDim / (fontSize * 5));
    sproutCount = Math.floor(minDim / (fontSize * 3.5));
    columns = Math.floor(width / (fontSize));
    drops = Array.from({length: columns}, () => Array(dropsPerColumn).fill(1));
    dropChars = Array.from({length: columns}, () =>
        Array.from({length: dropsPerColumn}, () => (Math.random() < 0.5 ? '0' : '1'))
    );
}

resizeCanvas();

let mouse = { x: width / 2, y: height / 2 };
const speed = 0.125;

window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function getGreenShade() {
    const greenShades = [
        "#00FF46",
        "#39FF14",
        "#00FF99",
        "#00FFB2",
        "#00E676",
        "#1AFF66",
        "#00C853"
    ];
    return greenShades[Math.floor(Math.random() * greenShades.length)];
}

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dx = clickX - resetButtonCircle.x;
    const dy = clickY - resetButtonCircle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= resetButtonCircle.radius) {
        explosionCount = 0;
        localStorage.setItem('explosionCount', explosionCount);
        resizeCanvas();
        return;
    }

    const { frameX, frameY, boxWidth, boxHeight } = getExplosionCounterBox();

    if (
        clickX >= frameX && clickX <= frameX + boxWidth &&
        clickY >= frameY && clickY <= frameY + boxHeight
    ) {
        return;
    }

    triggerSproutExplosion(e.clientX, e.clientY);
});

canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dx = clickX - resetButtonCircle.x;
    const dy = clickY - resetButtonCircle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= resetButtonCircle.radius) {
        resetGrow = true;
        resetShrink = false;
        growingIndex = 0;
        shrinkingIndex = 0;
    }
})

canvas.addEventListener('mouseup', e => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dx = clickX - resetButtonCircle.x;
    const dy = clickY - resetButtonCircle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= resetButtonCircle.radius) {
        resetGrow = false;
        resetShrink = true;
        growingIndex = dropsPerColumn;
        shrinkingIndex = dropsPerColumn;
    }
})

let explosionCount = localStorage.getItem('explosionCount') || 0;
localStorage.setItem('explosionCount', explosionCount);

function drawExplosionCounterAndResetButton() {
    const text = `Explosion Count: ${explosionCount}`;
    ctx.save();
    ctx.font = "22px 'Pixelify Sans', monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const padding = 12;
    const framePad = 50;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = 28;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = textHeight + padding * 2;
    const x = width - boxWidth - framePad;
    const y = framePad;

    ctx.fillStyle = "#000";
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.beginPath();
    const r = 16;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + boxWidth - r, y);
    ctx.arcTo(x + boxWidth, y, x + boxWidth, y + r, r);
    ctx.lineTo(x + boxWidth, y + boxHeight - r);
    ctx.arcTo(x + boxWidth, y + boxHeight, x + boxWidth - r, y + boxHeight, r);
    ctx.lineTo(x + r, y + boxHeight);
    ctx.arcTo(x, y + boxHeight, x, y + boxHeight - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();

    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = performance.now() / -25;
    ctx.strokeStyle = "#00FF46";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = "#00FF46";
    ctx.font = "22px 'Pixelify Sans', monospace";
    ctx.fillText("Explosion Count: ", x + padding, y + padding);

    const labelWidth = ctx.measureText("Explosion Count: ").width;
    ctx.font = "22px monospace";
    ctx.fillText(explosionCount, x + padding + labelWidth, y + padding);

    const circleRadius = boxHeight / 2;
    const circleX = x - circleRadius * 2.5;
    const circleY = y + boxHeight / 2;

    const dx = mouse.x - circleX;
    const dy = mouse.y - circleY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const isHovering = dist < circleRadius;

    let pulseRadius = circleRadius;
    if (resetGrow === true) {
        growingIndex++;
        if (growingIndex > dropsPerColumn) growingIndex = dropsPerColumn;
        pulseRadius += growingIndex;
    }
    if (resetShrink === true) {
        shrinkingIndex--;
        if (shrinkingIndex < 0) shrinkingIndex = 0;
        pulseRadius += shrinkingIndex;
    }

    ctx.shadowColor = isHovering ? "#00FF46" : "#003F1F";
    ctx.shadowBlur = isHovering ? 16 : 6;

    ctx.beginPath();
    ctx.arc(circleX, circleY, pulseRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.setLineDash([5, 5])
    ctx.lineDashOffset = performance.now() / -25;
    ctx.strokeStyle = "#00FF46";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "30px 'Pixelify Sans', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#00FF46";
    ctx.fillText("↺", circleX, circleY);

    ctx.restore();

    resetButtonCircle = {
        x: circleX,
        y: circleY,
        radius: circleRadius
    };
}

function triggerSproutExplosion(x, y) {
    if (sprouts.length > 40) sprouts.splice(0, sprouts.length - 40);
    for (let i = 0; i < sproutCount; i++) {
        const spread = Math.atan((bubbleRadius) / 30);
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread * 2;
        const minSpeed = 3.5;
        const maxSpeed = 5.2;
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        const curve = (Math.random() - 0.5) * 0.02;
        sprouts.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            curve,
            char: Math.random() < 0.5 ? '0' : '1',
            color: getGreenShade(),
            life: 0,
            maxLife: 55 + Math.random() * 18
        });
    }
}

function drawBubble() {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = performance.now() / -25;
    ctx.strokeStyle = "#00FF46";
    ctx.lineWidth = 2;
    ctx.arc(mouse.x, mouse.y, bubbleRadius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

function isOnScreen(x, y) {
    return x >= 0 && x <= width && y >= 0 && y <= height;
}

function spawnExplosion(x, y, color) {
    if (isOnScreen(x, y)) {
        explosionCount = localStorage.getItem('explosionCount') || 0;
        explosionCount++;
        localStorage.setItem('explosionCount', explosionCount);
    }
    for (let i = 0; i < 4; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 1 + Math.random() * 2;
        explosions.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color,
            life: 0,
            maxLife: 18 + Math.random() * 8
        });
    }
    triggerSproutExplosion(x, y);
    if (explosions.length > 30) explosions.splice(0, explosions.length - 30);
}

function drawExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const ex = explosions[i];
        ctx.save();
        ctx.globalAlpha = ex.alpha;
        ctx.fillStyle = ex.color;
        ctx.font = fontSize + "px monospace";
        ctx.fillText(Math.random() < 0.5 ? '0' : '1', ex.x, ex.y);
        ctx.restore();

        ex.x += ex.vx;
        ex.y += ex.vy;
        ex.vy += 0.08;
        ex.life++;
        ex.alpha -= 0.04;

        if (
            ex.life > ex.maxLife ||
            ex.alpha <= 0 ||
            ex.x < 0 || ex.x > width ||
            ex.y < 0 || ex.y > height
        ) {
            explosions.splice(i, 1);
        }
    }
}

function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.075)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = fontSize + "px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    drawBubble();
    drawExplosions();
    drawExplosionCounterAndResetButton();

    const { frameX, frameY, boxWidth, boxHeight } = getExplosionCounterBox();

    for (let i = sprouts.length - 1; i >= 0; i--) {
        const s = sprouts[i];
        ctx.save();
        ctx.fillStyle = s.color || "#00FF46";
        ctx.globalAlpha = 1 - s.life / s.maxLife;
        ctx.font = fontSize + "px monospace";
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.atan2(s.vy, s.vx) + Math.PI / 2);
        ctx.fillText(s.char, 0, 0);
        ctx.restore();

        s.x += s.vx;
        s.y += s.vy;
        s.vx += s.curve;
        s.vy += 0.12;
        s.life++;

        if (s.life > s.maxLife) {
            sprouts.splice(i, 1);
        }
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < columns; i++) {
        for (let j = 0; j < dropsPerColumn; j++) {
            let x = i * fontSize + fontSize / 2;
            let y = drops[i][j] * fontSize + j * (fontSize * 2);

            let hit = false;
            for (let k = 0; k < sprouts.length; k++) {
                const s = sprouts[k];
                const dx = s.x - x;
                const dy = s.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < fontSize * 0.7) {
                    spawnExplosion(x, y, getGreenShade());
                    drops[i][j] = -1000;
                    dropChars[i][j] = '';
                    hit = true;
                    break;
                }
            }

            if (drops[i][j] < 0) {
                drops[i][j] += 10;
                if (drops[i][j] >= 0) {
                    drops[i][j] = 0;
                    dropChars[i][j] = Math.random() < 0.5 ? '0' : '1';
                }
                continue;
            }

            let dx = x - mouse.x;
            let dy = y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            const dxReset = x - resetButtonCircle.x;
            const dyReset = y - resetButtonCircle.y;
            const distReset = Math.sqrt(dxReset * dxReset + dyReset * dyReset);

            let shade = getGreenShade();

            if (
                (x >= frameX && x <= frameX + boxWidth &&
                    y >= frameY && y <= frameY + boxHeight) ||
                distReset < resetButtonCircle.radius
            ) {
            } else if (dist < bubbleRadius) {
                let angle = Math.atan2(dy, dx);
                let curveStrength = 1.2;
                let warpedX = mouse.x + Math.cos(angle) * bubbleRadius * curveStrength;
                let warpedY = mouse.y + Math.sin(angle) * bubbleRadius * curveStrength;
                ctx.fillStyle = shade;
                ctx.save();
                ctx.font = fontSize + "px monospace";
                ctx.translate(warpedX, warpedY);
                ctx.rotate(angle + Math.PI / 2);
                ctx.fillText(dropChars[i][j], 0, 0);
                ctx.restore();
            } else {
                ctx.fillStyle = shade;
                ctx.font = fontSize + "px monospace";
                ctx.fillText(dropChars[i][j], x, y);
            }

            if (y > height && dropChars[i][j] !== '') {
                let tries = 0;
                while (tries < 10) {
                    const newCol = Math.floor(Math.random() * columns);
                    const newDrop = Math.floor(Math.random() * dropsPerColumn);
                    if (drops[newCol][newDrop] <= 0 && dropChars[newCol][newDrop] === '') {
                        drops[newCol][newDrop] = 0;
                        dropChars[newCol][newDrop] = Math.random() < 0.5 ? '0' : '1';
                        break;
                    }
                    tries++;
                }
                drops[i][j] = -1000;
                dropChars[i][j] = '';
            }
            drops[i][j] += speed;
        }
    }

    requestAnimationFrame(draw);
}

draw();
