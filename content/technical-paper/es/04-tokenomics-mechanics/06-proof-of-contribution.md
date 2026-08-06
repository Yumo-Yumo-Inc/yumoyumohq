# Rail de Proof of Contribution

## 4.11 Qué financia este rail

El rail de Proof of Contribution (PoC) es la parte de la asignación de INT que recompensa el trabajo de ingeniería, diseño, gobernanza y activación del ecosistema. El Vision Paper establece la cuota de asignación. El equipo fundador, los empleados a tiempo completo, los contratistas y los colaboradores externos ganan a través de PoC, con la misma lógica ponderada por impacto.

PoC coloca las distribuciones al equipo y a los colaboradores externos bajo el mismo proceso publicado de evaluación y vesting. Este diseño no garantiza por sí mismo una distribución justa; la auditabilidad depende de publicar la rúbrica versionada, los registros de distribución y los contratos de vesting.

## 4.12 Cómo se puntúan las distribuciones

La emisión de PoC ocurre en distribuciones periódicas. Cada distribución puntúa las contribuciones recientes contra una rúbrica de impacto escrita y asigna el presupuesto de PoC del período proporcionalmente. La rúbrica se documenta por separado y se actualiza a medida que evoluciona la superficie del protocolo; las categorías actuales incluyen:

- Ingeniería de protocolo (desarrollo de contratos inteligentes, operación de canalización, infraestructura).
- Ingeniería de aplicación (móvil, web, superficies).
- Investigación y diseño económico.
- Seguridad, enlace de auditoría y tratamiento de riesgos operacionales.
- Activación del ecosistema (expansión de mercado, habilitación de socios, programas comunitarios).
- Trabajo de gobernanza a medida que se materializa.

El registro de distribución correspondiente especifica el cliff, la duración del vesting y la dirección del contrato para cada contribuidor. La versión de la rúbrica de evaluación se incluye en ese registro antes de que se realice la distribución.

## 4.13 Vesting

Toda emisión de PoC lleva vesting; ninguna distribución de PoC es inmediatamente líquida. Los parámetros de vesting dependen del rol del contribuidor y del alcance de la distribución:

| Alcance de distribución | Cliff | Horizonte de vesting lineal | Custodio |
|---|---|---|---|
| Ingeniería core a tiempo completo | Cliff estándar | Lineal plurianual | Contrato de vesting por destinatario |
| Contratista especialista (auditoría, seguridad, diseño) | Variable, delimitado por proyecto | Alineado al proyecto | Contrato de vesting por compromiso |
| Trabajo comunitario / de gobernanza | Corto o ninguno | Alineado a la distribución | Emisión directa o vesting corto |

Las duraciones exactas de cliff y vesting son política y se documentan en el registro publicado de cada distribución. Los contratos de vesting son on-chain e inspeccionables.

## 4.14 La capa contable de bINT

Cada contribución verificada se registra como un evento de libro mayor de solo anexado en la capa contable de bINT. La liquidación por época suma esos eventos directamente y convierte el total elegible a INT al ratio plano de 1:1 (4.24); el ciclo de vida estándar bINT → INT (4.4) se aplica. No hay un evento de migración, instantánea ni paso de conversión intermedio.
