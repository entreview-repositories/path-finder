export const errorHandler = (logger) => (error, req, res, _next) => {
  const status =
    error.code === 'P2002'
      ? 409
      : ['P2003', 'P2025', 'P2034'].includes(error.code)
        ? 409
        : (error.status ?? 500);
  logger(
    JSON.stringify({
      time: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status,
      message: error.message,
    }),
  );
  const message =
    error.code === 'P2002'
      ? 'A record with these unique fields already exists'
      : ['P2003', 'P2025', 'P2034'].includes(error.code)
        ? 'A related record changed; reload and retry'
        : status >= 500
          ? 'Server could not complete the request'
          : error.message;
  res.status(status).json({ error: message });
};
