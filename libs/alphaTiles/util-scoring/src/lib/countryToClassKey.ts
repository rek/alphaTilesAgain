// PascalCase Country → kebab-case route classKey. Must agree with the
// `apps/alphaTiles/app/games/<key>.tsx` filenames + precompute keys, so
// `UnitedStates` resolves to `united-states`, not `unitedstates`.
export function countryToClassKey(country: string): string {
  return country.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
