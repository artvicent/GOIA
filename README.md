===========================================================================
     PLATAFORMA DE CONTROL DE GESTIONES EJECUTIVAS - MANUAL DE SISTEMA
                        GERENCIA DE ADQUIRENCIA
===========================================================================
PRODUCTO: GOIA (Gestión Operacional de Integridad de Adquirencia)
VERSIÓN ACTUAL: v2.02 - EDICIÓN CLOUD SEGURO
ENTORNO DE RED: Producción Web (Protocolo Seguro HTTPS)
ÚLTIMA ACTUALIZACIÓN: Junio 2026
===========================================================================

1. INTRODUCCIÓN Y OBJETIVO
---------------------------------------------------------------------------
Esta plataforma web ha sido diseñada para la automatización, control y 
auditoría en tiempo real de las metas de producción, cargas operacionales, 
asignaciones y catálogos de gestiones de la Gerencia General de Adquirencia.
Permite el seguimiento continuo de métricas críticas e índices de desempeño.


2. ARQUITECTURA TECNOLÓGICA Y BLINDAJE DE INTEGRIDAD
---------------------------------------------------------------------------
A partir de la versión v2.02, el software migró de una arquitectura local 
volátil a un ecosistema web centralizado de grado empresarial:

* SERVIDOR DE ALOJAMIENTO (HOSTING): Servidores estáticos protegidos mediante 
  GitHub Pages (https://github.io). Proporciona un entorno 
  aislado de alta prioridad (Efecto Sandbox por Dominio Protegido).
  
* BASE DE DATOS CENTRALIZADA: Enlace directo en tiempo real (Realtime Cloud) 
  con los servidores de Firebase Realtime Database de Google. 
  
* INMUNIDAD DE INTEGRIDAD: El software es 100% inmune a borrados manuales de 
  historial, cookies o limpiezas de la caché general de las computadoras. 
  Los datos reales ya no residen en el almacenamiento temporal de las PC 
  locales; viajan cifrados de forma automática a la nube de Google.

* OBSOLESCENCIA LOCAL: Se eliminaron por completo las dependencias de hilos 
  locales obsoletos como "Sincronizador.vbs", "Iniciar_Programa.bat" o 
  archivos de texto físicos planos ("db_storage.json", "db_data.js"). 
  La consola negra de comandos ha quedado erradicada del flujo operacional.


3. ACCESO Y CREDENCIALES MAESTRAS DE FÁBRICA
---------------------------------------------------------------------------
Para iniciar la plataforma en cualquier monitor de la gerencia, digite la URL 
oficial. El sistema levantará de forma instantánea.

* URL DE ACCESO: https://github.io
* USUARIO ADMINISTRADOR DE FÁBRICA: admin
* CONTRASEÑA DE SEGURIDAD INICIAL: Admin2026*

Nota: Si el servidor en la nube es restablecido o se encuentra vacío, el motor 
inyectará automáticamente estas credenciales administrativas para el primer acceso.


4. JERARQUÍA DE ROLES Y MATRIZ DE SEGURIDAD
---------------------------------------------------------------------------
El sistema posee un cerrojo lógico por niveles jerárquicos (lvl) inyectado 
directamente en el esqueleto HTML, impidiendo accesos no autorizados:

* NIVEL 4 (Gerente) / NIVEL 3 (Administrador): Control absoluto. Acceso 
  habilitado al botón [⚙️ Ajustes y Usuarios]. Autorizados para gestionar 
  la nómina de personal, auditoría de logs, modificar títulos y ejecutar 
  el mantenimiento crítico del servidor.
  
* NIVEL 2 (Coordinador) / NIVEL 1 (Analista / Especialista): Operación pura. 
  Por estrictas razones de seguridad corporativa, el botón de ajustes se 
  mantiene oculto y destruido al 100% para estos roles en la pantalla. 
  Tienen acceso bloqueado a la nómina general y bases de datos.


5. PROTOCOLO DE MANTENIMIENTO CRÍTICO (REINICIO DE BASE DE DATOS)
---------------------------------------------------------------------------
Para formatear el servidor de Firebase y dejar la base de datos en cero 
absoluto de fábrica:

1. Inicie sesión con la cuenta maestra "admin".
2. Diríjase a la esquina superior derecha y presione [⚙️ Ajustes y Usuarios].
3. Ubique el panel rojo llamado "🚨 Mantenimiento Crítico de Servidor".
4. Presione el botón "REINICIAR BASE DE DATOS DE FÁBRICA".
5. El sistema solicitará una doble confirmación de seguridad. Digite la 
   palabra token "REINICIAR" y presione Aceptar.
6. La nube se purgará en un milisegundo y el sistema se reiniciará limpio.


6. ESTRUCTURA DE ARCHIVOS VIVOS EN REPOSITORIO
---------------------------------------------------------------------------
Para el correcto funcionamiento de la plataforma en internet, el repositorio 
solo debe contener los siguientes elementos esenciales:

* index.html           -> Esqueleto SPA limpio de estilos en línea.
* styles.css           -> Hoja de diseño unificada y opacidad sutil.
* db.js                -> Motor y pasarela Fetch de conexión a Firebase.
* app-core.js          -> Núcleo operacional y control de sesiones.
* app-executive.js     -> Lógica de interfaces, reportes y modales.
* app-admin-users.js   -> Gestión de nómina de personal y políticas.
* app-admin-assign.js  -> Gestor de cargas y metas operacionales.
* app-admin-roles.js   -> Control y jerarquías de permisos.
* app-admin-managements.js -> Catálogo de gestiones de adquirencia.
* app-admin-logs.js    -> Historial de auditoría interna.
* 1.jpeg               -> Lienzo de fondo de pantalla corporativo.
* logo_gerencia.png    -> Logotipo institucional de alta definición.
* logo credicard 2.ico -> Icono del navegador de internet.
===========================================================================
           ENTORNO DIGITAL DESPLEGADO CON ÉXITO - JUNIO 2026
===========================================================================
