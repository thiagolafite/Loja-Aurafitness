export interface SizeMeasurement {
  size: string;
  busto: string;
  cintura: string;
  quadril: string;
  coxa: string;
}

export const sizeGuideData: SizeMeasurement[] = [
  { size: 'PP (34)', busto: '80 - 84 cm', cintura: '60 - 64 cm', quadril: '88 - 92 cm', coxa: '50 - 52 cm' },
  { size: 'P (36-38)', busto: '85 - 89 cm', cintura: '65 - 69 cm', quadril: '93 - 97 cm', coxa: '53 - 55 cm' },
  { size: 'M (40-42)', busto: '90 - 94 cm', cintura: '70 - 74 cm', quadril: '98 - 102 cm', coxa: '56 - 58 cm' },
  { size: 'G (44)', busto: '95 - 99 cm', cintura: '75 - 79 cm', quadril: '103 - 107 cm', coxa: '59 - 61 cm' },
  { size: 'GG (46)', busto: '100 - 104 cm', cintura: '80 - 84 cm', quadril: '108 - 112 cm', coxa: '62 - 64 cm' },
];

export const sizeTips = [
  'Busto: Meça contornando a parte mais proeminente do tórax.',
  'Cintura: Meça na menor circunferência do abdômen, cerca de 2 dedos acima do umbigo.',
  'Quadril: Meça na parte de maior volume dos glúteos com os pés juntos.',
  'Em caso de dúvida entre dois tamanhos, escolha o maior para maior conforto ou o menor para compressão extra.'
];
