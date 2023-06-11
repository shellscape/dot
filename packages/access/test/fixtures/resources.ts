/* eslint-disable sort-keys */

export const RESOURCES = {
  CONFIGURATION: 'configuration',
  FILE: 'file',
  USER: 'user',
  ORDER: 'order',
  PRODUCT: 'product'
};

export const USERS = [
  {
    id: 1,
    firstName: 'Benny',
    lastName: 'Fowlie',
    email: 'bfowlie0@sciencedirect.com',
    password: 'c85c4ac157d5eef97e468defe65986aec9746b4b',
    address: {
      country: 'Canada',
      city: 'Gjoa Haven',
      street: '95 Golf Course Court',
      location: [-8.0604636, 15.3487537]
    },
    timezone: 'America/Regina',
    isActive: true,
    updatedAt: '2022-02-07T00:31:19Z',
    createAt: '2022-02-08T11:56:02Z'
  },
  {
    id: 2,
    firstName: 'Dari',
    lastName: 'Runnalls',
    email: 'drunnalls1@timesonline.co.uk',
    password: 'c9e030ae28d72c4d5aa0b563c31bd682b267ec22',
    address: {
      country: 'China',
      city: 'Jianxin',
      street: '76333 Milwaukee Terrace',
      location: [21.5500232, 1.7488388]
    },
    timezone: 'Asia/Chongqing',
    isActive: false,
    updatedAt: '2022-05-25T13:53:55Z',
    createAt: '2021-11-13T20:17:17Z'
  },
  {
    id: 3,
    firstName: 'Stacia',
    lastName: 'Droogan',
    email: 'sdroogan2@ucoz.ru',
    password: 'f028eead33f27b932f98bdf457277a26c975b350',
    address: {
      country: 'Peru',
      city: 'Huacrapuquio',
      street: '63 Rowland Point',
      location: [59.3433282, -8.3251]
    },
    timezone: 'America/Lima',
    isActive: false,
    updatedAt: '2022-06-26T18:36:35Z',
    createAt: '2021-12-05T12:35:34Z'
  },
  {
    id: 4,
    firstName: 'Ruthi',
    lastName: 'Venton',
    email: 'rventon3@liveinternet.ru',
    password: '8e36a12e523709693f09efab2535a891d23b3c99',
    address: {
      country: 'Russia',
      city: 'Cheremshan',
      street: '49238 Jenifer Place',
      location: [-8.6470988, 40.207475]
    },
    timezone: 'Europe/Moscow',
    isActive: false,
    updatedAt: '2022-06-23T17:30:54Z',
    createAt: '2022-04-22T09:40:42Z'
  },
  {
    id: 5,
    firstName: 'Padget',
    lastName: 'Bettanay',
    email: 'pbettanay4@sohu.com',
    password: '1eb78f170c480eedeb2f9daf81ed68841506ef1f',
    address: {
      country: 'China',
      city: 'Hezhi',
      street: '1707 Rigney Drive',
      location: [32.016539, 49.62406]
    },
    timezone: 'Asia/Shanghai',
    isActive: true,
    updatedAt: '2021-12-03T05:23:00Z',
    createAt: '2021-09-28T02:56:34Z'
  }
];

export const PRODUCTS = [
  {
    id: 1,
    authorId: 1,
    name: 'Wine La Vielle Ferme Cote Du',
    category: 'Home',
    brand: 'Norwegian Cruise Line Holdings Ltd.',
    description: 'eget elit sodales scelerisque mauris sit amet eros',
    sku: 2408,
    price: 36.68,
    image: 'http://dummyimage.com/135x100.png/5fa2dd/ffffff',
    isActive: false,
    updatedAt: new Date('2022-01-01T23:33:15Z'),
    createdAt: new Date('2021-11-25T07:31:14Z')
  },
  {
    id: 2,
    authorId: 9,
    name: 'Almonds Ground Blanched',
    category: 'Toys',
    brand: 'American International Group, Inc.',
    description: 'et magnis dis parturient montes nascetur',
    sku: 7463,
    price: 14.01,
    image: 'http://dummyimage.com/125x100.png/cc0000/ffffff',
    isActive: false,
    updatedAt: '2022-03-27T11:56:12Z',
    createdAt: '2021-08-27T17:21:29Z'
  },
  {
    id: 3,
    authorId: 8,
    name: 'Iced Tea Concentrate',
    category: 'Shoes',
    brand: 'Amkor Technology, Inc.',
    description: 'potenti cras',
    sku: 194,
    price: 82.14,
    image: 'http://dummyimage.com/247x100.png/ff4444/ffffff',
    isActive: true,
    updatedAt: '2022-04-02T00:24:20Z',
    createdAt: '2021-09-12T10:34:24Z'
  },
  {
    id: 4,
    authorId: 6,
    name: 'Vodka - Moskovskaya',
    category: 'Grocery',
    brand: 'Geron Corporation',
    description: 'id nulla',
    sku: 7051,
    price: 62.54,
    image: 'http://dummyimage.com/124x100.png/dddddd/000000',
    isActive: false,
    updatedAt: '2021-11-21T22:10:31Z',
    createdAt: '2022-02-12T03:37:25Z'
  },
  {
    id: 5,
    authorId: 3,
    name: 'Cheese - Mascarpone',
    category: 'Tools',
    brand: 'Guggenheim Enhanced Equity Income Fund',
    description: 'turpis nec euismod scelerisque quam turpis adipiscing lorem',
    sku: 164,
    price: 14.21,
    image: 'http://dummyimage.com/196x100.png/dddddd/000000',
    isActive: true,
    updatedAt: '2022-07-31T01:24:12Z',
    createdAt: '2021-11-23T09:16:45Z'
  },
  {
    id: 6,
    authorId: 1,
    name: 'Trueblue - Blueberry',
    category: 'Games',
    brand: 'BT Group plc',
    description: 'volutpat in',
    sku: 4700,
    price: 53.49,
    image: 'http://dummyimage.com/211x100.png/5fa2dd/ffffff',
    isActive: false,
    updatedAt: '2022-04-17T11:10:00Z',
    createdAt: '2022-08-11T08:31:15Z'
  },
  {
    id: 7,
    authorId: 2,
    name: 'Taro Leaves',
    category: 'Health',
    brand: 'FuelCell Energy, Inc.',
    description: 'pede malesuada in imperdiet et',
    sku: 4783,
    price: 53.37,
    image: 'http://dummyimage.com/109x100.png/dddddd/000000',
    isActive: false,
    updatedAt: '2021-12-12T17:21:44Z',
    createdAt: '2022-05-17T11:15:13Z'
  },
  {
    id: 8,
    authorId: 8,
    name: 'Pastry - Apple Muffins - Mini',
    category: 'Sports',
    brand: 'CBOE Holdings, Inc.',
    description: 'suspendisse potenti cras in purus eu magna vulputate',
    sku: 5745,
    price: 70.11,
    image: 'http://dummyimage.com/238x100.png/dddddd/000000',
    isActive: true,
    updatedAt: '2021-10-15T03:52:07Z',
    createdAt: '2021-12-20T07:07:35Z'
  },
  {
    id: 9,
    authorId: 6,
    name: 'Lettuce - Curly Endive',
    category: 'Industrial',
    brand: 'Putnam Managed Municipal Income Trust',
    description: 'id lobortis convallis',
    sku: 967,
    price: 2.17,
    image: 'http://dummyimage.com/214x100.png/ff4444/ffffff',
    isActive: true,
    updatedAt: '2022-07-25T11:58:40Z',
    createdAt: '2021-09-07T13:37:40Z'
  },
  {
    id: 10,
    authorId: 2,
    name: 'Bread - Pita, Mini',
    category: 'Music',
    brand: 'AudioCodes Ltd.',
    description: 'a odio in',
    sku: 4016,
    price: 42.05,
    image: 'http://dummyimage.com/122x100.png/dddddd/000000',
    isActive: false,
    updatedAt: '2022-01-11T17:07:16Z',
    createdAt: '2022-04-20T02:42:39Z'
  }
];

export const ORDERS = [
  {
    id: 1,
    userId: 3,
    number: 41474,
    status: 'completed',
    items: [
      {
        id: 5812,
        name: 'Lecidella granulata (H. Magn.) R.C. Harris',
        count: 3,
        price: 8.54
      }
    ],
    delivery: {
      name: 'Christy Hartland',
      phone: '363-256-3404',
      city: 'Póvoa',
      street: '3531 Walton Circle'
    },
    cost: {
      vat: 3.5868,
      price: 25.62,
      total: 29.2068
    },
    updatedAt: '2022-05-28T09:38:49Z',
    createdAt: '2022-06-04T13:13:45Z'
  },
  {
    id: 2,
    userId: 5,
    number: 87876,
    status: 'completed',
    items: [
      {
        id: 6247,
        name: 'Ferocactus hamatacanthus (Muehlenpf.) Britton & Rose var. hamatacanthus',
        count: 5,
        price: 51.61
      },
      {
        id: 2912,
        name: 'Achlys DC.',
        count: 9,
        price: 11.13
      }
    ],
    delivery: {
      name: 'Darryl Duprey',
      phone: '116-217-8261',
      city: 'Sagay',
      street: '72 Prentice Drive'
    },
    cost: {
      vat: 50.1508,
      price: 358.22,
      total: 408.3708
    },
    updatedAt: '2021-11-18T23:54:32Z',
    createdAt: '2022-07-01T19:20:47Z'
  },
  {
    id: 3,
    userId: 8,
    number: 83531,
    status: 'pending',
    items: [
      {
        id: 5243,
        name: 'Agalinis maritima (Raf.) Raf. var. grandiflora (Benth.) Shinners',
        count: 1,
        price: 56.34
      },
      {
        id: 3949,
        name: 'Tiquilia nuttallii (Hook.) A.T. Richardson',
        count: 10,
        price: 30.74
      },
      {
        id: 3004,
        name: 'Packera tridenticulata (Rydb.) W.A. Weber & Á. Löve',
        count: 1,
        price: 42.08
      }
    ],
    delivery: {
      name: 'Linc Pibsworth',
      phone: '118-806-9880',
      city: 'Ciudad del Este',
      street: '2 Ryan Court'
    },
    cost: {
      vat: 56.8148,
      price: 405.82,
      total: 462.6348
    },
    updatedAt: '2021-12-23T22:14:39Z',
    createdAt: '2022-05-29T02:16:13Z'
  },
  {
    id: 4,
    userId: 10,
    number: 260,
    status: 'delivered',
    items: [
      {
        id: 5787,
        name: 'Hyptis atrorubens Poit.',
        count: 8,
        price: 14.66
      },
      {
        id: 8479,
        name: 'Hieracium murorum L.',
        count: 4,
        price: 46.42
      },
      {
        id: 7891,
        name: 'Eriophorum ×porsildii Raymond',
        count: 5,
        price: 10.01
      },
      {
        id: 217,
        name: 'Echinochloa elliptica Michael & Vick.',
        count: 9,
        price: 87.98
      }
    ],
    delivery: {
      name: 'Norma Gristwood',
      phone: '673-813-1261',
      city: 'Riyadh',
      street: '9 Lyons Terrace'
    },
    cost: {
      vat: 160.2762,
      price: 1144.83,
      total: 1305.1062
    },
    updatedAt: '2021-11-30T15:20:32Z',
    createdAt: '2022-01-19T21:50:27Z'
  },
  {
    id: 5,
    userId: 2,
    number: 77595,
    status: 'delivered',
    items: [
      {
        id: 5452,
        name: 'Anacyclus clavatus (Desf.) Pers.',
        count: 5,
        price: 99.82
      }
    ],
    delivery: {
      name: 'Karim Swain',
      phone: '408-739-8665',
      city: 'Subulussalam',
      street: '990 Little Fleur Street'
    },
    cost: {
      vat: 69.874,
      price: 499.1,
      total: 568.974
    },
    updatedAt: '2021-09-08T12:24:34Z',
    createdAt: '2021-08-16T12:46:04Z'
  }
];
