import * as React from "react";
import { MapComponent } from "./components/Map";
import { AddressSearch } from "./components/AddressSearch";
import { SpecialtySelect } from "./components/SpecialtySelect";
import { HospitalList } from "./components/HospitalList";
import { getRouteMetrics, getRoute } from "./services/routing";
import hospitalsData from "./data/hospitals.json";
import type { Hospital } from "./types";
import { Activity } from "lucide-react";

function App() {
  const [userLocation, setUserLocation] = React.useState<
    [number, number] | null
  >(null);
  const [selectedSpecialty, setSelectedSpecialty] = React.useState("");
  const [filteredHospitals, setFilteredHospitals] = React.useState<Hospital[]>(
    []
  );
  const [selectedHospital, setSelectedHospital] =
    React.useState<Hospital | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [routeGeometry, setRouteGeometry] = React.useState<
    [number, number][] | null
  >(null);

  // Initial load of hospitals
  React.useEffect(() => {
    // Cast the JSON data to Hospital[] to ensure types match
    setFilteredHospitals(hospitalsData as Hospital[]);
  }, []);

  // Filter and Route calculation
  React.useEffect(() => {
    const updateHospitals = async () => {
      setLoading(true);
      let nextHospitals = (hospitalsData as Hospital[]).filter(
        (h) => !selectedSpecialty || h.specialties.includes(selectedSpecialty)
      );

      if (userLocation) {
        try {
          const destinations = nextHospitals.map((h) => h.coordinates);
          const metrics = await getRouteMetrics(userLocation, destinations);

          nextHospitals = nextHospitals.map((h, i) => ({
            ...h,
            distance: metrics[i].distance,
            duration: metrics[i].duration,
          }));
        } catch (error) {
          console.error("Routing error:", error);
        }
      }

      setFilteredHospitals(nextHospitals);
      setLoading(false);
    };

    updateHospitals();
  }, [userLocation, selectedSpecialty]);

  const handleAddressSelect = (coords: [number, number]) => {
    setUserLocation(coords);
  };

  const handleHospitalHover = async (hospital: Hospital | null) => {
    if (!hospital || !userLocation) {
      setRouteGeometry(null);
      return;
    }

    try {
      const route = await getRoute(userLocation, hospital.coordinates);
      if (route) {
        setRouteGeometry(route.coordinates);
      } else {
        setRouteGeometry(null);
      }
    } catch (error) {
      console.error("Route fetch error:", error);
      setRouteGeometry(null);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapComponent
          userLocation={userLocation}
          hospitals={filteredHospitals}
          selectedHospital={selectedHospital}
          onSelectHospital={setSelectedHospital}
          routeGeometry={routeGeometry}
        />
      </div>

      {/* Floating Sidebar / Panel */}
      <div className="absolute top-0 left-0 h-full w-full md:w-[480px] pointer-events-none z-10 flex flex-col">
        {/* Content Container - Enable pointer events here */}
        <div className="pointer-events-auto flex-1 flex flex-col p-6 overflow-y-auto bg-white/40 backdrop-blur-[2px] border-r border-white/50">
          {/* Header */}
          <div className="mb-6 p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-white/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 text-blue-600">
                <Activity size={24} />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                CareRoutes
              </h1>
            </div>
            <p className="text-gray-600 text-sm">
              Indtast din adresse og vælg en undersøgelse for at finde det rette
              hospital.
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <AddressSearch onSelect={handleAddressSelect} />
            <SpecialtySelect
              selected={selectedSpecialty}
              onSelect={setSelectedSpecialty}
            />
          </div>

          {/* Results */}
          <div className="mt-6 flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : userLocation && selectedSpecialty ? (
              <>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Resultater ({filteredHospitals.length})
                  </h2>
                </div>
                <HospitalList
                  hospitals={filteredHospitals}
                  onSelect={setSelectedHospital}
                  selectedId={selectedHospital?.id}
                  onHover={handleHospitalHover}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
