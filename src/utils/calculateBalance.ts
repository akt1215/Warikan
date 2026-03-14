export const sumPositiveBalances = (balances: Record<string, number>): number => {
  return Object.values(balances)
    .filter((value) => value > 0)
    .reduce((total, value) => total + value, 0);
};

export const sumNegativeBalances = (balances: Record<string, number>): number => {
  return Object.values(balances)
    .filter((value) => value < 0)
    .reduce((total, value) => total + Math.abs(value), 0);
};
