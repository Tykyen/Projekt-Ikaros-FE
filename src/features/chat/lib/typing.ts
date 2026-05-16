/** Sestaví popisek „kdo píše" se správným skloňováním. */
export function typingLabel(names: string[]): string {
  if (names.length === 1) return `${names[0]} píše…`;
  if (names.length === 2) return `${names[0]} a ${names[1]} píšou…`;
  const others = names.length - 2;
  const word = others >= 5 ? 'dalších' : 'další';
  return `${names[0]}, ${names[1]} a ${others} ${word} píšou…`;
}
