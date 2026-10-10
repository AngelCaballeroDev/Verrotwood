// Equipo oficial de Verrotwood (manual, págs. 18-20).
// En los efectos, **texto** se muestra en negrita y *texto* en cursiva.
// 'short' es el resumen de una línea que se usa en la hoja imprimible.

const WEAPON_TYPES = {
    'M': 'Cuerpo a cuerpo',
    'R': 'Distancia',
    'M/R': 'Cuerpo a cuerpo / Distancia'
};

const WEAPONS = [
    { id: 'improvised', name: 'Improvised', cost: 0, type: 'M/R', range: '0-5″', damage: 3, crit: '0' },
    { id: 'light-bladed', name: 'Light Bladed', cost: 10, type: 'M', range: '0″', damage: 5, crit: '+1' },
    { id: 'heavy-bladed', name: 'Heavy Bladed', cost: 20, type: 'M', range: '0″', damage: 8, crit: '+1' },
    { id: 'light-blunted', name: 'Light Blunted', cost: 10, type: 'M', range: '0″', damage: 5, crit: 'Prone' },
    { id: 'heavy-blunted', name: 'Heavy Blunted', cost: 20, type: 'M', range: '0″', damage: 8, crit: 'Prone' },
    { id: 'pole', name: 'Pole', cost: 15, type: 'M', range: '0-3″', damage: 5, crit: '+1' },
    { id: 'bow', name: 'Bow', cost: 20, type: 'R', range: '2-24″', damage: 5, crit: '+1' },
    { id: 'crossbow', name: 'Crossbow', cost: 20, type: 'R', range: '0-12″', damage: 8, crit: '+1' }
];

const GEAR = [
    { id: 'mortshrooms', name: 'Mortshrooms', cost: 5, consumable: true,
      short: 'Un uso · acción gratuita: recupera 5 de salud',
      effect: 'Un solo uso. Como **acción gratuita** en el turno del modelo, **recupera 5 de salud**.' },
    { id: 'incense', name: 'Incense', cost: 5, consumable: true,
      short: 'Un uso · acción gratuita: el culto gana 5 RP',
      effect: 'Un solo uso. Como **acción gratuita** en el turno del modelo, el culto **gana 5 RP**.' },
    { id: 'poison', name: 'Poison', cost: 15, consumable: true,
      short: 'Un uso · el siguiente ataque causa Poisoned (STR 6+ para librarse)',
      effect: 'Un solo uso. Añade **Poisoned** a la siguiente acción cuerpo a cuerpo o a distancia; si el ataque falla, se pierde. *Poisoned*: al inicio de su activación el objetivo tira STR; con **1-5** recibe 1 de daño y sigue envenenado, con **6-10** se libra.' },
    { id: 'oil', name: 'Oil', cost: 15, consumable: true,
      short: 'Un uso · el siguiente ataque causa Burning (DEX 6+ para apagarse)',
      effect: 'Un solo uso. Añade **Burning** a la siguiente acción cuerpo a cuerpo o a distancia; si el ataque falla, se pierde. *Burning*: al inicio de su activación el objetivo tira DEX; con **1-5** recibe 1 de daño y sigue ardiendo, con **6-10** se apaga.' },
    { id: 'mount', name: 'Mount', cost: 100, unique: true,
      short: 'Mover 9″ / Correr 12″ · +1 dado STR cuerpo a cuerpo · Arrollar',
      move: 9, run: 12,
      effect: 'Se asigna a un único modelo; **el culto solo puede tener una**. **Mover 9″ / Correr 12″**, pero no puede mover ni correr por terreno difícil o de bosque ni escalar más de 1″. Si ya se movió esta ronda, **+1 dado de DEF** contra ataques a distancia. **+1 dado de STR** en cuerpo a cuerpo. *Arrollar*: si al mover o correr contacta con un modelo derribado, ese modelo queda **fuera de acción**.' }
];
