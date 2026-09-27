// The backend stores difficulty as "easy" | "medium" | "hard".
// The UI shows a friendly label and a learner level next to it.
export const DIFFICULTIES = [
  { value: "easy", label: "Easy", level: "Beginner" },
  { value: "medium", label: "Medium", level: "Intermediate" },
  { value: "hard", label: "Hard", level: "Advanced" },
];

export const DIFFICULTY_VALUES = DIFFICULTIES.map((d) => d.value);

export function getDifficulty(value) {
  return DIFFICULTIES.find((d) => d.value === value) || DIFFICULTIES[0];
}
