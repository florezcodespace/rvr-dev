import { useCallback } from 'react'
import {
  ESTADO_USUARIO_META,
  ROLES_USUARIO,
  ROL_USUARIO_META,
  TRANSICIONES_USUARIO,
  type RolUsuario,
} from '@shared/domain/estados'
import { IconMas, IconUsuarios } from '@shared/components/icons'
import { DataTable, Pager, SelectorEstado } from '@shared/components/data'
import type { Columna } from '@shared/components/data'
import {
  Alert,
  Avatar,
  Button,
  Card,
  PageHeader,
  SearchInput,
  StatCard,
  StatGrid,
  Tabs,
} from '@shared/components/ui'
import { useCambioEstado } from '@shared/hooks/useCambioEstado'
import { useListaParams } from '@shared/hooks/useListaParams'
import { useRecurso } from '@shared/hooks/useRecurso'
import { PENDIENTE_BACKEND } from '@shared/lib/pendiente'
import { textoPagina } from '@shared/lib/paginar'
import { usuariosService } from '../api'
import { TABS_USUARIO, type TabUsuario, type UsuarioPortal } from '../types'

const ETIQUETAS: Record<TabUsuario, string> = {
  todos: 'Todos',
  administradores: 'Administradores',
  coordinacion: 'Coordinación',
  tecnicos: 'Técnicos',
  inactivos: 'Inactivos',
}

const ACCESO = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const cargar = usuariosService.listar.bind(usuariosService)

export default function UsuariosPage() {
  const { tab, q, params, setTab, setQ, setPagina } = useListaParams<TabUsuario>(
    'todos',
    TABS_USUARIO,
  )
  const { datos, cargando, error } = useRecurso(cargar, params)

  const guardarEstado = useCallback(
    (id: number, estado: Parameters<typeof usuariosService.cambiarEstado>[1]) =>
      usuariosService.cambiarEstado(id, estado),
    [],
  )
  const guardarRol = useCallback(
    (id: number, rol: RolUsuario) => usuariosService.cambiarRol(id, rol),
    [],
  )

  const { estadoDe, cambiar } = useCambioEstado(guardarEstado, ESTADO_USUARIO_META)
  const { estadoDe: rolDe, cambiar: cambiarRol } = useCambioEstado(
    guardarRol,
    ROL_USUARIO_META,
  )

  if (error) {
    return (
      <div className="p-7">
        <Alert tone="danger" title={error} description="Inténtalo de nuevo en un momento." />
      </div>
    )
  }

  const resumen = datos?.resumen
  const lista = datos?.pagina

  const columnas: Columna<UsuarioPortal>[] = [
    {
      clave: 'usuario',
      titulo: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar nombre={u.nombre} tamano="sm" />
          <div className="min-w-0">
            <div className="truncate font-semibold text-fg">{u.nombre}</div>
            <div className="truncate text-[11px] text-fg-subtle">{u.correo}</div>
          </div>
        </div>
      ),
    },
    {
      clave: 'rol',
      titulo: 'Rol',
      ancho: '168px',
      render: (u) => {
        const actual = rolDe(u.id, u.rol)
        return (
          <SelectorEstado
            valor={actual}
            meta={ROL_USUARIO_META}
            transiciones={ROLES_USUARIO.filter((rol) => rol !== actual)}
            registro={u.nombre}
            onCambiar={(destino) => cambiarRol(u.id, destino, actual, u.nombre)}
          />
        )
      },
    },
    {
      clave: 'acceso',
      titulo: 'Acceso',
      ancho: '210px',
      render: (u) => ROL_USUARIO_META[rolDe(u.id, u.rol)].acceso,
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      ancho: '206px',
      render: (u) => {
        const actual = estadoDe(u.id, u.estado)
        return (
          <SelectorEstado
            valor={actual}
            meta={ESTADO_USUARIO_META}
            transiciones={TRANSICIONES_USUARIO[actual]}
            registro={u.nombre}
            onCambiar={(destino) => cambiar(u.id, destino, actual, u.nombre)}
          />
        )
      },
    },
    {
      clave: 'ultimo',
      titulo: 'Último ingreso',
      ancho: '152px',
      render: (u) =>
        u.ultimoAcceso ? (
          ACCESO.format(new Date(u.ultimoAcceso)).replace(',', ' ·')
        ) : (
          <span className="text-fg-faint italic">Sin ingresar</span>
        ),
    },
  ]

  return (
    <div className="flex h-full flex-col gap-4 px-7 py-6">
      <PageHeader
        titulo="Usuarios"
        descripcion={
          resumen
            ? `${resumen.total} cuentas con acceso al portal · ${resumen.invitaciones} invitación sin aceptar`
            : 'Cargando…'
        }
        acciones={
          <>
            <Button
              variant="secondary"
              disabled
              title={PENDIENTE_BACKEND}
              leadingIcon={<IconUsuarios />}
            >
              Ver roles
            </Button>
            <Button disabled title={PENDIENTE_BACKEND} leadingIcon={<IconMas />}>
              Invitar usuario
            </Button>
          </>
        }
      />

      {resumen && (
        <StatGrid>
          <StatCard
            etiqueta="Usuarios activos"
            valor={String(resumen.activos)}
            valorSecundario={` / ${resumen.total}`}
            detalle="Cuentas creadas en el portal"
            glifo="✓"
            tono="primary"
          />
          <StatCard
            etiqueta="Administradores"
            valor={String(resumen.administradores)}
            detalle="Con acceso total al sistema"
            glifo="★"
            tono="info"
          />
          <StatCard
            etiqueta="Invitaciones pendientes"
            valor={String(resumen.invitaciones)}
            detalle="Enviada hace 3 días"
            detalleDestacado
            glifo="✉"
            tono="warning"
          />
          <StatCard
            etiqueta="Sin ingresar hace 30 días"
            valor={String(resumen.sinIngresar30)}
            detalle="Revisar si siguen activos"
            glifo="!"
            tono="danger"
          />
        </StatGrid>
      )}

      <Card className="min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border-base px-4 py-3">
          <Tabs
            etiqueta="Filtrar usuarios por rol"
            valor={tab}
            onChange={setTab}
            opciones={TABS_USUARIO.map((valor) => ({
              valor,
              label: ETIQUETAS[valor],
              conteo: datos?.conteos[valor],
            }))}
          />
          <SearchInput
            valor={q}
            onChange={setQ}
            placeholder="Buscar por nombre o correo"
            className="ml-auto w-full max-w-[260px]"
          />
        </div>

        <DataTable
          columnas={columnas}
          filas={lista?.items ?? []}
          claveFila={(u) => u.id}
          cargando={cargando}
          vacio={{
            titulo: 'Ningún usuario coincide',
            descripcion: 'Cambia de pestaña o ajusta la búsqueda.',
          }}
        />

        {lista && (
          <Pager
            pagina={lista.pagina}
            totalPaginas={lista.totalPaginas}
            info={textoPagina(lista, 'usuarios')}
            onPagina={setPagina}
          />
        )}
      </Card>
    </div>
  )
}
