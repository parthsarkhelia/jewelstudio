import { PrismaClient, MaterialType } from "@prisma/client";

const prisma = new PrismaClient();

const materialPresets: {
  name: string;
  type: MaterialType;
  color: string;
  metallic: number;
  roughness: number;
  ior: number;
  transmission: number;
  clearcoat: number;
  opacity: number;
}[] = [
  // Metals
  { name: "Yellow Gold", type: MaterialType.METAL, color: "#FFD700", metallic: 1.0, roughness: 0.15, ior: 1.5, transmission: 0, clearcoat: 0.1, opacity: 1 },
  { name: "White Gold", type: MaterialType.METAL, color: "#E8E8E0", metallic: 1.0, roughness: 0.12, ior: 1.5, transmission: 0, clearcoat: 0.1, opacity: 1 },
  { name: "Rose Gold", type: MaterialType.METAL, color: "#E8A090", metallic: 1.0, roughness: 0.15, ior: 1.5, transmission: 0, clearcoat: 0.1, opacity: 1 },
  { name: "Sterling Silver", type: MaterialType.METAL, color: "#C0C0C0", metallic: 1.0, roughness: 0.1, ior: 1.5, transmission: 0, clearcoat: 0.15, opacity: 1 },
  { name: "Platinum", type: MaterialType.METAL, color: "#E5E4E2", metallic: 1.0, roughness: 0.08, ior: 1.5, transmission: 0, clearcoat: 0.2, opacity: 1 },
  { name: "Copper", type: MaterialType.METAL, color: "#B87333", metallic: 1.0, roughness: 0.2, ior: 1.5, transmission: 0, clearcoat: 0.05, opacity: 1 },
  { name: "Bronze", type: MaterialType.METAL, color: "#CD7F32", metallic: 1.0, roughness: 0.25, ior: 1.5, transmission: 0, clearcoat: 0.05, opacity: 1 },
  // Gemstones
  { name: "Diamond", type: MaterialType.GEMSTONE, color: "#F0F0FF", metallic: 0, roughness: 0.0, ior: 2.42, transmission: 0.95, clearcoat: 1.0, opacity: 0.1 },
  { name: "Ruby", type: MaterialType.GEMSTONE, color: "#E0115F", metallic: 0, roughness: 0.05, ior: 1.77, transmission: 0.7, clearcoat: 1.0, opacity: 0.3 },
  { name: "Sapphire", type: MaterialType.GEMSTONE, color: "#0F52BA", metallic: 0, roughness: 0.05, ior: 1.77, transmission: 0.7, clearcoat: 1.0, opacity: 0.3 },
  { name: "Emerald", type: MaterialType.GEMSTONE, color: "#50C878", metallic: 0, roughness: 0.08, ior: 1.58, transmission: 0.6, clearcoat: 0.8, opacity: 0.4 },
  { name: "Amethyst", type: MaterialType.GEMSTONE, color: "#9966CC", metallic: 0, roughness: 0.05, ior: 1.55, transmission: 0.75, clearcoat: 0.9, opacity: 0.25 },
  { name: "Topaz", type: MaterialType.GEMSTONE, color: "#FFC87C", metallic: 0, roughness: 0.03, ior: 1.63, transmission: 0.8, clearcoat: 0.9, opacity: 0.2 },
  { name: "Opal", type: MaterialType.GEMSTONE, color: "#A8C3BC", metallic: 0.1, roughness: 0.15, ior: 1.45, transmission: 0.3, clearcoat: 0.5, opacity: 0.6 },
  { name: "Pearl", type: MaterialType.GEMSTONE, color: "#FDEEF4", metallic: 0.3, roughness: 0.3, ior: 1.53, transmission: 0, clearcoat: 0.8, opacity: 1 },
];

async function main() {
  console.log("Seeding material presets...");

  for (const preset of materialPresets) {
    await prisma.materialPreset.upsert({
      where: { id: preset.name.toLowerCase().replace(/\s+/g, "-") },
      update: preset,
      create: {
        id: preset.name.toLowerCase().replace(/\s+/g, "-"),
        ...preset,
      },
    });
  }

  console.log(`Seeded ${materialPresets.length} material presets`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
