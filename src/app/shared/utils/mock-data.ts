import { Product, DiaryEntry, DashboardData, Settings } from '../models';

export const mockProducts: Product[] = [
  { id: '1', name: 'Куриная грудка', calories: 165, protein: 31, fat: 3.6, carbs: 0, category: 'Мясо' },
  { id: '2', name: 'Рис белый', calories: 130, protein: 2.7, fat: 0.3, carbs: 28, category: 'Крупы' },
  { id: '3', name: 'Яйцо куриное', calories: 155, protein: 13, fat: 11, carbs: 1.1, category: 'Яйца' },
  { id: '4', name: 'Хлеб белый', calories: 265, protein: 9, fat: 3.2, carbs: 49, category: 'Выпечка' },
  { id: '5', name: 'Молоко 2.5%', calories: 52, protein: 2.8, fat: 2.5, carbs: 4.7, category: 'Молочные' },
  { id: '6', name: 'Яблоко', calories: 52, protein: 0.3, fat: 0.2, carbs: 14, category: 'Фрукты' },
  { id: '7', name: 'Творог 5%', calories: 121, protein: 17, fat: 5, carbs: 1.8, category: 'Молочные' },
  { id: '8', name: 'Гречка', calories: 132, protein: 4.2, fat: 1.6, carbs: 25, category: 'Крупы' },
];

export const mockSettings: Settings = {
  dailyCalories: 2500,
  dailyProtein: 150,
  dailyFat: 83,
  dailyCarbs: 300,
  weightUnit: 'g',
  notificationsEnabled: true,
};

export const mockDiaryEntry: DiaryEntry = {
  id: '1',
  date: new Date().toISOString().split('T')[0],
  meals: [
    {
      id: 'm1',
      type: 'breakfast',
      items: [
        { id: 'mi1', product: mockProducts[2], quantity: 100 },
        { id: 'mi2', product: mockProducts[3], quantity: 50 },
        { id: 'mi3', product: mockProducts[4], quantity: 200 },
      ],
    },
    {
      id: 'm2',
      type: 'lunch',
      items: [
        { id: 'mi4', product: mockProducts[0], quantity: 150 },
        { id: 'mi5', product: mockProducts[1], quantity: 100 },
      ],
    },
    {
      id: 'm3',
      type: 'dinner',
      items: [
        { id: 'mi6', product: mockProducts[6], quantity: 150 },
        { id: 'mi7', product: mockProducts[5], quantity: 150 },
      ],
    },
    {
      id: 'm4',
      type: 'snack',
      items: [
        { id: 'mi8', product: mockProducts[5], quantity: 100 },
      ],
    },
  ],
};

export const mockDashboardData: DashboardData = {
  date: new Date().toISOString().split('T')[0],
  totalCalories: 1840,
  totalProtein: 95,
  totalFat: 67,
  totalCarbs: 210,
  meals: [
    { type: 'breakfast', calories: 520, itemsCount: 3 },
    { type: 'lunch', calories: 730, itemsCount: 2 },
    { type: 'dinner', calories: 400, itemsCount: 2 },
    { type: 'snack', calories: 190, itemsCount: 1 },
  ],
  recentProducts: [
    { ...mockProducts[5], id: 'r1' },
    { ...mockProducts[0], id: 'r2' },
    { ...mockProducts[1], id: 'r3' },
    { ...mockProducts[6], id: 'r4' },
  ],
  goals: {
    calories: mockSettings.dailyCalories,
    protein: mockSettings.dailyProtein,
    fat: mockSettings.dailyFat,
    carbs: mockSettings.dailyCarbs,
  },
};
