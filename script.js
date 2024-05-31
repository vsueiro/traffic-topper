// Units are 0–1 as percentages from game dimensions
// Positions are from top left corner ↖

class Obstacles {
  constructor(game) {
    this.game = game;
    this.list = [];
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

  setup() {
    this.randomObstacle;
  }

  add(item) {
    this.list.push(item);
    this.gap = this.randomGap;
  }
}

class Game {
  constructor() {
    this.element = document.getElementById("game");
    this.cols = 12;
    this.rows = 6;
    this.bounds = {};
    this.bounds.right = 2;
    this.bounds.left = -2;
    this.over = false;
    this.obstacles = [];
    this.possibleObstacles = ["car", "bus"];

    this.setup();
  }

  get allowsNewObstacle() {
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

  haveCommonElements(arr1, arr2) {
    const set1 = new Set(arr1);
    return arr2.some((element) => set1.has(element));
  }

  setup() {
    this.taxi = new Taxi(this);
    this.taxiWheels = new TaxiWheels(this);
    this.controls = new Controls(this);
    this.obstacles = new Obstacles(this);

    requestAnimationFrame(() => {
      this.update(this);
    });
  }

  update(game) {
    if (game.over) {
      window.alert("Game Over");
      return;
    }

    if (this.allowsNewObstacle) {
      let obstacle = new Obstacle(this);

      // If current gap is smaller than taxi and an obstacle already exists
      if (this.obstacles.gap < this.taxi.w && this.obstacles.list.length > 0) {
        const last = this.obstacles.list.at(-1);
        const lastPositions = last.kind.allowedPositions;

        // Make sure new obstacle allows taxi to pass
        while (
          !this.haveCommonElements(
            lastPositions,
            obstacle.kind.allowedPositions
          )
        ) {
          console.log("generating new obstacle");
          obstacle = new Obstacle(this);
          obstacle.element.style.backgroundColor = "DeepPink";
        }
      }

      this.obstacles.add(obstacle);
    }

    for (let obstacle of this.obstacles.list) {
      obstacle.update();
    }

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

class Taxi {
  constructor(game) {
    this.game = game;
    this.element = document.createElement("div");
    this.position = 0;
    this.min = 0;
    this.max = 2;
    this.w = 3;
    this.h = 2;
    this.width = (1 / this.game.cols) * this.w;
    this.height = (1 / this.game.rows) * this.h;
    this.x = (1 / this.game.cols) * 1;
    this.speedX = 0.01;

    this.setup();
  }

  get y() {
    if (this.position === 0) return this.height * 2;
    if (this.position === 1) return this.height * 1;
    if (this.position === 2) return this.height * 0;
  }

  setup() {
    this.element.classList.add("taxi");
    this.element.style.width = `${this.width * 100}%`;
    this.element.style.height = `${this.height * 100}%`;
    this.element.style.top = `${this.y * 100}%`;
    this.element.style.left = `${this.x * 100}%`;

    this.game.element.append(this.element);
  }

  move(step) {
    this.position += step;

    if (this.position > this.max) {
      this.position = this.max;
    } else if (this.position < this.min) {
      this.position = this.min;
    }

    this.update();
  }

  update() {
    this.element.style.top = `${this.y * 100}%`;

    this.game.taxiWheels.update();
  }
}

class Controls {
  constructor(game) {
    this.game = game;

    this.setup();
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

  setup() {
    this.addArrowKeys();
    this.addWASD();
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

  destroy() {
    this.element.remove();

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
    this.element.style.left = `${this.x * 100}%`;

    this.game.element.append(this.element);
  }

  update() {
    this.x += this.game.taxi.speedX * -1;

    this.element.style.left = `${this.x * 100}%`;

    if (this.x < this.game.bounds.left) {
      this.destroy();
    }

    if (this.hasCollided) {
      console.log("Collided");
      this.game.over = true;
    }
  }
}

const game = new Game();
