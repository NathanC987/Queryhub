const formatDateOnly = (value) => {
  if (!value) {
    return "Unknown date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const wasEdited = (createdAt, updatedAt) => {
  if (!createdAt || !updatedAt) {
    return false;
  }

  return new Date(updatedAt).getTime() > new Date(createdAt).getTime() + 1000;
};

const formatEditedMeta = (createdAt, updatedAt) => {
  if (!wasEdited(createdAt, updatedAt)) {
    return "";
  }

  return ` · Edited on ${formatDateOnly(updatedAt)}`;
};

export { formatDateOnly, wasEdited, formatEditedMeta };
