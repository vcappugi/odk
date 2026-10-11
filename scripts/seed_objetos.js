/**
 * Script de Inicialización y Registro de Objetos del Sistema (Vistas y CRUDs)
 * Tabla: public.objetos (Supabase)
 * 
 * Ejecución: node scripts/seed_objetos.js
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jzaowaqnxafdltintoov.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_SSWyLHhz_9sgHbV5BHodNA_GptZBmVf';

export const SYSTEM_OBJECTS = [
  // --- VISTAS PRINCIPALES DEL SISTEMA ---
  {
    nombre: 'Vista Calendario Mensual',
    id_vista: 'cal-month',
    plantilla: 'calendarMonthView',
    descripcion: 'Vista mensual interactiva para visualización global de días, turnos y chips de citas agendadas.'
  },
  {
    nombre: 'Vista Calendario Semanal',
    id_vista: 'cal-week',
    plantilla: 'calendarWeekView',
    descripcion: 'Vista semanal con 7 columnas por día, tarjetas de citas por horario y slots para agendar.'
  },
  {
    nombre: 'Vista Calendario Diario (Agenda)',
    id_vista: 'cal-day',
    plantilla: 'calendarDayView',
    descripcion: 'Vista de agenda diaria por horas detalladas (08:00 AM a 06:00 PM) con disponibilidad de turnos odontológicos.'
  },
  {
    nombre: 'Barra de Gestión Rápida',
    id_vista: 'quick-actions-bar',
    plantilla: 'quickActionsView',
    descripcion: 'Barra superior con accesos directos a gestión de pacientes, historial, reportes y configuración administrativa.'
  },
  {
    nombre: 'Cabecera y Selector de Sede',
    id_vista: 'header-navbar',
    plantilla: 'topCompactHeader',
    descripcion: 'Barra superior de navegación con indicador de sede activa, selector de tema claro/oscuro y sesión de usuario.'
  },
  {
    nombre: 'Vista Historial Clínico Odontológico',
    id_vista: 'modal-quick-history',
    plantilla: 'historyView',
    descripcion: 'Modal y tabla de consulta del historial clínico, odontogramas y tratamientos realizados a pacientes.'
  },
  {
    nombre: 'Vista Reportes y Métricas Odontológicas',
    id_vista: 'modal-quick-reports',
    plantilla: 'reportsView',
    descripcion: 'Panel analítico con métricas clave (KPIs), citas del mes, pacientes activos y tratamientos.'
  },
  {
    nombre: 'Ventana de Autenticación y Acceso',
    id_vista: 'modal-auth',
    plantilla: 'authModalView',
    descripcion: 'Modal de inicio de sesión con selector obligatorio de consultorio/sede y formulario de registro.'
  },
  {
    nombre: 'Selector de Sede Activa (Cambio Rápido)',
    id_vista: 'dialog-switch-consultorio',
    plantilla: 'switchConsultorioModal',
    descripcion: 'Modal flotante para alternar entre diferentes sedes o consultorios clínicos sin cerrar la sesión.'
  },
  {
    nombre: 'Panel de Configuración Administrativa',
    id_vista: 'modal-admin-config',
    plantilla: 'adminConfigModalView',
    descripcion: 'Centro de control administrativo accesible exclusivamente para usuarios con rol admin verificado.'
  },
  {
    nombre: 'Configuración Webhook Google Drive',
    id_vista: 'modal-drive-config',
    plantilla: 'driveConfigModal',
    descripcion: 'Configuración del endpoint Google Apps Script para sincronización y almacenamiento de fotografías dentales.'
  },

  // --- CRUDS DEL SISTEMA ---
  {
    nombre: 'CRUD de Citas Odontológicas',
    id_vista: 'modal-cita',
    plantilla: 'citaView',
    descripcion: 'Gestión completa de citas en la tabla "cita": agendar turnos, seleccionar paciente y doctor obligatorio, modificar horarios y eliminar.'
  },
  {
    nombre: 'CRUD de Pacientes y Fichas Clínicas',
    id_vista: 'modal-patient-form',
    plantilla: 'patientManagementView',
    descripcion: 'Gestión integral de pacientes en la tabla "paciente": altas, modificaciones, bajas, cédula, teléfono, dirección y fotos.'
  },
  {
    nombre: 'CRUD de Consultorios / Sedes',
    id_vista: 'admin-section-consultorio',
    plantilla: 'consultorioAdminView',
    descripcion: 'Registro, modificación, listado y eliminación de sedes clínicas en la tabla "consultorio".'
  },
  {
    nombre: 'CRUD de Doctores y Especialistas',
    id_vista: 'admin-section-doctor',
    plantilla: 'doctorAdminView',
    descripcion: 'Registro de odontólogos, asignación de sede, datos de contacto y administración en la tabla "doctor".'
  },
  {
    nombre: 'CRUD de Usuarios del Sistema',
    id_vista: 'admin-section-users',
    plantilla: 'userAdminView',
    descripcion: 'Administración de cuentas en tabla "usuario": creación con clave encriptada bcrypt, edición, estado activo y bajas.'
  },
  {
    nombre: 'CRUD de Roles y Permisos de Usuario',
    id_vista: 'admin-section-user-roles',
    plantilla: 'userRolesAdminView',
    descripcion: 'Asignación, revocación y auditoría de permisos y roles administrativos en la tabla "user_roles".'
  },
  {
    nombre: 'CRUD de Historial Médico',
    id_vista: 'modal-historial-medico',
    plantilla: 'historialView',
    descripcion: 'Gestión clínica completa de antecedentes, alergias, diagnósticos, evolución y tratamientos por paciente en la tabla historial_medico.'
  },
  {
    nombre: 'CRUD Odontograma Gráfico',
    id_vista: 'modal-odontograma',
    plantilla: 'odontogramaView',
    descripcion: 'Odontograma gráfico interactivo (FDI), superficies dentales y registro sincronizado en historial_medico y detalle_odontograma.'
  }
];

export async function syncObjetos() {
  console.log('🔄 Sincronizando objetos en tabla "objetos"...');

  const getRes = await fetch(`${supabaseUrl}/rest/v1/objetos?select=id,nombre,id_vista`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  const existing = await getRes.json();

  for (const obj of SYSTEM_OBJECTS) {
    const found = existing.find(e => e.id_vista === obj.id_vista || e.nombre === obj.nombre);

    if (found) {
      await fetch(`${supabaseUrl}/rest/v1/objetos?id=eq.${found.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(obj)
      });
      console.log(`[OK] Actualizado: ${obj.nombre}`);
    } else {
      await fetch(`${supabaseUrl}/rest/v1/objetos`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(obj)
      });
      console.log(`[OK] Insertado: ${obj.nombre}`);
    }
  }

  console.log('✅ Sincronización completada exitosamente.');
}

// Ejecutar si se invoca directamente desde CLI
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].endsWith('seed_objetos.js')) {
  syncObjetos().catch(console.error);
}
