// Units are 0–1 as percentages from game dimensions
// Positions are from top left corner ↖

class Obstacles {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.isFirst = true;
    this.gap = 1;
    this.gapMin = 1;
    this.gapMax = 12;

    this.kinds = {
      car: {
        allowedPositions: [1, 2],
        y: 4,
        h: 2,
        w: 3,
      },
      bus: {
        allowedPositions: [2],
        y: 2,
        h: 4,
        w: 8,
      },
      bike: {
        allowedPositions: [1, 2],
        y: 4,
        h: 2,
        w: 2,
      },
      signal: {
        allowedPositions: [0, 1],
        y: 0,
        h: 2,
        w: 1,
      },
      bridge: {
        allowedPositions: [0],
        y: 0,
        h: 4,
        w: 12,
      },
    };

    this.setup();
  }

  get randomObstacle() {
    if (this.list.length < 2) {
      return "car";
    }

    const list = [];

    for (let key in this.kinds) {
      list.push(key);
    }

    const index = Math.floor(Math.random() * list.length);

    return list[index];
  }

  get randomGap() {
    return Math.floor(Math.random() * this.gapMax) + this.gapMin;
  }

  get isLastObstacleCleared() {
    if (this.list.length <= 0) {
      return true;
    }

    const last = this.list.at(-1);

    return last.isCleared;
  }

  removeIncomingObstacles() {
    const visually = true;

    for (let i = this.list.length - 1; i >= 0; i--) {
      const obstacle = this.list[i];
      if (obstacle.isIncoming) {
        obstacle.destroy(visually);
      }
    }
  }

  setup() {
    this.randomObstacle;
  }

  add(item) {
    this.list.push(item);
    this.gap = this.randomGap;
  }
}

class Scoreboard {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");
    this.progress = document.createElement("div");
    this.progressIndicator = document.createElement("div");
    // this.scoreElement = document.createElement("div");
    this.timeElement = document.createElement("div");
    this.bounceCount = 0;

    this.setup();
  }

  get bounce() {
    return this.bounceCount;
  }

  set bounce(increment) {
    this.bounceCount += increment;
  }

  toSeconds(ms) {
    const seconds = ms / 1000; // Convert ms to seconds
    return `${seconds.toFixed(1)}s`; // Format to 1 decimal place
  }

  setup() {
    this.element.classList.add("scoreboard");
    this.progress.classList.add("progress");
    this.progressIndicator.classList.add("indicator");
    this.timeElement.classList.add("time");
    // this.scoreElement.classList.add("score");

    this.progress.append(this.progressIndicator);
    this.element.append(this.progress);
    this.element.append(this.timeElement);
    this.game.element.append(this.element);
  }

  update() {
    this.timeElement.textContent = this.toSeconds(this.game.countdown);

    const percentage = (this.game.countdown / this.game.timeLimit) * 100;
    this.progressIndicator.style.scale = `${percentage / 100} 1`;

    // this.scoreElement.textContent = `Bounced ${this.bounce}x`;
  }
}

class Grid {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");
    this.cells = 72;

    this.setup();
  }

  setup() {
    this.element.classList.add("grid");

    for (let i = 0; i < this.cells; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      this.element.append(cell);
    }

    this.game.element.append(this.element);
  }
}

class Game {
  constructor() {
    this.element = document.getElementById("game");
    this.cols = 12;
    this.rows = 6;
    this.bounds = {};
    this.bounds.right = 3;
    this.bounds.left = -3;
    this.isOver = false;
    this.isWon = false;
    this.startTime;
    this.elapsedTime = 0;
    this.timeLimit = 15 * 1000;
    this.countdown = this.timeLimit;

    this.setup();
  }

  get over() {
    return this.isOver;
  }

  set over(value) {
    this.isOver = value;
    this.element.dataset.over = value;
  }

  get won() {
    return this.isWon;
  }

  set won(value) {
    this.isWon = value;
    this.element.dataset.won = value;
  }

  get allowsNewObstacle() {
    if (this.isWon) {
      return false;
    }

    if (this.obstacles.list.length === 0) {
      return true;
    }

    const gap = (1 / this.cols) * this.obstacles.gap;
    const last = this.obstacles.list.at(-1);
    const rightEdge = last.x + last.width + gap;

    if (rightEdge > this.bounds.right) {
      return false;
    }

    return true;
  }

  restart() {
    cancelAnimationFrame(this.nextAnimationFrame);

    this.element.replaceChildren();
    for (let property in this) {
      this[property] = undefined;
    }
    window.game = new Game();

    // TODO: remove all event listeners from document etc (those not attached to specific elements)
  }

  haveCommonElements(arr1, arr2) {
    const set1 = new Set(arr1);
    return arr2.some((element) => set1.has(element));
  }

  setup() {
    this.over = false;
    this.won = false;

    // this.grid = new Grid(this);
    this.taxi = new Taxi(this);
    this.taxiWheels = new TaxiWheels(this);
    this.controls = new Controls(this);
    this.obstacles = new Obstacles(this);
    this.trees = new Trees(this);
    this.sky = new Sky(this);
    this.road = new Road(this);
    this.scoreboard = new Scoreboard(this);
    this.speedometer = new Speedometer(this);
    this.startTime = Date.now();

    this.nextAnimationFrame = requestAnimationFrame(() => {
      this.update(this);
    });
  }

  update(game) {
    if (game.over) {
      return;
    }

    this.countdown = this.timeLimit - this.elapsedTime;

    if (this.countdown <= 0) {
      this.countdown = 0;
      this.won = true;
    }

    this.taxi.update();
    this.speedometer.update();
    this.trees.update();
    this.scoreboard.update();

    if (this.allowsNewObstacle) {
      let obstacle = new Obstacle(this);

      // If current gap is smaller than taxi and an obstacle already exists
      const fitsTaxi = this.obstacles.gap < this.taxi.w + 1;
      const obstacleExists = this.obstacles.list.length > 0;

      if (fitsTaxi && obstacleExists) {
        const last = this.obstacles.list.at(-1);
        const lastPositions = last.kind.allowedPositions;

        // Make sure new obstacle allows taxi to pass
        while (
          !this.haveCommonElements(
            lastPositions,
            obstacle.kind.allowedPositions
          )
        ) {
          obstacle = new Obstacle(this);
        }
      }

      this.obstacles.add(obstacle);
    }

    for (let obstacle of this.obstacles.list) {
      obstacle.update();
    }

    if (this.isWon) {
      this.obstacles.removeIncomingObstacles();

      if (this.obstacles.isLastObstacleCleared) {
        if (this.airport === undefined) {
          this.airport = new Airport(this);
        }

        if (this.airport) {
          this.airport.update();
        }

        // this.taxi.isBreaking = true;

        if (this.taxi.position > 0) {
          this.taxi.move(-1);
        }
      }
    }

    this.elapsedTime = Date.now() - this.startTime;

    requestAnimationFrame(() => {
      this.update(game);
    });
  }
}

class TaxiWheels {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");
    this.front = document.createElement("div");
    this.rear = document.createElement("div");

    this.height = (1 / this.game.rows) * 2;
    this.width = (1 / this.game.cols) * 3;
    this.x = (1 / this.game.cols) * 1;

    this.setup();
  }

  hide() {
    this.element.style.display = "none";
  }

  setup() {
    this.element.classList.add("wheels");
    this.element.style.width = `${this.width * 100}%`;
    // this.element.style.height = `${this.height * 100}%`;
    this.element.style.top = `${this.y * 100}%`;
    this.element.style.bottom = 0;
    this.element.style.left = `${this.x * 100}%`;

    this.front.classList.add("wheel", "front");
    this.front.style.left = `${this.game.taxi.x * 1}%`;
    this.front.style.top = `${this.y * 100}%`;

    this.rear.classList.add("wheel", "rear");
    this.rear.style.left = 0;
    this.rear.style.top = `${this.y * 100}%`;

    this.element.append(this.front);
    this.element.append(this.rear);
    this.game.element.append(this.element);
  }

  update() {
    this.element.style.top = `${this.game.taxi.y * 100}%`;
    // this.element.style.height = `${
    //   this.height * this.game.taxi.position + this.height * 100
    // }%`;
  }
}

class Speedometer {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");
    this.indicator = document.createElement("div");
    this.min = -135;
    this.max = 135;

    this.setup();
  }

  convertRange(value, fromMin, fromMax, toMin, toMax) {
    fromMin = fromMin || this.game.taxi.speed.min;
    fromMax = fromMax || this.game.taxi.speed.max;
    toMin = toMin || this.min;
    toMax = toMax || this.max;

    return toMin + ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin);
  }

  updateRotation() {}

  setup() {
    this.element.classList.add("speedometer");
    this.indicator.classList.add("indicator");

    this.element.append(this.indicator);
    this.game.element.append(this.element);
  }

  update() {
    const root = document.documentElement;
    const degrees = this.convertRange(this.game.taxi.speed.x);

    root.style.setProperty("--speedometer-rotation", `${degrees}deg`);
  }
}

class RestartButton {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("button");

    this.w = 3;
    this.h = 1;
    this.width = (1 / this.game.cols) * this.w;
    this.height = (1 / this.game.rows) * this.h;
    this.y = (1 / this.game.rows) * 2.5;
    this.x = (1 / this.game.cols) * 4.5;

    this.setup();
  }

  setup() {
    this.element.classList.add("restart");
    this.element.style.width = `${this.width * 100}%`;
    this.element.style.height = `${this.height * 100}%`;
    this.element.style.left = `${this.x * 100}%`;
    this.element.style.top = `${this.y * 100}%`;

    this.element.innerHTML = "<span>Restart</span>";
    this.element.addEventListener("click", () => {
      this.game.restart();
    });

    this.game.element.append(this.element);
  }

  press() {
    this.element.classList.add("pressed");
  }

  unpress() {
    this.element.classList.remove("pressed");

    if (this.isEscapePressed) {
      return;
    }

    this.game.restart();
  }
}

/*
class Template {
  constructor(game) {
    this.game = game;
    this.element = document.createElement('div')

    this.setup();
  }

  setup() {
    this.element.classList.add('template')

    this.game.element.append(this.element)
  }

  update() {

  }
}
*/

class Sky {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");
    this.width = 1 + this.game.bounds.right - this.game.bounds.left;

    this.setup();
  }

  setup() {
    this.element.classList.add("sky");
    this.element.style.width = `${this.width * 100}%`;

    this.game.element.append(this.element);
  }

  update() {}
}

class Road {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");
    this.width = 1 + this.game.bounds.right - this.game.bounds.left;

    this.setup();
  }

  setup() {
    this.element.classList.add("road");
    this.element.style.width = `${this.width * 100}%`;

    this.game.element.append(this.element);
  }

  update() {}
}

class Trees {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");
    this.list = [];
    this.chance = 0.025;
    this.initialTrees = 16;
    this.isFirst = true;

    this.setup();
  }

  convertRange(value, fromMin, fromMax, toMin, toMax) {
    return toMin + ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin);
  }

  setup() {
    this.element.classList.add("trees");
    this.game.element.append(this.element);
  }

  update() {
    if (this.isFirst) {
      for (let i = 0; i < this.initialTrees; i++) {
        const x = this.convertRange(
          Math.random(),
          0,
          1,
          -this.game.bounds.right,
          this.game.bounds.right
        );

        const tree = new Tree(this.game, x);
        this.list.push(tree);
      }
      this.isFirst = false;
    }

    if (Math.random() < this.chance) {
      const tree = new Tree(this.game);
      this.list.push(tree);
    }

    for (let tree of this.list) {
      tree.update();
    }
  }
}

class Tree {
  constructor(game, x) {
    this.game = game;
    this.element = document.createElement("div");
    this.leaves = document.createElement("div");
    this.trunk = document.createElement("div");
    this.ground = document.createElement("div");

    this.heights = [2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5];
    this.widths = [1, 1.25, 1.5];
    this.ratios = [1, , 0.875, 0.75, 0.625];
    this.proximities = [0.725, 0.75, 0.775];
    this.groundHeights = [0, 0.0625, 0.125, 0.25, 0.3125, 0.375];
    this.groundWidths = [8, 12, 16, 20, 24, 28, 32];

    this.height = (1 / this.game.rows) * this.random(this.heights);
    this.width = (1 / this.game.cols) * this.random(this.widths);
    this.ratio = this.random(this.ratios);
    this.proximity = this.random(this.proximities);

    this.groundHeight = this.random(this.groundHeights);
    this.groundWidth = this.random(this.groundWidths);

    this.x = x || this.game.bounds.right;

    this.setup();
  }

  random(list) {
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  setup() {
    this.element.classList.add("tree");
    this.leaves.classList.add("leaves");
    this.trunk.classList.add("trunk");
    this.ground.classList.add("ground");

    this.element.style.width = `${this.width * 100}%`;
    this.element.style.height = `${this.height * 100}%`;
    this.element.style.left = `0%`;
    this.element.style.translate = `calc( var(--cell) * ${this.game.cols} * ${this.x})`;
    this.element.style.zIndex = Math.round(this.proximity * 1000);

    this.leaves.style.aspectRatio = this.ratio;
    this.ground.style.height = `calc( var(--cell) * ${this.groundHeight})`;
    this.ground.style.width = `calc( var(--cell) * ${this.groundWidth})`;

    this.element.append(this.leaves, this.trunk, this.ground);

    this.game.trees.element.append(this.element);
  }

  update() {
    this.x += this.game.taxi.offsetX * this.proximity;
    this.element.style.translate = `calc( var(--cell) * ${this.game.cols} * ${this.x})`;

    if (this.x < this.game.bounds.left) {
      this.destroy();
    }
  }
  destroy() {
    this.element.remove();

    const index = this.game.trees.list.indexOf(this);
    if (index > -1) {
      this.game.trees.list.splice(index, 1);
    }
  }
}

class Airplane {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");
    this.w = 3;
    this.h = 1;
    this.width = (1 / this.game.cols) * this.w;
    this.height = (1 / this.game.rows) * this.h;
    this.y = (1 / this.game.rows) * (this.game.rows - this.h);
    this.x = (1 / this.game.cols) * 1;
    this.speed = {};
    this.speed.y = -4;
    this.translateY = 4; // 0 for no delay
    this.timeOfLastUpdate = this.game.taxi.timeOfLastUpdate;

    this.setup();
  }

  get offsetY() {
    const deltaTime = this.game.elapsedTime - this.timeOfLastUpdate;
    const offsetPerMs = this.speed.y / 1000;
    const offset = deltaTime * offsetPerMs;
    this.timeOfLastUpdate = this.game.elapsedTime;

    return offset;
  }

  setup() {
    this.element.classList.add("airplane");
    this.element.style.width = `${this.width * 100}%`;
    this.element.style.height = `${this.height * 100}%`;
    this.element.style.left = `${this.x * 100}%`;
    this.element.style.top = `${this.y * 100}%`;

    this.game.element.append(this.element);
  }

  update() {
    // this.translateY += this.offsetY;
    // if (this.translateY > 0) {
    //   return;
    // }
    // this.element.style.translate = `0 calc( var(--cell) * ${this.translateY})`;
  }
}

class Airport {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");

    this.h = 6;
    this.w = 24;

    this.height = (1 / this.game.rows) * this.h;
    this.width = (1 / this.game.cols) * this.w;
    this.proximity = 1;

    this.x = this.game.bounds.right;

    this.setup();
  }

  get shouldTakeoff() {
    const taxi = this.game.taxi;

    const tolerance = (1 / this.game.rows) * 1;
    const taxiRightEdge = taxi.x + taxi.width;
    const airportRightEdge = this.x + this.width;

    return taxiRightEdge > airportRightEdge - tolerance;
  }

  setup() {
    this.element.classList.add("airport");

    this.element.style.width = `${this.width * 100}%`;
    this.element.style.height = `${this.height * 100}%`;
    this.element.style.left = `0%`;
    this.element.style.translate = `calc( var(--cell) * ${this.game.cols} * ${this.x})`;

    this.game.element.append(this.element);
  }

  update() {
    this.x += this.game.taxi.offsetX * this.proximity;
    this.element.style.translate = `calc( var(--cell) * ${this.game.cols} * ${this.x})`;

    if (this.shouldTakeoff) {
      this.game.taxi.hide();
      this.game.taxiWheels.hide();
      this.takeoff();
    }
  }

  takeoff() {
    if (!this.airplane) {
      this.airplane = new Airplane(this.game);
    }

    this.airplane.update();
  }
}

class Taxi {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");
    this.min = 0;
    this.max = 2;
    this.position = this.min;
    this.oldPosition = this.position;
    this.w = 3;
    this.h = 2;
    this.width = (1 / this.game.cols) * this.w;
    this.height = (1 / this.game.rows) * (this.h - 0.5);
    this.x = (1 / this.game.cols) * 1;
    this.speed = {}; // % of screen per second
    this.speed.min = 0;
    this.speed.max = 2.5;
    this.speed.x = 0.75;
    this.speed.decreaseX = -1; // % of screen per second
    this.speed.increaseX = 0.1; // % of screen per second
    this.offsetX = 0;
    this.timeOfLastUpdate = 0;
    this.pokeTimeout;
    this.autopilot = true;
    this.isBreaking = false;

    this.setup();
  }

  get y() {
    if (this.position === 0) return (1 / this.game.rows) * this.h * 2;
    if (this.position === 1) return (1 / this.game.rows) * this.h * 1;
    if (this.position === 2) return (1 / this.game.rows) * this.h * 0;
  }

  get closestObstacle() {
    let closest;

    const obstacles = this.game.obstacles.list;

    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      const previous = obstacle[i - 1];
      const distance = obstacle.x - (this.x + this.width);

      if (distance > 0 && distance < this.width / 3) {
        closest = obstacle;
        break;
      }
    }

    return closest;

    /*
    let closest;

    const obstacles = this.game.obstacles.list;

    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      const previous = obstacles[i - 1] || undefined;
      const next = obstacles[i + 1] || undefined;

      const obstacleIsInFront = obstacle.x > this.x + this.width;

      if (obstacleIsInFront) {
        if (next) {
          const distance = next.x - this.x + this.width;
          const nextIsClose = distance > 0 && distance < this.width;

          if (nextIsClose) {
            closest = next;
            break;
          }
        }

        if (previous) {
          const clearedPrevious = previous.x + previous.width < this.x;

          if (clearedPrevious) {
            closest = obstacle;
            break;
          }
        } else {
          closest = obstacle;
          break;
        }
      }
    }

    return closest;
    */
  }

  findClosest(number, numbers) {
    return numbers.reduce((closest, num) => {
      const diffCurrent = Math.abs(num - number);
      const diffClosest = Math.abs(closest - number);

      if (diffCurrent < diffClosest) {
        return num;
      } else {
        return closest;
      }
    }, numbers[0]);
  }

  getOffsetX() {
    const deltaTime = this.game.elapsedTime - this.timeOfLastUpdate;
    const offsetPerMs = this.speed.x / 1000;
    const offset = deltaTime * offsetPerMs;
    this.timeOfLastUpdate = this.game.elapsedTime;

    return offset * -1;
  }

  accelerate() {
    const deltaTime = this.game.elapsedTime - this.timeOfLastUpdate;

    const factor = this.isBreaking
      ? this.speed.decreaseX
      : this.speed.increaseX;

    const distancePerMs = factor / 1000;
    const distance = deltaTime * distancePerMs;
    const newSpeed = this.speed.x + distance;

    if (newSpeed > this.speed.max) {
      this.speed.x = this.speed.max;
    } else if (newSpeed < this.speed.min) {
      this.speed.x = this.speed.min;
    } else {
      this.speed.x = newSpeed;
    }
  }

  setup() {
    this.element.classList.add("taxi");
    this.element.style.width = `${this.width * 100}%`;
    this.element.style.height = `${this.height * 100}%`;
    this.element.style.top = `${this.y * 100}%`;
    this.element.style.left = `${this.x * 100}%`;

    this.game.element.append(this.element);
  }

  poke(direction) {
    clearTimeout(this.pokeTimeout);
    this.element.dataset.poke = "";

    this.element.dataset.poke = direction;

    this.pokeTimeout = setTimeout(() => {
      this.element.dataset.poke = "";
    }, 100);
  }

  hit(obstacle) {
    this.impact = document.createElement("div");
    this.impact.classList.add("impact");
    this.impact.style.width = `${this.width * 1.5 * 100}%`;
    // this.element.style.height = `${this.height * 100}%`;
    this.impact.style.top = `${(this.y + this.height / 2) * 100}%`;
    this.impact.style.left = `${(this.x + this.width / 2) * 100}%`;

    this.game.element.append(this.impact);

    setTimeout(() => {
      this.impact.style.scale = 1;
    }, 100);
  }

  move(step) {
    if (this.game.over) {
      return;
    }

    this.game.controls.pressButton(step > 0 ? "up" : "down");

    this.oldPosition = this.position;

    this.position += step;

    if (this.position > this.max) {
      this.poke("up");
      this.position = this.max;
    } else if (this.position < this.min) {
      this.poke("down");
      this.position = this.min;
    }

    if (this.position !== this.oldPosition) {
      this.game.scoreboard.bounce = +1;
    }

    this.update();
  }

  hide() {
    this.element.style.display = "none";
  }

  update() {
    if (this.autopilot) {
      if (this.closestObstacle) {
        // this.closestObstacle.element.style.outline = "10px solid DeepPink";

        const { allowedPositions } = this.closestObstacle.kind;

        if (allowedPositions.includes(this.position)) {
          // if (this.position === 0 && allowedPositions.includes(1)) {
          //   this.move(+1);
          // }
        } else {
          const target = this.findClosest(this.position, allowedPositions);
          const step = target > this.position ? +1 : -1;
          this.move(step);
        }
      }
    }

    this.element.style.top = `${this.y * 100}%`;

    this.accelerate();

    this.offsetX = this.getOffsetX();

    this.game.taxiWheels.update();
  }
}

class Controls {
  constructor(game) {
    this.game = game;

    this.restartButton = new RestartButton(this.game);

    this.element = document.createElement("div");
    this.buttonUp = document.createElement("button");
    this.buttonDown = document.createElement("button");

    this.touch = {};
    this.touch.tolerance = 24;

    this.visualizer = document.c;

    this.setup();
  }

  addSpacebar() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.restartButton.isEscapePressed = true;
      }

      if (event.key === " ") {
        this.restartButton.press();
      }
    });
    document.addEventListener("keyup", (event) => {
      if (event.key === "Escape") {
        this.restartButton.isEscapePressed = false;
      }

      if (event.key === " ") {
        this.restartButton.unpress();
      }
    });
  }

  addArrowKeys() {
    document.addEventListener("keydown", (event) => {
      if (event.code === "ArrowUp") {
        this.game.taxi.move(+1);
      } else if (event.code === "ArrowDown") {
        this.game.taxi.move(-1);
      }
    });
  }

  addWASD() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "w" || event.key === "W") {
        this.game.taxi.move(+1);
      } else if (event.key === "s" || event.key === "S") {
        this.game.taxi.move(-1);
      }
    });
  }

  addButtons() {
    this.element.classList.add("controls");
    this.element.setAttribute("aria-hidden", "true");

    this.buttonUp.classList.add("up");
    this.buttonUp.addEventListener("click", () => {
      this.game.taxi.move(+1);
    });

    this.buttonDown.classList.add("down");
    this.buttonDown.addEventListener("click", () => {
      this.game.taxi.move(-1);
    });

    this.element.append(this.buttonUp, this.buttonDown);

    this.game.element.append(this.element);
  }

  handleTouchStart(event) {
    const firstTouch = event.touches[0];
    this.touch.startY = firstTouch.clientY;
  }

  handleTouchEnd(event) {
    this.touch.endY = event.changedTouches[0].clientY;

    if (this.touch.startY > this.touch.endY + this.touch.tolerance) {
      this.game.taxi.move(+1);
    } else if (this.touch.startY < this.touch.endY - this.touch.tolerance) {
      this.game.taxi.move(-1);
    }
  }

  addSwiping() {
    document.body.addEventListener(
      "touchstart",
      (event) => {
        this.handleTouchStart(event);
      },
      false
    );

    document.body.addEventListener(
      "touchend",
      (event) => {
        this.handleTouchEnd(event);
      },
      false
    );
  }

  pressButton(direction) {
    const button =
      direction === "up"
        ? this.buttonUp
        : direction === "down"
        ? this.buttonDown
        : undefined;

    if (!button) {
      return;
    }

    button.dataset.pressed = true;
    setTimeout(() => {
      button.dataset.pressed = false;
    }, 50);
  }

  setup() {
    this.addSpacebar();
    this.addArrowKeys();
    this.addWASD();
    this.addButtons();
    this.addSwiping();
  }
}

class Obstacle {
  constructor(game, name) {
    this.game = game;
    this.element = document.createElement("div");
    this.className = "obstacle";
    this.name = name || this.game.obstacles.randomObstacle;

    this.kind = this.game.obstacles.kinds[this.name];

    this.tolerance = {};
    this.tolerance.front = (1 / this.game.cols) * -0.25;
    this.tolerance.back = (1 / this.game.cols) * -0.5;

    this.height = (1 / this.game.rows) * this.kind.h;
    this.width = (1 / this.game.cols) * this.kind.w;
    this.x = this.game.bounds.right;
    this.y = (1 / this.game.rows) * this.kind.y;

    this.setup();
  }

  get hasCollided() {
    if (this.kind.allowedPositions.includes(this.game.taxi.position)) {
      return false;
    }

    const taxi = this.game.taxi;

    // WITH TOLERANCE

    if (this.x - (taxi.x + taxi.width) > this.tolerance.front) {
      return false;
    }

    if (taxi.x - (this.x + this.width) > this.tolerance.back) {
      return false;
    }

    // WITHOUT TOLERANCE

    // if (this.x > taxi.x + taxi.width) {
    //   return false;
    // }
    // if (this.x + this.width < taxi.x) {
    //   return false;
    // }

    return true;
  }

  get isCleared() {
    const taxi = this.game.taxi;
    return this.x + this.width < taxi.x;
  }

  get isIncoming() {
    const taxi = this.game.taxi;
    return this.x >= taxi.x + taxi.width;
  }

  destroy(visually = false) {
    if (visually) {
      // TODO: Add animation before complete removal
      this.element.remove();
    } else {
      this.element.remove();
    }

    const index = this.game.obstacles.list.indexOf(this);
    if (index > -1) {
      this.game.obstacles.list.splice(index, 1);
    }
  }

  setup() {
    this.element.classList.add(this.className, this.name);
    this.element.style.width = `${this.width * 100}%`;
    this.element.style.height = `${this.height * 100}%`;
    this.element.style.top = `${this.y * 100}%`;
    this.element.style.left = `0%`;
    this.element.style.translate = `calc( var(--cell) * ${this.game.cols} * ${this.x})`;

    this.game.element.append(this.element);
  }

  update() {
    this.x += this.game.taxi.offsetX;

    // if (this.x === this.game.bounds.right) {
    //   this.element.style.outline = "4px solid red";
    // } else {
    //   this.element.style.outline = "none";
    // }

    // this.element.style.left = `${this.x * 100}%`;
    this.element.style.translate = `calc( var(--cell) * ${this.game.cols} * ${this.x})`;

    if (this.x < this.game.bounds.left) {
      this.destroy();
    }

    if (this.hasCollided) {
      this.game.taxi.hit(this);
      this.game.over = true;
    }
  }
}

window.game = new Game();

// Toggle autopilot
document.addEventListener("keydown", (event) => {
  if (event.key === "x" || event.key === "X") {
    window.game.taxi.autopilot = !window.game.taxi.autopilot;
  }
});
