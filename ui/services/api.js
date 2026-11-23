export const api = async (path, method = 'GET', body) => {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 204) return;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};
