// @ts-ignore
module.exports = function (handler) {
  // @ts-ignore
  return async function (req, res, next) {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};
