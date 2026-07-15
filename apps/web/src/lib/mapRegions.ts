import { type CSSProperties } from "react";
import { type MapRegionId } from "@/lib/mapMonsterMarkers";

export type MapRegionDefinition = {
  id: MapRegionId;
  label: string;
  description: string;
  worldHighlightSrc: string;
  regionMapSrc: string;
  hitArea: CSSProperties;
};

export const mapRegions: MapRegionDefinition[] = [
  {
    id: "flaris",
    label: "Flaris",
    description: "A smaller island region southeast of the mainland.",
    worldHighlightSrc: "/images/maps/World/Flaris.png",
    regionMapSrc: "/images/maps/regions/WORLD_flaris.png",
    hitArea: {
      left: "50.8%",
      top: "62.4%",
      width: "17.8%",
      height: "23.4%",
      clipPath: "ellipse(42% 46% at 55% 50%)"
    }
  },
  {
    id: "saint",
    label: "Saint Morning",
    description: "A southern island region with rivers, fields, and city roads.",
    worldHighlightSrc: "/images/maps/World/SaintMorning.png",
    regionMapSrc: "/images/maps/regions/WORLD_saint.png",
    hitArea: {
      left: "62.5%",
      top: "66.3%",
      width: "17%",
      height: "27.8%",
      clipPath: "polygon(35% 3%, 56% 8%, 78% 28%, 88% 63%, 72% 94%, 38% 94%, 20% 73%, 15% 39%)"
    }
  },
  {
    id: "rhisis",
    label: "Garden of Rhisis",
    description: "An eastern island marked by narrow paths and old ruins.",
    worldHighlightSrc: "/images/maps/World/Rhisis.png",
    regionMapSrc: "/images/maps/regions/WORLD_rhisis.png",
    hitArea: {
      left: "68.3%",
      top: "63.1%",
      width: "17.5%",
      height: "17.5%",
      clipPath: "polygon(14% 37%, 41% 17%, 63% 20%, 89% 41%, 75% 76%, 49% 93%, 28% 74%)"
    }
  },
  {
    id: "darkon12",
    label: "Darkon 1 and 2",
    description: "The western Darkon landmass, rich with mines and old roads.",
    worldHighlightSrc: "/images/maps/World/Darkon12.png",
    regionMapSrc: "/images/maps/regions/WORLD_darkon12.png",
    hitArea: {
      left: "20.2%",
      top: "57.5%",
      width: "34%",
      height: "25.5%",
      clipPath: "polygon(5% 18%, 33% 8%, 58% 16%, 95% 35%, 91% 75%, 70% 96%, 40% 82%, 18% 58%)"
    }
  },
  {
    id: "darkon3",
    label: "Darkon 3",
    description: "A rugged southern zone shaped by cliffs, canyons, and heat.",
    worldHighlightSrc: "/images/maps/World/Darkon3.png",
    regionMapSrc: "/images/maps/regions/WORLD_darkon3.png",
    hitArea: {
      left: "11.5%",
      top: "61.6%",
      width: "25.5%",
      height: "32%",
      clipPath: "polygon(45% 0%, 68% 14%, 86% 47%, 75% 83%, 47% 98%, 12% 83%, 4% 53%, 18% 19%)"
    }
  },
  {
    id: "shaduwar",
    label: "Shaduwar",
    description: "A dark mountain region at the heart of the northern landmass.",
    worldHighlightSrc: "/images/maps/World/Shaduwar.png",
    regionMapSrc: "/images/maps/regions/WORLD_shaduwar.png",
    hitArea: {
      left: "42.7%",
      top: "34.8%",
      width: "24%",
      height: "24.4%",
      clipPath: "polygon(28% 10%, 55% 0%, 90% 17%, 93% 55%, 72% 90%, 32% 96%, 9% 68%, 8% 33%)"
    }
  },
  {
    id: "valley",
    label: "Valley of the Risen",
    description: "A central northern valley surrounded by mountain passes.",
    worldHighlightSrc: "/images/maps/World/Valley.png",
    regionMapSrc: "/images/maps/regions/WORLD_valley.png",
    hitArea: {
      left: "50.4%",
      top: "16.7%",
      width: "22.5%",
      height: "26.7%",
      clipPath: "polygon(13% 27%, 32% 7%, 78% 13%, 96% 42%, 82% 80%, 38% 92%, 13% 69%)"
    }
  },
  {
    id: "kaillun",
    label: "Kaillun",
    description: "A highland territory on the upper edge of Madrigal.",
    worldHighlightSrc: "/images/maps/World/Kaillun.png",
    regionMapSrc: "/images/maps/regions/WORLD_kaillun.png",
    hitArea: {
      left: "50.8%",
      top: "4.9%",
      width: "22.6%",
      height: "17%",
      clipPath: "polygon(18% 27%, 42% 8%, 84% 15%, 95% 47%, 75% 83%, 31% 89%, 8% 62%)"
    }
  },
  {
    id: "bahara",
    label: "Bahara",
    description: "A northern desert region beyond the mainland ridge.",
    worldHighlightSrc: "/images/maps/World/Bahara.png",
    regionMapSrc: "/images/maps/regions/WORLD_bahara.png",
    hitArea: {
      left: "34.4%",
      top: "5.9%",
      width: "20.4%",
      height: "20.8%",
      clipPath: "polygon(28% 12%, 77% 5%, 96% 46%, 82% 88%, 27% 92%, 4% 58%)"
    }
  }
];
