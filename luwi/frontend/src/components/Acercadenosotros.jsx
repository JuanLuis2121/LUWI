import { useState } from "react";

const items = [
  {
    id: "mision",
    title: "Nuestra misión",
    body: (
      <>
        <p>
          Ayudar a las empresas a preparar a sus candidatos antes de que se
          incorporen al trabajo, identificando qué les falta para ocupar un
          puesto y acompañándolos con una ruta de capacitación hecha a su
          medida.
        </p>
        <p>
          Queremos que más personas tengan la oportunidad de desarrollar las
          competencias que el mercado laboral les pide.
        </p>
      </>
    ),
  },
  {
    id: "significado",
    title: "¿Qué significa LUWI?",
    body: (
      <>
        <p>
          Cada letra resume una parte del camino que acompañamos, desde el
          primer aprendizaje hasta el crecimiento dentro del puesto.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["Learn", "Aprender lo que cada puesto realmente requiere."],
            ["Upgrade", "Fortalecer las competencias que aún faltan."],
            ["Work", "Llegar al trabajo con la preparación necesaria."],
            ["Improve", "Seguir mejorando con seguimiento de tu progreso."],
          ].map(([palabra, descripcion]) => (
            <li key={palabra} className="rounded-xl bg-[#F2FBF9] p-4">
              <span className="inline-block rounded-full bg-[#DBB4FD] px-3 py-1 text-sm font-bold text-black">
                {palabra}
              </span>
              <span className="mt-2 block text-base text-black/75">
                {descripcion}
              </span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "empresas",
    title: "Cómo ayudamos a las empresas",
    body: (
      <>
        <p>
          Cada empresa configura su propia academia dentro de la plataforma:
          registra sus puestos, define las competencias que necesita y organiza
          los contenidos de formación.
        </p>
        <p>
          Su equipo puede consultar el avance de cada participante desde un
          panel de seguimiento y generar reportes. La decisión final sobre la
          contratación siempre es de la empresa.
        </p>
      </>
    ),
  },
  {
    id: "candidatos",
    title: "Cómo ayudamos a los candidatos",
    body: (
      <>
        <p>
          Cada candidato se vincula a un puesto y realiza una evaluación para
          conocer su nivel inicial. Luego comparamos sus competencias con las
          que pide el cargo y detectamos las áreas por fortalecer.
        </p>
        <p>
          Con apoyo de inteligencia artificial, recomendamos una ruta de
          aprendizaje con cursos, actividades, evaluaciones y ejercicios
          prácticos, y registramos sus avances en cada paso.
        </p>
      </>
    ),
  },
];

function PlusIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 transition-transform duration-300 motion-reduce:transition-none ${
        open ? "rotate-45" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function AcercaDeNosotros() {
  const [openId, setOpenId] = useState(items[0].id);

  return (
    <section
      id="nosotros"
      className="bg-[#F2FBF9] px-4 py-20 sm:px-8"
      aria-labelledby="nosotros-titulo"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="nosotros-titulo"
          className="text-center text-4xl font-black tracking-tight text-black sm:text-6xl"
        >
          Acerca de{" "}
          <span className="relative isolate ml-1 inline-block px-4 text-black">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 -z-10 h-full w-full"
              aria-hidden="true"
            >
              <polygon
                points="0,10 2,3 100,0 98,86 100,96 3,100 1,90"
                fill="#DBB4FD"
              />
            </svg>
            nosotros
          </span>
        </h2>

        <div className="mx-auto mt-10 max-w-4xl space-y-5 rounded-[2rem] bg-[#00B9A9] px-6 py-10 text-center sm:px-14 sm:py-14">
          <p className="text-xl font-extrabold leading-snug tracking-tight text-black sm:text-3xl">
            LUWI prepara a los candidatos antes de que lleguen al puesto.
          </p>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-black/80 sm:text-lg">
            Somos una plataforma que ayuda a las empresas a formar a las
            personas según lo que cada cargo realmente necesita. Identificamos
            la distancia entre lo que sabe un candidato y lo que pide el puesto,
            y armamos una ruta de aprendizaje personalizada con apoyo de
            inteligencia artificial.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white shadow-[0_8px_24px_-8px_rgba(0,80,72,0.18)]"
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-expanded={open}
                    aria-controls={`panel-${item.id}`}
                    id={`btn-${item.id}`}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-6 text-left text-lg font-extrabold tracking-tight text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B9A9] sm:px-10 sm:text-2xl"
                  >
                    {item.title}
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-black transition-colors duration-300 motion-reduce:transition-none ${
                        open ? "bg-[#00B9A9]" : "bg-[#DBB4FD]"
                      }`}
                    >
                      <PlusIcon open={open} />
                    </span>
                  </button>
                </h3>

                <div
                  id={`panel-${item.id}`}
                  role="region"
                  aria-labelledby={`btn-${item.id}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="mx-6 mb-8 space-y-4 border-t border-black/10 pt-6 text-base leading-relaxed text-black/75 sm:mx-10 sm:text-lg">
                      {item.body}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}