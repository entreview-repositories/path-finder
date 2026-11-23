export const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

// Result is a small error container: map/chain preserve a failed computation.
export const Result = (ok, value) => ({
  ok,
  value,
  map: (transform) => (ok ? Result(true, transform(value)) : Result(false, value)),
  chain: (transform) => (ok ? transform(value) : Result(false, value)),
});

export const attempt = (operation) => {
  try {
    return Result(true, operation());
  } catch (error) {
    return Result(false, error);
  }
};

export const unwrap = (result) => {
  if (!result.ok) throw result.value;
  return result.value;
};
