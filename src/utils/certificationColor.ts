export function getCertificationColor(certification: string): string {
  switch (certification) {
    case "L":
      return "#22c55e"; // verde
    case "10":
      return "#3b82f6"; // azul
    case "12":
      return "#eab308"; // amarelo
    case "14":
      return "#f97316"; // laranja
    case "16":
      return "#ef4444"; // vermelho
    case "18":
      return "#b91c1c"; // vermelho escuro
    default:
      return "#6b7280"; // cinza
  }
}
