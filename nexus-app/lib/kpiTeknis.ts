// -----------------------------------------------------------------------------
// KPI Teknis — technical KPIs defined per Job Profile (entered manually in the
// Performance Dictionary). They feed the Performance Mapping cascade as the
// "KPI Teknis" source (formerly "Performance History").
// -----------------------------------------------------------------------------

export const KPI_TEKNIS_KEY = "kpi-teknis";

export interface KpiTeknis {
  id: string;
  jobProfileId: string; // linked Job Profile
  kpi: string;
  validitas: string;
  satuan: string;
  polaritas: string;
  tipe: string; // Jenis Cascade
  prioritas: string; // Skala Prioritas
  bobot: string;
  pengukuran: string; // Jenis Pengukuran
  frekuensi: string;
  target: string; // Target Tahunan
}

export const emptyKpiTeknis = (jobProfileId: string): Omit<KpiTeknis, "id"> => ({
  jobProfileId,
  kpi: "",
  validitas: "",
  satuan: "",
  polaritas: "Maximize",
  tipe: "",
  prioritas: "",
  bobot: "",
  pengukuran: "",
  frekuensi: "",
  target: "",
});
