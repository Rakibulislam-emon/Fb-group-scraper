// Utils: Randomization and Helper Functions

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomDelayMs(minMs, maxMs) {
  return new Promise((r) => setTimeout(r, rand(minMs, maxMs)));
}

function shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

// Export for module systems (optional, mainly for structure)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { rand, randFloat, randomDelayMs, shuffleArray };
}
