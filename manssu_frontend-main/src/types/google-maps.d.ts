// Type definitions for Google Maps API
declare namespace google {
  namespace maps {
    namespace places {
      interface AutocompleteOptions {
        componentRestrictions?: { country: string | string[] };
        fields?: string[];
        types?: string[];
      }

      class Autocomplete {
        constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
        getPlace(): PlaceResult;
        addListener(event: string, callback: () => void): void;
      }

      interface PlaceResult {
        formatted_address?: string;
        place_id?: string;
        geometry?: {
          location?: {
            lat(): number;
            lng(): number;
          };
        };
        name?: string;
        [key: string]: unknown;
      }
    }

    namespace event {
      function clearInstanceListeners(instance: unknown): void;
    }
  }
}

declare global {
  interface Window {
    google: {
      maps: {
        places: typeof google.maps.places;
        event: typeof google.maps.event;
      };
    };
  }
}

export {};
