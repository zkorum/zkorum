---
title: "Por qué las pruebas de conocimiento cero por sí solas no bastan para proteger la privacidad"
description: "Las pruebas de conocimiento cero pueden proteger la prueba de la credencial, pero las plataformas cívicas necesitan privacidad en la identidad, los metadatos, las carteras digitales, los dispositivos y la infraestructura de código abierto."
author: "Nicolas Gimenez"
date: "2024-09-01"
type: "tech"
thumbnail: "https://lh7-us.googleusercontent.com/docs/AHkbwyK44xfmb0zN95CAfiTWJ5ULJ_-8DpfWRTy8r23dsV6kahSE4C4X-cZ8W4Ed-n2MT0jfWuolbqR77m1-rt_yXV4xcoojPDahscs3bQ=w1200-h630-p"
image: "https://lh7-us.googleusercontent.com/docs/AHkbwyK44xfmb0zN95CAfiTWJ5ULJ_-8DpfWRTy8r23dsV6kahSE4C4X-cZ8W4Ed-n2MT0jfWuolbqR77m1-rt_yXV4xcoojPDahscs3bQ=w1200-h630-p"
---

Las [pruebas de conocimiento cero](https://en.wikipedia.org/wiki/Zero-knowledge_proof) suelen presentarse como una respuesta completa a la privacidad. En tecnología cívica, la promesa es especialmente atractiva: una persona puede demostrar que es elegible para participar, que es única, que supera cierta edad o que reside en una jurisdicción sin revelar todo el contenido de un documento de identidad.

Esa promesa es real. También es más limitada de lo que a veces parece.

Una prueba de conocimiento cero protege una prueba. No protege automáticamente la dirección IP de la persona, la huella del navegador, el número de teléfono, la dirección de correo, la implementación de la cartera digital, el dispositivo, el sistema operativo ni las muchas marcas de tiempo y señales de comportamiento que se crean alrededor de la prueba. Si esas capas no se diseñan con cuidado, un verificador todavía puede aprender quién es la persona usuaria.

Este artículo adapta una [presentación](https://docs.google.com/presentation/d/e/2PACX-1vRKRJW4-ZUHso3o-KzzwemuezH7ifLENCpvJCr9552PlRHzOtyxetsLM-4ghHDwCA/pub?start=false&loop=false&delayms=3000) dada a [NGI TrustChain](https://trustchain.ngi.eu/) en septiembre de 2024. La tesis central es sencilla: las pruebas de conocimiento cero son una pieza importante para la participación cívica respetuosa con la privacidad, pero la privacidad de una persona es una propiedad de toda la pila.

## Por qué la identidad entra en las plataformas cívicas

No todos los espacios en línea necesitan verificación de identidad. Existen buenos casos de uso para comunidades puramente seudónimas, donde las personas participan mediante nombres persistentes y reputación en lugar de credenciales formales.

Las plataformas de participación cívica enfrentan otro problema. Si el objetivo es recoger aportes públicos significativos, resistir el spam, reducir la propaganda computacional o apoyar procesos de «una persona, una voz», el sistema necesita alguna forma de resistencia a ataques Sybil. En la práctica, puede necesitar saber que una persona participante es real, pertenece a una comunidad relevante o cumple una regla de elegibilidad cívica.

Hay varias formas de lograr resistencia a ataques Sybil, pero todas tienen costes:

- Los sistemas biométricos pueden aportar unicidad, pero crean graves riesgos de privacidad y seguridad.
- Los sistemas de grafo social pueden ayudar en algunos contextos, pero siguen siendo difíciles de escalar y a menudo tienen garantías de privacidad débiles.
- Los enfoques híbridos de red de confianza pueden funcionar para ciertas comunidades, pero suelen ofrecer una unicidad más débil.
- Las credenciales institucionales o gubernamentales pueden dar garantías fuertes, pero no deben convertirse en una capa de vigilancia.

Aquí es donde la identidad autosoberana y las pruebas de conocimiento cero resultan atractivas. Sugieren una manera de verificar elegibilidad sin pedir a las personas que expongan más datos personales de los necesarios.

## Lo que las pruebas de conocimiento cero hacen bien

En un flujo simplificado de credenciales intervienen tres partes:

- El emisor confirma algo sobre una persona y emite una credencial.
- El titular guarda esa credencial y decide cuándo usarla.
- El verificador comprueba una prueba derivada de la credencial.

Las técnicas de conocimiento cero pueden permitir que el titular demuestre una afirmación específica sin revelar la credencial subyacente. Por ejemplo, una persona puede demostrar que tiene más de 18 años sin revelar su fecha de nacimiento, o demostrar que recibió una credencial de un emisor confiable sin revelar todo su contenido.

Varios enfoques técnicos pueden sostener este patrón. Las credenciales BBS+ permiten divulgación selectiva y pruebas no vinculables. Otros enfoques usan credenciales estructuradas en árboles de Merkle y ZK-SNARKs para hacer más privados formatos de credenciales que normalmente son vinculables. Las zkVM de propósito general podrían facilitar en el futuro pruebas sobre credenciales ya existentes orientadas a la seguridad.

Estas herramientas son valiosas porque pueden impedir la vinculación por parte del emisor a nivel de prueba. Es decir, el emisor no debería saber dónde se usa la credencial, y distintos usos de la misma credencial no deberían poder vincularse trivialmente a través de la propia prueba.

Eso resuelve un problema importante. No resuelve todos los problemas de privacidad.

## El modelo de amenazas: primero el titular

Para la participación cívica, el modelo de privacidad debe empezar desde la perspectiva del titular. La persona que usa la credencial debe mantener el control sobre qué revela y a quién.

Esto exige un modelo de amenazas más estricto que el de la mayoría de plataformas sociales actuales:

- No se debe confiar ciegamente en el verificador, es decir, la plataforma que solicita la prueba. Puede intentar desanonimizar a la persona a menos que el sistema lo haga difícil y auditable.
- Se confía en el emisor para identificar al titular y emitir una credencial válida, pero no para saber dónde, cuándo o por qué se usa después esa credencial.
- El emisor y el verificador no deben poder coludirse para identificar personas a través de presentaciones de pruebas.
- El código cliente propietario, el código de la cartera y las interfaces del verificador deben tratarse como superficies de riesgo salvo que sean de código abierto, inspeccionables e idealmente auditadas.

Esto es muy distinto del modelo dominante de redes sociales, donde se suele confiar en que las plataformas gestionen los datos de forma responsable. La historia de las plataformas en línea da muchas razones para desconfiar de esa premisa.

## El resto del iceberg de privacidad

El error más fácil es tratar la prueba de conocimiento cero como si fuera todo el sistema de privacidad. En realidad, la prueba es solo una capa.

### Divulgación excesiva

Aunque una prueba se genere en conocimiento cero, el verificador puede pedir atributos demasiado precisos, numerosos o raros. Una persona puede no revelar su documento completo, pero una combinación de atributos puede identificarla.

Por ejemplo, probar una edad exacta, ciudad, profesión y estado de membresía puede bastar para señalar a una persona en una comunidad pequeña. Los sistemas que preservan la privacidad deben preferir criterios poco precisos y la mínima divulgación necesaria.

### Metadatos de red

Un verificador puede intentar vincular una prueba con la persona mediante direcciones IP, huellas de navegador, metadatos de dispositivo o tiempos de solicitud. Si la prueba se envía desde la misma sesión de navegador que un inicio de sesión identificante o una verificación de correo, la privacidad matemática de la prueba puede dejar de importar.

El conocimiento cero no oculta por defecto la capa de red. También importan la privacidad del transporte, los proxies, las políticas de registro y la separación cuidadosa de sesiones.

### Cookies y corredores de datos

Las cookies de terceros, scripts de analítica, identificadores publicitarios y datos comprados pueden debilitar la privacidad de una prueba. Si un verificador incrusta seguimiento alrededor del flujo de prueba, podría correlacionar una prueba anónima con una identidad web conocida.

Para una plataforma cívica, el flujo de prueba debe evitar por completo los rastreadores de terceros. La privacidad no puede depender de un protocolo criptográfico mientras la página filtra la identidad a través de infraestructura web ordinaria.

### Correo, teléfono y recuperación de cuenta

El correo electrónico y el teléfono son prácticos, pero también son identificadores fuertes. Si el verificador los asocia con una prueba de conocimiento cero, la prueba puede volverse parte de un perfil de identidad más amplio.

Esto no significa que una plataforma cívica nunca pueda usar correo o teléfono. Significa que esos identificadores deben aislarse de los eventos de prueba siempre que sea posible, usarse solo cuando sea necesario y regirse por políticas claras de retención.

### Identificadores permanentes

Una prueba de conocimiento cero aún puede vincularse si el mismo identificador permanente aparece alrededor de ella. Direcciones de cartera, DIDs, identificadores del titular de una credencial, identificadores de dispositivo o de cuenta estables pueden convertirse en puntos de correlación.

Los sistemas que necesitan seudonimato deben usar identificadores por contexto o por relación en lugar de identificadores universales. La persona no debería llevar por defecto la misma huella entre espacios cívicos no relacionados.

### Correlación temporal

Aunque se oculten los identificadores, el tiempo puede revelar relaciones. Un verificador puede correlacionar el momento en que se genera una prueba con otra solicitud, como un inicio de sesión, un clic en una notificación o una carga de página.

Los diseñadores deben tratar las marcas de tiempo como sensibles. El procesamiento por lotes, el envío diferido, la minimización de registros y la separación entre autenticación y presentación de prueba reducen el riesgo de correlación.

### Carteras, dispositivos y cadena de suministro

La prueba puede ser criptográficamente correcta, pero la cartera o el cliente aún pueden filtrar datos sensibles. Una cartera propietaria puede enviar telemetría. Un SDK comprometido puede revelar atributos. Una interfaz maliciosa puede pedir más de lo que la persona entiende.

El código abierto no elimina mágicamente estos riesgos, pero el código cerrado los vuelve mucho más difíciles de inspeccionar. Para sistemas cívicos de alta confianza, los clientes de código abierto, compilaciones reproducibles, auditorías independientes y telemetría mínima deben tratarse como infraestructura básica.

### Inferencia conductual

El aprendizaje automático puede inferir identidad a partir de patrones que parecen inofensivos por separado. Estilo de escritura, horarios de actividad, comportamiento del dispositivo, patrones de ubicación e historial de interacciones pueden reducir el conjunto de anonimato.

Por eso la privacidad no puede reducirse a la prueba. La participación anónima también requiere decisiones de producto, moderación y retención que eviten construir expedientes conductuales innecesarios.

## Una mejor arquitectura para pruebas creíblemente anónimas

Un flujo de credenciales que preserve la privacidad debe diseñarse bajo la suposición de que el verificador quiere aprender más de lo que debería.

Como mínimo, una plataforma cívica que use pruebas de conocimiento cero debería considerar estos principios:

- Pedir la prueba menos precisa que satisfaga el requisito cívico.
- Evitar combinar presentación de prueba con flujos de cuenta identificantes.
- No asociar teléfonos, correos, direcciones de cartera o DIDs permanentes a eventos de prueba salvo que el caso de uso lo requiera de verdad.
- Mantener cookies de terceros, analítica y rastreadores fuera del flujo de prueba.
- Minimizar registros, especialmente direcciones IP, marcas de tiempo y metadatos de solicitudes.
- Usar seudónimos específicos por contexto cuando se necesite participación persistente.
- Hacer de código abierto y auditables la interfaz del verificador, la lógica de solicitud de pruebas, las integraciones de carteras y los SDK.
- Hacer que las solicitudes de prueba sean comprensibles para las personas, de modo que vean qué se está probando y qué no se está revelando.
- Evitar llamadas al emisor u otros mecanismos que le permitan saber dónde se usan las credenciales.

El objetivo no son solo pruebas anónimas. El objetivo es anonimato creíble: un sistema donde usuarios, auditores y sociedad civil puedan inspeccionar si las promesas de privacidad de la plataforma coinciden con su comportamiento real.

## Desafíos abiertos

Todavía queda trabajo difícil.

Primero, la experiencia de usuario no es suficientemente buena. La mayoría de las personas no puede razonar sobre esquemas de credenciales, divulgación selectiva, solicitudes de prueba, imposibilidad de vinculación por parte del emisor o ataques de correlación. Un producto seguro debe explicar sus propiedades de privacidad sin exigir que los usuarios se vuelvan criptógrafos.

Segundo, el ecosistema de credenciales está fragmentado. BBS+, SD-JWT, licencias de conducir móviles, chips de pasaporte, credenciales estructuradas en árboles de Merkle y pruebas basadas en zkVM hacen distintos compromisos. Las plataformas cívicas necesitan interoperabilidad sin caer en el mínimo común denominador de privacidad.

Tercero, la resistencia a ataques Sybil y la privacidad siguen en tensión. Una unicidad más fuerte suele exigir evidencia de identidad más fuerte. El reto es verificar solo lo necesario y evitar que esa verificación se convierta en un grafo de identidad general.

Cuarto, la prevención de abusos no debe recrear vigilancia. Los espacios anónimos o seudónimos todavía necesitan moderación, límites de frecuencia y mecanismos de responsabilidad. Esos mecanismos deben diseñarse para no reidentificar silenciosamente a todo el mundo.

Finalmente, el código abierto es necesario pero no suficiente. El código publicado ayuda, pero las personas también necesitan compilaciones reproducibles, auditorías independientes, gobernanza clara y garantías de despliegue de que el código inspeccionado es el código que se usa.

## Conclusión

Las pruebas de conocimiento cero son poderosas. Permiten demostrar hechos sin revelar los datos subyacentes y pueden impedir que los emisores rastreen dónde se usan las credenciales.

Pero las pruebas no son todo el sistema de privacidad. Un verificador todavía puede atacar las capas circundantes: atributos, metadatos, cookies, correo, teléfono, identificadores permanentes, tiempos, carteras, dispositivos y patrones de comportamiento.

Para la tecnología cívica, esta distinción importa. Si la identidad digital se vuelve parte de la participación pública, no debe convertirse en otra forma de observar a la ciudadanía. Las pruebas de conocimiento cero pueden ser parte de la respuesta, pero solo dentro de una arquitectura más amplia basada en minimización de datos, imposibilidad de vinculación, auditabilidad del código abierto y control por parte de la persona usuaria.

La lección práctica es clara: usa conocimiento cero, pero no te detengas ahí.

## Lecturas adicionales

- [Presentación original](https://docs.google.com/presentation/d/e/2PACX-1vRKRJW4-ZUHso3o-KzzwemuezH7ifLENCpvJCr9552PlRHzOtyxetsLM-4ghHDwCA/pub?start=false&loop=false&delayms=3000)
- [Presentación de BBS+ en NIST](https://csrc.nist.gov/csrc/media/presentations/2023/crclub-2023-10-18/images-media/20231018-crypto-club--greg-and-vasilis--slides--BBS.pdf)
- [Documentación de Iden3 sobre árboles de Merkle](https://docs.iden3.io/basics/key-concepts/#why-do-we-use-merkle-trees-at-iden3)
