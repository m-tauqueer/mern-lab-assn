export function validateRegistration({ fullName, email, password, phone }) {
  const errors = {};

  if (!fullName?.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!email?.trim()) {
    errors.email = "Email is required.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must contain at least 6 characters.";
  }

  if (!phone?.trim()) {
    errors.phone = "Phone number is required.";
  }

  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};

  if (!email?.trim()) {
    errors.email = "Email is required.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
}
