// custom logger. logt request method en url
// @ts-ignore
function logger(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next();
}
module.exports = logger;
