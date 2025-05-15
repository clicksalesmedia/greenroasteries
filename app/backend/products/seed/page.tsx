'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Define a common interface for all product types
interface BaseCoffeeProduct {
  name: string;
  description: string;
  origin: string;
  sizes: { name: string; value: number; price: number; }[];
  beans: string[];
}

// Extended interface for Arabica products with additional fields
interface ArabicaCoffeeProduct extends BaseCoffeeProduct {
  arabicName: string;
  arabicDescription: string;
  types: string[];
  arabicTypes: string[];
  arabicBeans: string[];
}

// We need a union type to handle both product types
type CoffeeProduct = ArabicaCoffeeProduct | BaseCoffeeProduct;

// For type safety in the component
type CoffeeType = 'arabica' | 'medium' | 'espresso' | 'turkish';

const coffeeSeedData: ArabicaCoffeeProduct[] = [
  {
    name: 'Nicaragua Arabica Coffee',
    arabicName: 'نيكاراغـــوا',
    description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
    arabicDescription: 'نفخر بنكهة القهوة العربية اإلماراتية المحضرة حسب أصولها، بدءا من انتقاء حبوب البن الخضراء وتحميصها بكل حب حتى إضافة الهيل والزعفران، استمتع بتجربة فريدة للتعرف على تقاليدنا وثقافتنا.',
    origin: 'Nicaragua',
    sizes: [
      { name: '1 KG', value: 1000, price: 112 },
      { name: '500 G', value: 500, price: 56 },
      { name: '250 G', value: 250, price: 28 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  },
  {
    name: 'Colombia Arabica Coffee',
    arabicName: 'كولومبيـــا',
    description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
    arabicDescription: 'نفخر بنكهة القهوة العربية اإلماراتية المحضرة حسب أصولها، بدءا من انتقاء حبوب البن الخضراء وتحميصها بكل حب حتى إضافة الهيل والزعفران، استمتع بتجربة فريدة للتعرف على تقاليدنا وثقافتنا.',
    origin: 'Colombia',
    sizes: [
      { name: '1 KG', value: 1000, price: 72 },
      { name: '500 G', value: 500, price: 36 },
      { name: '250 G', value: 250, price: 18 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  },
  {
    name: 'Ethiopia Arabica Coffee',
    arabicName: 'اثيوبيـــا',
    description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
    arabicDescription: 'نفخر بنكهة القهوة العربية اإلماراتية المحضرة حسب أصولها، بدءا من انتقاء حبوب البن الخضراء وتحميصها بكل حب حتى إضافة الهيل والزعفران، استمتع بتجربة فريدة للتعرف على تقاليدنا وثقافتنا.',
    origin: 'Ethiopia',
    sizes: [
      { name: '1 KG', value: 1000, price: 72 },
      { name: '500 G', value: 500, price: 36 },
      { name: '250 G', value: 250, price: 18 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  },
  {
    name: 'Sri Lanka Arabica Coffee',
    arabicName: 'سرالنكـــا',
    description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
    arabicDescription: 'نفخر بنكهة القهوة العربية اإلماراتية المحضرة حسب أصولها، بدءا من انتقاء حبوب البن الخضراء وتحميصها بكل حب حتى إضافة الهيل والزعفران، استمتع بتجربة فريدة للتعرف على تقاليدنا وثقافتنا.',
    origin: 'Sri Lanka',
    sizes: [
      { name: '1 KG', value: 1000, price: 72 },
      { name: '500 G', value: 500, price: 36 },
      { name: '250 G', value: 250, price: 18 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  },
  {
    name: 'Kenya Arabica Coffee',
    arabicName: 'كينيـــا',
    description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
    arabicDescription: 'نفخر بنكهة القهوة العربية اإلماراتية المحضرة حسب أصولها، بدءا من انتقاء حبوب البن الخضراء وتحميصها بكل حب حتى إضافة الهيل والزعفران، استمتع بتجربة فريدة للتعرف على تقاليدنا وثقافتنا.',
    origin: 'Kenya',
    sizes: [
      { name: '1 KG', value: 1000, price: 80 },
      { name: '500 G', value: 500, price: 40 },
      { name: '250 G', value: 250, price: 20 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  },
  {
    name: 'Brazil Arabica Coffee',
    arabicName: 'برازيـــل',
    description: 'We are proud of the flavor of Emirati Arabic coffee, prepared according to its origins, from selecting green coffee beans and roasting them with love until adding cardamom and saffron. Enjoy a unique experience to learn about our traditions and culture.',
    arabicDescription: 'نفخر بنكهة القهوة العربية اإلماراتية المحضرة حسب أصولها، بدءا من انتقاء حبوب البن الخضراء وتحميصها بكل حب حتى إضافة الهيل والزعفران، استمتع بتجربة فريدة للتعرف على تقاليدنا وثقافتنا.',
    origin: 'Brazil',
    sizes: [
      { name: '1 KG', value: 1000, price: 60 },
      { name: '500 G', value: 500, price: 30 },
      { name: '250 G', value: 250, price: 15 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  },
  {
    name: 'Al Dhaid Blend Arabica Coffee',
    arabicName: 'خلطـــة الذيـــد',
    description: 'The smell of fresh Arabic coffee wafts through our cafés, inviting you to taste our distinctive blend that we prepare for you. In each of them, we have selected the finest types of coffee beans for a strong flavor and smooth texture.',
    arabicDescription: 'تفوح رائحة القهوة العربية الطازجة في مقاهينا، وتدعوك لتذوق خلطتنا المميزة التي نحضرها لك. وقد اخترنا في كل منها أجود أنواع حبوب البن لنكهة قوية وملمس ناعم.',
    origin: 'Al Dhaid',
    sizes: [
      { name: '1 KG', value: 1000, price: 115 },
      { name: '500 G', value: 500, price: 57.5 },
      { name: '250 G', value: 250, price: 28.75 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  }
];

const mediumRoastSeedData: BaseCoffeeProduct[] = [
  {
    name: 'Nicaragua Medium Roast Coffee',
    description: 'It is considered one of the most famous coffee producing regions in Nicaragua, as it is characterized by its smooth and balanced taste in addition to the chocolate flavor It can be used to prepare a wide range of coffee styles.',
    origin: 'Nicaragua',
    sizes: [
      { name: '1 KG', value: 1000, price: 120 },
      { name: '500 G', value: 500, price: 60 },
      { name: '250 G', value: 250, price: 30 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Ethiopia Hambila Medium Roast Coffee',
    description: 'A crop from one of the most famous and wonderful regions in Ethiopia, the Hambila region, which is rich in fruit crops, usually including floral and fruit tones and even brown sugar. The coffee is grown at high altitudes, which makes it have a distinctive and rich flavor, suitable for milk and filter drinks.',
    origin: 'Ethiopia Hambila',
    sizes: [
      { name: '1 KG', value: 1000, price: 115 },
      { name: '500 G', value: 500, price: 57.5 },
      { name: '250 G', value: 250, price: 28.75 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Ethiopia Harrar Medium Roast Coffee',
    description: 'A unique crop due to the Harrar region having the oldest and tallest types of coffee trees grown on the face of the earth, which makes it produce large types of high-quality coffee. It is distinctive for hot and cold filter drinks with its classic, balanced fruity flavor.',
    origin: 'Ethiopia Harrar',
    sizes: [
      { name: '1 KG', value: 1000, price: 88 },
      { name: '500 G', value: 500, price: 44 },
      { name: '250 G', value: 250, price: 22 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Colombia Tamara Medium Roast Coffee',
    description: 'The crop has rich and beautiful notes that suit lovers of classic, uncomplicated black coffee drinks. The crop\'s beauty is highlighted with milk drinks of all kinds. It is characterized by the flavors of caramel, dried fruits and chocolate.',
    origin: 'Colombia Tamara',
    sizes: [
      { name: '1 KG', value: 1000, price: 115 },
      { name: '500 G', value: 500, price: 57.5 },
      { name: '250 G', value: 250, price: 28.75 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Colombia Tolima Medium Roast Coffee',
    description: 'The crop has rich, beautiful aromas that suit lovers of simple, classic black coffee drinks. The beauty of the crop is highlighted with all kinds of milk drinks, characterized by the flavors of passion fruit, grapes and dark chocolate.',
    origin: 'Colombia Tolima',
    sizes: [
      { name: '1 KG', value: 1000, price: 88 },
      { name: '500 G', value: 500, price: 44 },
      { name: '250 G', value: 250, price: 22 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Kenya Medium Roast Coffee',
    description: 'This distinctive crop comes to you from the finest types of luxury crops in the world, as it is characterized by a plump texture and pleasant acidity, with balanced and clear flavors such as black currant, sweet caramel and bergamot.',
    origin: 'Kenya',
    sizes: [
      { name: '1 KG', value: 1000, price: 90 },
      { name: '500 G', value: 500, price: 45 },
      { name: '250 G', value: 250, price: 22.5 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Brazil Medium Roast Coffee',
    description: 'Enjoy the original taste of coffee through a distinctive and carefully selected Brazilian crop. It provides a balanced taste with clear, classic overtones such as hazelnut and chocolate. It is suitable for milk drinks, black coffee and filter coffee.',
    origin: 'Brazil',
    sizes: [
      { name: '1 KG', value: 1000, price: 68 },
      { name: '500 G', value: 500, price: 34 },
      { name: '250 G', value: 250, price: 17 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Morning Blend Medium Roast Coffee',
    description: 'A distinctive crop of green roasters with rich and beautiful notes that suit lovers of classic filter drinks that are free of complexity. The sweetness of the crop is highlighted with milk drinks of all kinds. This crop is considered a special blend of our selection of the finest crops.',
    origin: 'Morning Blend',
    sizes: [
      { name: '1 KG', value: 1000, price: 120 },
      { name: '500 G', value: 500, price: 60 },
      { name: '250 G', value: 250, price: 30 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Afternoon Blend Medium Roast Coffee',
    description: 'A distinctive crop of green roasters with rich and beautiful notes that suit lovers of classic filter drinks that are free of complexity. The sweetness of the crop is highlighted with milk drinks of all kinds. This crop is considered a special blend of our selection of the finest crops.',
    origin: 'Afternoon Blend',
    sizes: [
      { name: '1 KG', value: 1000, price: 120 },
      { name: '500 G', value: 500, price: 60 },
      { name: '250 G', value: 250, price: 30 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Evening Blend Medium Roast Coffee',
    description: 'A distinctive crop of green roasters with rich and beautiful notes that suit lovers of classic filter drinks that are free of complexity. The sweetness of the crop is highlighted with milk drinks of all kinds. This crop is considered a special blend of our selection of the finest crops.',
    origin: 'Evening Blend',
    sizes: [
      { name: '1 KG', value: 1000, price: 120 },
      { name: '500 G', value: 500, price: 60 },
      { name: '250 G', value: 250, price: 30 }
    ],
    beans: ['whole beans', 'Ground grains']
  }
];

const espressoRoastSeedData: BaseCoffeeProduct[] = [
  {
    name: 'Nicaragua Espresso Roast Coffee',
    description: 'It is considered one of the most famous coffee producing regions in Nicaragua, as it is characterized by its smooth and balanced taste in addition to the chocolate flavor It can be used to prepare a wide range of coffee styles.',
    origin: 'Nicaragua',
    sizes: [
      { name: '1 KG', value: 1000, price: 120 },
      { name: '500 G', value: 500, price: 60 },
      { name: '250 G', value: 250, price: 30 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Ethiopia Hambila Espresso Roast Coffee',
    description: 'A crop from one of the most famous and wonderful regions in Ethiopia, the Hambila region, which is rich in fruit crops, usually including floral and fruit tones and even brown sugar. The coffee is grown at high altitudes, which makes it have a distinctive and rich flavor, suitable for milk and filter drinks.',
    origin: 'Ethiopia Hambila',
    sizes: [
      { name: '1 KG', value: 1000, price: 115 },
      { name: '500 G', value: 500, price: 57.5 },
      { name: '250 G', value: 250, price: 28.75 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Ethiopia Harrar Espresso Roast Coffee',
    description: 'A unique crop due to the Harrar region having the oldest and tallest types of coffee trees grown on the face of the earth, which makes it produce large types of high-quality coffee. It is distinctive for hot and cold filter drinks with its classic, balanced fruity flavor.',
    origin: 'Ethiopia Harrar',
    sizes: [
      { name: '1 KG', value: 1000, price: 88 },
      { name: '500 G', value: 500, price: 44 },
      { name: '250 G', value: 250, price: 22 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Colombia Tamara Espresso Roast Coffee',
    description: 'The crop has rich and beautiful notes that suit lovers of classic, uncomplicated black coffee drinks. The crop\'s beauty is highlighted with milk drinks of all kinds. It is characterized by the flavors of caramel, dried fruits and chocolate.',
    origin: 'Colombia Tamara',
    sizes: [
      { name: '1 KG', value: 1000, price: 115 },
      { name: '500 G', value: 500, price: 57.5 },
      { name: '250 G', value: 250, price: 28.75 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Colombia Tolima Espresso Roast Coffee',
    description: 'The crop has rich, beautiful aromas that suit lovers of simple, classic black coffee drinks. The beauty of the crop is highlighted with all kinds of milk drinks, characterized by the flavors of passion fruit, grapes and dark chocolate.',
    origin: 'Colombia Tolima',
    sizes: [
      { name: '1 KG', value: 1000, price: 88 },
      { name: '500 G', value: 500, price: 44 },
      { name: '250 G', value: 250, price: 22 }
    ],
    beans: ['whole beans', 'Ground grains']
  },
  {
    name: 'Kenya Espresso Roast Coffee',
    description: 'This distinctive crop comes to you from the finest types of luxury crops in the world, as it is characterized by a plump texture and pleasant acidity, with balanced and clear flavors such as black currant, sweet caramel and bergamot.',
    origin: 'Kenya',
    sizes: [
      { name: '1 KG', value: 1000, price: 90 },
      { name: '500 G', value: 500, price: 45 },
      { name: '250 G', value: 250, price: 22.5 }
    ],
    beans: ['whole beans', 'Ground grains']
  }
];

// Add Turkish Roast data
const turkishRoastSeedData: ArabicaCoffeeProduct[] = [
  {
    name: 'Turkish Light Roast Coffee',
    arabicName: 'تحميـــص متـــوازن',
    description: 'Turkish coffee is so unique that it was inscribed to Unesco\'s Intangible Culture Heritage List in 2013, due to the unique practices that goes into the preparation and presentation.',
    arabicDescription: 'تعتبر القهوة التركية فريدة من نوعها لدرجة أنها أدرجت في قائمة التراث الثقافي غير المادي لمنظمة اليونسكو في عام ،2013 وذلك بسبب الممارسات الفريدة التي تدخل في إعدادها وتقديمها.',
    origin: 'Turkey',
    sizes: [
      { name: '1 KG', value: 1000, price: 60 },
      { name: '500 G', value: 500, price: 30 },
      { name: '250 G', value: 250, price: 15 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  },
  {
    name: 'Turkish Dark Roast Coffee',
    arabicName: 'تحميـــص داكـــن',
    description: 'Turkish coffee is so unique that it was inscribed to Unesco\'s Intangible Culture Heritage List in 2013, due to the unique practices that goes into the preparation and presentation.',
    arabicDescription: 'تعتبر القهوة التركية فريدة من نوعها لدرجة أنها أدرجت في قائمة التراث الثقافي غير المادي لمنظمة اليونسكو في عام ،2013 وذلك بسبب الممارسات الفريدة التي تدخل في إعدادها وتقديمها.',
    origin: 'Turkey',
    sizes: [
      { name: '1 KG', value: 1000, price: 60 },
      { name: '500 G', value: 500, price: 30 },
      { name: '250 G', value: 250, price: 15 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  },
  {
    name: 'Special Turkish Light Roast Coffee',
    arabicName: 'قهـــوة تركيـــة متـــوازنة',
    description: 'Turkish coffee is so unique that it was inscribed to Unesco\'s Intangible Culture Heritage List in 2013, due to the unique practices that goes into the preparation and presentation. with spices',
    arabicDescription: 'تعتبر القهوة التركية فريدة من نوعها لدرجة أنها أدرجت في قائمة التراث الثقافي غير المادي لمنظمة اليونسكو في عام ،2013 وذلك بسبب الممارسات الفريدة التي تدخل في إعدادها وتقديمها، مع بهارات خاصة',
    origin: 'Turkey',
    sizes: [
      { name: '1 KG', value: 1000, price: 80 },
      { name: '500 G', value: 500, price: 40 },
      { name: '250 G', value: 250, price: 20 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  },
  {
    name: 'Special Turkish Dark Roast Coffee',
    arabicName: 'قهـــوة تركيـــة داكنـــة',
    description: 'Turkish coffee is so unique that it was inscribed to Unesco\'s Intangible Culture Heritage List in 2013, due to the unique practices that goes into the preparation and presentation. with spices',
    arabicDescription: 'تعتبر القهوة التركية فريدة من نوعها لدرجة أنها أدرجت في قائمة التراث الثقافي غير المادي لمنظمة اليونسكو في عام ،2013 وذلك بسبب الممارسات الفريدة التي تدخل في إعدادها وتقديمها، مع بهارات خاصة',
    origin: 'Turkey',
    sizes: [
      { name: '1 KG', value: 1000, price: 80 },
      { name: '500 G', value: 500, price: 40 },
      { name: '250 G', value: 250, price: 20 }
    ],
    types: ['cardamom', 'saffron', 'cardamom & saffron'],
    arabicTypes: ['هيل', 'زعفران', 'هيل و زعفران'],
    beans: ['whole beans', 'Ground grains'],
    arabicBeans: ['حبوب كاملة', 'حبوب مطحونة']
  }
];

export default function SeedProductsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [coffeeType, setCoffeeType] = useState<CoffeeType>('arabica');
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>(
    Object.fromEntries(coffeeSeedData.map(product => [product.name, true]))
  );

  // Switch between coffee types
  const handleCoffeeTypeChange = (type: CoffeeType) => {
    setCoffeeType(type);
    
    if (type === 'arabica') {
      setSelectedProducts(Object.fromEntries(coffeeSeedData.map(product => [product.name, true])));
    } else if (type === 'medium') {
      setSelectedProducts(Object.fromEntries(mediumRoastSeedData.map(product => [product.name, true])));
    } else if (type === 'espresso') {
      setSelectedProducts(Object.fromEntries(espressoRoastSeedData.map(product => [product.name, true])));
    } else {
      setSelectedProducts(Object.fromEntries(turkishRoastSeedData.map(product => [product.name, true])));
    }
  };

  const toggleProduct = (productName: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productName]: !prev[productName]
    }));
  };

  const selectAll = () => {
    let productsToSelect: CoffeeProduct[] = [];
    if (coffeeType === 'arabica') {
      productsToSelect = coffeeSeedData;
    } else if (coffeeType === 'medium') {
      productsToSelect = mediumRoastSeedData;
    } else if (coffeeType === 'espresso') {
      productsToSelect = espressoRoastSeedData;
    } else {
      productsToSelect = turkishRoastSeedData;
    }
    setSelectedProducts(Object.fromEntries(productsToSelect.map(product => [product.name, true])));
  };

  const deselectAll = () => {
    let productsToSelect: CoffeeProduct[] = [];
    if (coffeeType === 'arabica') {
      productsToSelect = coffeeSeedData;
    } else if (coffeeType === 'medium') {
      productsToSelect = mediumRoastSeedData;
    } else if (coffeeType === 'espresso') {
      productsToSelect = espressoRoastSeedData;
    } else {
      productsToSelect = turkishRoastSeedData;
    }
    setSelectedProducts(Object.fromEntries(productsToSelect.map(product => [product.name, false])));
  };

  // Function to generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  const handleSeedProducts = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      // Get the appropriate coffee category from the database
      let categoryName = 'Arabica%20Coffee';
      if (coffeeType === 'medium') {
        categoryName = 'Medium%20Roast';
      } else if (coffeeType === 'espresso') {
        categoryName = 'Espresso%20Roast';
      } else if (coffeeType === 'turkish') {
        categoryName = 'Turkish%20Roast';
      }
      
      const categoryResponse = await fetch(`/api/categories?name=${categoryName}`);
      
      if (!categoryResponse.ok) {
        throw new Error(`Failed to fetch ${coffeeType} coffee category`);
      }
      
      const categories = await categoryResponse.json();
      const coffeeCategory = categories.length > 0 ? categories[0] : null;
      
      if (!coffeeCategory) {
        const categoryDisplayName = coffeeType === 'arabica' ? 'Arabica Coffee' : 
                                   (coffeeType === 'medium' ? 'Medium Roast' : 
                                   (coffeeType === 'espresso' ? 'Espresso Roast' : 'Turkish Roast'));
        throw new Error(`${categoryDisplayName} category not found. Please create a "${categoryDisplayName}" category first.`);
      }

      // Fetch sizes, types, and beans for variations
      const sizesResponse = await fetch('/api/variations/sizes');
      const beansResponse = await fetch('/api/variations/beans');

      if (!sizesResponse.ok || !beansResponse.ok) {
        throw new Error('Failed to fetch variation data');
      }

      const sizes = await sizesResponse.json();
      const beans = await beansResponse.json();

      // For Arabica coffee, we need types too
      let types: any[] = [];
      if (coffeeType === 'arabica') {
        const typesResponse = await fetch('/api/variations/types');
        if (!typesResponse.ok) {
          throw new Error('Failed to fetch type variations');
        }
        types = await typesResponse.json();
      }

      // Filter selected products
      let productsDataSource: CoffeeProduct[] = [];
      if (coffeeType === 'arabica') {
        productsDataSource = coffeeSeedData;
      } else if (coffeeType === 'medium') {
        productsDataSource = mediumRoastSeedData;
      } else if (coffeeType === 'espresso') {
        productsDataSource = espressoRoastSeedData;
      } else {
        productsDataSource = turkishRoastSeedData;
      }
      
      const productsToCreate = productsDataSource.filter(product => selectedProducts[product.name]);
      
      let successCount = 0;
      let errorCount = 0;
      let variationsCount = 0;

      // Create each product
      for (const [index, productData] of productsToCreate.entries()) {
        try {
          const slug = generateSlug(productData.name);
          let productVariationsCount = 0;
          
          // Create the base product
          const productResponse = await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: productData.name,
              description: productData.description,
              slug,
              categoryId: coffeeCategory.id,
              origin: productData.origin,
              inStock: true,
              price: productData.sizes[0].price, // Default price is the first size
              variations: []
            }),
          });

          if (!productResponse.ok) {
            throw new Error(`Failed to create product: ${productData.name}`);
          }

          const product = await productResponse.json();
          
          // Define SKU prefix based on product origin
          let originPrefix = '';
          if (productData.name.includes('Al Dhaid')) {
            originPrefix = 'AL';
          } else if (productData.origin === 'Nicaragua') {
            originPrefix = 'NI';
          } else if (productData.origin.includes('Colombia')) {
            originPrefix = 'CO';
          } else if (productData.origin.includes('Ethiopia')) {
            originPrefix = 'ET';
          } else if (productData.origin === 'Sri Lanka') {
            originPrefix = 'SL';
          } else if (productData.origin === 'Kenya') {
            originPrefix = 'KE';
          } else if (productData.origin === 'Brazil') {
            originPrefix = 'BR';
          } else if (productData.origin.includes('Morning')) {
            originPrefix = 'MB';
          } else if (productData.origin.includes('Afternoon')) {
            originPrefix = 'AB';
          } else if (productData.origin.includes('Evening')) {
            originPrefix = 'EB';
          }

          if (coffeeType === 'arabica') {
            // Create predefined variations for Arabica coffee (with type variations)
            const variationPatterns = [
              // 250g variations
              { size: '250 g', sizeValue: 250, type: 'cardamom & saffron', beans: 'whole beans', skuPattern: 'SF-CA-250G-G-B' },
              { size: '250 g', sizeValue: 250, type: 'cardamom', beans: 'Ground grains', skuPattern: '{origin} -250G-G-B' },
              { size: '250 g', sizeValue: 250, type: 'cardamom', beans: 'whole beans', skuPattern: '{origin} -250G-T-B' },
              { size: '250 g', sizeValue: 250, type: 'saffron', beans: 'Ground grains', skuPattern: 'SF-250G-G-B' },
              { size: '250 g', sizeValue: 250, type: 'saffron', beans: 'whole beans', skuPattern: 'SF-250G-T-B' },
              
              // 500g variations
              { size: '500 g', sizeValue: 500, type: 'cardamom & saffron', beans: 'whole beans', skuPattern: 'SF-CA-500G-G-B' },
              { size: '500 g', sizeValue: 500, type: 'cardamom', beans: 'Ground grains', skuPattern: '{origin} -500G-G-B' },
              { size: '500 g', sizeValue: 500, type: 'cardamom', beans: 'whole beans', skuPattern: '{origin} -500G-T-B' },
              { size: '500 g', sizeValue: 500, type: 'saffron', beans: 'Ground grains', skuPattern: 'SF-500G-G-B' },
              { size: '500 g', sizeValue: 500, type: 'saffron', beans: 'whole beans', skuPattern: 'SF-500T-T-B' },
              
              // 1kg variations
              { size: '1 kg', sizeValue: 1000, type: 'cardamom & saffron', beans: 'whole beans', skuPattern: 'SF-CA-1KG-G-B' },
              { size: '1 kg', sizeValue: 1000, type: 'cardamom', beans: 'Ground grains', skuPattern: '{origin} -1KG-G-B' },
              { size: '1 kg', sizeValue: 1000, type: 'cardamom', beans: 'whole beans', skuPattern: '{origin} -1KG-T-B' },
              { size: '1 kg', sizeValue: 1000, type: 'saffron', beans: 'Ground grains', skuPattern: 'SF-1KG-G-B' },
              { size: '1 kg', sizeValue: 1000, type: 'saffron', beans: 'whole beans', skuPattern: 'SF-1KG-T-B' },
            ];
            
            // Create each variation
            for (const pattern of variationPatterns) {
              // Find the matching size, type, and bean objects
              const sizeObj = sizes.find((s: any) => s.value === pattern.sizeValue);
              const typeObj = types.find((t: any) => t.name.toLowerCase() === pattern.type.toLowerCase());
              const beanObj = beans.find((b: any) => b.name.toLowerCase() === pattern.beans.toLowerCase());
              
              if (!sizeObj || !typeObj || !beanObj) {
                console.warn(`Missing size/type/bean for ${pattern.size} ${pattern.type} ${pattern.beans}`);
                continue;
              }
              
              // Find the matching size in productData to get the correct price
              const sizePrice = productData.sizes.find(s => s.value === pattern.sizeValue)?.price || 0;
              if (sizePrice === 0) {
                console.warn(`Price not found for ${productData.name} ${pattern.size}`);
                continue;
              }
              
              // Generate the SKU from the pattern
              const sku = pattern.skuPattern.replace('{origin}', originPrefix);
              
              try {
                // Create the variation
                const variationResponse = await fetch('/api/variations/products', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    productId: product.id,
                    sizeId: sizeObj.id,
                    typeId: typeObj.id,
                    beansId: beanObj.id,
                    price: sizePrice,
                    sku: sku,
                    stockQuantity: 100,
                    isActive: true,
                  }),
                });

                if (!variationResponse.ok) {
                  console.error(`Failed to create variation for ${productData.name} with SKU ${sku}`);
                  const errorData = await variationResponse.json();
                  console.error('Error details:', errorData);
                } else {
                  console.log(`Created variation for ${productData.name}: ${pattern.size} ${pattern.type} ${pattern.beans} - SKU: ${sku}, Price: ${sizePrice} AED`);
                  variationsCount++;
                  productVariationsCount++;
                }
              } catch (error) {
                console.error(`Error creating variation for ${productData.name}:`, error);
              }
            }
          } else {
            // Create variations for Medium Roast coffee (no type variations)
            // Create variations for each size and bean combination
            for (const sizeData of productData.sizes) {
              for (const beanType of productData.beans) {
                // Find the matching size and bean objects
                const sizeObj = sizes.find((s: any) => s.value === sizeData.value);
                const beanObj = beans.find((b: any) => b.name.toLowerCase() === beanType.toLowerCase());
                
                if (!sizeObj || !beanObj) {
                  console.warn(`Missing size/bean for ${sizeData.name} ${beanType}`);
                  continue;
                }
                
                // Generate the SKU
                const sizePart = sizeData.value === 1000 ? '1KG' : (sizeData.value === 500 ? '500G' : '250G');
                const beanPart = beanType.includes('whole') ? 'WB' : 'GG';
                const sku = `${originPrefix}-${sizePart}-${beanPart}`;
                
                try {
                  // Create the variation
                  const variationResponse = await fetch('/api/variations/products', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      productId: product.id,
                      sizeId: sizeObj.id,
                      beansId: beanObj.id,
                      price: sizeData.price,
                      sku: sku,
                      stockQuantity: 100,
                      isActive: true,
                    }),
                  });

                  if (!variationResponse.ok) {
                    console.error(`Failed to create variation for ${productData.name} with SKU ${sku}`);
                    const errorData = await variationResponse.json();
                    console.error('Error details:', errorData);
                  } else {
                    console.log(`Created variation for ${productData.name}: ${sizeData.name} ${beanType} - SKU: ${sku}, Price: ${sizeData.price} AED`);
                    variationsCount++;
                    productVariationsCount++;
                  }
                } catch (error) {
                  console.error(`Error creating variation for ${productData.name}:`, error);
                }
              }
            }
          }

          console.log(`Created ${productVariationsCount} variations for ${productData.name}`);
          successCount++;
        } catch (err) {
          console.error(`Error creating product ${productData.name}:`, err);
          errorCount++;
        }

        // Update progress
        setProgress(Math.round(((index + 1) / productsToCreate.length) * 100));
      }

      setSuccess(`Successfully created ${successCount} ${coffeeType} coffee products with ${variationsCount} variations. ${errorCount > 0 ? `Failed to create ${errorCount} products.` : ''}`);
    } catch (err) {
      console.error('Error seeding products:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-green-900 text-white h-screen fixed">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Green Roasteries</h1>
            <p className="text-sm">Admin Dashboard</p>
          </div>
          <nav className="mt-8">
            <ul className="space-y-2 px-4">
              <li>
                <a href="/backend" className="block py-2 px-4 rounded hover:bg-green-800">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/backend/products" className="block py-2 px-4 rounded bg-green-800">
                  Products
                </a>
              </li>
              <li>
                <a href="/backend/categories" className="block py-2 px-4 rounded hover:bg-green-800">
                  Categories
                </a>
              </li>
              <li>
                <a href="/backend/orders" className="block py-2 px-4 rounded hover:bg-green-800">
                  Orders
                </a>
              </li>
              <li>
                <a href="/backend/users" className="block py-2 px-4 rounded hover:bg-green-800">
                  Users
                </a>
              </li>
              <li>
                <a href="/backend/promotions" className="block py-2 px-4 rounded hover:bg-green-800">
                  Promotions
                </a>
              </li>
              <li>
                <a href="/backend/settings" className="block py-2 px-4 rounded hover:bg-green-800">
                  Settings
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="ml-64 p-8 w-full">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Seed Coffee Products</h1>
              <Link href="/backend/products" className="text-green-700 hover:underline">
                &larr; Back to Products
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
                {success}
              </div>
            )}

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                This will create coffee products with all the necessary variations. Make sure you have created:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-600">
                <li>A category named "Arabica Coffee" for Arabica products</li>
                <li>A category named "Medium Roast" for Medium Roast products</li>
                <li>Size variations (250g, 500g, 1kg)</li>
                <li>Type variations (for Arabica: cardamom, saffron, cardamom & saffron)</li>
                <li>Bean variations (whole beans, ground grains)</li>
              </ul>
              
              {/* Coffee type selector */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Select Coffee Type</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCoffeeTypeChange('arabica')}
                    className={`px-4 py-2 rounded-md ${
                      coffeeType === 'arabica' 
                        ? 'bg-green-700 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Arabica Coffee
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCoffeeTypeChange('medium')}
                    className={`px-4 py-2 rounded-md ${
                      coffeeType === 'medium'
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Medium Roast
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCoffeeTypeChange('espresso')}
                    className={`px-4 py-2 rounded-md ${
                      coffeeType === 'espresso'
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Espresso Roast
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCoffeeTypeChange('turkish')}
                    className={`px-4 py-2 rounded-md ${
                      coffeeType === 'turkish'
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Turkish Roast
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-2 mb-4">
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h2 className="text-lg font-semibold mb-3">
                {coffeeType === 'arabica' ? 'Arabica Coffee Products' : 
                 coffeeType === 'medium' ? 'Medium Roast Coffee Products' : 
                 coffeeType === 'espresso' ? 'Espresso Roast Coffee Products' :
                 'Turkish Roast Coffee Products'} to Create
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(coffeeType === 'arabica' ? coffeeSeedData : 
                  coffeeType === 'medium' ? mediumRoastSeedData : 
                  coffeeType === 'espresso' ? espressoRoastSeedData :
                  turkishRoastSeedData).map((product) => (
                  <div key={product.name} className="border rounded-md p-3 bg-white">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`product-${product.name}`}
                        checked={selectedProducts[product.name] || false}
                        onChange={() => toggleProduct(product.name)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`product-${product.name}`} className="ml-2 block text-sm font-medium text-gray-700">
                        {product.name}
                      </label>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <div>Origin: {product.origin}</div>
                      <div>
                        Sizes: {product.sizes.map(s => `${s.name} (${s.price} AED)`).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {progress > 0 && progress < 100 && (
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Creating products... {progress}% complete</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSeedProducts}
                disabled={isLoading || Object.values(selectedProducts).every(v => !v)}
                className={`bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-800 transition ${
                  isLoading || Object.values(selectedProducts).every(v => !v) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Creating Products...' : `Create Selected ${
                  coffeeType === 'arabica' ? 'Arabica' : 
                  coffeeType === 'medium' ? 'Medium Roast' : 
                  coffeeType === 'espresso' ? 'Espresso Roast' :
                  'Turkish Roast'} Products`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 