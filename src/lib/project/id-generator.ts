export function uuid() {
  return crypto.randomUUID();
}

export function genProjectId() {
  return uuid();
}

export function genClassId() {
  return uuid().replace(/-/g, '').slice(-8);
}

export function genSampleId() {
  return uuid().replace(/-/g, '').slice(-16);
}
