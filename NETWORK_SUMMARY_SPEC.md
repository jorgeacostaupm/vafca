# Especificación editable: resumen de redes

Este fichero define qué debe incluir el resumen de teoría de redes en VAFCA.
Antes de implementar, editar este documento para quitar métricas no deseadas,
cambiar prioridades o añadir criterios de cálculo.

La implementación debe tomar este fichero como referencia funcional.

## Objetivo

Crear un resumen analítico de cada red de conectividad funcional, adaptado al
modelo de la aplicación:

- matrices ROI x ROI originales
- matrices reducidas o agregadas por grupos de ROIs
- redes completas, sin filtro aplicado
- redes filtradas, usando la máscara activa de filtros, en una fase posterior
- atlas, ROIs y tags disponibles para agrupar resultados

El resumen no sustituye al resumen de dataset existente. Debe ser un resumen
de una red concreta o de una vista concreta.

## Alcance inicial recomendado

- [x] Calcular sobre una matriz completa.
- [x] Ignorar valores `null`, `NaN` o infinitos.
- [x] Permitir configurar si se incluye la diagonal.
- [x] Ignorar diagonal por defecto.
- [x] Permitir configurar si los valores cero cuentan como enlaces.
- [x] Contar valores cero como enlaces por defecto.
- [x] Soportar matrices simétricas como redes no dirigidas.
- [x] Preparar los tipos para aceptar una máscara de filtro después.
- [ ] Calcular directamente sobre redes filtradas en la primera versión.
- [ ] Calcular métricas avanzadas costosas en la primera versión.
- [ ] Exportar el resumen a CSV/JSON en la primera versión.

## Identidad de la red

Mostrar metadatos básicos para que el usuario sepa exactamente qué está
resumiendo.

- [x] ID de matriz.
- [x] Etiqueta de matriz.
- [x] Tipo de matriz: `population`, `subject`, `comparison` o `aggregated`.
- [x] Medida.
- [x] Estadístico.
- [x] Capa.
- [x] Población o poblaciones.
- [x] Tamaño de matriz.
- [x] Número de nodos.
- [x] Si la red es simétrica.
- [x] Si la red se trata como dirigida o no dirigida.
- [x] Si la red es ROI x ROI o agregada por grupos.
- [x] Alcance: `complete network` o `filtered network`.

## Cobertura y densidad

Resumen estructural básico.

- [x] Número de nodos.
- [x] Número de enlaces posibles.
- [x] Número de enlaces evaluados.
- [x] Número de enlaces válidos usados.
- [x] Número de enlaces descartados por valor no finito.
- [x] Número de enlaces con valor cero.
- [x] Densidad.
- [x] Sparsity.
- [x] Porcentaje de enlaces positivos.
- [x] Porcentaje de enlaces negativos.
- [x] Porcentaje de enlaces cero.
- [ ] Número de enlaces conservados por filtro.
- [ ] Porcentaje de enlaces conservados por filtro.
- [ ] Número de nodos que quedan aislados tras filtrar.

## Distribución de pesos

Resumen de valores de conectividad.

- [x] Valor mínimo.
- [x] Valor máximo.
- [x] Media.
- [x] Mediana.
- [x] Desviación estándar.
- [x] Media absoluta.
- [x] Suma total de pesos.
- [x] Suma de pesos absolutos.
- [x] Suma de pesos positivos.
- [x] Suma de pesos negativos.
- [x] Percentil 5.
- [x] Percentil 25.
- [x] Percentil 50.
- [x] Percentil 75.
- [x] Percentil 95.
- [ ] Histograma de pesos.
- [ ] Separar métricas de distribución por pesos positivos y negativos.

## Métricas globales de teoría de redes

Métricas de red completa.

- [x] Grado medio.
- [x] Grado máximo.
- [x] Número de componentes conectados.
- [x] Tamaño del componente gigante.
- [x] Proporción de nodos en el componente gigante.
- [x] Número de nodos aislados.
- [x] Clustering medio.
- [x] Transitivity.
- [x] Global efficiency.
- [x] Longitud media de camino.
- [x] Diámetro.
- [ ] Modularidad.
- [ ] Assortativity por grupo del atlas.

Notas:

- Las métricas de camino se calcularán como métricas no ponderadas sobre la
  topología efectiva del grafo. Un enlace existe si su valor es válido y cumple
  la configuración de ceros/diagonal/filtro.

## Métricas por ROI o nodo

Tabla o bloque de ranking interno del resumen.

- [x] Top ROIs por grado.
- [x] ROIs aisladas.
- [x] Grado por ROI.
- [ ] Betweenness centrality.
- [ ] Closeness centrality.
- [ ] Eigenvector centrality.
- [ ] Clustering local.
- [ ] Participation coefficient.
- [ ] Within-module degree z-score.

Para redes dirigidas, si se decide soportarlas explícitamente:

- [ ] In-degree.
- [ ] Out-degree.

## Enlaces destacados

Ayuda a interpretar la red sin abrir otra herramienta.

- [x] Top enlaces por valor absoluto.
- [x] Top enlaces positivos.
- [x] Top enlaces negativos.
- [x] ROI origen.
- [x] ROI destino.
- [x] Valor.
- [x] Grupo o tags relevantes de cada ROI si existen.
- [ ] Mostrar si el enlace pasa el filtro activo.

## Resumen por grupos del atlas

Usar tags de ROI cuando estén disponibles. Campos candidatos:

- `network`
- `region`
- `hemisphere`
- cualquier campo configurado por el usuario en la app

Métricas candidatas:

- [x] Número de ROIs por grupo.
- [x] Densidad intra-grupo.
- [x] Densidad inter-grupo.
- [x] Grupo con mayor número de enlaces.
- [ ] Matriz grupo x grupo del resumen.
- [ ] Comparar grupos antes/después de filtros.

## Comparación entre red completa y red filtrada

Esto queda preparado para una fase posterior.

- [ ] Enlaces conservados.
- [ ] Porcentaje de red conservada.
- [ ] Cambio de densidad.
- [ ] Cambio de grado medio.
- [ ] ROIs que quedan aisladas tras el filtro.
- [ ] Top enlaces perdidos.
- [ ] Top enlaces conservados.

## Configuración del cálculo

Constantes numéricas y defaults deben vivir en `src/config/ui.ts`.

Opciones candidatas:

- [x] Número de elementos en rankings internos del resumen.
- [x] Incluir o excluir diagonal.
- [x] Incluir o excluir valores cero como enlaces.
- [x] Tratar matriz simétrica como no dirigida.
- [ ] Umbral mínimo absoluto para considerar un enlace.
- [x] Campo de agrupación del atlas para resumen por grupos.

La agrupación por atlas usa este orden:

1. grouping activo en la configuración de network views
2. primer campo escalar disponible en `roi.tags`
3. si no existe ningún campo usable, mostrar que no se puede calcular el
   resumen por grupos

## Ubicación propuesta en la interfaz

Opciones:

- [x] Añadir una pestaña principal `Summaries` junto a `Atlas` y
  `Selected Links`.
- [ ] Crear paneles de resumen dentro del workspace como los rankings.
- [ ] Añadir el resumen dentro de cada panel de visualización.

Preferencia inicial:

Usar pestaña principal `Summaries` para seleccionar una matriz y mostrar el
resumen. Más adelante se puede convertir en panel añadible al workspace si
interesa comparar varios resúmenes.

## Pestaña `Summaries`

La primera implementación se hará como una pestaña principal de la aplicación,
al mismo nivel que `Atlas` y `Selected Links`.

La pestaña debe incluir:

- [x] Selector de matriz propio para el resumen.
- [x] Botón de settings para elegir qué campos aparecen en el resumen.
- [x] Estado vacío cuando no haya matriz seleccionada.
- [x] Estado de carga mientras se calcula el resumen.
- [x] Estado de error si el cálculo falla.
- [x] Resumen de una sola matriz seleccionada.
- [ ] Comparar varios resúmenes en paralelo.
- [ ] Convertir el resumen en panel del workspace.

El selector de matriz del resumen debe parecerse al selector usado en
`Networks`:

- [x] Soportar modo `Single`, con un selector completo de matriz.
- [x] Soportar modo `Fields`, con selectores por población, medida,
  estadístico y capa.
- [x] Reutilizar las opciones de matrices, etiquetas y filtros de catálogo que
  ya usa el selector de redes cuando sea posible.
- [x] Respetar el modo de selector configurado para las vistas de red.
- [x] Mantener selección independiente para el resumen, sin crear ni modificar
  vistas.
- [x] Al seleccionar una matriz en modo `Single`, sincronizar internamente los
  campos derivados: población, medida, estadístico y capa.
- [x] En modo `Fields`, resolver la matriz cuando los campos seleccionados
  identifiquen una única matriz.
- [ ] Si los campos seleccionados coinciden con varias matrices, mostrar una
  selección explícita de matriz final.

Notas:

- El resumen no debe usar el botón `Add view`.
- El selector del resumen puede compartir hooks/utilidades con el selector de
  redes, pero debe tener su propio estado Redux para evitar efectos laterales
  sobre las vistas existentes.
- Si se reutiliza lógica del selector actual, evitar prop drilling y mantener
  componentes pequeños.

## Settings del resumen

La pestaña `Summaries` tendrá un botón de settings. Ese modal o popover permite
decidir qué secciones y campos se muestran.

Cada campo configurable debe tener dos checks independientes:

- `Show in Summary tab`: controla si el campo aparece en la pestaña `Summaries`.
- `Show in View summaries`: prepara si el campo aparecerá en resúmenes compactos
  dentro de las vistas de red en una fase posterior.

La primera implementación solo debe renderizar los campos marcados para
`Show in Summary tab`. La segunda columna de checks debe guardarse ya en estado
para que la futura integración con resúmenes dentro de vistas no requiera
cambiar el modelo.

Ejemplo conceptual:

| Campo | Summary tab | View summaries |
| --- | --- | --- |
| Densidad | checked | checked |
| Media absoluta | checked | unchecked |
| Top ROIs por grado | checked | unchecked |

Las opciones de visibilidad deben cubrir, como mínimo:

- [x] Bloque de identidad de la red.
- [x] Bloque de cobertura y densidad.
- [x] Bloque de distribución de pesos.
- [x] Bloque de métricas globales.
- [x] Tabla de ROIs o nodos.
- [x] Tabla de enlaces destacados.
- [x] Tabla por grupos del atlas.

Los campos concretos dentro de cada bloque deben poder desactivarse. No todos
los campos calculados tienen que aparecer en el resumen.

Defaults recomendados:

- Mostrar en `Summary tab` todos los campos marcados como incluidos en este
  documento para la primera fase.
- Mostrar en `View summaries` solo campos compactos: nodos, enlaces usados,
  densidad, grado medio y componentes.
- Guardar los defaults numéricos y opciones iniciales en `src/config/ui.ts`.

## Arquitectura propuesta

Mantener el cálculo fuera de los componentes React.

Tipos:

- `src/types/networkMeasures.ts`

Lógica pura:

- `src/utils/networkMeasures/graphBuilder.ts`
- `src/utils/networkMeasures/statistics.ts`
- `src/utils/networkMeasures/globalMeasures.ts`
- `src/utils/networkMeasures/groupMeasures.ts`
- `src/utils/networkMeasures/networkSummary.ts`

Nota: las métricas nodales básicas quedan integradas en `globalMeasures.ts` y
`networkSummary.ts` mientras no crezcan lo suficiente como para justificar un
archivo propio.

Estado Redux:

- `src/store/slices/networkMeasures/networkMeasuresTypes.ts`
- `src/store/slices/networkMeasures/networkMeasuresSlice.ts`
- `src/store/slices/networkMeasures/networkMeasuresSelectors.ts`
- `src/store/slices/networkMeasures/thunks/computeNetworkSummary.ts`

UI:

- `src/components/network-summary/NetworkSummaryTab.tsx`
- `src/components/network-summary/NetworkSummaryControls.tsx`
- `src/components/network-summary/NetworkSummarySettingsModal.tsx`
- `src/components/network-summary/NetworkSummaryOverview.tsx`
- `src/components/network-summary/NetworkSummaryMetricGrid.tsx`
- `src/components/network-summary/NetworkSummaryNodeTable.tsx`
- `src/components/network-summary/NetworkSummaryLinkTable.tsx`
- `src/components/network-summary/NetworkSummaryGroupTable.tsx`

Estilos:

- usar clases con prefijo `network-summary-`
- CSS en la capa correspondiente de `styles/features`
- no hardcodear colores en componentes
- constantes de tamaño, límites y defaults en `src/config/ui.ts`

## Decisiones pendientes

- [x] Confirmar que `Summaries` será una pestaña principal en la primera
  implementación.
- [x] Confirmar que el resumen tendrá selector de matriz propio.
- [x] Confirmar que el resumen tendrá settings de visibilidad de campos.
- [x] Confirmar que cada campo configurable tendrá checks separados para
  `Summary tab` y `View summaries`.
- [x] Confirmar que la diagonal será configurable e ignorada por defecto.
- [x] Confirmar que valores cero serán configurables e incluidos por defecto.
- [x] Confirmar que las métricas de fuerza no se implementan de momento.
- [x] Confirmar que se deben implementar métricas de camino en esta fase.
- [x] Confirmar que el grouping activo se usa como agrupación por defecto y que,
  si no existe, se usa el primer campo escalar de tags.
- [x] Confirmar que el estado de settings debe persistirse solo en Redux durante
  la sesión o también en almacenamiento local.
- [x] Confirmar que población/medida/stat/layer identifican una matriz única.

## Criterios de implementación

- Mantener tipos explícitos para inputs, resultados globales, nodales, enlaces
  y grupos.
- No mezclar cálculo de teoría de redes con componentes React.
- Usar `createAsyncThunk` para el cálculo.
- Mostrar estado de carga si el cálculo tarda.
- Mantener funciones pequeñas y testeables.
- Evitar prop drilling: los componentes leen su estado desde Redux.
- Preparar la API interna para filtros aunque la primera versión calcule solo
  redes completas.
- No implementar métricas marcadas como no deseadas o desmarcadas si este
  documento se edita antes de empezar.
- La pestaña `Summaries` debe usar estado propio y no debe modificar la selección
  usada para añadir vistas de red.
- La configuración de campos visibles debe modelarse por campo, no solo por
  bloque, y debe distinguir entre visibilidad en la pestaña y visibilidad futura
  en resúmenes dentro de vistas.
