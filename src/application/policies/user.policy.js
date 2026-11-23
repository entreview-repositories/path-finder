import { text, email, preferences } from '../../domain/validation.js';

export const prepareUser = (input, current) => {
  const data = { ...current, ...input };
  return {
    name: text(data.name, 'name'),
    email: email(data.email),
    preferences: preferences(data.preferences ?? {}),
  };
};
