export const PROJECT_NAME_MAX_LENGTH = 120;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 1000;

export type ProjectFormValues = {
  name: string;
  description: string;
};

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>;

export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = "Please enter a project name.";
  } else if (name.length > PROJECT_NAME_MAX_LENGTH) {
    errors.name = `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (values.description.trim().length > PROJECT_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${PROJECT_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
