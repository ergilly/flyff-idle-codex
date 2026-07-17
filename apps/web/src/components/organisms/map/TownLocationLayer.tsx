import Image from "next/image";
import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";
import { type TownMapLocation } from "@/lib/townMapLocations";

type TownLocationLayerProps = {
  locations: TownMapLocation[];
  onSelectLocation: (location: TownMapLocation) => void;
  selectedLocationId?: string;
  zoom: number;
};

export function TownLocationLayer({
  locations,
  onSelectLocation,
  selectedLocationId,
  zoom
}: TownLocationLayerProps) {
  return (
    <div className="absolute inset-0 z-10" data-testid="map_div_town_location_layer">
      {locations.map((location) => {
        const isSelected = selectedLocationId === location.id;
        const testId = getTestIdSegment(location.id);

        return (
          <button
            key={location.id}
            aria-label={`${location.label}, ${location.kind}`}
            aria-pressed={isSelected}
            className={cx(
              "group absolute z-10 grid aspect-square -translate-x-1/2 -translate-y-1/2 place-items-center border-0 bg-transparent p-0 transition-transform hover:z-20 hover:scale-110 focus-visible:z-20 focus-visible:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff1ba]",
              isSelected && "scale-105"
            )}
            data-testid={`map_button_town_location_${testId}`}
            onClick={() => onSelectLocation(location)}
            onMouseDown={(event) => event.stopPropagation()}
            style={{ left: `${location.x}%`, top: `${location.y}%`, width: `${3.25 / zoom}%` }}
            title={location.label}
            type="button"
          >
            <Image
              className="pointer-events-none h-full w-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)]"
              src={location.iconSrc}
              alt=""
              aria-hidden="true"
              width={96}
              height={96}
              unoptimized
            />
            <span
              className="pointer-events-none absolute left-1/2 top-[calc(100%+0.3rem)] w-max -translate-x-1/2 rounded-control border border-[#fff1ba]/70 bg-black/90 px-2 py-1 text-[0.65rem] font-black uppercase tracking-wide text-[#fff1ba] opacity-0 shadow-menu transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              role="tooltip"
            >
              {location.label} - TBC
            </span>
          </button>
        );
      })}
    </div>
  );
}
