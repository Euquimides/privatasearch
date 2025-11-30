import Footer from '@/components/Footer';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20 flex-1">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl text-center">Descargo de Responsabilidad/Disclaimer</h1>
        <div className="text-neutral-800 dark:text-neutral-200 text-lg space-y-4">
          <h3 className="text-2xl font-semibold">Información General</h3>
          <p>
           PrivataSearch es un proyecto de código abierto desarrollado de forma independiente con fines académicos. Este buscador no tiene afiliación oficial con la Agencia de Protección de Datos de los Habitantes (PRODHAB) ni con ninguna entidad gubernamental de Costa Rica.
          </p>
          <h3 className="text-2xl font-semibold">Naturaleza, Precisión y Actualización de Datos</h3>
          <p>
           La información contenida en este buscador proviene de resoluciones públicas y despersonalizadas emitidas por PRODHAB. Aunque se busca incluir todas las resoluciones disponibles públicamente, pueden existir omisiones o retrasos en la actualización del índice. Por tanto, se recomienda verificar siempre con las fuentes oficiales.
          </p>
          <h3 className="text-2xl font-semibold">Limitación de Responsabilidad</h3>
          <p>
           PrivataSearch se proporciona "tal cual" sin garantías de ningún tipo, ya sean expresas o implícitas. Los desarrolladores no asumen responsabilidad alguna por errores, omisiones o interpretaciones incorrectas de la información presentada. El usuario entiende que esta es una herramienta de consulta y referencia que no acredita en forma alguna, eficacia o validez de las resoluciones que sean accedidas a través de la misma. El uso de este buscador es bajo el propio riesgo del usuario.
          </p>
          <h3 className="text-2xl font-semibold">Privacidad y Datos</h3>
          <p>
            Este proyecto no recopila datos personales de los usuarios. No utiliza cookies de seguimiento ni análisis. Las resoluciones incluidas ya están despersonalizadas en su versión pública original según lo dispuesto por la legislación costarricense vigente. 
          </p>
          <h3 className="text-2xl font-semibold">Cambios en el Descargo de Responsabilidad</h3>
          <p>
           Los desarrolladores se reservan el derecho de modificar este descargo de responsabilidad en cualquier momento. Se recomienda a los usuarios revisar periódicamente esta sección para estar informados sobre cualquier cambio.
          </p>
          <h3 className="text-2xl font-semibold">Contacto</h3>
          <p>
           Para reportar errores, inexactitudes o solicitar actualizaciones, por favor abra un issue en el repositorio de GitHub. 
          </p>
          <h3 className="text-2xl font-semibold">Aceptación de Términos</h3>
          <p>
           Al utilizar PrivataSearch, usted acepta los términos y condiciones establecidos en este descargo de responsabilidad.
          </p>
          <h3 className="text-2xl font-semibold">Última Actualización</h3>
            <p>
            Este descargo de responsabilidad fue actualizado por última vez el {new Date().toLocaleDateString('es-CR')}.
            </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
