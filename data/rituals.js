// Catálogo oficial de Rituales de Verrotwood (manual, págs. 21-31).
// En los efectos, **texto** se muestra en negrita y *texto* en cursiva.

const RITUAL_CATEGORIES = [
    { id: 'passive', label: 'Pasivos', range: '0 RP', min: 0, max: 0,
      desc: 'Sin gasto de RP ni acción; se aplican de forma constante o automática.' },
    { id: 'low', label: 'Bajo coste', range: '3-5 RP', min: 3, max: 5,
      desc: 'Bendiciones inmediatas, mejoras de atributos o manipulaciones tácticas menores.' },
    { id: 'medium', label: 'Coste medio', range: '6-9 RP', min: 6, max: 9,
      desc: 'Alteran el posicionamiento, el terreno o la salud de los combatientes.' },
    { id: 'form', label: 'Formas', range: '10-12 RP', min: 10, max: 12,
      desc: 'Mutaciones y estados místicos de gran duración.' },
    { id: 'high', label: 'Alto coste', range: '13-20 RP', min: 13, max: 20,
      desc: 'Milagros oscuros capaces de alterar la mesa o invocar entidades.' }
];

const RITUALS = [
    // Pasivos (0 RP)
    { id: 'cannibalism', name: 'Cannibalism', cost: 0, effect: 'Pasivo. Si un cultista enemigo queda fuera de acción por tu culto y después muere en la fase de lesiones, tu culto gana **50 de Favor**.' },
    { id: 'the-devout', name: 'The Devout', cost: 0, effect: 'Pasivo. Al inicio de cada ronda ganas **1 RP por cada modelo de tu culto** que siga en la mesa. Las invocaciones no generan RP.' },
    { id: 'hardened', name: 'Hardened', cost: 0, effect: 'Pasivo. Cuando un modelo deba tirar en la tabla de lesiones, tiras **2 dados** y eliges el resultado.' },
    { id: 'survivalist', name: 'Survivalist', cost: 0, effect: 'Pasivo. En la fase de exploración (*Scouting*) robas **2 cartas** y eliges una; la otra se vuelve a barajar.' },

    // Bajo coste (3-5 RP)
    { id: 'armor-of-the-gods', name: 'Armor of the Gods', cost: 3, effect: 'Este modelo suma **+1 a su DEF** en su siguiente tirada de DEF.' },
    { id: 'blessing-of-the-blade', name: 'The Blessing of the Blade', cost: 3, effect: 'Este modelo suma **+1 a su STR** en su siguiente acción cuerpo a cuerpo.' },
    { id: 'hive-mind', name: 'Hive Mind', cost: 3, effect: 'Este modelo suma **+1 a su INT** en su siguiente tirada de INT.' },
    { id: 'sight-of-the-divine', name: 'Sight of the Divine', cost: 3, effect: 'Este modelo suma **+1 a su DEX** en su siguiente acción a distancia.' },
    { id: 'disillusion', name: 'Disillusion', cost: 4, effect: 'Elige un modelo enemigo: solo puede realizar **una acción** esta ronda.' },
    { id: 'give-of-self', name: 'Give of Self', cost: 4, effect: 'En la siguiente acción cuerpo a cuerpo con éxito de este modelo **eliges el daño** que inflige, pero el atacante recibe **el mismo daño**.' },
    { id: 'grasp', name: 'Grasp', cost: 4, effect: 'Elige un enemigo que no esté en terreno elevado. Antes de su siguiente movimiento o carrera tira su STR: con **5+** puede moverse; con 4 o menos **no puede mover ni correr** y debe repetir la tirada cada ronda hasta sacar 5+.' },
    { id: 'regurgitated-crow', name: 'Regurgitated Crow', cost: 4, effect: 'Ataque a distancia contra cualquier modelo **ignorando alcance, línea de visión y cobertura**. El cuervo tiene **DEX 1, daño 3 y CRIT 1**.' },
    { id: 'silenced-tether', name: 'Silenced Tether', cost: 4, effect: 'Elige un modelo enemigo: **no puede realizar acciones de ritual** esta ronda.' },
    { id: 'twisting-the-fates', name: 'Twisting the Fates', cost: 4, effect: 'Como **acción gratuita** tras cualquier tirada de la partida, este modelo puede **repetir todos los dados** de esa tirada.' },
    { id: 'aura-of-rage', name: 'Aura of Rage', cost: 5, effect: 'Hasta el final de la siguiente ronda, los aliados a **3″** de este modelo tiran **+1 dado de STR** en acciones cuerpo a cuerpo.' },
    { id: 'aura-of-range', name: 'Aura of Range', cost: 5, effect: 'Hasta el final de la siguiente ronda, los aliados a **3″** de este modelo tiran **+1 dado de DEX** en acciones a distancia.' },
    { id: 'berserk', name: 'Berserk', cost: 5, effect: 'El modelo hace una **carrera que termina en una acción cuerpo a cuerpo gratuita**. Si deja fuera de acción al objetivo, puede repetir carrera y ataque gratis.' },
    { id: 'birds-of-a-feather', name: 'Birds of a Feather', cost: 5, effect: 'Retira este modelo y colócalo **en contacto con un aliado** que esté en contacto con un enemigo.' },
    { id: 'embracing-aura', name: 'Embracing Aura', cost: 5, effect: 'Hasta el final de la siguiente ronda, los aliados a **3″** de este modelo tiran **+1 dado de DEF**.' },
    { id: 'exploding-carcass', name: 'Exploding Carcass', cost: 5, effect: 'Coloca un marcador de 1″ a más de 4″ de cualquier modelo. Si un modelo se mueve a **3″** del marcador, tira DEX: con **4 o menos**, todos los modelos a 3″ reciben **1D10 de daño** y el marcador se retira.' },
    { id: 'stench-of-death', name: 'Stench of Death', cost: 5, effect: '**Empuja 4″ hacia atrás** a todos los enemigos que estén a 4″ de este modelo.' },

    // Coste medio (6-9 RP)
    { id: 'bloodlust', name: 'Bloodlust', cost: 6, effect: 'Debe lanzarse en la **primera ronda**. Elige un modelo del culto rival: si lo dejas fuera de acción durante la partida, ganas **1 VP** al final.' },
    { id: 'revenge', name: 'Revenge', cost: 6, effect: '**Acción gratuita** tras recibir daño de un ataque enemigo. El siguiente ataque con éxito de este modelo hace **+3 de daño**.' },
    { id: 'time-displacement', name: 'Time Displacement', cost: 6, effect: 'Coloca un marcador donde está el modelo. En cualquier turno posterior puede **volver al marcador** como acción gratuita; después se retira.' },
    { id: 'at-one-with-the-woods', name: 'At One with the Woods', cost: 7, effect: 'Con el modelo en una zona de bosque, **muévelo gratis a otra zona de bosque**.' },
    { id: 'disembodied-whispers', name: 'Disembodied Whispers', cost: 7, effect: 'Elige un enemigo en cualquier lugar de la mesa y **muévelo hasta su movimiento completo**.' },
    { id: 'existential-dread', name: 'Existential Dread', cost: 7, effect: 'Tirada de **INT contra la INT** de un enemigo: si tu resultado es mayor, el objetivo recibe **5 de daño**.' },
    { id: 'hex', name: 'Hex', cost: 7, effect: 'Elige un enemigo: usa su **dado más bajo** como resultado en todas sus tiradas hasta el final de la ronda.' },
    { id: 'one-mind-one-body', name: 'One Mind, One Body', cost: 7, effect: '**Acción gratuita** justo después de recibir daño: reparte ese daño **libremente entre modelos aliados**.' },
    { id: 'quake', name: 'Quake', cost: 7, effect: 'Todos los modelos a **4″** del lanzador quedan **derribados (*Prone*)**.' },
    { id: 'transpose', name: 'Transpose', cost: 7, effect: 'Elige un enemigo en línea de visión e **intercambia la posición** de ambos modelos.' },
    { id: 'hoofed-form', name: 'Hoofed Form', cost: 8, effect: 'Hasta el final de la partida este modelo **ignora los efectos negativos del terreno difícil**.' },
    { id: 'martyr', name: 'Martyr', cost: 8, effect: '**Acción gratuita** cuando el modelo queda a 0 de salud y fuera de acción: todos los aliados obtienen **1 acción extra gratuita** de movimiento, cuerpo a cuerpo o a distancia.' },
    { id: 'conjure-terrain', name: 'Conjure Terrain', cost: 9, effect: 'Coloca una **nueva pieza de terreno** (máx. 4″ de diámetro) hasta el final de la partida, sin ponerla sobre otro terreno ni sobre un modelo.' },
    { id: 'drain-life', name: 'Drain Life', cost: 9, effect: 'En contacto con el objetivo: **le quitas 3 de salud y se los sumas** a este modelo, sin superar su máximo.' },
    { id: 'salt-circle', name: 'Salt Circle', cost: 9, effect: 'Coloca un **círculo de 4″** centrado en el lanzador; no se puede mover. **Criaturas e invocaciones** no pueden entrar ni salir de él.' },

    // Formas y Transformaciones (10-12 RP)
    { id: 'burnt-form', name: 'Burnt Form', cost: 10, effect: 'Resto de la partida: el modelo **no puede quedar *Burning*** y sus **CRIT cuerpo a cuerpo causan *Burning***.' },
    { id: 'disjointed-form', name: 'Disjointed Form', cost: 10, effect: 'Resto de la partida: cada vez que un enemigo **falla un ataque cuerpo a cuerpo** contra este modelo, puede hacer un **ataque cuerpo a cuerpo gratuito**.' },
    { id: 'ethereal-form', name: 'Ethereal Form', cost: 10, effect: 'Resto de la partida: **+1 DEX**, y puede **defenderse con DEX en lugar de DEF** contra ataques cuerpo a cuerpo y a distancia.' },
    { id: 'forest-form', name: 'Forest Form', cost: 10, effect: 'Resto de la partida: **+1″ de alcance** con su arma cuerpo a cuerpo y **no puede ser objetivo de ataques a distancia** mientras esté en una zona de bosque.' },
    { id: 'hallowed-ground', name: 'Hallowed Ground', cost: 10, effect: 'Convierte una pieza de terreno en **terreno *Hallowed*** hasta el final de la partida.' },
    { id: 'heal', name: 'Heal', cost: 10, effect: 'Tira **1D10**: el lanzador recupera esa salud, sin superar su máximo.' },
    { id: 'scent-of-the-woods-form', name: 'Scent of the Woods Form', cost: 10, effect: 'Resto de la partida: **no puede ser objetivo directo** de criaturas controladas por la IA ni de invocaciones.' },
    { id: 'twist-nature', name: 'Twist Nature', cost: 10, effect: 'Convierte una pieza de terreno en **terreno difícil** hasta el final de la partida.' },
    { id: 'venomous-form', name: 'Venomous Form', cost: 10, effect: 'Resto de la partida: el modelo **no puede quedar *Poisoned*** y sus **CRIT cuerpo a cuerpo causan *Poisoned***.' },
    { id: 'winged-form', name: 'Winged Form', cost: 10, effect: 'Resto de la partida: **ignora el terreno difícil** y la regla de **escalar** al cambiar de elevación.' },
    { id: 'corrupted-ground', name: 'Corrupted Ground', cost: 11, effect: 'Convierte una pieza de terreno en **terreno *Wicked*** hasta el final de la partida.' },
    { id: 'cursed-ground', name: 'Cursed Ground', cost: 11, effect: 'Convierte una pieza de terreno en **terreno *Cursed*** hasta el final de la partida.' },
    { id: 'healing-form', name: 'Healing Form', cost: 11, effect: 'Hasta el final de la partida, todo aliado que **termine su turno a 3″** de este modelo recupera **1 de salud**, sin superar su máximo.' },
    { id: 'hidden-form', name: 'Hidden Form', cost: 11, effect: 'Resto de la partida: no se le pueden hacer **ataques a distancia desde 6″ o más**.' },
    { id: 'protected-form', name: 'Protected Form', cost: 11, effect: 'Resto de la partida: **+2 DEF**, pero recibe **3 de daño** cada vez que realiza una carrera (*Run*).' },
    { id: 'zealot-form', name: 'Zealot Form', cost: 11, effect: 'Resto de la partida: **no puede ser objetivo directo de rituales**.' },
    { id: 'beast-form', name: 'Beast Form', cost: 12, effect: 'Resto de la partida: **+1 STR y +1 DEX**, pero **-1 INT**.' },
    { id: 'frenzy-form', name: 'Frenzy Form', cost: 12, effect: 'Resto de la partida: puede hacer **la misma acción** (mover, cuerpo a cuerpo o distancia) **dos veces por ronda**, sin superar las 2 acciones.' },
    { id: 'giant-form', name: 'Giant Form', cost: 12, effect: 'Resto de la partida: **+2 STR**, **+1″ de alcance** cuerpo a cuerpo y **no puede ser empujado ni derribado**, pero **no puede atravesar zonas de bosque**.' },
    { id: 'pustulous-form', name: 'Pustulous Form', cost: 12, effect: 'Resto de la partida: cada vez que recibe daño, todos los modelos a **1″** reciben **2 de daño**.' },

    // Alto coste (13-20 RP)
    { id: 'call-upon-the-dead', name: 'Call Upon the Dead', cost: 13, effect: 'Convierte una pieza de terreno en **terreno *Haunted*** hasta el final de la partida.' },
    { id: 'swallowed-by-the-forest', name: 'Swallowed by the Forest', cost: 13, effect: '**Retira una pieza de terreno** que no sea un objetivo. Los modelos que estuvieran encima quedan **derribados** lo más cerca posible de su posición.' },
    { id: 'alter-destiny', name: 'Alter Destiny', cost: 15, effect: 'Mueve un **marcador de objetivo hasta 4″** en cualquier dirección.' },
    { id: 'summon', name: 'Summon', cost: 16, effect: 'Coloca un modelo nuevo a **2″** del lanzador; se une a tu culto hasta el final de la partida y entra en la activación aleatoria. Solo **una invocación a la vez**, y no recoge objetivos salvo los de eliminar modelos. **STR 2 · DEX 1 · INT 1 · DEF 1 · Salud 10**, Mover 6″ / Correr 9″. Armas: Improvised y Light Bladed o Light Blunted.' },
    { id: 'greater-summon', name: 'Greater Summon', cost: 20, effect: 'Invoca al **avatar de tu dios** a **2″** del lanzador, hasta el final de la partida y en la activación aleatoria. Solo **uno a la vez**, y no recoge objetivos salvo los de eliminar modelos. **STR 3 · DEX 2 · INT 1 · DEF 1 · Salud 15**, Mover 6″ / Correr 9″. Armas: Improvised y Heavy Bladed o Heavy Blunted.' }
];
