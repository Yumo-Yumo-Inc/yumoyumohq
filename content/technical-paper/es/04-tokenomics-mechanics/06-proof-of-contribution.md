# Rail de Proof of Contribution

## 4.11 Qué financia este rail

El rail de Proof of Contribution (PoC) es la parte de la asignación de INT que recompensa el trabajo de ingeniería, diseño, gobernanza y activación del ecosistema. El Vision Paper establece la cuota de asignación. El equipo fundador, los empleados a tiempo completo, los contratistas y los colaboradores externos ganan a través de PoC, con la misma lógica ponderada por impacto.

Esta es una elección estructural deliberada. Separar los "team tokens" de los "contributor tokens" es el patrón convencional; otorga al equipo una asignación fija independientemente del impacto y crea una asimetría que deprime la confianza a largo plazo de los holders de tokens. El rail de PoC cierra esa asimetría dirigiendo toda la emisión no destinada a recompensas de usuarios a través del mismo mecanismo de ganancia por trabajo.

## 4.12 Cómo se puntúan las distribuciones

La emisión de PoC ocurre en distribuciones periódicas. Cada distribución puntúa las contribuciones recientes contra una rúbrica de impacto escrita y asigna el presupuesto de PoC del período proporcionalmente. La rúbrica se documenta por separado y se actualiza a medida que evoluciona la superficie del protocolo; las categorías actuales incluyen:

- Ingeniería de protocolo (desarrollo de contratos inteligentes, operación de canalización, infraestructura).
- Ingeniería de aplicación (móvil, web, superficies).
- Investigación y diseño económico.
- Seguridad, enlace de auditoría y tratamiento de riesgos operacionales.
- Activación del ecosistema (expansión de mercado, habilitación de socios, programas comunitarios).
- Trabajo de gobernanza a medida que se materializa.

Cada contribuidor recibe una distribución de INT con vesting adjunto. El calendario de vesting es política; los valores predeterminados actuales siguen formas estándar de la industria cliff-plus-linear para contribuciones de ingeniería y calendarios más cortos para trabajo delimitado por proyecto.

## 4.13 Vesting

Toda emisión de PoC lleva vesting; ninguna distribución de PoC es inmediatamente líquida. Los parámetros de vesting dependen del rol del contribuidor y del alcance de la distribución:

| Alcance de distribución | Cliff | Horizonte de vesting lineal | Custodio |
|---|---|---|---|
| Ingeniería core a tiempo completo | Cliff estándar | Lineal plurianual | Contrato de vesting por destinatario |
| Contratista especialista (auditoría, seguridad, diseño) | Variable, delimitado por proyecto | Alineado al proyecto | Contrato de vesting por compromiso |
| Trabajo comunitario / de gobernanza | Corto o ninguno | Alineado a la distribución | Emisión directa o vesting corto |

Las duraciones exactas de cliff y vesting son política y se documentan en el registro publicado de cada distribución. Los contratos de vesting son on-chain e inspeccionables.

## 4.14 Migración cPoints → bINT en el TGE

Antes del Token Generation Event, los créditos de contribución se acumulan como cPoints. En el TGE, los cPoints quedan obsoletos y se migran a bINT a un ratio de conversión publicado. La migración es un evento único con una fecha de instantánea. El ratio de conversión es parte del calendario de TGE publicado y se establece contra la distribución de contribución de la beta cerrada que existe en el momento de la instantánea.

Los holders de cPoints ven la migración en su billetera como un mint único de bINT; desde ese momento, aplica el ciclo de vida estándar bINT → INT (4.4).
