// FLOATING LOTUS PETALS - Temple-themed animation

document.addEventListener("DOMContentLoaded", function () {
  // Globals
  var random = Math.random,
    cos = Math.cos,
    sin = Math.sin,
    PI = Math.PI,
    PI2 = PI * 2,
    timer = undefined,
    frame = undefined,
    petals = [];

  var particles = 8, // Reduced for subtlety
    spread = 60, // More spread out
    sizeMin = 8, // Larger petals
    sizeMax = 16 - sizeMin,
    eccentricity = 10,
    deviation = 80,
    dxThetaMin = -0.05, // Slower horizontal movement
    dxThetaMax = -dxThetaMin - dxThetaMin,
    dyMin = 0.08, // Slower fall
    dyMax = 0.12,
    dThetaMin = 0.2, // Gentler rotation
    dThetaMax = 0.4 - dThetaMin;

  // Temple-inspired petal colors: jasmine white, lotus pink, marigold orange
  var petalColors = [
    function () {
      return "rgba(255, 248, 240, 0.9)"; // Jasmine white
    },
    function () {
      return "rgba(255, 182, 193, 0.85)"; // Lotus pink
    },
    function () {
      return "rgba(255, 153, 51, 0.9)"; // Marigold orange
    },
    function () {
      return "rgba(255, 228, 196, 0.85)"; // Pale peach
    },
    function () {
      return "rgba(255, 240, 245, 0.9)"; // Soft white
    },
  ];

  function color(colorFunc) {
    return colorFunc();
  }

  // Cosine interpolation
  function interpolation(a, b, t) {
    return ((1 - cos(PI * t)) / 2) * (b - a) + a;
  }

  // Create a 1D Maximal Poisson Disc over [0, 1]
  var radius = 1 / eccentricity,
    radius2 = radius + radius;
  function createPoisson() {
    var domain = [radius, 1 - radius],
      measure = 1 - radius2,
      spline = [0, 1];
    while (measure) {
      var dart = measure * random(),
        i,
        l,
        interval,
        a,
        b,
        c,
        d;

      for (i = 0, l = domain.length, measure = 0; i < l; i += 2) {
        (a = domain[i]), (b = domain[i + 1]), (interval = b - a);
        if (dart < measure + interval) {
          spline.push((dart += a - measure));
          break;
        }
        measure += interval;
      }
      (c = dart - radius), (d = dart + radius);

      for (i = domain.length - 1; i > 0; i -= 2) {
        (l = i - 1), (a = domain[l]), (b = domain[i]);
        if (a >= c && a < d)
          if (b > d) domain[l] = d;
          else domain.splice(l, 2);
        else if (a < c && b > c)
          if (b <= d) domain[i] = c;
          else domain.splice(i, 0, c, d);
      }

      for (i = 0, l = domain.length, measure = 0; i < l; i += 2)
        measure += domain[i + 1] - domain[i];
    }

    return spline.sort();
  }

  // Create the overarching container
  var container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100%";
  container.style.height = "0";
  container.style.overflow = "visible";
  container.style.zIndex = "9999";
  container.style.pointerEvents = "none";

  // Petal constructor
  function Petal(theme) {
    this.frame = 0;
    this.outer = document.createElement("div");
    this.inner = document.createElement("div");
    this.outer.appendChild(this.inner);

    var outerStyle = this.outer.style,
      innerStyle = this.inner.style;
    outerStyle.position = "absolute";
    outerStyle.width = sizeMin + sizeMax * random() + "px";
    outerStyle.height = sizeMin + sizeMax * random() + "px";
    innerStyle.width = "100%";
    innerStyle.height = "100%";
    innerStyle.backgroundColor = theme();
    innerStyle.borderRadius = "50% 0 50% 0"; // Petal shape
    innerStyle.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";

    outerStyle.perspective = "50px";
    outerStyle.transform = "rotate(" + 360 * random() + "deg)";
    this.axis =
      "rotate3D(" + cos(360 * random()) + "," + cos(360 * random()) + ",0,";
    this.theta = 360 * random();
    this.dTheta = dThetaMin + dThetaMax * random();
    innerStyle.transform = this.axis + this.theta + "deg)";

    this.x = window.innerWidth * random();
    this.y = -deviation;
    this.dx = sin(dxThetaMin + dxThetaMax * random());
    this.dy = dyMin + dyMax * random();
    outerStyle.left = this.x + "px";
    outerStyle.top = this.y + "px";

    // Create the periodic spline
    this.splineX = createPoisson();
    this.splineY = [];
    for (var i = 1, l = this.splineX.length - 1; i < l; ++i)
      this.splineY[i] = deviation * random();
    this.splineY[0] = this.splineY[l] = deviation * random();

    this.update = function (height, delta) {
      this.frame += delta;
      this.x += this.dx * delta;
      this.y += this.dy * delta;
      this.theta += this.dTheta * delta;

      var phi = (this.frame % 7777) / 7777,
        i = 0,
        j = 1;
      while (phi >= this.splineX[j]) i = j++;
      var rho = interpolation(
        this.splineY[i],
        this.splineY[j],
        (phi - this.splineX[i]) / (this.splineX[j] - this.splineX[i])
      );
      phi *= PI2;

      outerStyle.left = this.x + rho * cos(phi) + "px";
      outerStyle.top = this.y + rho * sin(phi) + "px";
      innerStyle.transform = this.axis + this.theta + "deg)";
      return this.y > height + deviation;
    };
  }

  function bloom() {
    if (!frame) {
      document.body.appendChild(container);

      var theme = petalColors[Math.floor(random() * petalColors.length)];
      (function addPetal() {
        var petal = new Petal(
          petalColors[Math.floor(random() * petalColors.length)]
        );
        petals.push(petal);
        container.appendChild(petal.outer);
        timer = setTimeout(addPetal, spread * random());
      })(0);

      var prev = undefined;
      requestAnimationFrame(function loop(timestamp) {
        var delta = prev ? timestamp - prev : 0;
        prev = timestamp;
        var height = window.innerHeight;

        for (var i = petals.length - 1; i >= 0; --i) {
          if (petals[i].update(height, delta)) {
            container.removeChild(petals[i].outer);
            petals.splice(i, 1);
          }
        }

        if (timer || petals.length)
          return (frame = requestAnimationFrame(loop));

        document.body.removeChild(container);
        frame = undefined;
      });
    }
  }

  var petalDuration = 3000; // 3 seconds - gentle and respectful
  setTimeout(function () {
    clearTimeout(timer);
    timer = undefined;
  }, petalDuration);

  bloom();
});
