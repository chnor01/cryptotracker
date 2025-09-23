export const validateUsername = (username: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username); // letters, numbers, underscore, 3-20 chars
};

export const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
};

export const validatePassword = (password: string) => {
    return password.length >= 8;
};
