"use client";

const team = [
    {
        name: "Sergio",
        role: "Backend Developer",
        image:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    },
    {
        name: "Diego",
        role: "Frontend Developer",
        image:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    },
    {
        name: "Daniel",
        role: "QA & Testing",
        image:
            "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80",
    },
    {
        name: "Carlos",
        role: "Full Stack Developer",
        image:
            "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=600&q=80",
    },
    {
        name: "Andrés",
        role: "Product & Strategy",
        image:
            "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=600&q=80",
    },
];

const smoothEase = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function ConocenosPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="relative isolate overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80"
                        alt="Equipo trabajando en entorno digital"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-transparent to-blue-500/20" />
                </div>

                <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-6 py-24 sm:px-10 lg:px-16">
                    <div className="max-w-4xl">
            <span className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
              Conócenos
            </span>

                        <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight text-white sm:text-5xl lg:text-7xl">
                            Páginas del estado:
                            <span className="block text-red-400">caos.</span>
                            <span className="block text-white">Syntia:</span>
                            <span className="block text-blue-300">claridad y solución.</span>
                        </h1>

                        <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                            Transformamos procesos complejos en una experiencia clara,
                            moderna y útil. Detrás de Syntia hay un equipo que mezcla
                            desarrollo, análisis y producto para hacer que encontrar y
                            entender oportunidades sea mucho más fácil.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16">
                <div className="mb-12 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-[0.22em] text-primary dark:text-blue-300">
            El equipo
          </span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                        Las personas detrás de Syntia
                    </h2>
                    <p className="mt-4 text-base leading-7 text-muted-foreground">
                        Un equipo enfocado en construir una plataforma sólida, intuitiva y
                        preparada para resolver problemas reales.
                    </p>
                </div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {team.map((member) => (
                        <article
                            key={member.name}
                            className="group rounded-3xl border border-border bg-card/80 p-6 text-center shadow-sm"
                            style={{
                                transitionProperty:
                                    "transform, box-shadow, border-color, background-color",
                                transitionDuration: "500ms",
                                transitionTimingFunction: smoothEase,
                            }}
                        >
                            <div
                                className="rounded-[1.4rem]"
                                style={{
                                    transitionProperty: "transform",
                                    transitionDuration: "500ms",
                                    transitionTimingFunction: smoothEase,
                                }}
                            >
                                <div
                                    className="mx-auto mb-5 h-32 w-32 overflow-hidden rounded-full ring-4 ring-primary/10 dark:ring-blue-300/20"
                                    style={{
                                        transitionProperty: "transform, box-shadow, ring-color",
                                        transitionDuration: "500ms",
                                        transitionTimingFunction: smoothEase,
                                    }}
                                >
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="h-full w-full object-cover"
                                        style={{
                                            transitionProperty: "transform, filter",
                                            transitionDuration: "700ms",
                                            transitionTimingFunction: smoothEase,
                                        }}
                                    />
                                </div>

                                <h3
                                    className="text-xl font-semibold text-foreground"
                                    style={{
                                        transitionProperty: "color, transform",
                                        transitionDuration: "350ms",
                                        transitionTimingFunction: smoothEase,
                                    }}
                                >
                                    {member.name}
                                </h3>

                                <p
                                    className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-primary dark:text-blue-300"
                                    style={{
                                        transitionProperty: "color, letter-spacing, transform",
                                        transitionDuration: "350ms",
                                        transitionTimingFunction: smoothEase,
                                    }}
                                >
                                    {member.role}
                                </p>

                                <p
                                    className="mt-4 text-sm leading-6 text-muted-foreground"
                                    style={{
                                        transitionProperty: "color, transform",
                                        transitionDuration: "350ms",
                                        transitionTimingFunction: smoothEase,
                                    }}
                                >
                                    Parte clave del desarrollo y evolución de Syntia, aportando
                                    visión técnica y trabajo en equipo en cada fase del proyecto.
                                </p>
                            </div>

                            <style jsx>{`
                article.group:hover {
                  transform: translateY(-6px) scale(1.015);
                  box-shadow:
                    0 10px 30px rgba(0, 0, 0, 0.12),
                    0 2px 10px rgba(0, 0, 0, 0.08);
                }

                article.group:hover div.rounded-\\[1\\.4rem\\] {
                  transform: translateY(-2px);
                }

                article.group:hover img {
                  transform: scale(1.08);
                  filter: saturate(1.05);
                }

                article.group:hover h3 {
                  transform: translateY(-1px);
                }

                article.group:hover p:first-of-type {
                  letter-spacing: 0.22em;
                  transform: translateY(-1px);
                }

                article.group:hover p:last-of-type {
                  color: rgb(90 90 90 / 0.95);
                }

                :global(.dark) article.group:hover p:last-of-type {
                  color: rgb(220 220 220 / 0.82);
                }

                :global(.dark) article.group:hover {
                  box-shadow:
                    0 14px 34px rgba(0, 0, 0, 0.34),
                    0 4px 16px rgba(0, 0, 0, 0.2);
                }

                @media (prefers-reduced-motion: reduce) {
                  article.group,
                  article.group *,
                  article.group:hover,
                  article.group:hover * {
                    transition: none !important;
                    transform: none !important;
                    animation: none !important;
                  }
                }
              `}</style>
                        </article>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-10 lg:px-16">
                <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-6 py-6 sm:px-8">
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-primary dark:text-blue-300">
              Presentación
            </span>
                        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                            Vídeo de presentación
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                            Aquí puedes insertar vuestro vídeo para presentar el proyecto, el
                            equipo y la visión de Syntia de forma mucho más cercana.
                        </p>
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40">
                            <iframe
                                className="h-full w-full"
                                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                                title="Vídeo de presentación de Syntia"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />

                            {/*
              Si todavía no tenéis vídeo, sustituye el iframe por este bloque:

              <div className="flex h-full w-full items-center justify-center">
                <p className="px-6 text-center text-sm text-muted-foreground sm:text-base">
                  Inserta aquí vuestro vídeo de presentación cuando lo tengáis listo.
                </p>
              </div>
              */}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}