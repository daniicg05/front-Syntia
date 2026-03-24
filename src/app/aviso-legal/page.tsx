import Link from "next/link";

export default function AvisoLegalPage() {
  return (
      <div className="min-h-screen bg-white px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="mb-8 inline-block text-sm text-blue-600 hover:underline">
            ← Volver al inicio
          </Link>

          <h1 className="mb-8 text-3xl font-bold text-gray-900">Aviso Legal</h1>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">1. Responsable del sitio e información de contacto</h2>
              <p>
                <strong>Titular:</strong> NOMBRE O RAZÓN SOCIAL
              </p>
              <p>
                <strong>NIF/CIF:</strong> XXXXXXXX-X
              </p>
              <p>
                <strong>Domicilio:</strong> DIRECCIÓN COMPLETA
              </p>
              <p>
                <strong>Correo:</strong>{" "}
                <a href="mailto:informacion@syntia.es" className="text-blue-600 hover:underline">
                  informacion@syntia.es
                </a>
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">2. Información general</h2>
              <p>
                Syntia es una plataforma tecnológica de ayuda a la búsqueda de subvenciones y
                financiación pública para empresas y entidades. El acceso y uso de esta plataforma
                está sujeto a las condiciones descritas en el presente aviso legal.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">3. Finalidad y objetivos del servicio</h2>
              <p>
                Syntia ofrece un servicio de análisis automatizado de proyectos mediante inteligencia
                artificial para identificar convocatorias de subvenciones públicas potencialmente
                compatibles, consultando la Base de Datos Nacional de Subvenciones (BDNS) del
                Ministerio de Hacienda.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">4. Uso del sitio</h2>
              <p>
                La persona usuaria se compromete a hacer un uso lícito del sitio y de sus contenidos,
                evitando conductas que puedan dañar, bloquear o sobrecargar la plataforma.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">5. Condiciones de uso del servicio</h2>
              <p>
                El uso del servicio tiene carácter informativo y orientativo. La persona usuaria es
                responsable de verificar en fuentes oficiales los requisitos, plazos y bases de cada
                convocatoria antes de adoptar decisiones.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">6. Limitación de responsabilidad</h2>
              <p>
                Las recomendaciones generadas por Syntia tienen carácter meramente orientativo. La
                plataforma no garantiza la concesión de ninguna subvención ni asume responsabilidad
                por las decisiones tomadas en base a la información proporcionada. Se recomienda
                verificar siempre la información oficial en las fuentes originales.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">7. Propiedad intelectual e industrial</h2>
              <p>
                Los contenidos de este sitio (textos, diseño, logotipos, código fuente, imágenes y
                demás elementos) son titularidad de Syntia o de terceros con licencia, y están
                protegidos por la normativa de propiedad intelectual e industrial.
              </p>
              <p>
                Queda prohibida su reproducción, distribución, transformación o comunicación pública,
                total o parcial, sin autorización previa y expresa del titular.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">8. Protección de datos</h2>
              <p>
                Los datos personales facilitados serán tratados conforme al Reglamento (UE) 2016/679
                (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD). Los datos se utilizan exclusivamente para
                la prestación del servicio y no serán cedidos a terceros sin consentimiento expreso.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-900">9. Legislación aplicable</h2>
              <p>
                El presente aviso legal se rige por la legislación española.
              </p>
            </section>
          </div>
        </div>
      </div>
  );
}