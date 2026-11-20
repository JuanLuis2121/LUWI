
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/Input";
import Button from "../components/Button";
import SocialButtons from "../components/SocialButtons";
import FormMessage from "../components/FormMessage";
import useAuth from "../hooks/useAuth";
import { inicioSegunRol } from "../utils/roles";

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(location.state?.message ?? "");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const validate = () => {
    const e = {};

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      e.email = "Ingresa un correo válido";
    }

    if (!form.password) {
      e.password = "Ingresa tu contraseña";
    }

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
      const usuario = await login({
        email: form.email.trim(),
        password: form.password,
      });

      navigate(inicioSegunRol(usuario.rol), {
        replace: true,
      });
    } catch (err) {
      setServerError(
        err.message || "No se pudo conectar con el servidor"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Inicia sesión para continuar tu ruta en LUWI."
      footer={
        <>
          ¿No tienes una cuenta?{" "}
          <Link
            to="/register"
            className="rounded font-semibold text-luwi-medio transition hover:text-luwi-profundo hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
          >
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          icon="user"
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

        <FormMessage type="error">{serverError}</FormMessage>
        <FormMessage type="success">{success}</FormMessage>

        <div className="pt-1">
          <Button type="submit" loading={loading} loadingText="Entrando…">
            Entrar
          </Button>
        </div>
      </form>

      <SocialButtons />

      <div className="mt-5 text-center">
        <Link
          to="/forgot-password"
          className="rounded text-[14px] font-medium text-luwi-medio transition hover:text-luwi-profundo hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </AuthLayout>
  );
}
