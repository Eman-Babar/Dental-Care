const DENTAL_KEYWORDS = [
  "tooth",
  "teeth",
  "gum",
  "gums",
  "dental",
  "dentist",
  "cavity",
  "cavities",
  "toothache",
  "pain",
  "mouth",
  "oral",
  "jaw",
  "bite",
  "braces",
  "aligner",
  "whitening",
  "cleaning",
  "plaque",
  "tartar",
  "root canal",
  "canal",
  "filling",
  "crown",
  "bridge",
  "extraction",
  "implant",
  "sensitivity",
  "sensitive",
  "bleeding",
  "swelling",
  "abscess",
  "wisdom",
  "molar",
  "incisor",
  "checkup",
  "check-up",
  "floss",
  "enamel",
  "orthodontic",
  "periodontal",
  "daant",
  "dant",
  "dantoon",
  "masoor",
  "masooray",
  "moonh",
  "munh",
  "dard",
];

const BLOCKED_KEYWORDS = [
  "hair",
  "baal",
  "skin",
  "acne",
  "eye",
  "ear",
  "nose surgery",
  "stomach",
  "pet",
  "fever",
  "bukhar",
  "leg",
  "arm",
  "back pain",
  "spine",
  "heart",
  "diabetes medicine",
  "cancer chemo",
  "pregnancy checkup",
  "gyne",
  "dermat",
  "nail",
];

export function isDentalProblem(problem) {
  const text = String(problem || "").trim().toLowerCase();

  if (text.length < 5) {
    return {
      ok: false,
      message: "Please describe your dental problem in more detail.",
    };
  }

  const blocked = BLOCKED_KEYWORDS.find((word) => text.includes(word));
  if (blocked) {
    return {
      ok: false,
      message:
        "Only dental problems are allowed (teeth, gums, mouth, jaw). Not hair/skin/other issues.",
    };
  }

  if (!DENTAL_KEYWORDS.some((word) => text.includes(word))) {
    return {
      ok: false,
      message:
        "Please describe a dental issue (e.g. tooth pain, gum bleeding, cavity).",
    };
  }

  return { ok: true };
}
