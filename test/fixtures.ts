/** Real records from the registry export, trimmed to a handful of cards,
 * served by a fake fetch in the tests. Regenerate from export/registry.json
 * when the record shape changes. */
export const versions = {"base_url":"https://api.test","latest":{"v3":"v3.9.0"},"releases":[{"tag":"v3.9.0"}]};
export const index = [
 {
  "codex_id": "C000230",
  "name": "Polar Bears",
  "type": "Minion",
  "category": "Spell",
  "rarity": "Ordinary",
  "elements": [
   "Water"
  ],
  "keywords": [],
  "subtypes": [
   "Beast"
  ],
  "cost": 2,
  "attack": 2,
  "defense": 2,
  "power": 2,
  "life": null,
  "errata": false,
  "set_codes": [
   "001",
   "002"
  ],
  "default_printing_id": "P000937",
  "image_status": "lowres"
 },
 {
  "codex_id": "C000429",
  "name": "Black Knight",
  "type": "Minion",
  "category": "Spell",
  "rarity": "Exceptional",
  "elements": [
   "Fire",
   "Water"
  ],
  "keywords": [],
  "subtypes": [
   "Mortal"
  ],
  "cost": 5,
  "attack": 5,
  "defense": 3,
  "power": 4,
  "life": null,
  "errata": false,
  "set_codes": [
   "004"
  ],
  "default_printing_id": "P001700",
  "image_status": "ok"
 },
 {
  "codex_id": "C000455",
  "name": "Dame Britomart",
  "type": "Minion",
  "category": "Spell",
  "rarity": "Unique",
  "elements": [
   "Air",
   "Earth",
   "Water"
  ],
  "keywords": [
   "Lance"
  ],
  "subtypes": [
   "Mortal"
  ],
  "cost": 5,
  "attack": 3,
  "defense": 5,
  "power": 4,
  "life": null,
  "errata": false,
  "set_codes": [
   "004"
  ],
  "default_printing_id": "P001754",
  "image_status": "ok"
 },
 {
  "codex_id": "C000927",
  "name": "Moss Troll",
  "type": "Minion",
  "category": "Spell",
  "rarity": "Ordinary",
  "elements": [
   "Water"
  ],
  "keywords": [
   "Stealth"
  ],
  "subtypes": [
   "Giant"
  ],
  "cost": 3,
  "attack": 3,
  "defense": 3,
  "power": 3,
  "life": null,
  "errata": false,
  "set_codes": [
   "006"
  ],
  "default_printing_id": "P002719",
  "image_status": "ok"
 },
 {
  "codex_id": "C000459",
  "name": "Druid",
  "type": "Avatar",
  "category": "Avatar",
  "rarity": null,
  "elements": [
   "None"
  ],
  "keywords": [],
  "subtypes": [],
  "cost": null,
  "attack": 1,
  "defense": 1,
  "power": 1,
  "life": 20,
  "errata": true,
  "set_codes": [
   "004",
   "999"
  ],
  "default_printing_id": "P001762",
  "image_status": "lowres"
 },
 {
  "codex_id": "C000393",
  "name": "Avatar of Air",
  "type": "Avatar",
  "category": "Avatar",
  "rarity": null,
  "elements": [
   "None"
  ],
  "keywords": [],
  "subtypes": [],
  "cost": null,
  "attack": 1,
  "defense": 1,
  "power": 1,
  "life": 20,
  "errata": false,
  "set_codes": [
   "001",
   "999"
  ],
  "default_printing_id": "P001591",
  "image_status": "lowres"
 }
];
export const sets = [
 {
  "set_code": "001",
  "set_name": "Alpha",
  "released_at": "2023-06-22",
  "cards": 207,
  "printings": 414,
  "api_url": "https://api.kairosarchive.net/v3/sets/001.json",
  "kairos_url": "https://kairosarchive.net/sets/001"
 },
 {
  "set_code": "002",
  "set_name": "Beta",
  "released_at": "2023-10-06",
  "cards": 107,
  "printings": 214,
  "api_url": "https://api.kairosarchive.net/v3/sets/002.json",
  "kairos_url": "https://kairosarchive.net/sets/002"
 },
 {
  "set_code": "004",
  "set_name": "Arthurian Legends",
  "released_at": "2024-08-16",
  "cards": 307,
  "printings": 614,
  "api_url": "https://api.kairosarchive.net/v3/sets/004.json",
  "kairos_url": "https://kairosarchive.net/sets/004"
 },
 {
  "set_code": "005",
  "set_name": "Dragonlord",
  "released_at": "2025-03-14",
  "cards": 7,
  "printings": 14,
  "api_url": "https://api.kairosarchive.net/v3/sets/005.json",
  "kairos_url": "https://kairosarchive.net/sets/005"
 },
 {
  "set_code": "006",
  "set_name": "Gothic",
  "released_at": "2025-12-05",
  "cards": 107,
  "printings": 214,
  "api_url": "https://api.kairosarchive.net/v3/sets/006.json",
  "kairos_url": "https://kairosarchive.net/sets/006"
 },
 {
  "set_code": "999",
  "set_name": "Promo",
  "released_at": null,
  "cards": 207,
  "printings": 414,
  "api_url": "https://api.kairosarchive.net/v3/sets/999.json",
  "kairos_url": "https://kairosarchive.net/sets/999"
 }
];
/** sets/{code}.json: the entry with its cards. */
export const setObjects: Record<string, unknown> = {
 "999": {
  "set_code": "999",
  "set_name": "Promo",
  "released_at": null,
  "printings": 414,
  "api_url": "https://api.kairosarchive.net/v3/sets/999.json",
  "kairos_url": "https://kairosarchive.net/sets/999",
  "cards": [
   {
    "codex_id": "C000393",
    "name": "Avatar of Air",
    "printing_ids": [
     "P001592"
    ]
   },
   {
    "codex_id": "C000459",
    "name": "Druid",
    "printing_ids": [
     "P001763",
     "P001764"
    ]
   }
  ]
 },
 "001": {
  "set_code": "001",
  "set_name": "Alpha",
  "released_at": "2023-06-22",
  "printings": 414,
  "api_url": "https://api.kairosarchive.net/v3/sets/001.json",
  "kairos_url": "https://kairosarchive.net/sets/001",
  "cards": [
   {
    "codex_id": "C000393",
    "name": "Avatar of Air",
    "printing_ids": [
     "P001590",
     "P001591"
    ]
   },
   {
    "codex_id": "C000230",
    "name": "Polar Bears",
    "printing_ids": [
     "P000935",
     "P000936"
    ]
   }
  ]
 },
 "002": {
  "set_code": "002",
  "set_name": "Beta",
  "released_at": "2023-10-06",
  "printings": 214,
  "api_url": "https://api.kairosarchive.net/v3/sets/002.json",
  "kairos_url": "https://kairosarchive.net/sets/002",
  "cards": [
   {
    "codex_id": "C000230",
    "name": "Polar Bears",
    "printing_ids": [
     "P000937",
     "P000938"
    ]
   }
  ]
 },
 "004": {
  "set_code": "004",
  "set_name": "Arthurian Legends",
  "released_at": "2024-08-16",
  "printings": 614,
  "api_url": "https://api.kairosarchive.net/v3/sets/004.json",
  "kairos_url": "https://kairosarchive.net/sets/004",
  "cards": [
   {
    "codex_id": "C000429",
    "name": "Black Knight",
    "printing_ids": [
     "P001700",
     "P001701"
    ]
   },
   {
    "codex_id": "C000455",
    "name": "Dame Britomart",
    "printing_ids": [
     "P001754",
     "P001755"
    ]
   },
   {
    "codex_id": "C000459",
    "name": "Druid",
    "printing_ids": [
     "P001762"
    ]
   }
  ]
 },
 "005": {
  "set_code": "005",
  "set_name": "Dragonlord",
  "released_at": "2025-03-14",
  "printings": 14,
  "api_url": "https://api.kairosarchive.net/v3/sets/005.json",
  "kairos_url": "https://kairosarchive.net/sets/005",
  "cards": []
 },
 "006": {
  "set_code": "006",
  "set_name": "Gothic",
  "released_at": "2025-12-05",
  "printings": 214,
  "api_url": "https://api.kairosarchive.net/v3/sets/006.json",
  "kairos_url": "https://kairosarchive.net/sets/006",
  "cards": [
   {
    "codex_id": "C000927",
    "name": "Moss Troll",
    "printing_ids": [
     "P002719",
     "P002720"
    ]
   }
  ]
 }
};
export const cards: Record<string, unknown> = {
 "C000230": {
  "codex_id": "C000230",
  "name": "Polar Bears",
  "type": "Minion",
  "category": "Spell",
  "rarity": "Ordinary",
  "slot": "Ordinary",
  "subtypes": [
   "Beast"
  ],
  "elements": [
   "Water"
  ],
  "keywords": [],
  "umbrellas": [],
  "cost": 2,
  "attack": 2,
  "defense": 2,
  "power": 2,
  "life": null,
  "thr_air": 0,
  "thr_earth": 0,
  "thr_fire": 0,
  "thr_water": 1,
  "rules_text": "Can move as if the top and bottom edges of the realm were connected.",
  "back": null,
  "errata": false,
  "set_codes": [
   "001",
   "002"
  ],
  "printing_ids": [
   "P000935",
   "P000936",
   "P000937",
   "P000938"
  ],
  "default_printing_id": "P000937",
  "api_url": "https://api.kairosarchive.net/v3/cards/C000230.json",
  "kairos_url": "https://kairosarchive.net/cards/C000230",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P000937.073378d31e35.small.webp",
   "normal": "https://api.kairosarchive.net/images/P000937.073378d31e35.normal.webp",
   "large": "https://api.kairosarchive.net/images/P000937.073378d31e35.large.webp",
   "original": "https://api.kairosarchive.net/images/P000937.073378d31e35.original.png"
  },
  "image_status": "lowres",
  "printings": [
   {
    "printing_id": "P000935",
    "slug": "001-polar_bears-b-s",
    "set_code": "001",
    "set_name": "Alpha",
    "released_at": "2023-06-22",
    "product": "Booster",
    "finish": "Standard",
    "printed_as_current": true,
    "retired_at": null
   },
   {
    "printing_id": "P000936",
    "slug": "001-polar_bears-b-f",
    "set_code": "001",
    "set_name": "Alpha",
    "released_at": "2023-06-22",
    "product": "Booster",
    "finish": "Foil",
    "printed_as_current": true,
    "retired_at": null
   },
   {
    "printing_id": "P000937",
    "slug": "002-polar_bears-b-s",
    "set_code": "002",
    "set_name": "Beta",
    "released_at": "2023-10-06",
    "product": "Booster",
    "finish": "Standard",
    "printed_as_current": true,
    "retired_at": null
   },
   {
    "printing_id": "P000938",
    "slug": "002-polar_bears-b-f",
    "set_code": "002",
    "set_name": "Beta",
    "released_at": "2023-10-06",
    "product": "Booster",
    "finish": "Foil",
    "printed_as_current": true,
    "retired_at": null
   }
  ],
  "name_history": [
   {
    "name": "Polar Bears",
    "valid_from": "2026-08-19",
    "valid_to": null
   }
  ],
  "card_history": [
   {
    "valid_from": "2026-08-19",
    "valid_to": null,
    "source": "api",
    "type": "Minion",
    "category": "Spell",
    "rarity": "Ordinary",
    "slot": "Ordinary",
    "subtypes": [
     "Beast"
    ],
    "elements": [
     "Water"
    ],
    "keywords": [],
    "umbrellas": [],
    "cost": 2,
    "attack": 2,
    "defense": 2,
    "power": 2,
    "life": null,
    "thr_air": 0,
    "thr_earth": 0,
    "thr_fire": 0,
    "thr_water": 1,
    "rules_text": "Can move as if the top and bottom edges of the realm were connected.",
    "back": null
   }
  ]
 },
 "C000429": {
  "codex_id": "C000429",
  "name": "Black Knight",
  "type": "Minion",
  "category": "Spell",
  "rarity": "Exceptional",
  "slot": "Exceptional",
  "subtypes": [
   "Mortal"
  ],
  "elements": [
   "Fire",
   "Water"
  ],
  "keywords": [],
  "umbrellas": [
   "Knight"
  ],
  "cost": 5,
  "attack": 5,
  "defense": 3,
  "power": 4,
  "life": null,
  "thr_air": 0,
  "thr_earth": 0,
  "thr_fire": 1,
  "thr_water": 1,
  "rules_text": "Costs (2) less to cast if you have more life than each opponent.",
  "back": null,
  "errata": false,
  "set_codes": [
   "004"
  ],
  "printing_ids": [
   "P001700",
   "P001701"
  ],
  "default_printing_id": "P001700",
  "api_url": "https://api.kairosarchive.net/v3/cards/C000429.json",
  "kairos_url": "https://kairosarchive.net/cards/C000429",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001700.edac6e940026.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001700.edac6e940026.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001700.edac6e940026.large.webp",
   "original": "https://api.kairosarchive.net/images/P001700.edac6e940026.original.png"
  },
  "image_status": "ok",
  "printings": [
   {
    "printing_id": "P001700",
    "slug": "004-black_knight-b-s",
    "set_code": "004",
    "set_name": "Arthurian Legends",
    "released_at": "2024-08-16",
    "product": "Booster",
    "finish": "Standard",
    "printed_as_current": true,
    "retired_at": null
   },
   {
    "printing_id": "P001701",
    "slug": "004-black_knight-b-f",
    "set_code": "004",
    "set_name": "Arthurian Legends",
    "released_at": "2024-08-16",
    "product": "Booster",
    "finish": "Foil",
    "printed_as_current": true,
    "retired_at": null
   }
  ],
  "name_history": [
   {
    "name": "Black Knight",
    "valid_from": "2026-08-19",
    "valid_to": null
   }
  ],
  "card_history": [
   {
    "valid_from": "2026-08-19",
    "valid_to": null,
    "source": "api",
    "type": "Minion",
    "category": "Spell",
    "rarity": "Exceptional",
    "slot": "Exceptional",
    "subtypes": [
     "Mortal"
    ],
    "elements": [
     "Fire",
     "Water"
    ],
    "keywords": [],
    "umbrellas": [
     "Knight"
    ],
    "cost": 5,
    "attack": 5,
    "defense": 3,
    "power": 4,
    "life": null,
    "thr_air": 0,
    "thr_earth": 0,
    "thr_fire": 1,
    "thr_water": 1,
    "rules_text": "Costs (2) less to cast if you have more life than each opponent.",
    "back": null
   }
  ]
 },
 "C000455": {
  "codex_id": "C000455",
  "name": "Dame Britomart",
  "type": "Minion",
  "category": "Spell",
  "rarity": "Unique",
  "slot": "Elite",
  "subtypes": [
   "Mortal"
  ],
  "elements": [
   "Air",
   "Earth",
   "Water"
  ],
  "keywords": [
   "Lance"
  ],
  "umbrellas": [
   "Knight"
  ],
  "cost": 5,
  "attack": 3,
  "defense": 5,
  "power": 4,
  "life": null,
  "thr_air": 1,
  "thr_earth": 1,
  "thr_fire": 0,
  "thr_water": 2,
  "rules_text": "Lance\nIf Dame Britomart would successfully attack an enemy site, she may summon a Mortal from your cemetery to her location instead.",
  "back": null,
  "errata": false,
  "set_codes": [
   "004"
  ],
  "printing_ids": [
   "P001754",
   "P001755"
  ],
  "default_printing_id": "P001754",
  "api_url": "https://api.kairosarchive.net/v3/cards/C000455.json",
  "kairos_url": "https://kairosarchive.net/cards/C000455",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001754.3faaa315d7d2.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001754.3faaa315d7d2.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001754.3faaa315d7d2.large.webp",
   "original": "https://api.kairosarchive.net/images/P001754.3faaa315d7d2.original.png"
  },
  "image_status": "ok",
  "printings": [
   {
    "printing_id": "P001754",
    "slug": "004-dame_britomart-b-s",
    "set_code": "004",
    "set_name": "Arthurian Legends",
    "released_at": "2024-08-16",
    "product": "Booster",
    "finish": "Standard",
    "printed_as_current": true,
    "retired_at": null
   },
   {
    "printing_id": "P001755",
    "slug": "004-dame_britomart-b-f",
    "set_code": "004",
    "set_name": "Arthurian Legends",
    "released_at": "2024-08-16",
    "product": "Booster",
    "finish": "Foil",
    "printed_as_current": true,
    "retired_at": null
   }
  ],
  "name_history": [
   {
    "name": "Dame Britomart",
    "valid_from": "2026-08-19",
    "valid_to": null
   }
  ],
  "card_history": [
   {
    "valid_from": "2026-08-19",
    "valid_to": null,
    "source": "api",
    "type": "Minion",
    "category": "Spell",
    "rarity": "Unique",
    "slot": "Elite",
    "subtypes": [
     "Mortal"
    ],
    "elements": [
     "Air",
     "Earth",
     "Water"
    ],
    "keywords": [
     "Lance"
    ],
    "umbrellas": [
     "Knight"
    ],
    "cost": 5,
    "attack": 3,
    "defense": 5,
    "power": 4,
    "life": null,
    "thr_air": 1,
    "thr_earth": 1,
    "thr_fire": 0,
    "thr_water": 2,
    "rules_text": "Lance\nIf Dame Britomart would successfully attack an enemy site, she may summon a Mortal from your cemetery to her location instead.",
    "back": null
   }
  ]
 },
 "C000927": {
  "codex_id": "C000927",
  "name": "Moss Troll",
  "type": "Minion",
  "category": "Spell",
  "rarity": "Ordinary",
  "slot": "Ordinary",
  "subtypes": [
   "Giant"
  ],
  "elements": [
   "Water"
  ],
  "keywords": [
   "Stealth"
  ],
  "umbrellas": [],
  "cost": 3,
  "attack": 3,
  "defense": 3,
  "power": 3,
  "life": null,
  "thr_air": 0,
  "thr_earth": 0,
  "thr_fire": 0,
  "thr_water": 1,
  "rules_text": "Stealth\nLoses Stealth if it moves.",
  "back": null,
  "errata": true,
  "set_codes": [
   "006"
  ],
  "printing_ids": [
   "P002719",
   "P002720"
  ],
  "default_printing_id": "P002719",
  "api_url": "https://api.kairosarchive.net/v3/cards/C000927.json",
  "kairos_url": "https://kairosarchive.net/cards/C000927",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P002719.88fae93d94ba.small.webp",
   "normal": "https://api.kairosarchive.net/images/P002719.88fae93d94ba.normal.webp",
   "large": "https://api.kairosarchive.net/images/P002719.88fae93d94ba.large.webp",
   "original": "https://api.kairosarchive.net/images/P002719.88fae93d94ba.original.png"
  },
  "image_status": "ok",
  "printings": [
   {
    "printing_id": "P002719",
    "slug": "006-moss_troll-b-s",
    "set_code": "006",
    "set_name": "Gothic",
    "released_at": "2025-12-05",
    "product": "Booster",
    "finish": "Standard",
    "printed_as_current": true,
    "retired_at": null
   },
   {
    "printing_id": "P002720",
    "slug": "006-moss_troll-b-f",
    "set_code": "006",
    "set_name": "Gothic",
    "released_at": "2025-12-05",
    "product": "Booster",
    "finish": "Foil",
    "printed_as_current": true,
    "retired_at": null
   }
  ],
  "name_history": [
   {
    "name": "Moss Troll of the Fen",
    "valid_from": "2025-12-05",
    "valid_to": "2026-01-10"
   },
   {
    "name": "Moss Troll",
    "valid_from": "2026-01-10",
    "valid_to": null
   }
  ],
  "card_history": [
   {
    "valid_from": "2025-12-05",
    "valid_to": "2026-09-15",
    "source": "card",
    "type": "Minion",
    "category": "Spell",
    "rarity": "Ordinary",
    "slot": "Ordinary",
    "subtypes": [
     "Giant"
    ],
    "elements": [
     "Water"
    ],
    "keywords": [
     "Stealth"
    ],
    "umbrellas": [],
    "cost": 4,
    "attack": 3,
    "defense": 3,
    "power": 3,
    "life": null,
    "thr_air": 0,
    "thr_earth": 0,
    "thr_fire": 0,
    "thr_water": 1,
    "rules_text": "Stealth\nLoses Stealth if it moves or attacks.",
    "back": null
   },
   {
    "valid_from": "2026-09-15",
    "valid_to": null,
    "source": "api",
    "type": "Minion",
    "category": "Spell",
    "rarity": "Ordinary",
    "slot": "Ordinary",
    "subtypes": [
     "Giant"
    ],
    "elements": [
     "Water"
    ],
    "keywords": [
     "Stealth"
    ],
    "umbrellas": [],
    "cost": 3,
    "attack": 3,
    "defense": 3,
    "power": 3,
    "life": null,
    "thr_air": 0,
    "thr_earth": 0,
    "thr_fire": 0,
    "thr_water": 1,
    "rules_text": "Stealth\nLoses Stealth if it moves.",
    "back": null
   }
  ]
 },
 "C000459": {
  "codex_id": "C000459",
  "name": "Druid",
  "type": "Avatar",
  "category": "Avatar",
  "rarity": null,
  "slot": "Unique",
  "subtypes": [],
  "elements": [
   "None"
  ],
  "keywords": [],
  "umbrellas": [],
  "cost": null,
  "attack": 1,
  "defense": 1,
  "power": 1,
  "life": 20,
  "thr_air": 0,
  "thr_earth": 0,
  "thr_fire": 0,
  "thr_water": 0,
  "rules_text": "Tap → Play or draw a site. If this is your first turn, summon Tawny here.\nTap → Summon Bruin here. Flip this card.",
  "back": {
   "type": "Avatar",
   "category": "Avatar",
   "rarity": null,
   "slot": "Ordinary",
   "subtypes": [],
   "elements": [
    "None"
   ],
   "keywords": [],
   "umbrellas": [],
   "cost": null,
   "attack": 1,
   "defense": 1,
   "power": 1,
   "life": 20,
   "thr_air": 0,
   "thr_earth": 0,
   "thr_fire": 0,
   "thr_water": 0,
   "rules_text": "Tap → Play or draw a site.\nNearby allied sites have \"Whenever an enemy enters here, it takes 1 damage.\""
  },
  "errata": true,
  "set_codes": [
   "004",
   "999"
  ],
  "printing_ids": [
   "P001762",
   "P001763",
   "P001764"
  ],
  "default_printing_id": "P001762",
  "api_url": "https://api.kairosarchive.net/v3/cards/C000459.json",
  "kairos_url": "https://kairosarchive.net/cards/C000459",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001762.0057ae85dc7d.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001762.0057ae85dc7d.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001762.0057ae85dc7d.large.webp",
   "original": "https://api.kairosarchive.net/images/P001762.0057ae85dc7d.original.png"
  },
  "image_status": "lowres",
  "printings": [
   {
    "printing_id": "P001762",
    "slug": "004-druid-bt-s",
    "set_code": "004",
    "set_name": "Arthurian Legends",
    "released_at": "2024-08-16",
    "product": "BoxTopper",
    "finish": "Standard",
    "printed_as_current": false,
    "retired_at": null
   },
   {
    "printing_id": "P001763",
    "slug": "999-druid-d-f",
    "set_code": "999",
    "set_name": "Promo",
    "released_at": null,
    "product": "Dust",
    "finish": "Foil",
    "printed_as_current": false,
    "retired_at": null
   },
   {
    "printing_id": "P001764",
    "slug": "999-druid-op-rf",
    "set_code": "999",
    "set_name": "Promo",
    "released_at": null,
    "product": "OrganizedPlay",
    "finish": "Rainbow",
    "printed_as_current": true,
    "retired_at": null
   }
  ],
  "name_history": [
   {
    "name": "Druid",
    "valid_from": "2026-08-19",
    "valid_to": null
   }
  ],
  "card_history": [
   {
    "valid_from": "2026-08-19",
    "valid_to": null,
    "source": "api",
    "type": "Avatar",
    "category": "Avatar",
    "rarity": null,
    "slot": "Unique",
    "subtypes": [],
    "elements": [
     "None"
    ],
    "keywords": [],
    "umbrellas": [],
    "cost": null,
    "attack": 1,
    "defense": 1,
    "power": 1,
    "life": 20,
    "thr_air": 0,
    "thr_earth": 0,
    "thr_fire": 0,
    "thr_water": 0,
    "rules_text": "Tap → Play or draw a site. If this is your first turn, summon Tawny here.\nTap → Summon Bruin here. Flip this card.",
    "back": {
     "type": "Avatar",
     "category": "Avatar",
     "rarity": null,
     "slot": "Ordinary",
     "subtypes": [],
     "elements": [
      "None"
     ],
     "keywords": [],
     "umbrellas": [],
     "cost": null,
     "attack": 1,
     "defense": 1,
     "power": 1,
     "life": 20,
     "thr_air": 0,
     "thr_earth": 0,
     "thr_fire": 0,
     "thr_water": 0,
     "rules_text": "Tap → Play or draw a site.\nNearby allied sites have \"Whenever an enemy enters here, it takes 1 damage.\""
    }
   }
  ]
 },
 "C000393": {
  "codex_id": "C000393",
  "name": "Avatar of Air",
  "type": "Avatar",
  "category": "Avatar",
  "rarity": null,
  "slot": "Unique",
  "subtypes": [],
  "elements": [
   "None"
  ],
  "keywords": [],
  "umbrellas": [],
  "cost": null,
  "attack": 1,
  "defense": 1,
  "power": 1,
  "life": 20,
  "thr_air": 0,
  "thr_earth": 0,
  "thr_fire": 0,
  "thr_water": 0,
  "rules_text": "Tap → Play or draw a site.\nOnce on your turn, if you occupy an Air site, you may fly a unit atop it to a nearby site.",
  "back": null,
  "errata": false,
  "set_codes": [
   "001",
   "999"
  ],
  "printing_ids": [
   "P001590",
   "P001591",
   "P001592"
  ],
  "default_printing_id": "P001591",
  "api_url": "https://api.kairosarchive.net/v3/cards/C000393.json",
  "kairos_url": "https://kairosarchive.net/cards/C000393",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001591.501f843e1d8b.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001591.501f843e1d8b.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001591.501f843e1d8b.large.webp",
   "original": "https://api.kairosarchive.net/images/P001591.501f843e1d8b.original.png"
  },
  "image_status": "lowres",
  "printings": [
   {
    "printing_id": "P001590",
    "slug": "001-avatar_of_air-pd-s",
    "set_code": "001",
    "set_name": "Alpha",
    "released_at": "2023-06-22",
    "product": "PreconstructedDeck",
    "finish": "Standard",
    "printed_as_current": true,
    "retired_at": null
   },
   {
    "printing_id": "P001591",
    "slug": "001-avatar_of_air-b-f",
    "set_code": "001",
    "set_name": "Alpha",
    "released_at": "2023-06-22",
    "product": "Booster",
    "finish": "Foil",
    "printed_as_current": true,
    "retired_at": null
   },
   {
    "printing_id": "P001592",
    "slug": "999-avatar_of_air-op-rf",
    "set_code": "999",
    "set_name": "Promo",
    "released_at": null,
    "product": "OrganizedPlay",
    "finish": "Rainbow",
    "printed_as_current": true,
    "retired_at": null
   }
  ],
  "name_history": [
   {
    "name": "Avatar of Air",
    "valid_from": "2026-08-19",
    "valid_to": null
   }
  ],
  "card_history": [
   {
    "valid_from": "2026-08-19",
    "valid_to": null,
    "source": "api",
    "type": "Avatar",
    "category": "Avatar",
    "rarity": null,
    "slot": "Unique",
    "subtypes": [],
    "elements": [
     "None"
    ],
    "keywords": [],
    "umbrellas": [],
    "cost": null,
    "attack": 1,
    "defense": 1,
    "power": 1,
    "life": 20,
    "thr_air": 0,
    "thr_earth": 0,
    "thr_fire": 0,
    "thr_water": 0,
    "rules_text": "Tap → Play or draw a site.\nOnce on your turn, if you occupy an Air site, you may fly a unit atop it to a nearby site.",
    "back": null
   }
  ]
 }
};
export const printings: Record<string, unknown> = {
 "P000935": {
  "printing_id": "P000935",
  "codex_id": "C000230",
  "card_name": "Polar Bears",
  "set_name": "Alpha",
  "set_code": "001",
  "released_at": "2023-06-22",
  "product": "Booster",
  "finish": "Standard",
  "slug": "001-polar_bears-b-s",
  "artist": "Melissa A. Benson",
  "artist_slug": "melissa_a_benson",
  "flavour_text": "",
  "typeline": "Ordinary Beasts of extreme latitudes",
  "back": null,
  "image_hash": "a9144178cf37",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P000935.json",
  "kairos_url": "https://kairosarchive.net/printings/P000935",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P000935.a9144178cf37.small.webp",
   "normal": "https://api.kairosarchive.net/images/P000935.a9144178cf37.normal.webp",
   "large": "https://api.kairosarchive.net/images/P000935.a9144178cf37.large.webp",
   "original": "https://api.kairosarchive.net/images/P000935.a9144178cf37.original.png"
  },
  "image_status": "lowres"
 },
 "P000936": {
  "printing_id": "P000936",
  "codex_id": "C000230",
  "card_name": "Polar Bears",
  "set_name": "Alpha",
  "set_code": "001",
  "released_at": "2023-06-22",
  "product": "Booster",
  "finish": "Foil",
  "slug": "001-polar_bears-b-f",
  "artist": "Melissa A. Benson",
  "artist_slug": "melissa_a_benson",
  "flavour_text": "",
  "typeline": "Ordinary Beasts of extreme latitudes",
  "back": null,
  "image_hash": "57deb5366b81",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P000936.json",
  "kairos_url": "https://kairosarchive.net/printings/P000936",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P000936.57deb5366b81.small.webp",
   "normal": "https://api.kairosarchive.net/images/P000936.57deb5366b81.normal.webp",
   "large": "https://api.kairosarchive.net/images/P000936.57deb5366b81.large.webp",
   "original": "https://api.kairosarchive.net/images/P000936.57deb5366b81.original.png"
  },
  "image_status": "lowres"
 },
 "P000937": {
  "printing_id": "P000937",
  "codex_id": "C000230",
  "card_name": "Polar Bears",
  "set_name": "Beta",
  "set_code": "002",
  "released_at": "2023-10-06",
  "product": "Booster",
  "finish": "Standard",
  "slug": "002-polar_bears-b-s",
  "artist": "Melissa A. Benson",
  "artist_slug": "melissa_a_benson",
  "flavour_text": "",
  "typeline": "Ordinary Beasts of extreme latitudes",
  "back": null,
  "image_hash": "073378d31e35",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P000937.json",
  "kairos_url": "https://kairosarchive.net/printings/P000937",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P000937.073378d31e35.small.webp",
   "normal": "https://api.kairosarchive.net/images/P000937.073378d31e35.normal.webp",
   "large": "https://api.kairosarchive.net/images/P000937.073378d31e35.large.webp",
   "original": "https://api.kairosarchive.net/images/P000937.073378d31e35.original.png"
  },
  "image_status": "lowres"
 },
 "P000938": {
  "printing_id": "P000938",
  "codex_id": "C000230",
  "card_name": "Polar Bears",
  "set_name": "Beta",
  "set_code": "002",
  "released_at": "2023-10-06",
  "product": "Booster",
  "finish": "Foil",
  "slug": "002-polar_bears-b-f",
  "artist": "Melissa A. Benson",
  "artist_slug": "melissa_a_benson",
  "flavour_text": "",
  "typeline": "Ordinary Beasts of extreme latitudes",
  "back": null,
  "image_hash": "21c3fa0620e5",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P000938.json",
  "kairos_url": "https://kairosarchive.net/printings/P000938",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P000938.21c3fa0620e5.small.webp",
   "normal": "https://api.kairosarchive.net/images/P000938.21c3fa0620e5.normal.webp",
   "large": "https://api.kairosarchive.net/images/P000938.21c3fa0620e5.large.webp",
   "original": "https://api.kairosarchive.net/images/P000938.21c3fa0620e5.original.png"
  },
  "image_status": "lowres"
 },
 "P001590": {
  "printing_id": "P001590",
  "codex_id": "C000393",
  "card_name": "Avatar of Air",
  "set_name": "Alpha",
  "set_code": "001",
  "released_at": "2023-06-22",
  "product": "PreconstructedDeck",
  "finish": "Standard",
  "slug": "001-avatar_of_air-pd-s",
  "artist": "Séverine Pineaux",
  "artist_slug": "severine_pineaux",
  "flavour_text": "",
  "typeline": "Your Avatar of soaring ambition",
  "back": null,
  "image_hash": "a85ae766a526",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P001590.json",
  "kairos_url": "https://kairosarchive.net/printings/P001590",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001590.a85ae766a526.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001590.a85ae766a526.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001590.a85ae766a526.large.webp",
   "original": "https://api.kairosarchive.net/images/P001590.a85ae766a526.original.png"
  },
  "image_status": "lowres"
 },
 "P001591": {
  "printing_id": "P001591",
  "codex_id": "C000393",
  "card_name": "Avatar of Air",
  "set_name": "Alpha",
  "set_code": "001",
  "released_at": "2023-06-22",
  "product": "Booster",
  "finish": "Foil",
  "slug": "001-avatar_of_air-b-f",
  "artist": "Séverine Pineaux",
  "artist_slug": "severine_pineaux",
  "flavour_text": "",
  "typeline": "Your Avatar of soaring ambition",
  "back": null,
  "image_hash": "501f843e1d8b",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P001591.json",
  "kairos_url": "https://kairosarchive.net/printings/P001591",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001591.501f843e1d8b.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001591.501f843e1d8b.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001591.501f843e1d8b.large.webp",
   "original": "https://api.kairosarchive.net/images/P001591.501f843e1d8b.original.png"
  },
  "image_status": "lowres"
 },
 "P001592": {
  "printing_id": "P001592",
  "codex_id": "C000393",
  "card_name": "Avatar of Air",
  "set_name": "Promo",
  "set_code": "999",
  "released_at": "2025-08-01",
  "product": "OrganizedPlay",
  "finish": "Rainbow",
  "slug": "999-avatar_of_air-op-rf",
  "artist": "Séverine Pineaux",
  "artist_slug": "severine_pineaux",
  "flavour_text": "",
  "typeline": "Your Avatar soared as high as its ambitions",
  "back": null,
  "image_hash": "ccd6f2b1afd2",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P001592.json",
  "kairos_url": "https://kairosarchive.net/printings/P001592",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001592.ccd6f2b1afd2.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001592.ccd6f2b1afd2.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001592.ccd6f2b1afd2.large.webp",
   "original": "https://api.kairosarchive.net/images/P001592.ccd6f2b1afd2.original.png"
  },
  "image_status": "ok"
 },
 "P001700": {
  "printing_id": "P001700",
  "codex_id": "C000429",
  "card_name": "Black Knight",
  "set_name": "Arthurian Legends",
  "set_code": "004",
  "released_at": "2024-10-04",
  "product": "Booster",
  "finish": "Standard",
  "slug": "004-black_knight-b-s",
  "artist": "Tony Szczudlo",
  "artist_slug": "tony_szczudlo",
  "flavour_text": "",
  "typeline": "An Exceptional Mortal sides with the strong",
  "back": null,
  "image_hash": "edac6e940026",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P001700.json",
  "kairos_url": "https://kairosarchive.net/printings/P001700",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001700.edac6e940026.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001700.edac6e940026.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001700.edac6e940026.large.webp",
   "original": "https://api.kairosarchive.net/images/P001700.edac6e940026.original.png"
  },
  "image_status": "ok"
 },
 "P001701": {
  "printing_id": "P001701",
  "codex_id": "C000429",
  "card_name": "Black Knight",
  "set_name": "Arthurian Legends",
  "set_code": "004",
  "released_at": "2024-10-04",
  "product": "Booster",
  "finish": "Foil",
  "slug": "004-black_knight-b-f",
  "artist": "Tony Szczudlo",
  "artist_slug": "tony_szczudlo",
  "flavour_text": "",
  "typeline": "An Exceptional Mortal sides with the strong",
  "back": null,
  "image_hash": "d760d598028d",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P001701.json",
  "kairos_url": "https://kairosarchive.net/printings/P001701",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001701.d760d598028d.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001701.d760d598028d.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001701.d760d598028d.large.webp",
   "original": "https://api.kairosarchive.net/images/P001701.d760d598028d.original.png"
  },
  "image_status": "ok"
 },
 "P001754": {
  "printing_id": "P001754",
  "codex_id": "C000455",
  "card_name": "Dame Britomart",
  "set_name": "Arthurian Legends",
  "set_code": "004",
  "released_at": "2024-10-04",
  "product": "Booster",
  "finish": "Standard",
  "slug": "004-dame_britomart-b-s",
  "artist": "Drew Tucker",
  "artist_slug": "drew_tucker",
  "flavour_text": "",
  "typeline": "A Unique Mortal on a rescue mission",
  "back": null,
  "image_hash": "3faaa315d7d2",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P001754.json",
  "kairos_url": "https://kairosarchive.net/printings/P001754",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001754.3faaa315d7d2.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001754.3faaa315d7d2.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001754.3faaa315d7d2.large.webp",
   "original": "https://api.kairosarchive.net/images/P001754.3faaa315d7d2.original.png"
  },
  "image_status": "ok"
 },
 "P001755": {
  "printing_id": "P001755",
  "codex_id": "C000455",
  "card_name": "Dame Britomart",
  "set_name": "Arthurian Legends",
  "set_code": "004",
  "released_at": "2024-10-04",
  "product": "Booster",
  "finish": "Foil",
  "slug": "004-dame_britomart-b-f",
  "artist": "Drew Tucker",
  "artist_slug": "drew_tucker",
  "flavour_text": "",
  "typeline": "A Unique Mortal on a rescue mission",
  "back": null,
  "image_hash": "07514878aad6",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P001755.json",
  "kairos_url": "https://kairosarchive.net/printings/P001755",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001755.07514878aad6.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001755.07514878aad6.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001755.07514878aad6.large.webp",
   "original": "https://api.kairosarchive.net/images/P001755.07514878aad6.original.png"
  },
  "image_status": "ok"
 },
 "P001762": {
  "printing_id": "P001762",
  "codex_id": "C000459",
  "card_name": "Druid",
  "set_name": "Arthurian Legends",
  "set_code": "004",
  "released_at": "2024-10-04",
  "product": "BoxTopper",
  "finish": "Standard",
  "slug": "004-druid-bt-s",
  "artist": "Bryon Wackwitz",
  "artist_slug": "bryon_wackwitz",
  "flavour_text": "",
  "typeline": "Your Avatar watches over this domain",
  "back": {
   "artist": "Bryon Wackwitz",
   "artist_slug": "bryon_wackwitz",
   "flavour_text": null,
   "typeline": "Your Avatar is a force of nature!",
   "image_urls": {
    "small": "https://api.kairosarchive.net/images/P001762.d15b93a24912.back.small.webp",
    "normal": "https://api.kairosarchive.net/images/P001762.d15b93a24912.back.normal.webp",
    "large": "https://api.kairosarchive.net/images/P001762.d15b93a24912.back.large.webp",
    "original": "https://api.kairosarchive.net/images/P001762.d15b93a24912.back.original.png"
   }
  },
  "image_hash": "0057ae85dc7d",
  "printed_as_current": false,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P001762.json",
  "kairos_url": "https://kairosarchive.net/printings/P001762",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001762.0057ae85dc7d.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001762.0057ae85dc7d.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001762.0057ae85dc7d.large.webp",
   "original": "https://api.kairosarchive.net/images/P001762.0057ae85dc7d.original.png"
  },
  "image_status": "lowres"
 },
 "P001763": {
  "printing_id": "P001763",
  "codex_id": "C000459",
  "card_name": "Druid",
  "set_name": "Promo",
  "set_code": "999",
  "released_at": "2025-06-06",
  "product": "Dust",
  "finish": "Foil",
  "slug": "999-druid-d-f",
  "artist": "Bryon Wackwitz",
  "artist_slug": "bryon_wackwitz",
  "flavour_text": "",
  "typeline": "Your Avatar watches over this domain",
  "back": {
   "artist": "Bryon Wackwitz",
   "artist_slug": "bryon_wackwitz",
   "flavour_text": null,
   "typeline": "Your Avatar is a force of nature!",
   "image_urls": {
    "small": "https://api.kairosarchive.net/images/P001763.76bda36b60ab.back.small.webp",
    "normal": "https://api.kairosarchive.net/images/P001763.76bda36b60ab.back.normal.webp",
    "large": "https://api.kairosarchive.net/images/P001763.76bda36b60ab.back.large.webp",
    "original": "https://api.kairosarchive.net/images/P001763.76bda36b60ab.back.original.png"
   }
  },
  "image_hash": "4633486d139a",
  "printed_as_current": false,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P001763.json",
  "kairos_url": "https://kairosarchive.net/printings/P001763",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001763.4633486d139a.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001763.4633486d139a.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001763.4633486d139a.large.webp",
   "original": "https://api.kairosarchive.net/images/P001763.4633486d139a.original.png"
  },
  "image_status": "lowres"
 },
 "P001764": {
  "printing_id": "P001764",
  "codex_id": "C000459",
  "card_name": "Druid",
  "set_name": "Promo",
  "set_code": "999",
  "released_at": "2025-08-01",
  "product": "OrganizedPlay",
  "finish": "Rainbow",
  "slug": "999-druid-op-rf",
  "artist": "Bryon Wackwitz",
  "artist_slug": "bryon_wackwitz",
  "flavour_text": "",
  "typeline": "Your Avatar was a force of nature",
  "back": null,
  "image_hash": "f570692d20e0",
  "printed_as_current": null,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P001764.json",
  "kairos_url": "https://kairosarchive.net/printings/P001764",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P001764.f570692d20e0.small.webp",
   "normal": "https://api.kairosarchive.net/images/P001764.f570692d20e0.normal.webp",
   "large": "https://api.kairosarchive.net/images/P001764.f570692d20e0.large.webp",
   "original": "https://api.kairosarchive.net/images/P001764.f570692d20e0.original.png"
  },
  "image_status": "ok"
 },
 "P002719": {
  "printing_id": "P002719",
  "codex_id": "C000927",
  "card_name": "Moss Troll",
  "set_name": "Gothic",
  "set_code": "006",
  "released_at": "2025-12-05",
  "product": "Booster",
  "finish": "Standard",
  "slug": "006-moss_troll-b-s",
  "artist": "Dan Seagrave",
  "artist_slug": "dan_seagrave",
  "flavour_text": "Moss grows fat on a troll in stone.",
  "typeline": "An Ordinary Giant rock, right?",
  "back": null,
  "image_hash": "88fae93d94ba",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P002719.json",
  "kairos_url": "https://kairosarchive.net/printings/P002719",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P002719.88fae93d94ba.small.webp",
   "normal": "https://api.kairosarchive.net/images/P002719.88fae93d94ba.normal.webp",
   "large": "https://api.kairosarchive.net/images/P002719.88fae93d94ba.large.webp",
   "original": "https://api.kairosarchive.net/images/P002719.88fae93d94ba.original.png"
  },
  "image_status": "ok"
 },
 "P002720": {
  "printing_id": "P002720",
  "codex_id": "C000927",
  "card_name": "Moss Troll",
  "set_name": "Gothic",
  "set_code": "006",
  "released_at": "2025-12-05",
  "product": "Booster",
  "finish": "Foil",
  "slug": "006-moss_troll-b-f",
  "artist": "Dan Seagrave",
  "artist_slug": "dan_seagrave",
  "flavour_text": "Moss grows fat on a troll in stone.",
  "typeline": "An Ordinary Giant rock, right?",
  "back": null,
  "image_hash": "e40a1789085a",
  "printed_as_current": true,
  "retired_at": null,
  "api_url": "https://api.kairosarchive.net/v3/printings/P002720.json",
  "kairos_url": "https://kairosarchive.net/printings/P002720",
  "image_urls": {
   "small": "https://api.kairosarchive.net/images/P002720.e40a1789085a.small.webp",
   "normal": "https://api.kairosarchive.net/images/P002720.e40a1789085a.normal.webp",
   "large": "https://api.kairosarchive.net/images/P002720.e40a1789085a.large.webp",
   "original": "https://api.kairosarchive.net/images/P002720.e40a1789085a.original.png"
  },
  "image_status": "ok"
 }
};
