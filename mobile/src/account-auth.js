export function validateLogin(identifier, password) {
  const value = String(identifier || "").trim().toLowerCase();
  if (!value) throw new Error("Enter your username or email.");
  if (value.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254)
      throw new Error("Enter a valid email address.");
  } else if (!/^[a-z0-9_]{3,24}$/.test(value)) {
    throw new Error("Use 3–24 letters, numbers or underscores for your username.");
  }
  if (!password) throw new Error("Enter your password.");
  if (password.length > 1024) throw new Error("Password is too long.");
  return value;
}

export function validateSignup({ username, email, password }) {
  const cleanUsername = String(username || "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername))
    throw new Error("Use 3–24 letters, numbers or underscores for your username.");
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail.includes("@")) throw new Error("Enter a valid email address.");
  validateLogin(cleanEmail, password);
  if (password.length < 8) throw new Error("Use at least eight characters for your password.");
  return { username: cleanUsername, email: cleanEmail, password };
}

async function accountAction(client, body) {
  const { data, error } = await client.functions.invoke("account-auth", { body });
  if (error) {
    // Edge Function HTTP errors keep the useful server message in their Response.
    const detail = await error.context?.json?.().catch(() => null);
    throw new Error(detail?.error || "Could not reach the account service. Check your connection and try again.");
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function passwordSignIn(client, identifier, password) {
  const value = validateLogin(identifier, password);
  if (value.includes("@")) {
    const response = await client.auth.signInWithPassword({ email: value, password });
    if (response.error) throw new Error(response.error.code === "invalid_credentials"
      ? "Username, email or password is incorrect." : response.error.message);
    return response.data;
  }
  const session = await accountAction(client, { action: "signin", username: value, password });
  if (!session?.access_token || !session?.refresh_token)
    throw new Error("Sign-in returned without a session. Please try again.");
  const response = await client.auth.setSession(session);
  if (response.error) throw response.error;
  return response.data;
}

export async function passwordSignUp(client, input) {
  const { username, email, password } = validateSignup(input);
  const check = () => accountAction(client, { action: "available", username });
  if (!(await check())?.available) throw new Error("Username already exists. Choose another one.");
  const { data, error } = await client.auth.signUp({
    email, password, options: { data: { username, name: username } },
  });
  if (error) {
    // Another signup may claim the name between our check and Auth's insert.
    if (error.code === "unexpected_failure" || /database/i.test(error.message)) {
      if (!(await check())?.available) throw new Error("Username already exists. Choose another one.");
    }
    if (["user_already_exists", "email_exists"].includes(error.code))
      throw new Error("That email already has an account. Log in instead.");
    throw new Error(error.message);
  }
  if (!data.session) throw new Error("Account created, but email confirmation is still enabled on the server. Contact the app owner before trying again.");
  return data;
}
