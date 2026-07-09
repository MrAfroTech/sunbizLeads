/**
 * Trim result cards to one visible row plus up to three hidden rows (hero-card results).
 */
export function pickHeroResultCards(cards, visibleId, hiddenCount = 3) {
  if (!cards?.length) return [];

  const visible = cards.find((card) => card.id === visibleId) ?? cards[0];
  const hidden = cards.filter((card) => card.id !== visible.id).slice(0, hiddenCount);

  return [visible, ...hidden];
}
