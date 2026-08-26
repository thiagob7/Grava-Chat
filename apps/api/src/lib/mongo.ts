export const unset = <K extends string>(field: K) =>
  ({ OR: [{ [field]: null }, { [field]: { isSet: false } }] }) as {
    OR: [Record<K, null>, Record<K, { isSet: false }>];
  };
