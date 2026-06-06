================================================================================
SISTEMA DE CONTROL DE GESTIONES EJECUTIVAS - DOCUMENTACIÓN TÉCNICA DE DESPLIEGUE
================================================================================

1. DESCRIPCIÓN GENERAL
--------------------------------------------------------------------------------
Este software es una aplicación de página única (SPA) diseñada para operar de forma 
autónoma en carpetas compartidas de red local (Intranet) dentro de entornos corporativos 
hiper-restringidos. Permite la distribución, seguimiento, control de tiempos de 
gestión y medición de metas operativas del personal en tiempo real sin requerir 
servidores de bases de datos tradicionales (como MySQL o Node.js).

2. ARQUITECTURA DEL SISTEMA Y ARCHIVOS
--------------------------------------------------------------------------------
El ecosistema está estructurado de forma modular en los siguientes componentes

• index.html                Estructura visual de la interfaz ejecutiva.
• styles.css                Hoja de estilos centralizada para el diseño corporativo.
• db_data.js                Base de datos física central, cifrada herméticamente.
• db.js                     Núcleo de autenticación, login y encriptación simétrica.
• app-core.js               Motor principal de cálculo numérico y temporizadores.
• app-executive.js          Monitor de alertas, reportes limpios y multimedia.
• app-admin-users.js        Control CRUD de personal y reseteo de claves.
• app-admin-assign.js       Formulario jerárquico de asignación de cargas laborales.
• app-admin-roles.js        Matriz de permisos de grano fino por checkboxes.
• app-admin-managements.js  CRUD del catálogo maestro de las 20 actividades de red.
• app-admin-logs.js         Bitácora inmutable de logs de auditoría gerencial.
• Iniciar_Programa.vbs      Script automatizador en segundo plano que unifica la red.

3. DIRECTIVAS DE SEGURIDAD REFORZADAS
--------------------------------------------------------------------------------
• Doble Bloqueo de Accesos Diferenciación estricta entre bloqueo automático por 
  intentos fallidos en login (BLOQ_SYS, permite autodesbloqueo por mascota) y 
  bloqueo manual discrecional del Administrador (BLOQ_ADM, restringe autogestión).
• Complejidad de Contraseñas Validación por expresiones regulares que exige un 
  mínimo de 8 caracteres, mayúsculas, minúsculas, números y símbolos (!#$%&()=.,).
• Historial Circular de Claves Almacenamiento encriptado de las últimas 5 contraseñas 
  para impedir la reutilización de credenciales previas.
• Expiración Temporal Configuración administrativa para forzar la actualización de 
  claves del personal cada 30, 60 o 90 días de forma mandatoria.
• Cifrado Simétrico XOR Toda la información de red viaja y se almacena encriptada 
  en texto Base64, impidiendo filtraciones si un usuario lee el archivo db_data.js.

4. INSTRUCCIONES DE USO
--------------------------------------------------------------------------------
• El Administrador o Gerente ingresa con el usuario maestro 'admin' y la clave 'Admin2026'.
• Desde el menú de Ajustes, el supervisor puede configurar las actividades del catálogo, 
  distribuir cargas fijando metas con tiempos límite a analistas específicos y revisar logs.
• Los Analistas y Especialistas ven estrictamente sus paneles limpios con sus tareas dirigidas.
• Para cerrar el ciclo de pruebas y arrancar el uso real en la empresa, el Administrador 
  puede usar el botón rojo REINICIAR SISTEMA (BD) introduciendo su contraseña para 
  purgar de fábrica todo el historial acumulado.

Desarrollado en colaboración directa entre la Gerencia de Adquirencia y el AI Collaborator.
Año 2026. Todos los derechos reservados.
================================================================================
