module.exports = function (err, req, res, next) {
  console.error({
    message: err.message,
    method: req.method,
    url: req.originalUrl,
  });

  const response = {
    message: "Something failed.",
  };

  if (process.env.NODE_ENV === "development") {
    response.details = err.message;
  }

  res.status(500).send(response);
};
