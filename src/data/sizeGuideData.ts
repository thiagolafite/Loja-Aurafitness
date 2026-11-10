export interface SizeMeasurement {
  size: string;
  busto: string;
  cintura: string;
  quadril: string;
  coxa: string;
}

export const sizeGuideData: SizeMeasurement[] = [
  { size: 'M (Veste 34 a 38)', busto: '86 - 94 cm', cintura: '66 - 74 cm', quadril: '94 - 102 cm', coxa: '52 - 58 cm' },
  { size: 'G (Veste 40 ao 44)', busto: '95 - 104 cm', cintura: '75 - 84 cm', quadril: '103 - 112 cm', coxa: '59 - 64 cm' },
  { size: 'P (Veste 32 a 34)', busto: '80 - 85 cm', cintura: '60 - 65 cm', quadril: '88 - 93 cm', coxa: '48 - 51 cm' },
  { size: 'GG (Veste 46)', busto: '105 - 110 cm', cintura: '85 - 90 cm', quadril: '113 - 118 cm', coxa: '65 - 68 cm' },
];

export const sizeTips = [
  'Busto: Meça contornando a parte mais proeminente do tórax.',
  'Cintura: Meça na menor circunferência do abdômen, cerca de 2 dedos acima do umbigo.',
  'Quadril: Meça na parte de maior volume dos glúteos com os pés juntos.',
  'Em caso de dúvida entre dois tamanhos, escolha o maior para maior conforto ou o menor para compressão extra.'
];
