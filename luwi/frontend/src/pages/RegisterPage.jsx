import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/Input";
import Button from "../components/Button";
import SocialButtons from "../components/SocialButtons";
import FormMessage from "../components/FormMessage";
import useAuth from "../hooks/useAuth";

// Deben coincidir con registerValidator del backend (auth.validator.js).
const USERNAME_MIN = 6;
const USERNAME_MAX = 20;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 64;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    const username = form.username.trim();

    if (!username) e.username = "Usuario requerido";
    else if (username.length < USERNAME_MIN)
      e.username = `Debe tener mínimo ${USERNAME_MIN} caracteres`;
    else if (username.length > USERNAME_MAX)
      e.username = `No puede superar los ${USERNAME_MAX} caracteres`;

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Ingresa un correo válido";

    if (form.password.length < PASSWORD_MIN)
      e.password = `Mínimo ${PASSWORD_MIN} caracteres`;
    else if (form.password.length > PASSWORD_MAX)
      e.password = `No puede superar los ${PASSWORD_MAX} caracteres`;
    else if (!/[A-Z]/.test(form.password)) e.password = "Debe contener una mayúscula";
    else if (!/[a-z]/.test(form.password)) e.password = "Debe contener una minúscula";
    else if (!/[0-9]/.test(form.password)) e.password = "Debe contener un número";

    if (form.confirm !== form.password) e.confirm = "Las contraseñas no coinciden";
    if (!form.terms) e.terms = "Debes aceptar los términos";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const data = await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate("/login", {
        state: { message: `¡Cuenta creada correctamente, ${data.username}! Ya puedes iniciar sesión.` },
      });
    } catch (err) {
      setServerError(err.message || "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crear una cuenta"
      subtitle="Únete a la comunidad y comienza tu camino."
      footer={
        <>
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="font-semibold text-luwi-blue hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          icon="user"
          name="username"
          placeholder="Nombre completo"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          error={errors.username}
        />
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
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Input
          icon="lock"
          type="password"
          name="confirm"
          placeholder="Confirmar contraseña"
          autoComplete="new-password"
          value={form.confirm}
          onChange={handleChange}
          error={errors.confirm}
        />

        <div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-luwi-ink">
            <input
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
              className="h-4 w-4 rounded accent-luwi-blue"
            />
            <span>
              Acepto los{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-luwi-blue hover:underline"
              >
                Términos y Condiciones
              </a>{" "}
              y la{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-luwi-blue hover:underline"
              >
                Política de Privacidad
              </a>
            </span>
          </label>
          {errors.terms && <p className="mt-1 pl-1 text-xs text-red-500">{errors.terms}</p>}
        </div>

        <FormMessage type="error">{serverError}</FormMessage>

        <Button type="submit" loading={loading}>
          Registrarse
        </Button>
      </form>

      <SocialButtons />
    </AuthLayout>
  );
}