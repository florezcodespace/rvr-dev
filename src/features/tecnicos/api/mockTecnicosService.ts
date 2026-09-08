import type { EstadoTecnico } from '@shared/domain/estados'
import { delay } from '@shared/lib/delay'
import type { TecnicosService } from './tecnicosService'
import type { ListadoTecnicos, ParamsTecnicos, TabTecnico, Tecnico } from '../types'

const TECNICOS: Tecnico[] = [
  {
    id: 1,
    nombre: 'Carlos Ramírez',
    especialidad: 'Redes y conectividad',
    estado: 'disponible',
    habilidades: ['Redes', 'CCTV', 'Fibra'],
    ordenesHoy: 3,
    cumplimientoSla: 98,
    zona: 'Envigado',
    telefono: '+57 310 555 12 03',
  },
  {
    id: 2,
    nombre: 'Ana Torres',
    especialidad: 'Soporte de hardware',
    estado: 'en_ruta',
    habilidades: ['Hardware', 'Impresoras'],
    ordenesHoy: 5,
    cumplimientoSla: 95,
    zona: 'Laureles',
    telefono: '+57 310 555 44 21',
  },
  {
    id: 3,
    nombre: 'Luis Morales',
    especialidad: 'Servidores y virtualización',
    estado: 'disponible',
    habilidades: ['Windows Server', 'VMware'],
    ordenesHoy: 2,
    cumplimientoSla: 99,
    zona: 'Itagüí',
    telefono: '+57 311 202 88 90',
  },
  {
    id: 4,
    nombre: 'María Gómez',
    especialidad: 'Mantenimiento preventivo',
    estado: 'en_sitio',
    habilidades: ['Preventivo', 'Limpieza'],
    ordenesHoy: 4,
    cumplimientoSla: 97,
    zona: 'Sabaneta',
    telefono: '+57 312 774 10 55',
  },
  {
    id: 5,
    nombre: 'Julián Vélez',
    especialidad: 'Seguridad electrónica',
    estado: 'disponible',
    habilidades: ['CCTV', 'Alarmas'],
    ordenesHoy: 1,
    cumplimientoSla: 96,
    zona: 'Bello',
    telefono: '+57 313 900 62 18',
  },
  {
    id: 6,
    nombre: 'Paola Restrepo',
    especialidad: 'Soporte remoto',
    estado: 'fuera_turno',
    habilidades: ['Helpdesk', 'Office 365'],
    ordenesHoy: 0,
    cumplimientoSla: 94,
    zona: 'Remoto',
    telefono: '+57 314 118 44 07',
  },
  {
    id: 7,
    nombre: 'Andrés Loaiza',
    especialidad: 'Cableado estructurado',
    estado: 'en_ruta',
    habilidades: ['Cableado', 'Certificación'],
    ordenesHoy: 3,
    cumplimientoSla: 93,
    zona: 'Rionegro',
    telefono: '+57 315 662 33 74',
  },
  {
    id: 8,
    nombre: 'Sofía Marín',
    especialidad: 'Diagnóstico de equipos',
    estado: 'disponible',
    habilidades: ['Diagnóstico', 'Portátiles'],
    ordenesHoy: 2,
    cumplimientoSla: 98,
    zona: 'Medellín',
    telefono: '+57 316 447 25 91',
  },
  {
    id: 9,
    nombre: 'Diego Naranjo',
    especialidad: 'Infraestructura eléctrica',
    estado: 'disponible',
    habilidades: ['UPS', 'Racks'],
    ordenesHoy: 0,
    cumplimientoSla: 92,
    zona: 'Medellín',
    telefono: '+57 317 335 90 12',
  },
  {
    id: 10,
    nombre: 'Valentina Ruiz',
    especialidad: 'Soporte en sitio',
    estado: 'disponible',
    habilidades: ['Hardware', 'Redes'],
    ordenesHoy: 2,
    cumplimientoSla: 97,
    zona: 'Envigado',
    telefono: '+57 318 220 71 46',
  },
  {
    id: 11,
    nombre: 'Jorge Mesa',
    especialidad: 'Telefonía IP',
    estado: 'fuera_turno',
    habilidades: ['VoIP', 'PBX'],
    ordenesHoy: 0,
    cumplimientoSla: 91,
    zona: 'Itagüí',
    telefono: '+57 319 806 55 30',
  },
]

const POR_TAB: Record<TabTecnico, (t: Tecnico) => boolean> = {
  todos: () => true,
  disponibles: (t) => t.estado === 'disponible',
  en_ruta: (t) => t.estado === 'en_ruta' || t.estado === 'en_sitio',
  fuera_turno: (t) => t.estado === 'fuera_turno',
}

export const mockTecnicosService: TecnicosService = {
  async listar({ tab, q }: ParamsTecnicos): Promise<ListadoTecnicos> {
    await delay(300)

    const texto = q.trim().toLowerCase()
    const items = TECNICOS.filter(
      (t) =>
        POR_TAB[tab](t) &&
        (!texto ||
          `${t.nombre} ${t.zona} ${t.especialidad} ${t.habilidades.join(' ')}`
            .toLowerCase()
            .includes(texto)),
    )

    const activos = TECNICOS.filter((t) => t.estado !== 'fuera_turno')
    const ordenesHoy = TECNICOS.reduce((s, t) => s + t.ordenesHoy, 0)

    return {
      items,
      resumen: {
        disponibles: TECNICOS.filter((t) => t.estado === 'disponible').length,
        activos: TECNICOS.length,
        enRuta: TECNICOS.filter((t) => t.estado === 'en_ruta' || t.estado === 'en_sitio')
          .length,
        ordenesHoy,
        promedioPorTecnico: Math.round((ordenesHoy / Math.max(activos.length, 1)) * 10) / 10,
        cumplimientoSla: Math.round(
          TECNICOS.reduce((s, t) => s + t.cumplimientoSla, 0) / TECNICOS.length,
        ),
      },
      conteos: {
        todos: TECNICOS.length,
        disponibles: TECNICOS.filter(POR_TAB.disponibles).length,
        en_ruta: TECNICOS.filter(POR_TAB.en_ruta).length,
        fuera_turno: TECNICOS.filter(POR_TAB.fuera_turno).length,
      },
    }
  },

  async cambiarEstado(id: number, estado: EstadoTecnico): Promise<void> {
    await delay(180)
    const tecnico = TECNICOS.find((t) => t.id === id)
    if (tecnico) tecnico.estado = estado
  },
}
