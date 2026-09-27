/** «HU_03 · Listar los roles» → { hu: 'HU_03', texto: 'Listar los roles' } */
export function partirDescripcion(descripcion: string) {
  const [hu, ...resto] = descripcion.split(' · ')
  if (resto.length && /^(Móvil )?HU_/.test(hu ?? '')) return { hu: hu!, texto: resto.join(' · ') }
  return { hu: '', texto: descripcion }
}
