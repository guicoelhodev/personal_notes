export class StorageError extends Error {}

export class StorageNotFoundError extends StorageError {}

export class StorageAlreadyExistsError extends StorageError {}

export class StorageConflictError extends StorageError {}

export class InvalidStoragePathError extends StorageError {}

export class StorageUnavailableError extends StorageError {}
