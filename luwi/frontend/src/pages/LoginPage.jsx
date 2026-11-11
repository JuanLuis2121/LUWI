import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/Input";
import Button from "../components/Button";
import SocialButtons from "../components/SocialButtons";
import FormMessage from "../components/FormMessage";
import useAuth from "../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  // Mensaje que llega desde el registro (navigate("/login", { state }))
  const [success, setSuccess] = useState(location.state?.message ?? "");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Ingresa un correo válido";
    if (!form.password) e.password = "Ingresa tu contraseña";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    setSuccess("");

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      // "remember" todavía no se envía: el backend no lo soporta (la cookie
      // se crea sin maxAge). Se agrega cuando se defina en el servidor.
      const user = await login({
        email: form.email.trim(),
        password: form.password,
      });

      setSuccess(`¡Bienvenido, ${user.username}!`);
      setForm((f) => ({ ...f, email: "", password: "" }));
      // TODO: redirigir al dashboard cuando exista (useNavigate -> "/dashboard")
    } catch (err) {
      setServerError(err.message || "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Bienvenido de nuevo. Nos alegra verte."
      footer={
        <>
          ¿No tienes una cuenta?{" "}
          <Link to="/register" className="font-semibold text-luwi-blue hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          icon="mail"
          type="email"
          name="email"
          placeholder="Correo electrónico"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <Input
          icon="lock"
          type="password"
          name="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-luwi-ink">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
              className="h-4 w-4 rounded accent-luwi-blue"
            />
            Recordarme
          </label>
          <Link to="/forgot-password" className="font-medium text-luwi-blue hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <FormMessage type="error">{serverError}</FormMessage>
        <FormMessage type="success">{success}</FormMessage>

        <Button type="submit" loading={loading}>
          Iniciar sesión
        </Button>
      </form>

      <SocialButtons />
    </AuthLayout>
  );
}