/**
 * Instituts (UCAO-UUT). Les filières sont gérées en base et récupérées via l'API (filieres.get).
 */

export const INSTITUTES = [
  { value: "DGI", label: "École Supérieure d'Ingénieurs - Département de Génie Informatique (DGI)" },
  { value: "ISSJ", label: "Institut Supérieur des Sciences Juridiques (ISSJ)" },
  { value: "ISEG", label: "Institut des Sciences Economiques et de Gestion (ISEG)" },
] as const;

export type InstituteCode = (typeof INSTITUTES)[number]["value"];
