import { useState } from "react";
import "./Login.css";

const API_URL = import.meta.env.VITE_API_URL;

const getErrorMessage = (data, fallback) => {
  if (typeof data.message === "string") {
    return data.message;
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  if (Array.isArray(data.error) && data.error.length > 0) {
    return data.error[0];
  }

  return fallback;
};

const SocialIcons = () => (
  <div className="social-icons">
    <a href="#" className="icon" aria-label="Google">
      <i className="fa-brands fa-google-plus-g"></i>
    </a>
    <a href="#" className="icon" aria-label="Facebook">
      <i className="fa-brands fa-facebook-f"></i>
    </a>
    <a href="#" className="icon" aria-label="GitHub">
      <i className="fa-brands fa-github"></i>
    </a>
    <a href="#" className="icon" aria-label="LinkedIn">
      <i className="fa-brands fa-linkedin-in"></i>
    </a>
  </div>
);

export default function Login() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleRegisterChange = (event) => {
    setRegisterData({
      ...registerData,
      [event.target.name]: event.target.value,
    });
  };

  const handleLoginChange = (event) => {
    setLoginData({
      ...loginData,
      [event.target.name]: event.target.value,
    });
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Error al registrar usuario"));
      }

      setSuccess(`¡Cuenta creada correctamente, ${data.username}!`);

      setRegisterData({
        username: "",
        email: "",
        password: "",
      });

      setActive(false);
    } catch (error) {
      setError(error.message || "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Error al iniciar sesión"));
      }

      setSuccess(`¡Bienvenido, ${data.username}!`);

      setLoginData({
        email: "",
        password: "",
      });

      // Aquí puedes redirigir al usuario al dashboard.
    } catch (error) {
      setError(error.message || "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const changePanel = (showRegister) => {
    setActive(showRegister);
    setError("");
    setSuccess("");
  };

  return (
    <div className={`container ${active ? "active" : ""}`} id="container">
      {/* Registro */}
      <div className="form-container sign-up">
        <form onSubmit={handleRegister}>
          <h1>Create Account</h1>

          <SocialIcons />

          <span>or use your email for registration</span>

          <input
            type="text"
            name="username"
            placeholder="Name"
            value={registerData.username}
            onChange={handleRegisterChange}
            autoComplete="username"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={registerData.email}
            onChange={handleRegisterChange}
            autoComplete="email"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={registerData.password}
            onChange={handleRegisterChange}
            autoComplete="new-password"
            required
          />

          {error && active && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="auth-success" role="status">
              {success}
            </p>
          )}

          <button type="submit" disabled={loading}>
            Sign Up
          </button>
        </form>
      </div>

      {/* Inicio de sesión */}
      <div className="form-container sign-in">
        <form onSubmit={handleLogin}>
          <h1>Sign In</h1>

          <SocialIcons />

          <span>or use your email password</span>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={loginData.email}
            onChange={handleLoginChange}
            autoComplete="email"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={loginData.password}
            onChange={handleLoginChange}
            autoComplete="current-password"
            required
          />

          <a href="#forgot-password">Forgot Your Password?</a>

          {error && !active && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="auth-success" role="status">
              {success}
            </p>
          )}

          <button type="submit" disabled={loading}>
            Sign In
          </button>
        </form>
      </div>

      {/* Panel animado */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Welcome Back!</h1>
            <p>Enter your personal details to use all of site features</p>

            <button
              type="button"
              className="hidden"
              onClick={() => changePanel(false)}
            >
              Sign In
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>Hello, Friend!</h1>
            <p>
              Register with your personal details to use all of site features
            </p>

            <button
              type="button"
              className="hidden"
              onClick={() => changePanel(true)}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
