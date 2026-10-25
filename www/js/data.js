// Datos del juego (generado a partir de la versión PC)
var DATA = {
 "LEVELS": [
  {
   "num": "0",
   "name": "El Lobby",
   "desc": "Papel tapiz amarillo, alfombra húmeda y el zumbido eterno.",
   "n": 18,
   "wall": 0.3,
   "room": 4.0,
   "h": 3.0,
   "braid": 0.34,
   "halls": 6,
   "pillar": 0.2,
   "lit": 0.91,
   "flick": 0.06,
   "dead": 0.06,
   "dark": 4,
   "light_i": 1.0,
   "light_rgb": [
    1.0,
    0.97,
    0.86
   ],
   "lamp": [
    0.62,
    1.24
   ],
   "lamp_rgb": [
    1.0,
    1.0,
    0.95
   ],
   "fog": [
    0.21,
    0.19,
    0.105
   ],
   "fogd": 0.045,
   "tex": [
    "wallpaper",
    "carpet",
    "ceiling"
   ],
   "uv": [
    1.5,
    2.0,
    1.2
   ],
   "base": true,
   "pipes": false,
   "water": false,
   "car": true,
   "desks": 6,
   "amb": "hum",
   "amb_vol": 0.18,
   "amb_rate": 1.0,
   "oneshot": "creak",
   "mon": {
    "hp": 1.0,
    "sp": 1.0,
    "dmg": 1.0,
    "count": 1.0,
    "scale": 1.0,
    "skin": 1.0,
    "eye": [
     1.6,
     1.55,
     1.35
    ]
   },
   "waves": 3,
   "calm": 20
  },
  {
   "num": "1",
   "name": "Zona de Almacenamiento",
   "desc": "Concreto, goteras y columnas. Algo grande se mueve entre los pallets.",
   "n": 15,
   "wall": 0.5,
   "room": 5.6,
   "h": 4.2,
   "braid": 0.45,
   "halls": 7,
   "pillar": 0.6,
   "lit": 0.74,
   "flick": 0.12,
   "dead": 0.14,
   "dark": 4,
   "light_i": 1.35,
   "light_rgb": [
    1.0,
    0.88,
    0.7
   ],
   "lamp": [
    0.5,
    1.6
   ],
   "lamp_rgb": [
    1.1,
    0.95,
    0.75
   ],
   "fog": [
    0.12,
    0.12,
    0.11
   ],
   "fogd": 0.05,
   "tex": [
    "cwall",
    "cfloor",
    "cceil"
   ],
   "uv": [
    3.0,
    3.0,
    3.0
   ],
   "base": false,
   "pipes": false,
   "water": false,
   "crates": true,
   "amb": "rumble",
   "amb_vol": 0.3,
   "amb_rate": 1.0,
   "oneshot": "drip",
   "mon": {
    "hp": 1.4,
    "sp": 0.92,
    "dmg": 1.15,
    "count": 1.0,
    "scale": 1.08,
    "skin": 7.0,
    "eye": [
     1.3,
     1.3,
     1.3
    ]
   },
   "waves": 3,
   "calm": 15
  },
  {
   "num": "2",
   "name": "Túneles de Servicio",
   "desc": "Caños calientes, vapor y luz de emergencia. Pasillos angostos.",
   "n": 20,
   "wall": 0.3,
   "room": 2.6,
   "h": 2.75,
   "braid": 0.2,
   "halls": 2,
   "pillar": 0.05,
   "lit": 0.5,
   "flick": 0.16,
   "dead": 0.22,
   "dark": 6,
   "light_i": 0.9,
   "light_rgb": [
    1.0,
    0.42,
    0.22
   ],
   "lamp": [
    0.28,
    0.28
   ],
   "lamp_rgb": [
    1.6,
    0.55,
    0.25
   ],
   "fog": [
    0.06,
    0.028,
    0.018
   ],
   "fogd": 0.07,
   "tex": [
    "mwall",
    "grate",
    "dceil"
   ],
   "uv": [
    2.0,
    1.0,
    2.0
   ],
   "base": false,
   "pipes": true,
   "water": false,
   "vents": 14,
   "amb": "machine",
   "amb_vol": 0.35,
   "amb_rate": 1.0,
   "oneshot": "steam",
   "mon": {
    "hp": 0.8,
    "sp": 1.2,
    "dmg": 1.0,
    "count": 1.1,
    "scale": 0.9,
    "skin": 1.4,
    "eye": [
     1.9,
     0.15,
     0.08
    ]
   },
   "waves": 3,
   "calm": 15
  },
  {
   "num": "3",
   "name": "Estación Eléctrica",
   "desc": "Ladrillo negro, cables y tubos que no paran de parpadear.",
   "n": 18,
   "wall": 0.35,
   "room": 4.0,
   "h": 3.4,
   "braid": 0.3,
   "halls": 4,
   "pillar": 0.3,
   "lit": 0.72,
   "flick": 0.35,
   "dead": 0.12,
   "dark": 5,
   "light_i": 1.3,
   "light_rgb": [
    0.72,
    0.84,
    1.0
   ],
   "lamp": [
    0.4,
    1.4
   ],
   "lamp_rgb": [
    0.85,
    0.95,
    1.35
   ],
   "fog": [
    0.04,
    0.05,
    0.08
   ],
   "fogd": 0.055,
   "tex": [
    "brick",
    "tfloor",
    "dceil"
   ],
   "uv": [
    2.0,
    1.6,
    2.0
   ],
   "base": true,
   "pipes": true,
   "water": false,
   "amb": "hum",
   "amb_vol": 0.24,
   "amb_rate": 1.35,
   "oneshot": "zap",
   "mon": {
    "hp": 1.0,
    "sp": 1.1,
    "dmg": 1.1,
    "count": 1.3,
    "scale": 1.0,
    "skin": 1.0,
    "eye": [
     0.35,
     0.8,
     1.9
    ]
   },
   "waves": 3,
   "calm": 15
  },
  {
   "num": "37",
   "name": "Las Piscinas",
   "desc": "Azulejos blancos y agua tibia. Demasiada calma. Demasiado silencio.",
   "n": 15,
   "wall": 0.4,
   "room": 5.2,
   "h": 3.6,
   "braid": 0.5,
   "halls": 6,
   "pillar": 0.35,
   "lit": 0.95,
   "flick": 0.02,
   "dead": 0.02,
   "dark": 1,
   "light_i": 1.35,
   "light_rgb": [
    0.92,
    1.0,
    1.05
   ],
   "lamp": [
    0.9,
    0.9
   ],
   "lamp_rgb": [
    1.1,
    1.15,
    1.2
   ],
   "fog": [
    0.5,
    0.64,
    0.68
   ],
   "fogd": 0.033,
   "tex": [
    "pool",
    "poolfloor",
    "pool"
   ],
   "uv": [
    1.6,
    1.6,
    1.6
   ],
   "base": false,
   "pipes": false,
   "water": true,
   "amb": "water",
   "amb_vol": 0.3,
   "amb_rate": 1.0,
   "oneshot": "drip",
   "mon": {
    "hp": 1.7,
    "sp": 0.88,
    "dmg": 1.6,
    "count": 0.65,
    "scale": 1.14,
    "skin": 11.0,
    "eye": [
     0.02,
     0.02,
     0.02
    ]
   },
   "waves": 3,
   "calm": 25
  },
  {
   "num": "?",
   "name": "La Comisaría",
   "desc": "Es tu comisaría. Casi. Los carteles no dicen nada y los pasillos no terminan.",
   "n": 16,
   "wall": 0.3,
   "room": 4.4,
   "h": 3.0,
   "braid": 0.3,
   "halls": 4,
   "pillar": 0.1,
   "lit": 0.8,
   "flick": 0.12,
   "dead": 0.08,
   "dark": 3,
   "light_i": 1.15,
   "light_rgb": [
    0.9,
    0.95,
    1.0
   ],
   "lamp": [
    0.62,
    1.24
   ],
   "lamp_rgb": [
    1.0,
    1.02,
    1.05
   ],
   "fog": [
    0.1,
    0.11,
    0.13
   ],
   "fogd": 0.05,
   "tex": [
    "pwall",
    "lino",
    "ceiling"
   ],
   "uv": [
    3.0,
    1.2,
    1.2
   ],
   "base": true,
   "pipes": false,
   "water": false,
   "desks": 30,
   "lockers": 10,
   "amb": "hum",
   "amb_vol": 0.15,
   "amb_rate": 0.85,
   "oneshot": "phone",
   "mon": {
    "hp": 1.2,
    "sp": 1.05,
    "dmg": 1.2,
    "count": 1.1,
    "scale": 1.0,
    "skin": 1.0,
    "eye": [
     1.6,
     1.55,
     1.35
    ]
   },
   "waves": 3,
   "calm": 18,
   "doppel_rate": 2.0
  }
 ],
 "ROLES": [
  {
   "key": "comisario",
   "name": "Comisario Ortega",
   "short": "COMISARIO",
   "weapon": "glock",
   "hp": 100,
   "speed": 1.0,
   "desc": "Pistola con silenciador y láser. Las entidades no oyen sus disparos."
  },
  {
   "key": "sargento",
   "name": "Sargento Ibarra",
   "short": "SARGENTO",
   "weapon": "rifle",
   "hp": 125,
   "speed": 0.95,
   "desc": "Rifle con mira (clic derecho). Letal de lejos, torpe de cerca. Más vida."
  },
  {
   "key": "novato",
   "name": "Agente Paz",
   "short": "NOVATO",
   "weapon": "revolver",
   "hp": 100,
   "speed": 1.03,
   "desc": "Revólver de 6 tiros. Pega fuerte, pero le tiembla el pulso si está solo."
  },
  {
   "key": "detective",
   "name": "Detective Luna",
   "short": "DETECTIVE",
   "weapon": "knife",
   "hp": 90,
   "speed": 1.15,
   "desc": "Cuchillo mariposa. Rápida y silenciosa. Por la espalda mata de un golpe."
  }
 ],
 "WEAPONS": {
  "glock": {
   "name": "Pistola 9mm con silenciador",
   "kind": "gun",
   "dmg": 24,
   "pellets": 1,
   "spread": 0.006,
   "rof": 0.17,
   "mag": 17,
   "reserve": 68,
   "reload": "mag",
   "reload_t": 1.5,
   "noise": 4,
   "falloff": [
    25,
    45
   ],
   "recoil": 1.3,
   "snd": "sup",
   "gain": 17,
   "laser": true
  },
  "rifle": {
   "name": "Rifle de cerrojo",
   "kind": "gun",
   "dmg": 88,
   "pellets": 1,
   "spread": 0.035,
   "zspread": 0.0012,
   "rof": 1.2,
   "mag": 5,
   "reserve": 20,
   "reload": "mag",
   "reload_t": 2.7,
   "noise": 32,
   "falloff": [
    60,
    100
   ],
   "recoil": 8.0,
   "snd": "rifle",
   "gain": 5,
   "scope": true,
   "bolt": true
  },
  "revolver": {
   "name": "Revólver .38",
   "kind": "gun",
   "dmg": 50,
   "pellets": 1,
   "spread": 0.011,
   "rof": 0.42,
   "mag": 6,
   "reserve": 24,
   "reload": "shell",
   "reload_t": 0.55,
   "noise": 22,
   "falloff": [
    18,
    38
   ],
   "recoil": 6.5,
   "snd": "revolver",
   "gain": 6
  },
  "knife": {
   "name": "Cuchillo mariposa",
   "kind": "melee",
   "dmg": 55,
   "back": 320,
   "rof": 0.5,
   "range": 1.9,
   "noise": 0,
   "snd": "swish"
  },
  "shotgun": {
   "name": "Escopeta",
   "kind": "gun",
   "dmg": 13,
   "pellets": 9,
   "spread": 0.072,
   "rof": 0.85,
   "mag": 6,
   "reserve": 12,
   "reload": "shell",
   "reload_t": 0.5,
   "noise": 26,
   "falloff": [
    7,
    25
   ],
   "recoil": 5.5,
   "snd": "shot",
   "gain": 6,
   "pump": true
  }
 },
 "STORY": [
  [
   {
    "type": "collect",
    "item": "radio",
    "count": 1,
    "text": "Encontrá la radio del Móvil 14"
   },
   {
    "type": "survive",
    "waves": 2,
    "text": "Aguantá mientras la radio busca la frecuencia"
   },
   {
    "type": "exit",
    "text": "La radio marca una salida. Llegá a la puerta"
   }
  ],
  [
   {
    "type": "collect",
    "item": "fuse",
    "count": 3,
    "text": "Juntá 3 fusibles para el montacargas"
   },
   {
    "type": "activate",
    "thing": "panel",
    "count": 1,
    "text": "Colocá los fusibles en el tablero (mantené USAR)"
   },
   {
    "type": "exit",
    "text": "El montacargas bajó. Llegá a la puerta"
   }
  ],
  [
   {
    "type": "activate",
    "thing": "valve",
    "count": 3,
    "text": "Cerrá las 3 válvulas de vapor (mantené USAR)"
   },
   {
    "type": "survive",
    "waves": 1,
    "text": "Algo viene por los caños. Aguantá"
   },
   {
    "type": "exit",
    "text": "El vapor bajó. Llegá a la puerta"
   }
  ],
  [
   {
    "type": "activate",
    "thing": "generator",
    "count": 1,
    "text": "Arrancá el generador (mantené USAR)"
   },
   {
    "type": "survive",
    "waves": 2,
    "text": "Defendé el generador mientras toma carga"
   },
   {
    "type": "exit",
    "text": "Hay luz en la salida. Llegá a la puerta"
   }
  ],
  [
   {
    "type": "collect",
    "item": "badge",
    "count": 1,
    "text": "Buscá al Oficial Ramírez"
   },
   {
    "type": "survive",
    "waves": 1,
    "text": "No estamos solos en el agua. Aguantá"
   },
   {
    "type": "exit",
    "text": "Llegá a la puerta"
   }
  ],
  [
   {
    "type": "collect",
    "item": "file",
    "count": 1,
    "text": "Encontrá el expediente del Móvil 22"
   },
   {
    "type": "exit",
    "text": "Llegá a la oficina del Comisario",
    "final": true
   }
  ]
 ],
 "SURVIVAL": [
  {
   "type": "survive",
   "waves": 3,
   "text": "Sobreviví 3 oleadas para abrir la salida"
  },
  {
   "type": "exit",
   "text": "SALIDA ABIERTA · seguí la flecha verde"
  }
 ],
 "ITEM_NAMES": {
  "radio": "Radio del Móvil 14",
  "fuse": "Fusible",
  "badge": "Placa del Oficial Ramírez",
  "file": "Expediente del Móvil 22"
 },
 "THING_NAMES": {
  "panel": "Tablero eléctrico",
  "valve": "Válvula de vapor",
  "generator": "Generador"
 },
 "NOTES": [
  [
   [
    "Parte diario - Móvil 14",
    "Edificio Galván, 3er subsuelo. Denuncia por ruidos.\nEntramos con Ramírez a las 02:10.\nLa pared del fondo no estaba. Dimos un paso y la alfombra era amarilla.\nEl reloj del patrullero marca 02:10 desde hace... no sé cuánto."
   ],
   [
    "Nota en una servilleta",
    "Si encontrás esto: NO SIGAS EL ZUMBIDO. Las luces que parpadean te miran.\nContá las puertas. Si alguna te habla con la voz de un compañero, no contestes."
   ],
   [
    "Hoja arrancada de una agenda",
    "Día 40. O 400. El papel tapiz tiene el mismo dibujo en todas las habitaciones.\nRamírez dice que escuchó mi voz pidiéndole ayuda en otro pasillo.\nYo estaba al lado suyo."
   ]
  ],
  [
   [
    "Remito de depósito",
    "Mercadería: 40 pallets. Destino: ningún lado.\nFirmado: (ilegible). Fecha: 31/13/1996."
   ],
   [
    "Manual del montacargas",
    "Requiere 3 fusibles de 30A. Si el tablero no responde, revisar que no haya nadie\nparado detrás de usted. Esto no es un error de impresión."
   ],
   [
    "Diario de Ramírez",
    "Perdí la radio en el Lobby. Ya no importa. Acá abajo hay cosas más grandes.\nNo caminan. Esperan. Las goteras marcan el tiempo y el tiempo está mal."
   ]
  ],
  [
   [
    "Placa de mantenimiento",
    "SECTOR B - PRESIÓN MÁXIMA 8 BAR. CERRAR VÁLVULAS ANTES DE ATRAVESAR.\nAlguien rayó debajo con una llave: 'ellas se meten por los caños'."
   ],
   [
    "Carta sin sobre",
    "Mamá: no sé si esto llega. Estoy bien. Hace calor. Hay luces rojas.\nSi un policía golpea tu puerta con mi cara, no le abras."
   ],
   [
    "Diario de Ramírez",
    "Las chiquitas son rápidas. Ojos rojos. Si les apuntás con luz se quedan quietas\nun segundo. Me quedan dos bengalas. Me queda una bala. Me quedan ganas."
   ]
  ],
  [
   [
    "Bitácora de la estación",
    "Generador principal: FALLA. Generador auxiliar: arranque manual.\nMientras carga, el ruido atrae. Se recomienda personal armado."
   ],
   [
    "Cable con una etiqueta",
    "NO CORTAR. NO TOCAR. NO MIRAR LOS TUBOS CUANDO PARPADEAN MÁS DE TRES VECES."
   ],
   [
    "Diario de Ramírez",
    "Vi a la patrulla nueva. Móvil 22. Cuatro. Uno con rifle, una con cuchillo.\nLes grité. Se dieron vuelta y no tenían cara. Tenían huesos.\n¿Cuánto tiempo hace que estoy acá?"
   ]
  ],
  [
   [
    "Cartel mojado",
    "PROHIBIDO CORRER. PROHIBIDO GRITAR. PROHIBIDO RECORDAR LA SALIDA."
   ],
   [
    "Diario de Ramírez (última página)",
    "El agua está tibia y es lo más parecido a estar en casa.\nDejo la placa acá. Si sos del 22: la comisaría está más abajo.\nNo es nuestra comisaría. Pero tiene nuestros nombres."
   ],
   [
    "Etiqueta de un flotador",
    "Propiedad del Club. Devolver al guardavidas. El guardavidas no está."
   ]
  ],
  [
   [
    "Orden del día",
    "Móvil 22: responder llamado en Edificio Galván. 02:00 hs.\nFecha: 14/06/1996. Firmado: Comisario Ortega."
   ],
   [
    "Lista de personal",
    "Ortega - Ibarra - Paz - Luna.\nEstado: AUSENTES. Motivo: (en blanco).\nAlguien agregó con lápiz: 'pero siguen viniendo a trabajar'."
   ],
   [
    "Calendario de pared",
    "Los meses están tachados uno por uno. Todos.\nEl último dice: 2026."
   ]
  ]
 ],
 "RADIO_START": [
  [
   [
    "CENTRAL",
    "...Móvil 22, ¿me copia? Edificio Galván... ¿me...?"
   ],
   [
    "COMISARIO",
    "Acá Ortega. Estamos adentro. Esto no es el subsuelo, Central."
   ],
   [
    "NOVATO",
    "Jefe... ¿por qué tengo las manos así? ¿Por qué se me ven los huesos?"
   ],
   [
    "DETECTIVE",
    "Calma, Paz. Hay un patrullero tirado allá. El 14. El que desapareció."
   ]
  ],
  [
   [
    "SARGENTO",
    "Concreto, columnas y goteras. Me gusta más que el papel amarillo."
   ],
   [
    "DETECTIVE",
    "Hay un montacargas. Sin fusibles no anda."
   ],
   [
    "COMISARIO",
    "Nos separamos de a dos. Nadie solo."
   ]
  ],
  [
   [
    "NOVATO",
    "Hace un calor de locos acá abajo."
   ],
   [
    "SARGENTO",
    "Son caños de vapor. Si no cerramos las válvulas no pasamos."
   ],
   [
    "DETECTIVE",
    "Ramírez escribió que las chiquitas se meten por los caños."
   ]
  ],
  [
   [
    "COMISARIO",
    "Una estación eléctrica. Si la arrancamos, la salida va a tener luz."
   ],
   [
    "NOVATO",
    "¿Y si la luz las atrae?"
   ],
   [
    "SARGENTO",
    "Entonces las vemos venir."
   ]
  ],
  [
   [
    "DETECTIVE",
    "Azulejos. Agua. Silencio. No me gusta nada."
   ],
   [
    "COMISARIO",
    "Ramírez tiene que estar cerca. Busquen su placa."
   ],
   [
    "NOVATO",
    "Las de acá son blancas... y no tienen ojos."
   ]
  ],
  [
   [
    "NOVATO",
    "¡Es la comisaría! ¡Volvimos!"
   ],
   [
    "DETECTIVE",
    "No, Paz. Mirá los carteles. Las letras no dicen nada."
   ],
   [
    "COMISARIO",
    "Mi oficina está al fondo. Ahí vamos a saber qué pasó."
   ]
  ]
 ],
 "RADIO_OBJ": {
  "collect": [
   [
    "DETECTIVE",
    "Ojo, puede estar en cualquier habitación. Revisen todo."
   ]
  ],
  "activate": [
   [
    "SARGENTO",
    "Mantengan apretado hasta que termine. Los cubro."
   ]
  ],
  "survive": [
   [
    "CENTRAL",
    "...22... vienen... muchas... aguanten..."
   ],
   [
    "COMISARIO",
    "¡Espalda con espalda! ¡Que no nos rodeen!"
   ]
  ],
  "exit": [
   [
    "COMISARIO",
    "¡Ahí está la puerta! ¡Todos juntos, vamos!"
   ]
  ]
 },
 "RADIO_EVENTS": {
  "down": [
   [
    "NOVATO",
    "¡Cayó uno! ¡Hay que juntarle los huesos!"
   ],
   [
    "SARGENTO",
    "¡Compañero en el piso! ¡Mantengan E encima para levantarlo!"
   ]
  ],
  "reveal": [
   [
    "DETECTIVE",
    "¡ESE NO ES DE LOS NUESTROS!"
   ],
   [
    "COMISARIO",
    "¡Es una copia! ¡Fuego!"
   ]
  ],
  "doppel_fake": [
   "Vengan, encontré la salida. Por acá.",
   "Estoy herido... ayúdenme... estoy solo.",
   "No disparen, soy yo. Bajen las armas.",
   "¿Dónde están? No los veo.",
   "Por acá, rápido, antes de que vuelvan."
  ]
 },
 "SPEAKER_COLORS": {
  "COMISARIO": [
   0.55,
   0.7,
   1.0
  ],
  "SARGENTO": [
   0.6,
   1.0,
   0.6
  ],
  "NOVATO": [
   1.0,
   0.85,
   0.45
  ],
  "DETECTIVE": [
   1.0,
   0.6,
   0.85
  ],
  "CENTRAL": [
   0.8,
   0.8,
   0.8
  ],
  "???": [
   1.0,
   0.35,
   0.3
  ]
 },
 "ENDING": [
  "Abren la puerta de la oficina del Comisario.",
  "Adentro hay un escritorio, una lámpara y una foto enmarcada.",
  "En la foto están ellos cuatro, con uniforme, sonriendo. Al pie dice: \"Móvil 22 - 1996\".",
  "Ortega mira por la ventana.",
  "Del otro lado del vidrio hay papel tapiz amarillo. Hasta donde da la vista.",
  "La radio se prende sola: \"...Móvil 22, ¿me copia? Edificio Galván...\"",
  "Nunca salieron."
 ]
};
