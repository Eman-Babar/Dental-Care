export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const getToken = () => localStorage.getItem("token");

export const removeToken = () => {
  localStorage.removeItem("token");
};

export const setStoredUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const removeStoredUser = () => {
  localStorage.removeItem("user");
};

export const dashboardPathForRole = (role) => {
  if (role === "ADMIN") return "/admin";
  if (role === "DOCTOR") return "/doctor";
  return "/patient";
};
