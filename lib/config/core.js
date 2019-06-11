let loadPromise = null;

function load(cli = {}) {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise(res => {
    const rc = require("rc");
    const defaults = require("./defaults");
    const config = rc("appframe", {
      loaded: true,
      ...defaults,
      ...cli
    });

    config.get = prop => config[prop];
    config.set = (prop, value) => (config[prop] = value);

    res(config);
  });

  return loadPromise;
}

module.exports = load;
