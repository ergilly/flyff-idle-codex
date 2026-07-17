import { type CSSProperties } from "react";
import { type MapRegionId } from "@/lib/mapMonsterMarkers";

export type MapRegionDefinition = {
  id: MapRegionId;
  label: string;
  description: string;
  worldHighlightSrc: string;
  regionMapSrc: string;
  hitArea: CSSProperties;
  worldMarkerPosition: CSSProperties;
};

export const mapRegions: MapRegionDefinition[] = [
  {
    id: "flaris",
    label: "Flaris",
    description: "A smaller island region southeast of the mainland.",
    worldHighlightSrc: "/images/maps/World/Flaris.webp",
    regionMapSrc: "/images/maps/regions/WORLD_flaris.webp",
    hitArea: {
      left: "50.8%",
      top: "62.4%",
      width: "17.8%",
      height: "23.4%",
      clipPath: "ellipse(42% 46% at 55% 50%)"
    },
    worldMarkerPosition: { left: "60.6%", top: "74.1%" }
  },
  {
    id: "saint",
    label: "Saint Morning",
    description: "A southern island region with rivers, fields, and city roads.",
    worldHighlightSrc: "/images/maps/World/SaintMorning.webp",
    regionMapSrc: "/images/maps/regions/WORLD_saint.webp",
    hitArea: {
      left: "62.5%",
      top: "66.3%",
      width: "17%",
      height: "27.8%",
      clipPath: "polygon(35% 3%, 56% 8%, 78% 28%, 88% 63%, 72% 94%, 38% 94%, 20% 73%, 15% 39%)"
    },
    worldMarkerPosition: { left: "71%", top: "80%" }
  },
  {
    id: "rhisis",
    label: "Rhisis",
    description: "An eastern island marked by narrow paths and old ruins.",
    worldHighlightSrc: "/images/maps/World/Rhisis.webp",
    regionMapSrc: "/images/maps/regions/WORLD_rhisis.webp",
    hitArea: {
      left: "68.3%",
      top: "63.1%",
      width: "17.5%",
      height: "17.5%",
      clipPath: "polygon(14% 37%, 41% 17%, 63% 20%, 89% 41%, 75% 76%, 49% 93%, 28% 74%)"
    },
    worldMarkerPosition: { left: "77%", top: "70.5%" }
  },
  {
    id: "darkon12",
    label: "Darkon 1 and 2",
    description: "The western Darkon landmass, rich with mines and old roads.",
    worldHighlightSrc: "/images/maps/World/Darkon12.webp",
    regionMapSrc: "/images/maps/regions/WORLD_darkon12.webp",
    hitArea: {
      left: "20.2%",
      top: "57.5%",
      width: "34%",
      height: "25.5%",
      clipPath: "polygon(5% 18%, 33% 8%, 58% 16%, 95% 35%, 91% 75%, 70% 96%, 40% 82%, 18% 58%)"
    },
    worldMarkerPosition: { left: "37.2%", top: "70.3%" }
  },
  {
    id: "darkon3",
    label: "Darkon 3",
    description: "A rugged southern zone shaped by cliffs, canyons, and heat.",
    worldHighlightSrc: "/images/maps/World/Darkon3.webp",
    regionMapSrc: "/images/maps/regions/WORLD_darkon3.webp",
    hitArea: {
      left: "11.5%",
      top: "61.6%",
      width: "25.5%",
      height: "32%",
      clipPath: "polygon(45% 0%, 68% 14%, 86% 47%, 75% 83%, 47% 98%, 12% 83%, 4% 53%, 18% 19%)"
    },
    worldMarkerPosition: { left: "24.3%", top: "77.6%" }
  },
  {
    id: "shaduwar",
    label: "Shaduwar",
    description: "A dark mountain region at the heart of the northern landmass.",
    worldHighlightSrc: "/images/maps/World/Shaduwar.webp",
    regionMapSrc: "/images/maps/regions/WORLD_shaduwar.webp",
    hitArea: {
      left: "42.7%",
      top: "34.8%",
      width: "24%",
      height: "24.4%",
      clipPath: "polygon(28% 10%, 55% 0%, 90% 17%, 93% 55%, 72% 90%, 32% 96%, 9% 68%, 8% 33%)"
    },
    worldMarkerPosition: { left: "54.7%", top: "47%" }
  },
  {
    id: "valley",
    label: "Valley of the Risen",
    description: "A central northern valley surrounded by mountain passes.",
    worldHighlightSrc: "/images/maps/World/Valley.webp",
    regionMapSrc: "/images/maps/regions/WORLD_valley.webp",
    hitArea: {
      left: "50.4%",
      top: "16.7%",
      width: "22.5%",
      height: "26.7%",
      clipPath: "polygon(13% 27%, 32% 7%, 78% 13%, 96% 42%, 82% 80%, 38% 92%, 13% 69%)"
    },
    worldMarkerPosition: { left: "61.7%", top: "29.8%" }
  },
  {
    id: "kaillun",
    label: "Eillun",
    description: "A highland territory on the upper edge of Madrigal.",
    worldHighlightSrc: "/images/maps/World/Kaillun.webp",
    regionMapSrc: "/images/maps/regions/WORLD_kaillun.webp",
    hitArea: {
      left: "50.8%",
      top: "4.9%",
      width: "22.6%",
      height: "17%",
      clipPath: "polygon(18% 27%, 42% 8%, 84% 15%, 95% 47%, 75% 83%, 31% 89%, 8% 62%)"
    },
    worldMarkerPosition: { left: "62.1%", top: "13.4%" }
  },
  {
    id: "bahara",
    label: "Bahara",
    description: "A northern desert region beyond the mainland ridge.",
    worldHighlightSrc: "/images/maps/World/Bahara.webp",
    regionMapSrc: "/images/maps/regions/WORLD_bahara.webp",
    hitArea: {
      left: "34.4%",
      top: "5.9%",
      width: "20.4%",
      height: "20.8%",
      clipPath: "polygon(28% 12%, 77% 5%, 96% 46%, 82% 88%, 27% 92%, 4% 58%)"
    },
    worldMarkerPosition: { left: "44.6%", top: "16.3%" }
  }
];
